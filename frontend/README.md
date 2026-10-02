# Alharam Navigator

Alharam Navigator helps users find the nearest gates of Masjid Al Haram and nearby amenities, with offline caching and live crowd-density support.

## Features

- **Map** – Masjid Al Haram map with the nearest gate to your location, live/simulated crowd density and gate recommendations.
- **Gates** – Gates sorted by distance with direction arrows and crowd levels.
- **Amenities** – Restaurants, groceries, bus stops, taxi stands and meqat filtered by category. Tap any amenity for Google Maps directions from your location.
- **Places** – Pilgrim places (Haram, Mashair, history, mosques, landmarks) with distance and direction. Tap a place for directions.
- **Umrah tracker** – Checkpoint progress and Tawaf circuit counter on the map.
- **Hajj Route Map** – Hajj checkpoints on a map, with the Hajj logo in the header.
- **Masjid Al Nabawi Gates** – Madinah gate map with the Nabawi Mosque logo. Gates are sorted by distance and direction from your location.
- **Indoor navigation** – Floor-by-floor points of interest inside the Haram.
- **Dua** – Umrah and Hajj duas, filterable by category.
- **Checklist** – Packing and preparation checklist (documents, clothing, health, essentials).
- **Tasbih** – Tap counter with completed cycles.
- **Notifications and offline cache** – Alerts for nearby events and cached gates/amenities for offline use.
- **Settings** – Switch crowd data between Simulation and Live mode (live data is pushed via `POST /api/gates/density/push`; the API URL cannot be entered in the app), refresh amenities from OpenStreetMap and clear cached data.

Location is shared across all screens, so distances and directions work on the Nabawi and Hajj maps as well.

## Run locally

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```
3. Build app 
   ```
    eas build --platform android --profile production
   ```

The app uses file-based routing in the `app` directory and supports development builds on Android and iOS.

## Notes

- Current version: 2.0.0 (Android versionCode 6).
- The native app name is set to Alharam Navigator.
- The app icon and splash assets already use the project branding favicon.
