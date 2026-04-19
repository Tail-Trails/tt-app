import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dispatch, SetStateAction } from 'react';
import { Coordinate } from '@/types/trail';
import { RECORDING_STORAGE_KEYS } from './recordingSession';
import { calculateDistance } from './distance';

// Allow somewhat older locations (e.g. queued or delayed deliveries).
// Previously 20s; increase to 60s to avoid rejecting valid late events.
export const BG_MAX_LOCATION_AGE_MS = 60_000;
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
  if (location?.sample === true) {
    console.log('shouldAcceptTrackedLocation: rejected (sample)');
    return false;
  }

  const timestamp = getLocationTimestampMs(location);
  if (!timestamp) {
    console.log('shouldAcceptTrackedLocation: rejected (no timestamp)');
    return false;
  }

  if (now - timestamp > maxLocationAgeMs) {
    console.log('shouldAcceptTrackedLocation: rejected (stale). ageMs=', now - timestamp);
    return false;
  }

  const currentTime = Date.now();
  console.log(`shouldAcceptTrackedLocation: timestamp=${new Date(timestamp).toISOString()} now=${new Date(currentTime).toISOString()} age_s=${((currentTime - timestamp) / 1000).toFixed(1)} accuracy_m=${getLocationAccuracyMeters(location)}`);

  // Reject out-of-order delivery (clock skew): GPS timestamp should advance
  // monotonically. Allow a small negative skew to accommodate minor device
  // clock adjustments or platform timestamp quirks.
  const ALLOW_SKEW_MS = 2000; // tolerate up to 2s backward skew
  if (options.minTimestampMs != null) {
    if (timestamp <= options.minTimestampMs) {
      const diff = options.minTimestampMs - timestamp;
      if (diff > ALLOW_SKEW_MS) {
        console.log('shouldAcceptTrackedLocation: rejected (timestamp <= minTimestampMs). diff_ms=', diff);
        return false;
      } else {
        console.log('shouldAcceptTrackedLocation: warning (small backward skew tolerated). diff_ms=', diff);
      }
    }
  }

  const accuracy = getLocationAccuracyMeters(location);
  if (accuracy == null) {
    console.log('shouldAcceptTrackedLocation: rejected (no accuracy)');
    return false;
  }
  if (accuracy > maxAccuracyMeters) {
    console.log('shouldAcceptTrackedLocation: rejected (low accuracy). accuracy=', accuracy);
    return false;
  }

  console.log('shouldAcceptTrackedLocation: accepted');
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
  prevCoords?: Coordinate[]
) {
  const normalized = { 
    latitude: Number(coordinate.latitude), 
    longitude: Number(coordinate.longitude) 
  };

  setCoordinates((prev) => {
    const last = (prevCoords && prevCoords.length > 0) ? prevCoords[prevCoords.length - 1] : prev[prev.length - 1];
    
    // Prevent duplicate points from bloating the array
    if (last && last.latitude === normalized.latitude && last.longitude === normalized.longitude) {
      console.log('appendCoordinateToPath: skipped duplicate point', normalized);
      return prev;
    }

    // Filter large jumps (likely outliers). Calculate haversine distance in meters.
    if (last) {
      try {
        const distMeters = calculateDistance(last, normalized) * 1000; // calculateDistance returns km
        const MAX_JUMP_METERS = 100; // configurable threshold
        if (distMeters > MAX_JUMP_METERS) {
          // If we only have a single seed point so far, it's likely that
          // the seed was stale/inaccurate. Replace the seed with the
          // incoming stable point instead of rejecting every subsequent
          // point that compares to the stale seed.
          if (prev.length <= 1) {
            console.log('appendCoordinateToPath: replacing initial seed due to large initial jump', { distMeters, from: last, to: normalized });
            return [normalized];
          }

          console.log('appendCoordinateToPath: rejected large jump', { distMeters, from: last, to: normalized });
          return prev; // skip this outlier point
        }
      } catch (e) {
        // ignore calc errors and proceed
      }
    }

    const next = [...prev, normalized];
    const willDrawLine = next.length >= 2;
    console.log('appendCoordinateToPath: added point', normalized, 'points=', next.length, 'drawLine=', willDrawLine);
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
