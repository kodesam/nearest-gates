# Haram Navigator - Product Requirements Document

## Overview
Mobile app that helps pilgrims navigate Masjid Al Haram in Makkah by showing their current location, nearest gate, all gates sorted by distance, and nearby amenities. Works offline with cached data and syncs when online.

## Architecture
- **Frontend**: Expo React Native (SDK 54) with expo-router tab navigation
- **Backend**: FastAPI with MongoDB (motor async driver)
- **Map**: Leaflet.js via iframe (web) / WebView (mobile) with CartoDB Voyager tiles
- **Offline**: AsyncStorage for POI data caching

## Features
1. **Interactive Map** - Full-screen OpenStreetMap with gate markers (green), amenity markers (colored), Kaaba marker (black), user location dot (blue)
2. **Nearest Gate Finder** - Bottom panel showing nearest gate with name, Arabic name, gate number, distance, direction, and route display
3. **Gates List** - 25 Haram gates searchable by name/number, filterable by side (North/South/East/West)
4. **Amenities List** - 20 nearby amenities filterable by category (Restaurant, Grocery, Bus Stop, Taxi Stand, Meqat)
5. **Offline/Online Sync** - Data cached in AsyncStorage, manual sync button, clear cache option, online/offline status indicator
6. **Settings** - Connection status, cached data counts, sync controls, app info

## API Endpoints
| Endpoint | Method | Description |
|---|---|---|
| /api/gates | GET | Returns all 25 gates |
| /api/amenities | GET | Returns all amenities (optional ?category= filter) |
| /api/sync/status | GET | Returns sync status with counts |

## Data
- **25 Gates**: Distributed around Haram perimeter with coordinates, Arabic/English names, gate numbers, side labels
- **20 Amenities**: 6 restaurants, 5 grocery shops, 3 bus stops, 3 taxi stands, 3 meqat locations

## Tech Stack
- expo-location (GPS)
- @react-native-async-storage/async-storage (offline caching)
- react-native-webview (mobile map)
- Leaflet.js (map rendering)
- CartoDB Voyager (map tiles)
