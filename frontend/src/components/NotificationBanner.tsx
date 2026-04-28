import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '../context/AppContext';

const COLORS = {
  primary: '#1E3F20',
  secondary: '#C8A951',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
};

const DENSITY_COLORS: Record<string, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  very_high: '#EF4444',
};

interface NotificationBannerProps {
  notification: Notification | null;
  onDismiss: (id: string) => void;
  onPress?: (notification: Notification) => void;
}

export default function NotificationBanner({ notification, onDismiss, onPress }: NotificationBannerProps) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notification) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        dismiss();
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-120);
      opacityAnim.setValue(0);
    }
  }, [notification?.id]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      if (notification) onDismiss(notification.id);
    });
  };

  if (!notification) return null;

  const densityColor = notification.gate
    ? DENSITY_COLORS[notification.gate.density_level] || COLORS.secondary
    : COLORS.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
      testID="notification-banner"
    >
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.9}
        onPress={() => onPress && notification && onPress(notification)}
      >
        <View style={[styles.iconContainer, { backgroundColor: densityColor }]}>
          <Ionicons
            name={notification.type === 'recommendation' ? 'bulb' : 'notifications'}
            size={18}
            color="#fff"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        </View>
        <TouchableOpacity
          testID="notification-dismiss"
          style={styles.dismissBtn}
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: { flex: 1, marginRight: 8 },
  title: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  message: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  dismissBtn: { padding: 4 },
});
