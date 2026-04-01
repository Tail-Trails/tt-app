import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dispatch, SetStateAction } from 'react';
import { Coordinate } from '@/types/trail';

export const BG_MAX_LOCATION_AGE_MS = 20_000;
export const BG_MAX_ACCURACY_METERS = 50;
export const BG_DISTANCE_FILTER_METERS = 10;

type BGLocationLike = {
  sample?: boolean;
  timestamp?: string | number;
  coords?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number | null;
  };
};

type ValidateOptions = {
  maxLocationAgeMs?: number;
  maxAccuracyMeters?: number;
  /** Reject any location whose GPS timestamp (ms) is older than this value. */
  minTimestampMs?: number;
  now?: number;
};

export function getLocationTimestampMs(location: BGLocationLike): number | null {
  const raw = location?.timestamp;
  const parsed = typeof raw === 'number' ? raw : new Date(raw || '').getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function getLocationAccuracyMeters(location: BGLocationLike): number | undefined {
  const accuracy = Number(location?.coords?.accuracy);
  return Number.isFinite(accuracy) ? accuracy : undefined;
}

export function shouldAcceptTrackedLocation(location: BGLocationLike, options: ValidateOptions = {}): boolean {
  const now = options.now ?? Date.now();
  const maxLocationAgeMs = options.maxLocationAgeMs ?? BG_MAX_LOCATION_AGE_MS;
  const maxAccuracyMeters = options.maxAccuracyMeters ?? BG_MAX_ACCURACY_METERS;

  if (location?.sample === true) return false;

  const timestamp = getLocationTimestampMs(location);
  if (!timestamp) return false;
  if (now - timestamp > maxLocationAgeMs) return false;

  // Reject out-of-order delivery (clock skew): GPS timestamp must advance monotonically.
  if (options.minTimestampMs != null && timestamp <= options.minTimestampMs) return false;

  const accuracy = getLocationAccuracyMeters(location);
  if (accuracy == null || accuracy > maxAccuracyMeters) return false;

  return true;
}

export function toCoordinate(location: BGLocationLike): Coordinate | null {
  const latitude = Number(location?.coords?.latitude);
  const longitude = Number(location?.coords?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export function appendCoordinateToPath(
  setCoordinates: Dispatch<SetStateAction<Coordinate[]>>,
  coordinate: Coordinate,
  storageKey: string = 'recording_coordinates'
) {
  setCoordinates((prev) => {
    const next = [...prev, coordinate];
    AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
    return next;
  });
}

/**
 * Filter a recorded path to remove jumps (out-of-order timestamps, low accuracy).
 * Pass raw location objects from BackgroundGeolocation.getLocations().
 * @returns Cleaned Coordinate array preserving only valid, monotonic timestamps.
 */
export function cleanRecordedPath(locations: BGLocationLike[]): Coordinate[] {
  const cleaned: Coordinate[] = [];
  let lastGpsTimestamp = 0;

  for (const loc of locations) {
    const coord = toCoordinate(loc);
    if (!coord) continue;

    // Check accuracy
    const accuracy = getLocationAccuracyMeters(loc);
    if (accuracy == null || accuracy > BG_MAX_ACCURACY_METERS) continue;

    // Check timestamp monotonicity
    const gpsTs = getLocationTimestampMs(loc);
    if (!gpsTs || gpsTs <= lastGpsTimestamp) continue;

    lastGpsTimestamp = gpsTs;
    cleaned.push(coord);
  }

  return cleaned;
}
