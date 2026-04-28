import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../src/context/AppContext';

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
};

export default function SettingsScreen() {
  const { isOnline, lastSynced, syncData, isLoading, gates, amenities } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);

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
            </Text>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowValue}>1.0.0</Text>
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
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, gap: 10,
  },
  actionButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.surface },
  clearButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface, borderRadius: 16, paddingVertical: 14,
    marginTop: 10, borderWidth: 1, borderColor: COLORS.border, gap: 8,
  },
  clearButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.offline },
  aboutText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
});
