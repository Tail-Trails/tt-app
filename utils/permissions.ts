import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import BackgroundGeolocation from 'react-native-background-geolocation';
import type { MutableRefObject } from 'react';

export async function ensureForegroundLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') return true;

    // Permission denied — prompt the user to open app settings so they can enable it.
    Alert.alert(
      'Location Permission Required',
      'This feature needs access to your location. Open settings to enable location access?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            try {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else if ((Linking as any).openSettings) {
                // react-native newer API
                (Linking as any).openSettings();
              } else {
                Linking.openURL('package:' + (Platform.OS === 'android' ? '' : ''));
              }
            } catch (e) {
              console.warn('Could not open settings:', e);
            }
          },
        },
      ]
    );
    return false;
  } catch (err) {
    console.warn('ensureForegroundLocationPermission error:', err);
    return false;
  }
}

export default ensureForegroundLocationPermission;

export async function checkBackgroundPermissionStatus(bgReadyRef: MutableRefObject<boolean>): Promise<boolean> {
  try {
    // Wait briefly for background SDK to initialize to avoid races
    const start = Date.now();
    while (!bgReadyRef.current && (Date.now() - start) < 2000) {
      // small delay
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 100));
    }

    if (!bgReadyRef.current) return false;

    // Try to query native provider state first to avoid triggering permission UI
    // @ts-ignore
    const state = await (BackgroundGeolocation.getProviderState?.() ?? BackgroundGeolocation.getState?.());
    if (state) {
      const s: any = state;
      const enabled = s.enabled === true;
      const authVal = s.authorization ?? s.authorizationStatus ?? s.status ?? null;
      const authStr = typeof authVal === 'string' ? authVal.toLowerCase() : null;
      const authorized = enabled || (authStr && (
        authStr.includes('always') || authStr.includes('when_in_use') || authStr.includes('authorized') || authStr.includes('granted') || authStr === 'authorized'
      ));
      if (authorized) return true;
    }

    return false;
  } catch (err) {
    console.warn('checkBackgroundPermissionStatus error:', err);
    return false;
  }
}
