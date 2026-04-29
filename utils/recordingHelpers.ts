import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { initializeRecordingSession, loadRecordingSnapshot, RECORDING_STORAGE_KEYS } from './recordingSession';
import { resolveInitialRecordingCoordinate } from './recordingFlow';
import { Coordinate, Trail } from '@/types/trail';

type LoadStateParams = {
  setCoordinates: (c: Coordinate[]) => void;
  setIsRecording: (b: boolean) => void;
  setDuration: (n: number) => void;
  setMaxElevation: (n: number) => void;
  setMaxSpeed: (n: number) => void;
};

export async function loadRecordingState(params: LoadStateParams) {
  const { setCoordinates, setIsRecording, setDuration, setMaxElevation, setMaxSpeed } = params;
  try {
    const snapshot = await loadRecordingSnapshot();

    if (!snapshot.hasSession) {
      await AsyncStorage.removeItem(RECORDING_STORAGE_KEYS.COORDINATES);
      setCoordinates([]);
      setIsRecording(false);
      setDuration(0);
    } else {
      setIsRecording(true);
      setCoordinates(snapshot.coordinates);
      setDuration(snapshot.duration);
    }

    setMaxElevation(snapshot.maxElevation);
    setMaxSpeed(snapshot.maxSpeed);
  } catch (err) {
    console.error('Error loading recording state (helper):', err);
  }
}

type RequestPermsParams = {
  bgReadyRef: { current: boolean };
  setHasPermission: (b: boolean) => void;
  setIsLoadingPermission: (b: boolean) => void;
  setCurrentLocation?: (c: Coordinate | null) => void;
  requestBgPermissionAndInitialLocation: (timeout: number) => Promise<any>;
};

export async function requestPermissions(params: RequestPermsParams) {
  const { bgReadyRef, setHasPermission, setIsLoadingPermission, setCurrentLocation, requestBgPermissionAndInitialLocation } = params;
  try {
    if (!bgReadyRef.current) {
      setHasPermission(false);
      setIsLoadingPermission(false);
      return;
    }

    try {
      const initial = await requestBgPermissionAndInitialLocation(30);
      if (initial.coordinate && setCurrentLocation) setCurrentLocation(initial.coordinate);
      setHasPermission(true);
    } catch (err) {
      console.warn('BG getCurrentPosition failed (helper)', err);
      setHasPermission(true);
    }
  } catch (err) {
    console.error('Permission error (helper):', err);
    setHasPermission(false);
  } finally {
    setIsLoadingPermission(false);
  }
}

type StartParams = {
  setIsRecording: (b: boolean) => void;
  setCoordinates: (c: Coordinate[]) => void;
  setDuration: (n: number) => void;
  setMaxElevation: (n: number) => void;
  setMaxSpeed: (n: number) => void;
  setCurrentLocation?: (c: Coordinate | null) => void;
  bgReadyRef: { current: boolean };
  resolveInitialRecordingCoordinate: typeof resolveInitialRecordingCoordinate;
  timerRef: { current: ReturnType<typeof setInterval> | null };
  setStartLocation?: (s: any) => void;
};

export async function startRecordingShared(params: StartParams) {
  const { setIsRecording, setCoordinates, setDuration, setMaxElevation, setMaxSpeed, setCurrentLocation, bgReadyRef, resolveInitialRecordingCoordinate, timerRef, setStartLocation } = params;
  if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  setIsRecording(true);
  setCoordinates([]);
  setDuration(0);
  setMaxElevation(0);
  setMaxSpeed(0);

  try {
    const startTime = Date.now();
    await initializeRecordingSession(startTime);

    // seed initial coordinate if available
    if (bgReadyRef.current && resolveInitialRecordingCoordinate) {
      try {
        const initial = await resolveInitialRecordingCoordinate(undefined, 30);
        if (initial?.coordinate) {
          await AsyncStorage.setItem(RECORDING_STORAGE_KEYS.COORDINATES, JSON.stringify([initial.coordinate]));
          setCoordinates([initial.coordinate]);
          if (setCurrentLocation) setCurrentLocation(initial.coordinate);
        }
      } catch (e) { /* ignore */ }
    }

    if (setStartLocation) setStartLocation(null);

    try {
      if (!bgReadyRef.current) {
        const startWait = Date.now();
        while (!bgReadyRef.current && Date.now() - startWait < 5000) {
          await new Promise((res) => setTimeout(res, 100));
        }
      }

      await BackgroundGeolocation.start();
      // BE AWARE: Force the background geolocation plugin into the "moving" state.
      // This is especially important for testing on iOS simulators (like "City Run")
      // because simulators do not simulate the CMMotionActivity (motion sensor) events 
      // that the plugin normally relies on to wake up from its stationary state.
      await BackgroundGeolocation.changePace(true);
    } catch (bgErr) {
      console.warn('BackgroundGeolocation.start() failed (helper)', bgErr);
    }

    timerRef.current = setInterval(async () => {
      try {
        const startTimeStr = await AsyncStorage.getItem(RECORDING_STORAGE_KEYS.START_TIME);
        if (startTimeStr) {
          const startTime = parseInt(startTimeStr);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setDuration(elapsed);
        }
      } catch (err) { /* swallow */ }
    }, 1000);
  } catch (err) {
    console.error('Recording error (helper):', err);
    setIsRecording(false);
  }
}

type StopParams = {
  timerRef: { current: ReturnType<typeof setInterval> | null };
  coordinates: Coordinate[];
  maxElevation: number;
  maxSpeed: number;
  duration: number;
};

export async function stopRecordingShared(params: StopParams) {
  const { timerRef, coordinates, maxElevation, maxSpeed, duration } = params;
  try {
    await BackgroundGeolocation.stop();
  } catch (err) {
    console.warn('BG stop error (helper)', err);
  }

  if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

  const snapshot = await loadRecordingSnapshot({
    fallbackCoordinates: coordinates,
    fallbackMaxElevation: maxElevation,
    fallbackMaxSpeed: maxSpeed,
    fallbackDuration: duration,
  });

  return snapshot;
}
