import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { formatDistance, bearing, bearingToArrow, bearingToDirection } from '../../src/utils/location';

const COLORS = {
  primary: '#1E3F20',
  secondary: '#C8A951',
  background: '#F9F7F3',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
};

const DENSITY_COLORS: Record<string, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  very_high: '#EF4444',
};

const SIDE_FILTERS = ['all', 'north', 'south', 'east', 'west'];

export default function GatesScreen() {
  const { gatesWithDistance, userLocation, densityMap } = useApp();
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = gatesWithDistance;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name_en.toLowerCase().includes(q) ||
          g.name_ar.includes(q) ||
          String(g.number).includes(q)
      );
    }
    if (sideFilter !== 'all') {
      result = result.filter((g) => g.side.includes(sideFilter));
    }
    return result;
  }, [gatesWithDistance, search, sideFilter]);

  const renderGate = ({ item }: any) => {
    const dir = userLocation
      ? bearing(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude)
      : 0;
    const density = densityMap[item.id];
    const densityColor = density ? DENSITY_COLORS[density.density_level] || COLORS.textSecondary : null;
    return (
      <View style={styles.card} testID={`gate-card-${item.id}`}>
        <View style={[styles.cardIcon, density && { backgroundColor: densityColor || COLORS.primary }]}>
          <Ionicons name="enter" size={18} color={COLORS.surface} />
        </View>
        <View style={styles.cardMiddle}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name_en}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.name_ar} • Gate {item.number} • {item.side}
          </Text>
          {density && (
            <View style={[styles.densityBadge, { backgroundColor: (densityColor || '#999') + '18' }]}>
              <View style={[styles.densityDot, { backgroundColor: densityColor || '#999' }]} />
              <Text style={[styles.densityLabel, { color: densityColor || '#999' }]}>
                {density.density_level.replace('_', ' ')} ({density.density_percentage}%)
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardDistance}>{formatDistance(item.distance)}</Text>
          {userLocation && (
            <Text style={styles.cardDirection}>
              {bearingToArrow(dir)} {bearingToDirection(dir)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Haram Gates</Text>
        <Text style={styles.subtitle}>{filtered.length} gates found</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          testID="gates-search-input"
          style={styles.searchInput}
          placeholder="Search gates by name or number..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity testID="gates-search-clear" onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {SIDE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            testID={`filter-${f}`}
            style={[styles.filterPill, sideFilter === f && styles.filterPillActive]}
            onPress={() => setSideFilter(f)}
          >
            <Text style={[styles.filterText, sideFilter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderGate}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No gates found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, marginTop: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterPillActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.surface },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  cardMiddle: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  cardRight: { alignItems: 'flex-end' },
  cardDistance: { fontSize: 18, fontWeight: '300', color: COLORS.primary },
  cardDirection: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  densityBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 5 },
  densityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  densityLabel: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#9CA3AF', marginTop: 12 },
});
