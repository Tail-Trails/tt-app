import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { Coordinate } from '@/types/trail';

type InitialLocationResult = {
  coordinate: Coordinate | null;
  accuracy?: number;
};

export async function requestBgPermissionAndInitialLocation(timeout: number = 30): Promise<InitialLocationResult> {
  // Ask the user for a brief rationale before invoking the native background permission prompt.
  // Background location allows TailTrails to continue recording your walk when the app is backgrounded
  // or the screen is locked.
  // @ts-ignore
  const userAgreed = await new Promise<boolean>((resolve) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Alert } = require('react-native');
      Alert.alert(
        'Allow Background Location?',
        'To record your walk while the app is in the background or your screen is locked, TailTrails needs background location access.\n\nYou can deny this and still use the app, but walk recording may stop when the app is backgrounded.',
        [
          { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Continue', onPress: () => resolve(true) },
        ],
      );
    } catch (e) {
      resolve(true);
    }
  });
  if (!userAgreed) return { coordinate: null, accuracy: undefined };

  // @ts-ignore
  await BackgroundGeolocation.requestPermission();
  try {
    // @ts-ignore
    const loc = await BackgroundGeolocation.getCurrentPosition({ timeout });
    if (loc?.coords) {
      return {
        coordinate: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
        accuracy: loc.coords.accuracy ?? undefined,
      };
    }
  } catch {
    // Non-fatal: caller may continue without immediate fix
  }
  return { coordinate: null, accuracy: undefined };
}

export async function resolveInitialRecordingCoordinate(
  currentLocation?: Coordinate | null,
  timeout: number = 30,
): Promise<InitialLocationResult> {
  if (currentLocation) {
    return { coordinate: currentLocation, accuracy: undefined };
  }
  return requestBgPermissionAndInitialLocation(timeout);
}

export async function captureAndStoreRecordingPhoto() {
  if (Platform.OS === 'web') {
    return { status: 'not-supported' as const };
  }

  // Ask the user why we need camera access before invoking the native prompt
  const cameraAgreed: boolean = await new Promise((resolve) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Alert } = require('react-native');
      Alert.alert(
        'Allow Camera Access?',
        'TailTrails can take photos during your walk to attach to your recording and make your trail memories richer.',
        [
          { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Continue', onPress: () => resolve(true) },
        ],
      );
    } catch (e) {
      resolve(true);
    }
  });
  if (!cameraAgreed) return { status: 'permission-denied' as const };

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return { status: 'permission-denied' as const };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    base64: false,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return { status: 'cancelled' as const };
  }

  const uri = result.assets[0].uri;
  let savedToGallery = false;
  try {
    // Explain why we might save to the user's gallery
    const mediaAgreed: boolean = await new Promise((resolve) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Alert } = require('react-native');
        Alert.alert(
          'Save Photo to Library?',
          'If you allow access to your photo library, TailTrails can save a copy of photos you take during walks to your device gallery.',
          [
            { text: 'Don\'t Save', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Allow & Save', onPress: () => resolve(true) },
          ],
        );
      } catch (e) {
        resolve(true);
      }
    });

    if (mediaAgreed) {
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus === 'granted') {
        try {
          await MediaLibrary.saveToLibraryAsync(uri);
          savedToGallery = true;
        } catch (err) {
          console.warn('Failed to save photo to gallery', err);
        }
      } else {
        console.warn('Media library permission not granted, photo not saved to gallery');
      }
    }
  } catch (err) {
    console.warn('Media library error', err);
  }
  const photosStr = await AsyncStorage.getItem('recording_photos');
  const photos = photosStr ? JSON.parse(photosStr) : [];
  photos.push({ uri, timestamp: Date.now() });
  await AsyncStorage.setItem('recording_photos', JSON.stringify(photos));

  return { status: 'saved' as const, savedToGallery };
}
