import { useState, useEffect, useRef } from 'react';
import { View, Platform, TouchableOpacity, Alert, ActivityIndicator, Animated, PanResponder, Dimensions, ScrollView } from 'react-native';
import { Text } from '@/components';
import TrailMap from '@/components/TrailMap';
// Using react-native-background-geolocation for all tracking (no Expo TaskManager/Location)
import * as Haptics from 'expo-haptics';
import BackgroundGeolocation, { Location as BGLocation, MotionChangeEvent } from 'react-native-background-geolocation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, Navigation } from 'lucide-react-native';
import styles from './record.styles';
import theme from '@/constants/colors';
import RecordOverlay from '@/components/RecordOverlay';
import { useTrails } from '@/context/TrailsContext';
import { useAuth } from '@/context/AuthContext';
import { Coordinate, Trail } from '@/types/trail';
import { calculateTotalDistance } from '@/utils/distance';
import { appendCoordinateToPath, getLocationAccuracyMeters, getLocationTimestampMs, shouldAcceptTrackedLocation, toCoordinate } from '@/utils/backgroundTracking';
import { initBackgroundTracking } from '@/utils/backgroundGeolocationInit';
import { clearRecordingSession, initializeRecordingSession, loadRecordingSnapshot, RECORDING_STORAGE_KEYS } from '@/utils/recordingSession';
import { captureAndStoreRecordingPhoto, requestBgPermissionAndInitialLocation, resolveInitialRecordingCoordinate } from '@/utils/recordingFlow';
import { useKeepAwake } from 'expo-keep-awake';
import { LocationWatchdog } from '@/components/LocationWatchdog';

// Background task removed — the native SDK will deliver locations via its own listeners

export default function RecordScreen({ trail: incomingTrail }: { trail?: Trail } = {}) {
  const { saveTrail, getTrailById, getTrailWithUser } = useTrails();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const trailId = typeof params.trailId === 'string' ? params.trailId : undefined;
  let paramTrail: Trail | undefined = undefined;
  if (typeof params.trail === 'string') {
    try {
      paramTrail = JSON.parse(decodeURIComponent(params.trail));
    } catch (err) {
      console.warn('Failed to parse trail param:', err);
    }
  }

  const [initialTrail, setInitialTrail] = useState<Trail | undefined>(incomingTrail ?? paramTrail ?? undefined);
  const mapRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoadingPermission, setIsLoadingPermission] = useState<boolean>(true);
  const [startLocation, setStartLocation] = useState<{ city?: string; country?: string } | null>(null);
  const locationSubscription = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomSheetHeight = Dimensions.get('window').height * 0.5;
  const collapsedHeight = 40;
  const navbarHeight = Platform.OS === 'ios' ? 100 : 92;
  const bottomSheetAnim = useRef(new Animated.Value(collapsedHeight)).current;
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [elevation, setElevation] = useState<number>(0);
  const [maxElevation, setMaxElevation] = useState<number>(0);
  const [pace, setPace] = useState<string>('0:00');
  const [speed, setSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [followMode, setFollowMode] = useState<boolean>(!!initialTrail);
  const [userLocationFollow, setUserLocationFollow] = useState<Coordinate | null>(null);
  const followLocationRef = useRef<any>(null);
  const stopStartTimeRef = useRef<number | null>(null);
  const [sniffTime, setSniffTime] = useState<number>(0);
  const sniffTimeRef = useRef<number>(0);
  const lastLocationTimestamp = useRef<number>(Date.now());
  const lastAcceptedGpsTimestamp = useRef<number>(0);

  useKeepAwake();

  const bgReady = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(isRecording);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  useEffect(() => {
    // initialize background-geolocation SDK if available
    let mounted = true;

    const initBG = async () => {
      try {
        await initBackgroundTracking({
          onLocation: async (location: BGLocation) => {
            const locationAccuracy = getLocationAccuracyMeters(location);

            if (!shouldAcceptTrackedLocation(location, { minTimestampMs: lastAcceptedGpsTimestamp.current })) {
              setAccuracy(locationAccuracy);
              return;
            }

            const coord = toCoordinate(location);
            if (!coord) return;

            const gpsTs = getLocationTimestampMs(location);
            if (gpsTs) lastAcceptedGpsTimestamp.current = gpsTs;
            lastLocationTimestamp.current = Date.now();

            setCurrentLocation(coord);
            setAccuracy(locationAccuracy);

            if (isRecordingRef.current) {
              appendCoordinateToPath(setCoordinates, coord);
            }
          },
          onLocationError: (err) => {
            console.warn('BG onLocation error', err);
            setAccuracy(undefined);
          },
          onMotionChange: (event: MotionChangeEvent) => {
            if (!isRecordingRef.current) return;

            if (!event.isMoving) {
              stopStartTimeRef.current = Date.now();
              console.log("Activity: Stationary (Sniffing)");
            } else {
              if (stopStartTimeRef.current) {
                const elapsed = Math.floor((Date.now() - stopStartTimeRef.current) / 1000);
                sniffTimeRef.current += elapsed;
                setSniffTime(sniffTimeRef.current);

                stopStartTimeRef.current = null;
                console.log(`Activity: Moving. Added ${elapsed}s to Sniff Time.`);
              }
            }
          },
        });

        if (!mounted) return;
        bgReady.current = true;

      } catch (err) {
        bgReady.current = false;
      }
    };

    initBG();

    return () => { mounted = false; BackgroundGeolocation.removeListeners(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    requestPermissions();
    loadRecordingState();

    const interval = setInterval(() => {
      loadRecordingState();
    }, 1000);

    return () => {
      clearInterval(interval);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- THE SIGNAL WATCHDOG & AUTO-RESUME ---
  useEffect(() => {
    const watchdogInterval = setInterval(async () => {
      const timeSinceUpdate = Date.now() - lastLocationTimestamp.current;

      // 1. SIGNAL LOST: If no location received in over 10 seconds
      if (timeSinceUpdate > 10000) {
        setAccuracy(undefined);

        // 2. AUTO-RESUME: Try to "poke" the SDK to see if location is back
        if (bgReady.current) {
          try {
            // This forced check often wakes up the Simulator stream
            const loc = await BackgroundGeolocation.getCurrentPosition({
              timeout: 5,       // Don't wait long
              maximumAge: 0,    // We want a FRESH one
              samples: 1,
              desiredAccuracy: 10
            });

            if (loc && loc.coords) {
              // If we got a location, manually trigger the "Heartbeat"
              lastLocationTimestamp.current = Date.now();
              setAccuracy(loc.coords.accuracy);
              setCurrentLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
              });
            }
          } catch (err) {
            // If this fails (Code 0), ensure UI stays "No Signal"
            setAccuracy(undefined);
          }
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(watchdogInterval);
  }, [isRecording]);

  useEffect(() => {
    if (!trailId && !incomingTrail && typeof params.trail !== 'string' && !isRecording) {
      setInitialTrail(undefined);
      setFollowMode(false);
    }
  }, [trailId, incomingTrail, params.trail, isRecording]);

  useEffect(() => {
    if (initialTrail) setFollowMode(true);
  }, [initialTrail]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!initialTrail && trailId) {
        try {
          const t = await getTrailWithUser(trailId);
          if (mounted && t) setInitialTrail(t);
        } catch (err) {
          console.warn('Failed to load trail by id in FollowScreen:', err);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, [initialTrail, trailId, getTrailWithUser]);

  useEffect(() => {
    let active = true;

    const startFollow = async () => {
      if (!bgReady.current) {
        Alert.alert('Background SDK Required', 'This feature requires the native background-geolocation SDK and a custom build.');
        return;
      }

      try {
        await BackgroundGeolocation.start();
        // onLocation handler will update `currentLocation`
      } catch (err) {
        console.error('Follow start error', err);
      }
    };

    if (followMode) {
      startFollow();
    } else {
      try { BackgroundGeolocation.stop(); } catch (err) { /* ignore */ }
      setUserLocationFollow(null);
    }

    return () => {
      active = false;
      try { BackgroundGeolocation.stop(); } catch (err) { /* ignore */ }
    };
  }, [followMode, hasPermission]);

  const loadRecordingState = async () => {
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
    } catch (error) {
      console.error('Error loading recording state:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      if (!bgReady.current) {
        Alert.alert('Background SDK Required', 'This feature requires the native background-geolocation SDK and a custom build.');
        setHasPermission(false);
        setIsLoadingPermission(false);
        return;
      }

      try {
        await requestBgPermissionAndInitialLocation(30);
      } catch {
        // Non-fatal — continue to try to get position
      }

      try {
        const initial = await requestBgPermissionAndInitialLocation(30);
        if (initial.coordinate) {
          setCurrentLocation(initial.coordinate);
        }
        setHasPermission(true);
      } catch (err) {
        console.warn('BG getCurrentPosition failed', err);
        // still consider permission granted if SDK is available
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Permission error:', error);
      setHasPermission(false);
    } finally {
      setIsLoadingPermission(false);
    }
  };

  const startRecording = async () => {
    if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
    setCoordinates([]);
    setDuration(0);
    setMaxElevation(0);
    setMaxSpeed(0);

    try {
      const startTime = Date.now();
      await initializeRecordingSession(startTime);

      // Try to seed an initial location from the native SDK
      if (bgReady.current) {
        const initial = await resolveInitialRecordingCoordinate(currentLocation, 30);
        if (initial.coordinate) {
          await AsyncStorage.setItem(RECORDING_STORAGE_KEYS.COORDINATES, JSON.stringify([initial.coordinate]));
          setCoordinates([initial.coordinate]);
          setCurrentLocation(initial.coordinate);
        }
      }

      setStartLocation(null);

      try {
        // Start native SDK to deliver location updates
        await BackgroundGeolocation.start();
      } catch (bgErr) {
        console.warn('BackgroundGeolocation.start() failed', bgErr);
        Alert.alert('Background Tracking Unavailable', 'Background location tracking requires a custom development build.');
      }

      timerRef.current = setInterval(async () => {
        try {
          const startTimeStr = await AsyncStorage.getItem(RECORDING_STORAGE_KEYS.START_TIME);
          if (startTimeStr) {
            const startTime = parseInt(startTimeStr);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setDuration(elapsed);

            // If the dog is currently stopped, update the UI live
            if (stopStartTimeRef.current) {
              const activeStopSeconds = Math.floor((Date.now() - stopStartTimeRef.current) / 1000);
              setSniffTime(sniffTimeRef.current + activeStopSeconds);
            }
          }
        } catch (error) {
          console.error('Error calculating duration:', error);
        }
      }, 1000);
    } catch (error: any) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (duration > 0) {
      const distance = calculateTotalDistance(coordinates);
      const distanceKm = distance / 1000;
      const durationMin = duration / 60;

      if (distanceKm > 0) {
        const paceMinPerKm = durationMin / distanceKm;
        const minutes = Math.floor(paceMinPerKm);
        const seconds = Math.round((paceMinPerKm - minutes) * 60);
        setPace(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }
  }, [duration, coordinates]);

  const initialTrailCoordinates: Coordinate[] | undefined = initialTrail
    ? (initialTrail.coordinates && initialTrail.coordinates.length > 0
      ? initialTrail.coordinates
      : initialTrail.path && initialTrail.path.length > 0
        ? initialTrail.path.map((p: any) => ({ latitude: p[1], longitude: p[0] }))
        : undefined)
    : undefined;

  const distance = calculateTotalDistance(coordinates);

  const progress = initialTrail && isRecording && coordinates.length > 0 && initialTrailCoordinates && initialTrailCoordinates.length > 0
    ? Math.min((distance / (initialTrail.distance || distance)) * 100, 100)
    : 0;

  const showProgress = !!initialTrail;

  const recenterMap = async () => {
    if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mapRef.current) {
      try {
        let coord = currentLocation;
        if (bgReady.current) {
          try {
            // @ts-ignore
            const loc = await BackgroundGeolocation.getCurrentPosition({ timeout: 30 });
            if (loc && loc.coords) coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          } catch (err) {
            // ignore and fallback to currentLocation
          }
        }

        if (coord) {
          setCurrentLocation(coord);
          mapRef.current.animateToRegion({ latitude: coord.latitude, longitude: coord.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
        }
      } catch (error) {
        console.error('Error getting current location:', error);
        if (currentLocation) {
          mapRef.current.animateToRegion({ latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
        }
      }
    }
  };

  const handleCamera = async () => {
    try {
      const result = await captureAndStoreRecordingPhoto();
      if (result.status === 'not-supported') {
        Alert.alert('Not supported', 'Camera capture is not supported on web.');
        return;
      }
      if (result.status === 'permission-denied') {
        Alert.alert('Permission required', 'Camera permission is required to take photos');
        return;
      }
      if (result.status === 'saved') {
        Alert.alert('Photo saved', 'Captured photo saved to this recording.');
      }
    } catch (err) {
      console.error('Camera error', err);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const initialHeight = useRef<number>(0);

  const panResponder = useRef(
    PanResponder.create({
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
        if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const threshold = (bottomSheetHeight + collapsedHeight) / 2;
        const currentValue = (bottomSheetAnim as any)._value;
        if (gestureState.dy < -50) expandBottomSheet();
        else if (gestureState.dy > 50) collapseBottomSheet();
        else if (currentValue > threshold) expandBottomSheet();
        else collapseBottomSheet();
      },
    })
  ).current;

  const expandBottomSheet = () => { setIsExpanded(true); Animated.spring(bottomSheetAnim, { toValue: bottomSheetHeight, useNativeDriver: false, tension: 50, friction: 8 }).start(); };
  const collapseBottomSheet = () => { setIsExpanded(false); Animated.spring(bottomSheetAnim, { toValue: collapsedHeight, useNativeDriver: false, tension: 50, friction: 8 }).start(); };
  const toggleBottomSheet = () => { if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (isExpanded) collapseBottomSheet(); else expandBottomSheet(); };

  const stopRecording = async () => {
    if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await BackgroundGeolocation.stop();
    } catch (err) {
      console.warn('BG stop error', err);
    }

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const snapshot = await loadRecordingSnapshot({
      fallbackCoordinates: coordinates,
      fallbackMaxElevation: maxElevation,
      fallbackMaxSpeed: maxSpeed,
      fallbackDuration: duration,
    });
    const finalCoords = snapshot.coordinates;
    const finalMaxElevation = snapshot.maxElevation;
    const finalMaxSpeed = snapshot.maxSpeed;
    const finalDuration = snapshot.duration;

    if (finalCoords.length < 2) {
      Alert.alert('No Trail Data', 'Not enough data to save this trail. Try walking a bit more!');
      setIsRecording(false);
      setCoordinates([]);
      setDuration(0);
      await clearRecordingSession();
      return;
    }

    const distance = calculateTotalDistance(finalCoords);
    const distanceKm = distance / 1000;
    const durationMin = finalDuration / 60;
    let finalPace = '0:00';
    if (distanceKm > 0) {
      const paceMinPerKm = durationMin / distanceKm;
      const minutes = Math.floor(paceMinPerKm);
      const seconds = Math.round((paceMinPerKm - minutes) * 60);
      finalPace = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const trail: Trail = {
      id: Date.now().toString(),
      date: Date.now(),
      distance,
      duration: finalDuration,
      sniffTime: sniffTime,
      coordinates: finalCoords,
      city: startLocation?.city,
      country: startLocation?.country,
      pace: finalPace,
      speed: finalMaxSpeed,
      maxElevation: finalMaxElevation,
    };

    try {
      const draftParam = encodeURIComponent(JSON.stringify(trail));
      router.push(`/end-walk/summary?draft=${draftParam}`);
    } catch (err) {
      console.error('Failed to navigate to end-walk summary:', err);
    }
  };

  const cancelRecording = async () => {
    Alert.alert('Cancel recording?', 'Discard this recording and all collected data. This cannot be undone.', [
      { text: 'Keep Recording', style: 'cancel' },
      {
        text: 'Discard', style: 'destructive', onPress: async () => {
          try { if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await BackgroundGeolocation.stop(); } catch (err) { console.warn('Error stopping background task on cancel:', err); }
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          try { await clearRecordingSession(true); } catch (err) { console.warn('Error clearing recording storage on cancel:', err); }
          setIsRecording(false); setCoordinates([]); setDuration(0); setMaxElevation(0); setMaxSpeed(0); setSniffTime(0); sniffTimeRef.current = 0; stopStartTimeRef.current = null;
        }
      }
    ]);
  };

  if (isLoadingPermission && true) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.backgroundPrimary} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <MapPin size={64} color="#666" />
        <Text style={styles.permissionTitle}>Location Permission Required</Text>
        <Text style={styles.permissionText}>This app needs access to your location to track your dog walks.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => { if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); requestPermissions(); }}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {initialTrailCoordinates && (
        <TrailMap
          coordinates={initialTrailCoordinates}
          style={styles.map}
          showOnlyPath
          showsUserLocation={false}
          followsUserLocation={false}
          routeColor={theme.accentSecondary}
          routeOpacity={0.75}
        />
      )}

      <LocationWatchdog isRecording={isRecording} thresholdSeconds={12} />

      {(currentLocation || initialTrail) && (
        <TrailMap
          ref={mapRef}
          coordinates={isRecording ? coordinates : (initialTrail ? initialTrailCoordinates ?? initialTrail.coordinates : coordinates)}
          style={styles.map}
          initialRegion={
            currentLocation
              ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
              : initialTrailCoordinates && initialTrailCoordinates.length > 0
                ? { latitude: initialTrailCoordinates[0].latitude, longitude: initialTrailCoordinates[0].longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
                : undefined
          }
          userLocation={userLocationFollow ?? currentLocation}
          showsUserLocation
          followsUserLocation={followMode || isRecording}
          routeColor={theme.backgroundPrimary}
          routeWidth={5}
          routeOpacity={1}
          showsMyLocationButton={false}
        />
      )}

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap} activeOpacity={0.8}>
        <Navigation size={24} color={theme.accentPrimary} />
      </TouchableOpacity>

      <Animated.View style={[styles.bottomSheet, { height: Animated.add(bottomSheetAnim, navbarHeight), bottom: 0 }]}>
        <View {...panResponder.panHandlers} style={styles.handleBar}>
          <TouchableOpacity style={styles.handleContainer} onPress={toggleBottomSheet} activeOpacity={0.7}><View style={styles.handle} /></TouchableOpacity>
        </View>

        <ScrollView style={styles.bottomSheetContent} contentContainerStyle={{ paddingBottom: isExpanded ? navbarHeight : 12 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <RecordOverlay
            isRecording={isRecording}
            isExpanded={isExpanded}
            duration={duration}
            distance={distance}
            elevation={elevation}
            pace={pace}
            speed={speed}
            progress={progress}
            showProgress={showProgress}
            onStart={startRecording}
            startLabel="Start Trail"
            accuracy={accuracy}
            sniffDuration={sniffTime}
            onStop={stopRecording}
            onClose={() => { if (followLocationRef.current) { followLocationRef.current.remove(); followLocationRef.current = null; } setFollowMode(false); router.back(); }}
            onCancel={cancelRecording}
            onCamera={handleCamera}
          />
        </ScrollView>
      </Animated.View>

    </View>
  );
}

