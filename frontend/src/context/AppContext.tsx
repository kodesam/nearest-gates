import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GateData, AmenityData, FALLBACK_GATES, FALLBACK_AMENITIES } from '../data/haramData';
import { haversineDistance } from '../utils/location';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const CACHE_KEY_GATES = '@haram_gates';
const CACHE_KEY_AMENITIES = '@haram_amenities';
const CACHE_KEY_LAST_SYNC = '@haram_last_sync';

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
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
  nearestGate: (GateData & { distance: number }) | null;
  gatesWithDistance: (GateData & { distance: number })[];
  amenitiesWithDistance: (AmenityData & { distance: number })[];
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
  nearestGate: null,
  gatesWithDistance: [],
  amenitiesWithDistance: [],
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
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    initLocation();
    loadCachedData();
    fetchFromAPI();
    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  const initLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Showing default Haram location.');
        setIsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? undefined,
      });
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? undefined,
          });
        }
      );
    } catch (err) {
      setLocationError('Could not get location');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCachedData = async () => {
    try {
      const cachedGates = await AsyncStorage.getItem(CACHE_KEY_GATES);
      const cachedAmenities = await AsyncStorage.getItem(CACHE_KEY_AMENITIES);
      const cachedSync = await AsyncStorage.getItem(CACHE_KEY_LAST_SYNC);
      if (cachedGates) setGates(JSON.parse(cachedGates));
      if (cachedAmenities) setAmenities(JSON.parse(cachedAmenities));
      if (cachedSync) setLastSynced(cachedSync);
    } catch {}
  };

  const fetchFromAPI = async () => {
    try {
      const [gatesRes, amenitiesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/gates`),
        fetch(`${BACKEND_URL}/api/amenities`),
      ]);
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
      }
    } catch {
      setIsOnline(false);
    }
  };

  const syncData = useCallback(async () => {
    setIsLoading(true);
    await fetchFromAPI();
    setIsLoading(false);
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
        nearestGate,
        gatesWithDistance,
        amenitiesWithDistance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
