import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { haversineDistance, bearing, bearingToArrow, bearingToDirection, formatDistance } from '../../src/utils/location';
import { PILGRIM_PLACES, PLACE_CATEGORY_LABELS, PlaceCategory, PilgrimPlace } from '../../src/data/placesData';

const COLORS = {
  primary: '#1E3F20',
  secondary: '#C8A951',
  background: '#F9F7F3',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
};

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  haram: '#1E3F20',
  mashair: '#C8A951',
  history: '#8B5CF6',
  mosque: '#3B82F6',
  landmark: '#EF4444',
};

const FILTERS: ('all' | PlaceCategory)[] = ['all', 'haram', 'mashair', 'history', 'mosque', 'landmark'];

type PlaceWithDistance = PilgrimPlace & { distance: number | null; heading: number | null };

export default function PlacesScreen() {
  const { userLocation } = useApp();
  const [filter, setFilter] = useState<'all' | PlaceCategory>('all');

  const places = useMemo<PlaceWithDistance[]>(() => {
    const withDistance = PILGRIM_PLACES.map((p) => ({
      ...p,
      distance: userLocation ? haversineDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude) : null,
      heading: userLocation ? bearing(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude) : null,
    }));
    const filtered = filter === 'all' ? withDistance : withDistance.filter((p) => p.category === filter);
    return filtered.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [userLocation, filter]);

  const openDirections = (place: PilgrimPlace) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`).catch(() => {});
  };

  const renderPlace = ({ item }: { item: PlaceWithDistance }) => {
    const color = CATEGORY_COLORS[item.category];
    return (
      <TouchableOpacity
        testID={`place-card-${item.id}`}
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => openDirections(item)}
        accessibilityLabel={`Get directions to ${item.name}`}
      >
        <View style={[styles.cardIcon, { backgroundColor: color }]}>
          <Ionicons name="location" size={18} color="#fff" />
        </View>
        <View style={styles.cardMiddle}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardArabic} numberOfLines={1}>{item.name_ar}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>{item.description}</Text>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{PLACE_CATEGORY_LABELS[item.category]}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          {item.distance != null && item.heading != null ? (
            <>
              <Text style={[styles.distance, { color }]}>{formatDistance(item.distance)}</Text>
              <Text style={styles.direction}>{bearingToArrow(item.heading)} {bearingToDirection(item.heading)}</Text>
            </>
          ) : (
            <Text style={styles.direction}>Location off</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} testID="places-screen">
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>Places in Makkah</Text>
        <Text style={styles.headerSubtitle}>
          {userLocation ? 'Sorted by distance from you' : 'Enable location to see distances'}
        </Text>
      </SafeAreaView>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((key) => (
            <TouchableOpacity
              key={key}
              testID={`btn-place-filter-${key}`}
              style={[styles.chip, filter === key && styles.chipActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>
                {key === 'all' ? 'All' : PLACE_CATEGORY_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        renderItem={renderPlace}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },
  listContent: { padding: 16, paddingTop: 4, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  cardIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardMiddle: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardArabic: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  cardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  distance: { fontSize: 15, fontWeight: '800' },
  direction: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
