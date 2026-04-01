import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinate } from '@/types/trail';

export const RECORDING_STORAGE_KEYS = {
  START_TIME: 'recording_start_time',
  COORDINATES: 'recording_coordinates',
  MAX_ELEVATION: 'recording_max_elevation',
  MAX_SPEED: 'recording_max_speed',
  LAST_UPDATE: 'recording_last_update',
  SNIFF_TIME: 'recording_sniff_time',
} as const;

type LoadRecordingSnapshotOptions = {
  fallbackCoordinates?: Coordinate[];
  fallbackMaxElevation?: number;
  fallbackMaxSpeed?: number;
  fallbackDuration?: number;
};

export async function initializeRecordingSession(startTime: number = Date.now()) {
  await AsyncStorage.setItem(RECORDING_STORAGE_KEYS.START_TIME, startTime.toString());
  await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.COORDINATES);
  await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.MAX_ELEVATION);
  await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.MAX_SPEED);
  await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.LAST_UPDATE);
}

export async function clearRecordingSession(includeSniffTime: boolean = false) {
  await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.START_TIME);
  await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.COORDINATES);
  await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.MAX_ELEVATION);
  await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.MAX_SPEED);
  await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.LAST_UPDATE);
  if (includeSniffTime) {
    await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.SNIFF_TIME);
  }
}

export async function loadRecordingSnapshot(options: LoadRecordingSnapshotOptions = {}) {
  const {
    fallbackCoordinates = [],
    fallbackMaxElevation = 0,
    fallbackMaxSpeed = 0,
    fallbackDuration = 0,
  } = options;

  const startTimeStr = await AsyncStorage.getItem(RECORDING_STORAGE_KEYS.START_TIME);
  const hasSession = !!startTimeStr;

  const coordinatesStr = await AsyncStorage.getItem(RECORDING_STORAGE_KEYS.COORDINATES);
  const coordinates = coordinatesStr ? JSON.parse(coordinatesStr) as Coordinate[] : fallbackCoordinates;

  const maxElevationStr = await AsyncStorage.getItem(RECORDING_STORAGE_KEYS.MAX_ELEVATION);
  const maxElevation = maxElevationStr ? parseFloat(maxElevationStr) : fallbackMaxElevation;

  const maxSpeedStr = await AsyncStorage.getItem(RECORDING_STORAGE_KEYS.MAX_SPEED);
  const maxSpeed = maxSpeedStr ? parseFloat(maxSpeedStr) : fallbackMaxSpeed;

  const duration = startTimeStr ? Math.floor((Date.now() - parseInt(startTimeStr, 10)) / 1000) : fallbackDuration;

  return {
    hasSession,
    startTimeStr,
    coordinates,
    maxElevation,
    maxSpeed,
    duration,
  };
}
