import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#1E3F20',
  secondary: '#C8A951',
  background: '#F9F7F3',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  border: '#E5E7EB',
};

const CACHE_KEY_TASBIH_COUNT = '@tasbih_count';
const CACHE_KEY_TASBIH_CYCLES = '@tasbih_cycles';
const CYCLE_TARGET = 33;

export default function TasbihScreen() {
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [savedCount, savedCycles] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEY_TASBIH_COUNT),
          AsyncStorage.getItem(CACHE_KEY_TASBIH_CYCLES),
        ]);
        if (savedCount) setCount(parseInt(savedCount, 10) || 0);
        if (savedCycles) setCycles(parseInt(savedCycles, 10) || 0);
      } catch {}
    })();
  }, []);

  const vibrate = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }, []);

  const increment = useCallback(() => {
    vibrate();
    setCount((prev) => {
      const next = prev + 1;
      AsyncStorage.setItem(CACHE_KEY_TASBIH_COUNT, String(next % CYCLE_TARGET === 0 ? 0 : next % CYCLE_TARGET)).catch(() => {});
      if (next % CYCLE_TARGET === 0) {
        setCycles((prevCycles) => {
          const nextCycles = prevCycles + 1;
          AsyncStorage.setItem(CACHE_KEY_TASBIH_CYCLES, String(nextCycles)).catch(() => {});
          return nextCycles;
        });
        return 0;
      }
      return next;
    });
  }, [vibrate]);

  const reset = useCallback(() => {
    setCount(0);
    setCycles(0);
    AsyncStorage.multiSet([[CACHE_KEY_TASBIH_COUNT, '0'], [CACHE_KEY_TASBIH_CYCLES, '0']]).catch(() => {});
  }, []);

  return (
    <View style={styles.container} testID="tasbih-screen">
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>Tasbih Counter</Text>
        <TouchableOpacity testID="btn-tasbih-reset" onPress={reset} style={styles.resetBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.cyclesRow}>
        <Text style={styles.cyclesText} testID="tasbih-cycles-text">Cycles completed: {cycles}</Text>
      </View>

      <Pressable
        testID="tasbih-tap-area"
        style={styles.tapArea}
        onPress={increment}
        android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
      >
        <Text style={styles.countText} testID="tasbih-count-text">{count}</Text>
        <Text style={styles.targetText}>of {CYCLE_TARGET}</Text>
        <Text style={styles.tapHint}>Tap anywhere to count</Text>
      </Pressable>
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
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  cyclesRow: { alignItems: 'center', paddingVertical: 12 },
  cyclesText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tapArea: {
    flex: 1,
    margin: 20,
    marginTop: 0,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 96, fontWeight: '800', color: '#fff' },
  targetText: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  tapHint: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 24 },
});
