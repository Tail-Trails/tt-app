import { useState, useEffect, useRef } from 'react';
import { View, Platform, TouchableOpacity, Alert, ActivityIndicator, Animated, PanResponder, Dimensions, ScrollView } from 'react-native';
import { Text } from '@/components';
import TrailMap from '@/components/TrailMap';
import * as Haptics from 'expo-haptics';
import BackgroundGeolocation, { Location as BGLocation, MotionChangeEvent } from 'react-native-background-geolocation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, Navigation } from 'lucide-react-native';
import styles from './follow.styles';
import theme from '@/constants/colors';
import RecordOverlay from '@/components/RecordOverlay';
import { useTrails } from '@/context/TrailsContext';
import { Coordinate, Trail } from '@/types/trail';
import { calculateTotalDistance } from '@/utils/distance';
import { appendCoordinateToPath, getLocationAccuracyMeters, getLocationTimestampMs, shouldAcceptTrackedLocation, toCoordinate } from '@/utils/backgroundTracking';
import { initBackgroundTracking } from '@/utils/backgroundGeolocationInit';
import { clearRecordingSession, initializeRecordingSession, loadRecordingSnapshot, RECORDING_STORAGE_KEYS, saveBackup } from '@/utils/recordingSession';
import { captureAndStoreRecordingPhoto, requestBgPermissionAndInitialLocation, resolveInitialRecordingCoordinate } from '@/utils/recordingFlow';
import { useKeepAwake } from 'expo-keep-awake';

export default function FollowScreen({ trail: incomingTrail }: { trail?: Trail } = {}) {
  const { getTrailWithUser } = useTrails();
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
  const coordinatesRef = useRef<Coordinate[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoadingPermission, setIsLoadingPermission] = useState<boolean>(true);
  const [startLocation, setStartLocation] = useState<{ city?: string; country?: string } | null>(null);
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
  const [sniffTime, setSniffTime] = useState<number>(0);
  const sniffTimeRef = useRef<number>(0);
  const stopStartTimeRef = useRef<number | null>(null);
  const lastLocationTimestamp = useRef<number>(Date.now());
  const lastAcceptedGpsTimestamp = useRef<number>(0);
  const recordingStartRef = useRef<number | null>(null);

  // Backup throttling (basic): save every N points or interval
  const POINT_THRESHOLD = 20;
  const BACKUP_INTERVAL_MS = 30000;
  const lastBackupPointsRef = useRef<number>(0);
  const lastBackupTimeRef = useRef<number>(Date.now());

  const [followMode, setFollowMode] = useState<boolean>(!!initialTrail);
  const [userLocationFollow, setUserLocationFollow] = useState<Coordinate | null>(null);
  const bgReady = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(isRecording);
  const maxElevationRef = useRef<number>(0);
  const maxSpeedRef = useRef<number>(0);

  useKeepAwake();

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { coordinatesRef.current = coordinates; }, [coordinates]);
  useEffect(() => { maxElevationRef.current = maxElevation; }, [maxElevation]);
  useEffect(() => { maxSpeedRef.current = maxSpeed; }, [maxSpeed]);

  useEffect(() => {
    let mounted = true;

    const initBG = async () => {
      try {
        await initBackgroundTracking({
          onProviderChange: (event) => {
            if (
              event.status !== BackgroundGeolocation.AuthorizationStatus.Always &&
              event.status !== BackgroundGeolocation.AuthorizationStatus.WhenInUse
            ) {
              setAccuracy(undefined);
            }
          },
          onLocation: (location: BGLocation) => {
            const locationAccuracy = getLocationAccuracyMeters(location);

            const accept = shouldAcceptTrackedLocation(location, { minTimestampMs: lastAcceptedGpsTimestamp.current });
            setAccuracy(locationAccuracy);
            if (!accept) return;

            const coord = toCoordinate(location);
            if (!coord) return;

            const gpsTs = getLocationTimestampMs(location);
            if (gpsTs) lastAcceptedGpsTimestamp.current = gpsTs;
            lastLocationTimestamp.current = Date.now();

            setCurrentLocation(coord);
            setUserLocationFollow(coord);
            setAccuracy(locationAccuracy);

            if (isRecordingRef.current) {
              (async () => {
                try {
                  const IGNORE_WINDOW_MS = 2 * 60 * 1000; // ignore first 2 minutes of points
                  let startMs = recordingStartRef.current;
                  if (!startMs) {
                    const s = await AsyncStorage.getItem(RECORDING_STORAGE_KEYS.START_TIME);
                    startMs = s ? parseInt(s, 10) : null;
                    if (startMs) recordingStartRef.current = startMs;
                  }

                  const now = Date.now();
                  if (startMs && (now - startMs) < IGNORE_WINDOW_MS) {
                    console.log('Skipping append: within initial ignore window, elapsed_s=', Math.floor((now - startMs) / 1000));
                  } else {
                    appendCoordinateToPath(setCoordinates, coord, coordinatesRef.current);
                  }
                } catch (e) {
                  console.warn('Error checking ignore window, appending point by fallback', e);
                  appendCoordinateToPath(setCoordinates, coord, coordinatesRef.current);
                }
              })();

              const altitude = location.coords.altitude;
              if (typeof altitude === 'number') {
                const currentElevation = Math.max(0, altitude);
                setElevation(currentElevation);
                if (currentElevation > maxElevationRef.current) {
                  maxElevationRef.current = currentElevation;
                  setMaxElevation(currentElevation);
                  AsyncStorage.setItem('recording_max_elevation', currentElevation.toString()).catch(() => { });
                }
              }

              const rawSpeed = location.coords.speed;
              if (typeof rawSpeed === 'number' && rawSpeed > 0) {
                const currentSpeed = rawSpeed * 3.6;
                setSpeed(currentSpeed);
                if (currentSpeed > maxSpeedRef.current) {
                  maxSpeedRef.current = currentSpeed;
                  setMaxSpeed(currentSpeed);
                  AsyncStorage.setItem('recording_max_speed', currentSpeed.toString()).catch(() => { });
                }
              }
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
              try {
                if (coordinatesRef.current.length > 0) {
                  saveBackup(coordinatesRef.current);
                  lastBackupTimeRef.current = Date.now();
                  lastBackupPointsRef.current = coordinatesRef.current.length;
                }
              } catch (e) { /* swallow */ }
            } else if (stopStartTimeRef.current) {
              const elapsed = Math.floor((Date.now() - stopStartTimeRef.current) / 1000);
              sniffTimeRef.current += elapsed;
              setSniffTime(sniffTimeRef.current);
              stopStartTimeRef.current = null;
            }
          },
        });
        if (!mounted) return;
        bgReady.current = true;
      } catch {
        bgReady.current = false;
      }
    };

    initBG();
    return () => {
      mounted = false;
      BackgroundGeolocation.removeListeners();
    };
  }, []);

  useEffect(() => {
    const saveCoordinates = async () => {
      if (isRecording && coordinates.length > 0) {
        try {
          await AsyncStorage.setItem(RECORDING_STORAGE_KEYS.COORDINATES, JSON.stringify(coordinates));
        } catch (err) {
          console.error('Failed to persist coordinates:', err);
        }
      }
    };

    saveCoordinates();
  }, [coordinates, isRecording]); // This fires every time coordinates change

  useEffect(() => {
    requestPermissions();
    loadRecordingState();

    // Load recording snapshot once; avoid polling and overwriting live state.
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
    const startFollow = async () => {
      if (!bgReady.current) {
        Alert.alert('Background SDK Required', 'This feature requires the native background-geolocation SDK and a custom build.');
        return;
      }

      try {
        await BackgroundGeolocation.start();
      } catch (err) {
        console.error('Follow start error', err);
      }
    };

    if (followMode) {
      startFollow();
    } else {
      try { BackgroundGeolocation.stop(); } catch { /* ignore */ }
      setUserLocationFollow(null);
    }

    return () => { };
  }, [followMode]);

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
      const initial = await requestBgPermissionAndInitialLocation(30);
      setHasPermission(true);

      if (initial.coordinate) {
        setCurrentLocation(initial.coordinate);
        setUserLocationFollow(initial.coordinate);
        setAccuracy(initial.accuracy);
      }
    } catch (error: any) {
      console.error('Permission error:', error);
      const errorMessage = error.message || 'Failed to get location permission';

      if (errorMessage.includes('NSLocation') || errorMessage.includes('Info.plist')) {
        Alert.alert(
          'Configuration Error',
          'This app needs to be built with a custom development build to use location tracking. Expo Go doesn\'t support background location tracking.\n\nPlease contact support or build a custom development client.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }

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
    sniffTimeRef.current = 0;
    setSniffTime(0);
    stopStartTimeRef.current = null;

    try {
      const startTime = Date.now();
      lastLocationTimestamp.current = startTime;
      await initializeRecordingSession(startTime);

      setStartLocation(null);

      const initial = await resolveInitialRecordingCoordinate(currentLocation, 30);
      if (initial.coordinate) {
        await AsyncStorage.setItem(RECORDING_STORAGE_KEYS.COORDINATES, JSON.stringify([initial.coordinate]));
        setCoordinates([initial.coordinate]);
        setCurrentLocation(initial.coordinate);
        setUserLocationFollow(initial.coordinate);
        setAccuracy(initial.accuracy ?? accuracy);
      }

      try {
        await BackgroundGeolocation.start();
      } catch (bgErr) {
        console.warn('BackgroundGeolocation.start() failed', bgErr);
      }

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
        if (stopStartTimeRef.current) {
          const activeStopSeconds = Math.floor((Date.now() - stopStartTimeRef.current) / 1000);
          setSniffTime(sniffTimeRef.current + activeStopSeconds);
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

  const guideStartCoordinate: Coordinate | null = initialTrail?.startLatitude != null && initialTrail?.startLongitude != null
    ? { latitude: initialTrail.startLatitude, longitude: initialTrail.startLongitude }
    : (initialTrailCoordinates?.[0] ?? null);

  const distance = calculateTotalDistance(coordinates);

  const progress = initialTrail && isRecording && coordinates.length > 0 && initialTrailCoordinates && initialTrailCoordinates.length > 0
    ? Math.min((distance / (initialTrail.distance || distance)) * 100, 100)
    : 0;

  const showProgress = !!initialTrail;

  const recenterMap = async () => {
    if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mapRef.current) {
      try {
        const loc = await BackgroundGeolocation.getCurrentPosition({ timeout: 30 });
        if (loc && loc.coords) {
          const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setCurrentLocation(coord);
          setUserLocationFollow(coord);
          setAccuracy(loc.coords.accuracy ?? undefined);
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
        const message = result.savedToGallery
          ? 'Captured photo saved to your device gallery and added to this recording.'
          : 'Captured photo saved to this recording (not saved to device gallery).';
        Alert.alert('Photo saved', message);
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
    try { await BackgroundGeolocation.stop(); } catch (error) { console.error('Error stopping background location:', error); }
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
    const finalSniffTime = stopStartTimeRef.current
      ? sniffTime + Math.floor((Date.now() - stopStartTimeRef.current) / 1000)
      : sniffTime;

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
      sniffTime: finalSniffTime,
      coordinates: finalCoords,
      city: startLocation?.city,
      country: startLocation?.country,
      pace: finalPace,
      speed: finalMaxSpeed,
      maxElevation: finalMaxElevation,
      isOriginal: false,
      originalTrailId: initialTrail?.id || trailId || null,
      rating: 0,
      dogMatchScore: 0,
    };

    try {
      const draftParam = encodeURIComponent(JSON.stringify(trail));
      router.push(`/end-walk/summary?draft=${draftParam}&flow=follow`);
    } catch (err) {
      console.error('Failed to navigate to end-walk summary:', err);
    }
  };

  const cancelRecording = async () => {
    Alert.alert('Cancel recording?', 'Discard this recording and all collected data. This cannot be undone.', [
      { text: 'Keep Recording', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: async () => {
        try { if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await BackgroundGeolocation.stop(); } catch (err) { console.warn('Error stopping background task on cancel:', err); }
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        try { await clearRecordingSession(); } catch (err) { console.warn('Error clearing recording storage on cancel:', err); }
        setIsRecording(false); setCoordinates([]); setDuration(0); setMaxElevation(0); setMaxSpeed(0); setSniffTime(0); sniffTimeRef.current = 0; stopStartTimeRef.current = null;
      } }
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
      <TrailMap
        ref={mapRef}
        coordinates={coordinates}
        guideCoordinates={initialTrailCoordinates}
        startCoordinate={guideStartCoordinate}
        style={styles.map}
        initialRegion={
          currentLocation
            ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
            : initialTrailCoordinates?.[0]
              ? { latitude: initialTrailCoordinates[0].latitude, longitude: initialTrailCoordinates[0].longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
              : undefined
        }
        userLocation={userLocationFollow ?? currentLocation}
        showsUserLocation
        followsUserLocation={followMode || isRecording}
        routeColor={theme.accentPrimary}
        routeWidth={5}
        routeOpacity={1}
        guideRouteColor={theme.backgroundPrimary}
        guideRouteWidth={4}
        guideRouteOpacity={0.7}
        showsMyLocationButton={false}
      />

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap} activeOpacity={0.8}>
        <Navigation size={24} color={theme.accentPrimary} />
      </TouchableOpacity>

      <Animated.View style={[styles.bottomSheet, { height: Animated.add(bottomSheetAnim, navbarHeight), bottom: 0 }] }>
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
            sniffDuration={sniffTime}
            pace={pace}
            speed={speed}
            progress={progress}
            showProgress={showProgress}
            onStart={startRecording}
            startLabel="Follow Trail"
            accuracy={accuracy}
            onStop={stopRecording}
            onClose={() => { setFollowMode(false); router.back(); }}
            onCancel={cancelRecording}
            onCamera={handleCamera}
          />
        </ScrollView>
      </Animated.View>

    </View>
  );
}
