import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RefObject } from 'react';
import type { Location as BGLocation, MotionChangeEvent } from 'react-native-background-geolocation';
import { appendCoordinateToPath, getLocationAccuracyMeters, getLocationTimestampMs, toCoordinate } from './backgroundTracking';
import { RECORDING_STORAGE_KEYS } from './recordingSession';

type Helpers = {
  isRecordingRef: RefObject<boolean>;
  setCurrentLocation: (c: { latitude: number; longitude: number } | null) => void;
  setAccuracy: (a: number | undefined) => void;
  setCoordinates: (coords: any) => void; // dispatcher
  coordinatesRef: RefObject<any[]>;
  lastAcceptedGpsTimestamp: RefObject<number>;
  lastLocationTimestamp: RefObject<number>;
  setElevation?: (n: number) => void;
  maxElevationRef?: RefObject<number>;
  setMaxElevation?: (n: number) => void;
  setSpeed?: (n: number) => void;
  maxSpeedRef?: RefObject<number>;
  setMaxSpeed?: (n: number) => void;
  saveBackup?: (coords: any[]) => void;
  lastBackupPointsRef?: RefObject<number>;
  lastBackupTimeRef?: RefObject<number>;
  stopStartTimeRef?: RefObject<number | null>;
  sniffTimeRef?: RefObject<number>;
  setSniffTime?: (n: number) => void;
};

export function processBGLocation(location: BGLocation, h: Helpers) {
  try {
    const locationAccuracy = getLocationAccuracyMeters(location);

    const coord = toCoordinate(location);
    if (!coord) return;

    const gpsTs = getLocationTimestampMs(location);
    if (gpsTs) h.lastAcceptedGpsTimestamp.current = gpsTs;
    h.lastLocationTimestamp.current = Date.now();

    h.setCurrentLocation(coord);
    h.setAccuracy(locationAccuracy);

    if (h.isRecordingRef.current) {
      try {
        appendCoordinateToPath(h.setCoordinates, coord, h.coordinatesRef.current);
      } catch (e) {
        // fallback
        appendCoordinateToPath(h.setCoordinates, coord);
      }

      // elevation
      try {
        const altitude = (location as any)?.coords?.altitude;
        if (typeof altitude === 'number' && h.setElevation && h.maxElevationRef && h.setMaxElevation) {
          const currentElevation = Math.max(0, altitude);
          h.setElevation(currentElevation);
          if (currentElevation > h.maxElevationRef.current) {
            h.maxElevationRef.current = currentElevation;
            h.setMaxElevation(currentElevation);
            AsyncStorage.setItem(RECORDING_STORAGE_KEYS.MAX_ELEVATION, currentElevation.toString()).catch(() => {});
          }
        }
      } catch (e) {
        // ignore
      }

      // speed
      try {
        const rawSpeed = (location as any)?.coords?.speed;
        if (typeof rawSpeed === 'number' && rawSpeed > 0 && h.setSpeed && h.maxSpeedRef && h.setMaxSpeed) {
          const currentSpeed = rawSpeed * 3.6;
          h.setSpeed(currentSpeed);
          if (currentSpeed > h.maxSpeedRef.current) {
            h.maxSpeedRef.current = currentSpeed;
            h.setMaxSpeed(currentSpeed);
            AsyncStorage.setItem(RECORDING_STORAGE_KEYS.MAX_SPEED, currentSpeed.toString()).catch(() => {});
          }
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    console.warn('processBGLocation error', err);
  }
}

export function makeMotionHandler(h: Helpers) {
  return (event: MotionChangeEvent) => {
    if (!h.isRecordingRef.current) return;

    if (!event.isMoving) {
      if (h.stopStartTimeRef) h.stopStartTimeRef.current = Date.now();
      try {
        if (h.coordinatesRef.current.length > 0 && h.saveBackup && h.lastBackupTimeRef && h.lastBackupPointsRef) {
          h.saveBackup(h.coordinatesRef.current);
          h.lastBackupTimeRef.current = Date.now();
          h.lastBackupPointsRef.current = h.coordinatesRef.current.length;
        }
      } catch (e) { /* swallow */ }
    } else {
      if (h.stopStartTimeRef && h.stopStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - h.stopStartTimeRef.current) / 1000);
        if (h.sniffTimeRef && h.setSniffTime) {
          h.sniffTimeRef.current += elapsed;
          h.setSniffTime(h.sniffTimeRef.current);
        }
        h.stopStartTimeRef.current = null;
      }
    }
  };
}
