import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHECKLIST_ITEMS, CHECKLIST_CATEGORY_LABELS, ChecklistItem } from '../../src/data/checklistData';

const COLORS = {
  primary: '#1E3F20',
  secondary: '#C8A951',
  background: '#F9F7F3',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
};

const CACHE_KEY_CHECKLIST = '@hajj_umrah_checklist';

const CATEGORY_ORDER: ChecklistItem['category'][] = ['documents', 'clothing', 'health', 'essentials'];

export default function ChecklistScreen() {
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(CACHE_KEY_CHECKLIST);
        if (saved) setChecked(JSON.parse(saved));
      } catch {}
    })();
  }, []);

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      AsyncStorage.setItem(CACHE_KEY_CHECKLIST, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const resetChecklist = () => {
    setChecked([]);
    AsyncStorage.setItem(CACHE_KEY_CHECKLIST, JSON.stringify([])).catch(() => {});
  };

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: CHECKLIST_ITEMS.filter((item) => item.category === category),
    }));
  }, []);

  const progress = checked.length / CHECKLIST_ITEMS.length;

  return (
    <View style={styles.container} testID="checklist-screen">
      <SafeAreaView edges={['top']} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hajj & Umrah Checklist</Text>
          <Text style={styles.headerSubtitle} testID="checklist-progress-text">
            {checked.length} of {CHECKLIST_ITEMS.length} packed
          </Text>
        </View>
        <TouchableOpacity testID="btn-checklist-reset" onPress={resetChecklist} style={styles.resetBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {grouped.map(({ category, items }) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{CHECKLIST_CATEGORY_LABELS[category]}</Text>
            {items.map((item) => {
              const done = checked.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  testID={`checklist-item-${item.id}`}
                  style={styles.itemRow}
                  activeOpacity={0.7}
                  onPress={() => toggleItem(item.id)}
                >
                  <View style={[styles.checkbox, done && styles.checkboxDone]}>
                    {done && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={[styles.itemLabel, done && styles.itemLabelDone]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary },
  list: { flex: 1 },
  listContent: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  itemLabel: { fontSize: 14, color: COLORS.text, flex: 1 },
  itemLabelDone: { color: COLORS.textSecondary, textDecorationLine: 'line-through' },
});
