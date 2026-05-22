import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import BackgroundGeolocation from 'react-native-background-geolocation';
import type { MutableRefObject } from 'react';

export function openAppSettings() {
  try {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if ((Linking as any).openSettings) {
      (Linking as any).openSettings();
    }
  } catch (e) {
    console.warn('Could not open settings:', e);
  }
}

function showOpenSettingsAlert(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: openAppSettings },
  ]);
}

export async function ensureForegroundLocationPermission(): Promise<boolean> {
  try {
    // @ts-ignore - expo-location typings
    const current = await Location.getForegroundPermissionsAsync?.();
    const currentStatus = current?.status ?? null;
    if (currentStatus === 'granted') return true;

    // Already denied — skip rationale and offer Settings link directly
    if (currentStatus === 'denied') {
      showOpenSettingsAlert(
        'Location Permission Needed',
        'TailTrails needs location access to show your position on the map. Please enable it in Settings.',
      );
      return false;
    }

    // First time — show rationale, then the native prompt
    await new Promise<void>((resolve) => {
      Alert.alert(
        'Allow Location While Using the App?',
        'TailTrails uses your location to show your real-time position on the map and enable features like live-follow and walk recording.\n\nWe only request foreground location now — background tracking is requested separately when you start a walk.',
        [{ text: 'Continue', onPress: () => resolve() }],
        { cancelable: false },
      );
    });

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') return true;

    showOpenSettingsAlert(
      'Location Permission Needed',
      'TailTrails needs location access to show your position on the map. Please enable it in Settings.',
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
