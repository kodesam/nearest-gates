import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
  TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../src/context/AppContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#1E3F20',
  secondary: '#C8A951',
  background: '#F9F7F3',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
  online: '#22C55E',
  offline: '#EF4444',
  live: '#2563EB',
};

export default function SettingsScreen() {
  const { isOnline, lastSynced, syncData, isLoading, gates, amenities } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [refreshingOSM, setRefreshingOSM] = useState(false);
  const [dataMode, setDataMode] = useState<'simulation' | 'live'>('simulation');
  const [liveApiUrl, setLiveApiUrl] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    loadDataSourceConfig();
  }, []);

  const loadDataSourceConfig = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/config/datasource`);
      if (res.ok) {
        const data = await res.json();
        setDataMode(data.mode || 'simulation');
        setLiveApiUrl(data.live_api_url || '');
      }
    } catch {}
    setConfigLoaded(true);
  };

  const saveDataSourceConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/config/datasource`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: dataMode,
          live_api_url: dataMode === 'live' ? liveApiUrl || null : null,
        }),
      });
      if (res.ok) {
        Alert.alert('Saved', `Data source set to ${dataMode === 'live' ? 'Live' : 'Simulation'} mode`);
      }
    } catch {
      Alert.alert('Error', 'Could not save configuration');
    }
    setSavingConfig(false);
  };

  const handleRefreshOSM = async () => {
    setRefreshingOSM(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/amenities/refresh`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'ok') {
        Alert.alert('Updated', `Loaded ${data.count} real amenities from OpenStreetMap`);
        await syncData();
      } else {
        Alert.alert('Error', data.message || 'Could not refresh amenities');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server');
    }
    setRefreshingOSM(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncData();
    setSyncing(false);
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will remove cached data. You will need to sync again when online.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            await AsyncStorage.multiRemove([
              '@haram_gates',
              '@haram_amenities',
              '@haram_last_sync',
            ]);
            setClearing(false);
          },
        },
      ]
    );
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Haram Navigator</Text>
            <Text style={styles.heroSubtitle}>Masjid Al Haram, Makkah</Text>
          </View>
        </View>

        {/* Data Source Config */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crowd Data Source</Text>
          <View style={styles.card}>
            <View style={styles.modeRow}>
              <TouchableOpacity
                testID="btn-mode-simulation"
                style={[styles.modeBtn, dataMode === 'simulation' && styles.modeBtnActive]}
                onPress={() => setDataMode('simulation')}
                activeOpacity={0.7}
              >
                <Ionicons name="dice-outline" size={18} color={dataMode === 'simulation' ? '#fff' : COLORS.textSecondary} />
                <Text style={[styles.modeBtnText, dataMode === 'simulation' && styles.modeBtnTextActive]}>Simulation</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="btn-mode-live"
                style={[styles.modeBtn, dataMode === 'live' && styles.modeBtnLive]}
                onPress={() => setDataMode('live')}
                activeOpacity={0.7}
              >
                <Ionicons name="radio-outline" size={18} color={dataMode === 'live' ? '#fff' : COLORS.textSecondary} />
                <Text style={[styles.modeBtnText, dataMode === 'live' && styles.modeBtnTextActive]}>Live Data</Text>
              </TouchableOpacity>
            </View>

            {dataMode === 'simulation' && (
              <View style={styles.modeInfo}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.modeInfoText}>
                  Using simulated crowd density based on historical patterns. Data refreshes every 30 seconds.
                </Text>
              </View>
            )}

            {dataMode === 'live' && (
              <View>
                <View style={styles.modeInfo}>
                  <Ionicons name="flash-outline" size={16} color={COLORS.live} />
                  <Text style={[styles.modeInfoText, { color: COLORS.live }]}>
                    Connect to a live crowd data API or push data via the REST endpoint.
                  </Text>
                </View>
                <Text style={styles.inputLabel}>Live API URL (optional)</Text>
                <TextInput
                  testID="input-live-api-url"
                  style={styles.textInput}
                  placeholder="https://api.example.com/crowd-density"
                  placeholderTextColor="#9CA3AF"
                  value={liveApiUrl}
                  onChangeText={setLiveApiUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <View style={styles.modeInfo}>
                  <Ionicons name="code-slash-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.modeInfoTextSmall}>
                    Or push data via POST /api/gates/density/push with JSON body
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              testID="btn-save-datasource"
              style={styles.saveBtn}
              onPress={saveDataSourceConfig}
              disabled={savingConfig}
              activeOpacity={0.8}
            >
              {savingConfig ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
              )}
              <Text style={styles.saveBtnText}>{savingConfig ? 'Saving...' : 'Save Configuration'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.online : COLORS.offline }]} />
                <Text style={styles.rowLabel}>Status</Text>
              </View>
              <Text style={[styles.rowValue, { color: isOnline ? COLORS.online : COLORS.offline }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="sync-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.rowLabel}>Last Synced</Text>
              </View>
              <Text style={styles.rowValue}>{formatDate(lastSynced)}</Text>
            </View>
          </View>
        </View>

        {/* Cached Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cached Data</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="enter-outline" size={16} color={COLORS.primary} />
                <Text style={styles.rowLabel}>Gates</Text>
              </View>
              <Text style={styles.rowValue}>{gates.length} cached</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="cafe-outline" size={16} color={COLORS.secondary} />
                <Text style={styles.rowLabel}>Amenities</Text>
              </View>
              <Text style={styles.rowValue}>{amenities.length} cached</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity
            testID="btn-sync-data"
            style={styles.actionButton}
            onPress={handleSync}
            disabled={syncing}
            activeOpacity={0.8}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={COLORS.surface} />
            ) : (
              <Ionicons name="cloud-download-outline" size={20} color={COLORS.surface} />
            )}
            <Text style={styles.actionButtonText}>
              {syncing ? 'Syncing...' : 'Sync Data Now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-refresh-osm"
            style={styles.osmButton}
            onPress={handleRefreshOSM}
            disabled={refreshingOSM}
            activeOpacity={0.8}
          >
            {refreshingOSM ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="globe-outline" size={18} color="#fff" />
            )}
            <Text style={styles.osmButtonText}>
              {refreshingOSM ? 'Fetching from OSM...' : 'Refresh Amenities from OpenStreetMap'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-clear-cache"
            style={styles.clearButton}
            onPress={handleClearCache}
            disabled={clearing}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.offline} />
            <Text style={styles.clearButtonText}>Clear Cached Data</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              Haram Navigator helps you find the nearest gate of Masjid Al Haram
              and discover nearby amenities. Works offline with cached data.
              Supports both simulated and live crowd density data.
            </Text>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowValue}>1.1.0</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroContainer: {
    height: 160, backgroundColor: COLORS.primary, justifyContent: 'flex-end',
    marginBottom: 8,
  },
  heroOverlay: { padding: 24 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: COLORS.surface },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.secondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 4,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 14, color: COLORS.text },
  rowValue: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', gap: 6,
  },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeBtnLive: { backgroundColor: COLORS.live },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  modeBtnTextActive: { color: '#fff' },
  modeInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8, marginBottom: 4 },
  modeInfoText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  modeInfoTextSmall: { flex: 1, fontSize: 11, color: '#9CA3AF', lineHeight: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginTop: 12, marginBottom: 6 },
  textInput: {
    backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 14, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, gap: 8, marginTop: 14,
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, gap: 10,
  },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.surface },
  osmButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563EB', borderRadius: 16, paddingVertical: 14, gap: 8, marginTop: 10,
  },
  osmButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  clearButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderRadius: 16, paddingVertical: 14,
    marginTop: 10, borderWidth: 1, borderColor: COLORS.border, gap: 8,
  },
  clearButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.offline },
  aboutText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
});
