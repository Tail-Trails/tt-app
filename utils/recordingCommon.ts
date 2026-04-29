import { useState, useRef, useEffect } from 'react';
import { Animated, PanResponder, Dimensions, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { appendCoordinateToPath } from '@/utils/backgroundTracking';
import { RECORDING_STORAGE_KEYS } from '@/utils/recordingSession';
import { Coordinate } from '@/types/trail';
import { calculateTotalDistance } from '@/utils/distance';

export function useBottomSheet() {
  const bottomSheetHeight = Dimensions.get('window').height * 0.5;
  const collapsedHeight = 40;
  const navbarHeight = Platform.OS === 'ios' ? 100 : 92;
  const bottomSheetAnim = useRef(new Animated.Value(collapsedHeight)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const initialHeight = useRef<number>(0);

  const expandBottomSheet = () => { setIsExpanded(true); Animated.spring(bottomSheetAnim, { toValue: bottomSheetHeight, useNativeDriver: false, tension: 50, friction: 8 }).start(); };
  const collapseBottomSheet = () => { setIsExpanded(false); Animated.spring(bottomSheetAnim, { toValue: collapsedHeight, useNativeDriver: false, tension: 50, friction: 8 }).start(); };
  const toggleBottomSheet = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (isExpanded) collapseBottomSheet(); else expandBottomSheet(); };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
    onPanResponderGrant: () => { initialHeight.current = (bottomSheetAnim as any)._value; },
    onPanResponderMove: (_, gestureState) => {
      const newValue = initialHeight.current - gestureState.dy;
      if (newValue >= collapsedHeight && newValue <= bottomSheetHeight) {
        bottomSheetAnim.setValue(newValue);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const threshold = (bottomSheetHeight + collapsedHeight) / 2;
      const currentValue = (bottomSheetAnim as any)._value;
      if (gestureState.dy < -50) expandBottomSheet();
      else if (gestureState.dy > 50) collapseBottomSheet();
      else if (currentValue > threshold) expandBottomSheet();
      else collapseBottomSheet();
    },
  });

  return { bottomSheetAnim, isExpanded, expandBottomSheet, collapseBottomSheet, toggleBottomSheet, panResponder, bottomSheetHeight, collapsedHeight, navbarHeight };
}

export function computePace(durationSeconds: number, coordinates: Coordinate[]) {
  if (durationSeconds <= 0) return '0:00';
  const distance = calculateTotalDistance(coordinates);
  const distanceKm = distance / 1000;
  const durationMin = durationSeconds / 60;
  if (distanceKm <= 0) return '0:00';
  const paceMinPerKm = durationMin / distanceKm;
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function makeRecenterMapFactory(opts: {
  mapRef: any;
  bgReadyRef: { current: boolean };
  currentLocationRef: { current: Coordinate | null } | null;
  setCurrentLocation: (c: Coordinate) => void;
  setAccuracy?: (v: number | undefined) => void;
}) {
  return async function recenterMap() {
    if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { mapRef, bgReadyRef, currentLocationRef, setCurrentLocation, setAccuracy } = opts;
    if (!mapRef?.current) return;
    try {
      console.log('Recentering map, currentLocationRef=', currentLocationRef?.current, 'bgReady=', bgReadyRef.current);
      let coord = currentLocationRef?.current ?? null;
      if (bgReadyRef.current) {
        try {
          const loc = await BackgroundGeolocation.getCurrentPosition({ timeout: 30 });
          if (loc && loc.coords) coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          if (setAccuracy) setAccuracy(loc?.coords?.accuracy);
        } catch (err) {
          // ignore and fallback
        }
      }

      if (coord) {
        setCurrentLocation(coord);
        mapRef.current.animateToRegion({ latitude: coord.latitude, longitude: coord.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
      }
    } catch (err) {
      console.error('Error recentering map:', err);
    }
  };
}

export function usePersistCoordinates(isRecording: boolean, coordinates: Coordinate[]) {
  useEffect(() => {
    const save = async () => {
      if (isRecording && coordinates.length > 0) {
        try {
          await AsyncStorage.setItem(RECORDING_STORAGE_KEYS.COORDINATES, JSON.stringify(coordinates));
        } catch (err) {
          console.error('Failed to persist coordinates:', err);
        }
      }
    };

    save();
  }, [isRecording, coordinates]);
}

export function usePollingPosition(opts: {
  isRecording: boolean;
  bgReadyRef: { current: boolean };
  isRecordingRef: { current: boolean };
  setCurrentLocation: (c: Coordinate | null) => void;
  setAccuracy: (n?: number) => void;
  setCoordinates: (up: any) => void;
  coordinatesRef: { current: Coordinate[] };
}) {
  const { isRecording, bgReadyRef, isRecordingRef, setCurrentLocation, setAccuracy, setCoordinates, coordinatesRef } = opts;
  useEffect(() => {
    // Intentionally disabled. 
    // Spamming BackgroundGeolocation.getCurrentPosition at 1Hz crashes 
    // the native location queue and forces it to return stale cached coordinates,
    // freezing the dog marker UI and path. BG Geolocation naturally emits 
    // highly-accurate points to the `onLocation` listener instead!
  }, [isRecording, bgReadyRef, isRecordingRef, setCurrentLocation, setAccuracy, setCoordinates, coordinatesRef]);
}

export function useSignalWatchdog(opts: {
  isRecording: boolean;
  lastLocationTimestampRef: { current: number };
  bgReadyRef: { current: boolean };
  setAccuracy: (n?: number) => void;
  setCurrentLocation: (c: Coordinate | null) => void;
}) {
  const { isRecording, lastLocationTimestampRef, bgReadyRef, setAccuracy, setCurrentLocation } = opts;
  useEffect(() => {
    if (!isRecording) return;
    const watchdogInterval = setInterval(async () => {
      const timeSinceUpdate = Date.now() - lastLocationTimestampRef.current;
      if (timeSinceUpdate > 10000) {
        setAccuracy(undefined);
        if (bgReadyRef.current) {
          try {
            const loc = await BackgroundGeolocation.getCurrentPosition({ timeout: 5, maximumAge: 0, samples: 1, desiredAccuracy: 10 });
            if (loc && loc.coords) {
              lastLocationTimestampRef.current = Date.now();
              setAccuracy((loc.coords as any).accuracy);
              setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            }
          } catch (err) {
            setAccuracy(undefined);
          }
        }
      }
    }, 5000);

    return () => clearInterval(watchdogInterval);
  }, [isRecording, lastLocationTimestampRef, bgReadyRef, setAccuracy, setCurrentLocation]);
}
