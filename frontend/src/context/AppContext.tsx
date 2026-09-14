import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GateData, AmenityData, FALLBACK_GATES, FALLBACK_AMENITIES, KAABA_LOCATION, SAFA_LOCATION, MARWA_LOCATION } from '../data/haramData';
import { bearing, haversineDistance } from '../utils/location';
import { buildApiUrl } from '../utils/backend';

const CACHE_KEY_GATES = '@haram_gates';
const CACHE_KEY_AMENITIES = '@haram_amenities';
const CACHE_KEY_LAST_SYNC = '@haram_last_sync';
const CACHE_KEY_UMRAH_PROGRESS = '@umrah_progress';
const CACHE_KEY_UMRAH_CIRCUITS = '@umrah_circuits';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface DensityInfo {
  gate_id: string;
  gate_number: number;
  name_en: string;
  density_percentage: number;
  density_level: 'low' | 'medium' | 'high' | 'very_high';
  updated_at: string;
}

export interface GateRecommendation {
  id: string;
  number: number;
  name_en: string;
  name_ar: string;
  latitude: number;
  longitude: number;
  side: string;
  density_percentage: number;
  density_level: string;
  distance_m: number;
  score: number;
}

export interface Notification {
  id: string;
  type: 'recommendation' | 'density_alert' | 'info';
  title: string;
  message: string;
  gate?: GateRecommendation;
  timestamp: number;
  read: boolean;
}

interface AppContextType {
  userLocation: UserLocation | null;
  locationError: string | null;
  gates: GateData[];
  amenities: AmenityData[];
  isOnline: boolean;
  isLoading: boolean;
  lastSynced: string | null;
  syncData: () => Promise<void>;
  retryLocation: () => Promise<void>;
  setAmenitiesData: (amenities: AmenityData[]) => void;
  nearestGate: (GateData & { distance: number }) | null;
  gatesWithDistance: (GateData & { distance: number })[];
  amenitiesWithDistance: (AmenityData & { distance: number })[];
  densityMap: Record<string, DensityInfo>;
  notifications: Notification[];
  dismissNotification: (id: string) => void;
  recommendation: GateRecommendation | null;
  acceptLocationDisclosure: () => void;
  completedUmrahCheckpoints: string[];
  umrahCircuitCounts: Record<'tawaf' | 'sai', number>;
  toggleUmrahCheckpoint: (checkpointId: string) => void;
  updateUmrahCircuit: (checkpointId: 'tawaf' | 'sai', change: number) => void;
  resetUmrahProgress: () => void;
}

const AppContext = createContext<AppContextType>({
  userLocation: null,
  locationError: null,
  gates: [],
  amenities: [],
  isOnline: true,
  isLoading: true,
  lastSynced: null,
  syncData: async () => {},
  retryLocation: async () => {},
  setAmenitiesData: () => {},
  nearestGate: null,
  gatesWithDistance: [],
  amenitiesWithDistance: [],
  densityMap: {},
  notifications: [],
  dismissNotification: () => {},
  recommendation: null,
  acceptLocationDisclosure: () => {},
  completedUmrahCheckpoints: [],
  umrahCircuitCounts: { tawaf: 0, sai: 0 },
  toggleUmrahCheckpoint: () => {},
  updateUmrahCircuit: () => {},
  resetUmrahProgress: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gates, setGates] = useState<GateData[]>(FALLBACK_GATES);
  const [amenities, setAmenities] = useState<AmenityData[]>(FALLBACK_AMENITIES);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [densityMap, setDensityMap] = useState<Record<string, DensityInfo>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recommendation, setRecommendation] = useState<GateRecommendation | null>(null);
  const [showLocationDisclosure, setShowLocationDisclosure] = useState(false);
  const [completedUmrahCheckpoints, setCompletedUmrahCheckpoints] = useState<string[]>([]);
  const [umrahCircuitCounts, setUmrahCircuitCounts] = useState<Record<'tawaf' | 'sai', number>>({ tawaf: 0, sai: 0 });
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const densityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRecommendationRef = useRef<string>('');
  const tawafTrackingRef = useRef({ lastBearing: null as number | null, rotation: 0 });
  const saiTrackingRef = useRef<'safa' | 'marwa' | null>(null);
  const umrahCompletionNotifiedRef = useRef(false);

  useEffect(() => {
    initLocation();
    loadCachedData();
    const unsubscribeConnectivity = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    // Initial connectivity check + data fetch
    checkConnectivity().then((online) => {
      if (online) {
        fetchFromAPI();
        fetchDensityData();
      }
    });
    // Poll density + connectivity every 30 seconds
    densityIntervalRef.current = setInterval(async () => {
      await fetchDensityData();
    }, 30000);
    // Failsafe: stop loading after 5 seconds regardless
    const timeout = setTimeout(() => setIsLoading(false), 5000);
    return () => {
      if (watchRef.current) watchRef.current.remove();
      if (densityIntervalRef.current) clearInterval(densityIntervalRef.current);
      clearTimeout(timeout);
      unsubscribeConnectivity();
    };
  }, []);

  // Fetch recommendation when location changes
  useEffect(() => {
    if (userLocation) fetchRecommendation();
  }, [userLocation]);

  const initLocation = async (requestPermission = false) => {
    try {
      const { status } = requestPermission
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (!requestPermission && status !== 'granted') {
        setShowLocationDisclosure(true);
        setIsLoading(false);
        return;
      }
      if (status !== 'granted') {
        setLocationError('Location permission denied. Showing default Haram location.');
        setIsLoading(false);
        return;
      }
      // Use a timeout wrapper to avoid hanging forever
      const locPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
      const result = await Promise.race([locPromise, timeoutPromise]);
      
      if (result) {
        setUserLocation({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy ?? undefined,
        });
      } else {
        setLocationError('Location timed out. Tap Enable to retry.');
      }
      
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 3, timeInterval: 2000 },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? undefined,
          });
          setLocationError(null);
        }
      );
    } catch {
      setLocationError('Could not get location. Tap Enable to retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptLocationDisclosure = useCallback(() => {
    setShowLocationDisclosure(false);
    setIsLoading(true);
    initLocation(true);
  }, []);

  const loadCachedData = async () => {
    try {
      const cachedGates = await AsyncStorage.getItem(CACHE_KEY_GATES);
      const cachedAmenities = await AsyncStorage.getItem(CACHE_KEY_AMENITIES);
      const cachedSync = await AsyncStorage.getItem(CACHE_KEY_LAST_SYNC);
      const cachedUmrahProgress = await AsyncStorage.getItem(CACHE_KEY_UMRAH_PROGRESS);
      const cachedUmrahCircuits = await AsyncStorage.getItem(CACHE_KEY_UMRAH_CIRCUITS);
      if (cachedGates) setGates(JSON.parse(cachedGates));
      if (cachedAmenities) setAmenities(JSON.parse(cachedAmenities));
      if (cachedSync) setLastSynced(cachedSync);
      if (cachedUmrahProgress) setCompletedUmrahCheckpoints(JSON.parse(cachedUmrahProgress));
      if (cachedUmrahCircuits) {
        const parsedCounts = JSON.parse(cachedUmrahCircuits);
        setUmrahCircuitCounts({
          tawaf: Math.min(7, Math.max(0, Number(parsedCounts.tawaf) || 0)),
          sai: Math.min(7, Math.max(0, Number(parsedCounts.sai) || 0)),
        });
      }
    } catch {}
  };

  const fetchFromAPI = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const [gatesRes, amenitiesRes] = await Promise.all([
        fetch(buildApiUrl('/gates'), { signal: controller.signal }),
        fetch(buildApiUrl('/amenities'), { signal: controller.signal }),
      ]);
      clearTimeout(timeoutId);
      if (gatesRes.ok && amenitiesRes.ok) {
        const gatesData = await gatesRes.json();
        const amenitiesData = await amenitiesRes.json();
        setGates(gatesData);
        setAmenities(amenitiesData);
        setIsOnline(true);
        const now = new Date().toISOString();
        setLastSynced(now);
        await AsyncStorage.setItem(CACHE_KEY_GATES, JSON.stringify(gatesData));
        await AsyncStorage.setItem(CACHE_KEY_AMENITIES, JSON.stringify(amenitiesData));
        await AsyncStorage.setItem(CACHE_KEY_LAST_SYNC, now);
      } else {
        await checkConnectivity();
      }
    } catch {
      await checkConnectivity();
    }
  };

  const checkConnectivity = async () => {
    try {
      const state = await NetInfo.fetch();
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      return online;
    } catch {
      setIsOnline(false);
      return false;
    }
  };

  const fetchDensityData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(buildApiUrl('/gates/density'), { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, DensityInfo> = {};
        data.density.forEach((d: DensityInfo) => { map[d.gate_id] = d; });
        setDensityMap(map);
      } else {
        await checkConnectivity();
      }
    } catch {
      // Check connectivity separately - maybe just density endpoint failed
      await checkConnectivity();
    }
  };

  const fetchRecommendation = async () => {
    if (!userLocation) return;
    try {
      const res = await fetch(
        `${buildApiUrl('/gates/recommend')}?lat=${userLocation.latitude}&lng=${userLocation.longitude}`
      );
      if (res.ok) {
        const data = await res.json();
        const rec = data.recommended_gate;
        if (rec) {
          setRecommendation(rec);
          // Create notification if recommendation changed
          const recKey = `${rec.id}-${rec.density_level}`;
          if (recKey !== lastRecommendationRef.current) {
            lastRecommendationRef.current = recKey;
            const notif: Notification = {
              id: `rec-${Date.now()}`,
              type: 'recommendation',
              title: 'Gate Recommendation',
              message: `${rec.name_en} (Gate ${rec.number}) has ${rec.density_level} crowd density and is ${rec.distance_m}m away`,
              gate: rec,
              timestamp: Date.now(),
              read: false,
            };
            setNotifications((prev) => [notif, ...prev.slice(0, 9)]);
          }
        }
      }
    } catch {}
  };

  const syncData = useCallback(async () => {
    setIsLoading(true);
    const online = await checkConnectivity();
    if (online) {
      await fetchFromAPI();
      await fetchDensityData();
    }
    setIsLoading(false);
  }, []);

  const setAmenitiesData = useCallback((nextAmenities: AmenityData[]) => {
    setAmenities(nextAmenities);
    AsyncStorage.setItem(CACHE_KEY_AMENITIES, JSON.stringify(nextAmenities)).catch(() => {});
  }, []);

  const retryLocation = useCallback(async () => {
    setLocationError(null);
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable location in your device settings.');
        setIsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
      });
      if (watchRef.current) watchRef.current.remove();
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
        (l) => {
          setUserLocation({
            latitude: l.coords.latitude,
            longitude: l.coords.longitude,
            accuracy: l.coords.accuracy ?? undefined,
          });
        }
      );
      setLocationError(null);
    } catch {
      setLocationError('Could not get location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const toggleUmrahCheckpoint = useCallback((checkpointId: string) => {
    if (checkpointId === 'tawaf' || checkpointId === 'sai') return;
    setCompletedUmrahCheckpoints((previous) => {
      const next = previous.includes(checkpointId)
        ? previous.filter((id) => id !== checkpointId)
        : [...previous, checkpointId];
      AsyncStorage.setItem(CACHE_KEY_UMRAH_PROGRESS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateUmrahCircuit = useCallback((checkpointId: 'tawaf' | 'sai', change: number) => {
    setUmrahCircuitCounts((previous) => {
      const next = { ...previous, [checkpointId]: Math.min(7, Math.max(0, previous[checkpointId] + change)) };
      AsyncStorage.setItem(CACHE_KEY_UMRAH_CIRCUITS, JSON.stringify(next)).catch(() => {});
      setCompletedUmrahCheckpoints((completed) => {
        const isComplete = next[checkpointId] === 7;
        const nextCompleted = isComplete
          ? completed.includes(checkpointId) ? completed : [...completed, checkpointId]
          : completed.filter((id) => id !== checkpointId);
        AsyncStorage.setItem(CACHE_KEY_UMRAH_PROGRESS, JSON.stringify(nextCompleted)).catch(() => {});
        return nextCompleted;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    const requiredCheckpoints = ['ihram', 'tawaf', 'sai', 'halq'];
    const isComplete = requiredCheckpoints.every((id) => completedUmrahCheckpoints.includes(id));
    if (isComplete && !umrahCompletionNotifiedRef.current) {
      umrahCompletionNotifiedRef.current = true;
      setNotifications((previous) => [
        {
          id: `umrah-complete-${Date.now()}`,
          type: 'info',
          title: 'Umrah Completed 🌸',
          message: 'Congratulations on completing your Umrah! May Allah accept your worship 🤲🌸',
          timestamp: Date.now(),
          read: false,
        },
        ...previous.slice(0, 9),
      ]);
    }
  }, [completedUmrahCheckpoints]);

  // Count laps from consecutive GPS updates while filtering jumps and stationary noise.
  useEffect(() => {
    // Indoor and mock GPS providers commonly report accuracy between 50 and 100 m.
    if (!userLocation || userLocation.accuracy && userLocation.accuracy > 100) return;
    const { latitude, longitude } = userLocation;
    const tawafCount = umrahCircuitCounts.tawaf;
    const kaabaDistance = haversineDistance(latitude, longitude, KAABA_LOCATION.latitude, KAABA_LOCATION.longitude);
    if (tawafCount < 7 && kaabaDistance >= 12 && kaabaDistance <= 140) {
      const currentBearing = bearing(KAABA_LOCATION.latitude, KAABA_LOCATION.longitude, latitude, longitude);
      const previousBearing = tawafTrackingRef.current.lastBearing;
      if (previousBearing !== null) {
        let delta = currentBearing - previousBearing;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        if (Math.abs(delta) <= 45) tawafTrackingRef.current.rotation += delta;
        if (tawafTrackingRef.current.rotation <= -300) {
          updateUmrahCircuit('tawaf', 1);
          tawafTrackingRef.current.rotation = 0;
        }
      }
      tawafTrackingRef.current.lastBearing = currentBearing;
    } else if (kaabaDistance > 180) {
      tawafTrackingRef.current.lastBearing = null;
      tawafTrackingRef.current.rotation = 0;
    }

    const safaDistance = haversineDistance(latitude, longitude, SAFA_LOCATION.latitude, SAFA_LOCATION.longitude);
    const marwaDistance = haversineDistance(latitude, longitude, MARWA_LOCATION.latitude, MARWA_LOCATION.longitude);
    const endpoint = safaDistance <= 60 ? 'safa' : marwaDistance <= 60 ? 'marwa' : null;
    if (endpoint && umrahCircuitCounts.sai < 7) {
      const previousEndpoint = saiTrackingRef.current;
      if (!previousEndpoint) {
        if (endpoint === 'safa') saiTrackingRef.current = endpoint;
      } else if (previousEndpoint !== endpoint) {
        updateUmrahCircuit('sai', 1);
        saiTrackingRef.current = endpoint;
      }
    }
  }, [userLocation, umrahCircuitCounts, updateUmrahCircuit]);

  const resetUmrahProgress = useCallback(() => {
    setCompletedUmrahCheckpoints([]);
    setUmrahCircuitCounts({ tawaf: 0, sai: 0 });
    umrahCompletionNotifiedRef.current = false;
    tawafTrackingRef.current = { lastBearing: null, rotation: 0 };
    saiTrackingRef.current = null;
    AsyncStorage.removeItem(CACHE_KEY_UMRAH_PROGRESS).catch(() => {});
    AsyncStorage.removeItem(CACHE_KEY_UMRAH_CIRCUITS).catch(() => {});
  }, []);

  const gatesWithDistance = React.useMemo(() => {
    if (!userLocation) return gates.map((g) => ({ ...g, distance: 0 }));
    return gates
      .map((g) => ({
        ...g,
        distance: haversineDistance(
          userLocation.latitude, userLocation.longitude,
          g.latitude, g.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [userLocation, gates]);

  const amenitiesWithDistance = React.useMemo(() => {
    if (!userLocation) return amenities.map((a) => ({ ...a, distance: 0 }));
    return amenities
      .map((a) => ({
        ...a,
        distance: haversineDistance(
          userLocation.latitude, userLocation.longitude,
          a.latitude, a.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [userLocation, amenities]);

  const nearestGate = gatesWithDistance.length > 0 ? gatesWithDistance[0] : null;

  return (
    <AppContext.Provider
      value={{
        userLocation,
        locationError,
        gates,
        amenities,
        isOnline,
        isLoading,
        lastSynced,
        syncData,
        retryLocation,
        setAmenitiesData,
        nearestGate,
        gatesWithDistance,
        amenitiesWithDistance,
        densityMap,
        notifications,
        dismissNotification,
        recommendation,
        acceptLocationDisclosure,
        completedUmrahCheckpoints,
        umrahCircuitCounts,
        toggleUmrahCheckpoint,
        updateUmrahCircuit,
        resetUmrahProgress,
      }}
    >
      {children}
      <Modal
        visible={showLocationDisclosure}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationDisclosure(false)}
      >
        <View style={disclosureStyles.backdrop}>
          <View style={disclosureStyles.dialog} accessibilityViewIsModal>
            <Text style={disclosureStyles.title}>Allow location access?</Text>
            <Text style={disclosureStyles.body}>
              Alharam Navigator collects your device location while you use the map to show your position, calculate distances, and recommend the nearest Haram gate.
            </Text>
            <Text style={disclosureStyles.body}>
              Your location is used only for these navigation features and is not collected in the background or shared for advertising.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue to location permission"
              style={disclosureStyles.button}
              onPress={acceptLocationDisclosure}
            >
              <Text style={disclosureStyles.buttonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppContext.Provider>
  );
}

const disclosureStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dialog: {
    borderRadius: 12,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    marginBottom: 12,
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  body: {
    marginBottom: 12,
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignSelf: 'flex-end',
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1E3F20',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
