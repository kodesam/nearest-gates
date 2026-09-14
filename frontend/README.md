# Alharam Navigator

Alharam Navigator helps users find the nearest gates of Masjid Al Haram and nearby amenities, with offline caching and live crowd-density support.

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
   ```` 

The app uses file-based routing in the `app` directory and supports development builds on Android and iOS.

## Notes

- The native app name is set to Alharam Navigator.
- The app icon and splash assets already use the project branding favicon.
