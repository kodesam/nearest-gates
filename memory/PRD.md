# Haram Navigator - Product Requirements Document

## Overview
Mobile app that helps pilgrims navigate Masjid Al Haram in Makkah by showing their current location, nearest gate with real-time crowd density, all gates sorted by distance, smart gate recommendations, and nearby amenities. Works offline with cached data and syncs when online.

## Architecture
- **Frontend**: Expo React Native (SDK 54) with expo-router tab navigation
- **Backend**: FastAPI with MongoDB (motor async driver)
- **Map**: Leaflet.js via iframe (web) / WebView (mobile) with CartoDB Voyager tiles
- **Offline**: AsyncStorage for POI data caching
- **Density**: Simulated crowd density with 30s refresh, persisted in memory cache

## Features
1. **Interactive Map** - Full-screen OpenStreetMap with gate markers color-coded by crowd density (green/yellow/orange/red), amenity markers, Kaaba marker, user location dot, density legend
2. **Real-time Crowd Density** - Simulated density data for all 25 gates (low/medium/high/very_high), refreshes every 30 seconds, visible on map markers and gate cards
3. **Smart Gate Recommendations** - Backend scores gates by 40% distance + 60% density, in-app notification banners suggest best gate, recommendation banner in bottom panel
4. **Nearest Gate Finder** - Bottom panel showing nearest gate with name, Arabic name, gate number, distance, direction, density badge, and route display
5. **Gates List** - 25 Haram gates searchable by name/number, filterable by side, each card shows density badge
6. **Amenities List** - 20 nearby amenities filterable by category (Restaurant, Grocery, Bus Stop, Taxi Stand, Meqat)
7. **Offline/Online Sync** - Data cached in AsyncStorage, auto-loads from cache when offline, manual sync button, online/offline status indicator
8. **In-app Notifications** - Animated slide-in banners for gate recommendations, auto-dismiss after 8s, tappable to navigate to recommended gate

## API Endpoints
| Endpoint | Method | Description |
|---|---|---|
| /api/gates | GET | Returns all 25 gates |
| /api/gates/density | GET | Returns crowd density for all gates (30s cache) |
| /api/gates/recommend | GET | Best gate by lat/lng + density (query: ?lat=&lng=) |
| /api/amenities | GET | Returns amenities (optional ?category= filter) |
| /api/sync/status | GET | Returns sync status with counts |

## Data
- **25 Gates**: Distributed around Haram perimeter with coordinates, Arabic/English names, gate numbers, side labels
- **20 Amenities**: 6 restaurants, 5 grocery shops, 3 bus stops, 3 taxi stands, 3 meqat locations
- **Density**: Simulated per-gate density with base weights (south gates busier) + random drift

## Tech Stack
- expo-location, @react-native-async-storage/async-storage, react-native-webview
- Leaflet.js, CartoDB Voyager tiles, react-native-reanimated (notification animations)
