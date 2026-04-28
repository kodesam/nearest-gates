import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { formatDistance, bearing, bearingToArrow } from '../../src/utils/location';
import { CATEGORY_LABELS } from '../../src/data/haramData';

const COLORS = {
  primary: '#1E3F20',
  secondary: '#C8A951',
  background: '#F9F7F3',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
};

const CATEGORIES = ['all', 'restaurant', 'grocery', 'bus_stop', 'taxi_stand', 'meqat'];

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurant: 'restaurant-outline',
  grocery: 'cart-outline',
  bus_stop: 'bus-outline',
  taxi_stand: 'car-outline',
  meqat: 'location-outline',
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#EF4444',
  grocery: '#22C55E',
  bus_stop: '#3B82F6',
  taxi_stand: '#F59E0B',
  meqat: '#8B5CF6',
};

export default function AmenitiesScreen() {
  const { amenitiesWithDistance, userLocation } = useApp();
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    if (category === 'all') return amenitiesWithDistance;
    return amenitiesWithDistance.filter((a) => a.category === category);
  }, [amenitiesWithDistance, category]);

  const renderAmenity = ({ item }: any) => {
    const color = CATEGORY_COLORS[item.category] || COLORS.secondary;
    const icon = CATEGORY_ICONS[item.category] || 'location-outline';
    const dir = userLocation
      ? bearing(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude)
      : 0;

    return (
      <View style={styles.card} testID={`amenity-card-${item.id}`}>
        <View style={[styles.cardIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={18} color={COLORS.surface} />
        </View>
        <View style={styles.cardMiddle}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.categoryBadgeText, { color }]}>
              {CATEGORY_LABELS[item.category] || item.category}
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardDistance, { color }]}>{formatDistance(item.distance)}</Text>
          {userLocation && (
            <Text style={styles.cardDirection}>{bearingToArrow(dir)}</Text>
          )}
        </View>
      </View>
    );
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'all') return 'All';
    return CATEGORY_LABELS[cat] || cat;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Amenities</Text>
        <Text style={styles.subtitle}>{filtered.length} places found</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            testID={`amenity-filter-${cat}`}
            style={[
              styles.pill,
              category === cat && {
                backgroundColor: cat === 'all' ? COLORS.primary : CATEGORY_COLORS[cat] || COLORS.primary,
              },
            ]}
            onPress={() => setCategory(cat)}
          >
            {cat !== 'all' && (
              <Ionicons
                name={CATEGORY_ICONS[cat] || 'location-outline'}
                size={14}
                color={category === cat ? '#fff' : COLORS.textSecondary}
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              style={[
                styles.pillText,
                category === cat && styles.pillTextActive,
              ]}
            >
              {getCategoryLabel(cat)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderAmenity}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cafe-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No amenities found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  pillRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  pillText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  pillTextActive: { color: '#fff' },
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
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  cardMiddle: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  categoryBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardRight: { alignItems: 'flex-end' },
  cardDistance: { fontSize: 18, fontWeight: '300' },
  cardDirection: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#9CA3AF', marginTop: 12 },
});
