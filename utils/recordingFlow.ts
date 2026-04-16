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
  } catch (err) {
    console.warn('Media library error', err);
  }
  const photosStr = await AsyncStorage.getItem('recording_photos');
  const photos = photosStr ? JSON.parse(photosStr) : [];
  photos.push({ uri, timestamp: Date.now() });
  await AsyncStorage.setItem('recording_photos', JSON.stringify(photos));

  return { status: 'saved' as const, savedToGallery };
}
