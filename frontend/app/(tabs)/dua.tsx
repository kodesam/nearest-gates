import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DUA_LIST, DUA_CATEGORY_LABELS } from '../../src/data/duaData';

const COLORS = {
  primary: '#1E3F20',
  secondary: '#C8A951',
  background: '#F9F7F3',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
};

type FilterKey = 'all' | 'umrah' | 'hajj';

export default function DuaScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDuas = useMemo(() => {
    if (filter === 'all') return DUA_LIST;
    return DUA_LIST.filter((d) => d.category === filter || d.category === 'both');
  }, [filter]);

  return (
    <View style={styles.container} testID="dua-screen">
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>Dua & Supplications</Text>
      </SafeAreaView>

      <View style={styles.filterRow}>
        {(Object.keys(DUA_CATEGORY_LABELS) as FilterKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            testID={`btn-dua-filter-${key}`}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>
              {DUA_CATEGORY_LABELS[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredDuas.map((dua) => {
          const expanded = expandedId === dua.id;
          return (
            <TouchableOpacity
              key={dua.id}
              testID={`dua-card-${dua.id}`}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => setExpandedId(expanded ? null : dua.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.occasion}>{dua.occasion}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
              </View>

              <Text style={styles.arabic}>{dua.arabic}</Text>

              {expanded && (
                <View style={styles.details}>
                  <Text style={styles.sectionLabel}>Transliteration</Text>
                  <Text style={styles.transliteration}>{dua.transliteration}</Text>

                  <Text style={styles.sectionLabel}>Translation</Text>
                  <Text style={styles.translation}>{dua.translation}</Text>

                  <Text style={styles.source}>Source: {dua.source}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 0, gap: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  occasion: { fontSize: 14, fontWeight: '700', color: COLORS.primary, flex: 1, marginRight: 8 },
  arabic: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right',
    color: COLORS.text,
    fontWeight: '600',
  },
  details: { marginTop: 14, gap: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  transliteration: { fontSize: 14, fontStyle: 'italic', color: COLORS.textSecondary, lineHeight: 20 },
  translation: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  source: { fontSize: 11, color: COLORS.textSecondary, marginTop: 10 },
});
