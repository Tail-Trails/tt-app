import 'dotenv/config';

// Import your existing static config
const appConfig = require('./app.json');

export default {
  // Spread the existing expo object from app.json
  ...appConfig.expo,
  
  // Overwrite or add to the 'extra' field
  extra: {
    ...appConfig.expo.extra, // Keep any extras already in app.json
    // Expose runtime env vars to the Expo `Constants.expoConfig.extra` object
    // Use the EXPO_PUBLIC_ prefix variables used across the app
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_APIKey || process.env.GOOGLE_MAPS_API_KEY,
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  },
};