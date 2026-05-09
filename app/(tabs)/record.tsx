import { useState, useEffect, useRef } from 'react';
import { View, Platform, TouchableOpacity, Alert, ActivityIndicator, Animated, PanResponder, Dimensions, ScrollView, AppState, AppStateStatus } from 'react-native';
import { Text } from '@/components';
import TrailMap from '@/components/TrailMap';
import { processBGLocation, makeMotionHandler } from '@/utils/bgHandlers';
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
import { clearRecordingSession, initializeRecordingSession, loadRecordingSnapshot, RECORDING_STORAGE_KEYS, saveBackup } from '@/utils/recordingSession';
import { captureAndStoreRecordingPhoto, requestBgPermissionAndInitialLocation, resolveInitialRecordingCoordinate } from '@/utils/recordingFlow';
import { loadRecordingState as loadRecordingStateHelper, requestPermissions as requestPermissionsHelper, startRecordingShared, stopRecordingShared } from '@/utils/recordingHelpers';
import { useBottomSheet, computePace, makeRecenterMapFactory, usePersistCoordinates, usePollingPosition, useSignalWatchdog } from '@/utils/recordingCommon';
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
  const coordinatesRef = useRef<Coordinate[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoadingPermission, setIsLoadingPermission] = useState<boolean>(true);
  const [startLocation, setStartLocation] = useState<{ city?: string; country?: string } | null>(null);
  const locationSubscription = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { bottomSheetAnim, isExpanded, expandBottomSheet, collapseBottomSheet, toggleBottomSheet, panResponder, bottomSheetHeight, collapsedHeight, navbarHeight } = useBottomSheet();
  const [elevation, setElevation] = useState<number>(0);
  const [maxElevation, setMaxElevation] = useState<number>(0);
  const [pace, setPace] = useState<string>('0:00');
  const [speed, setSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  
  const stopStartTimeRef = useRef<number | null>(null);
  const lastLocationTimestamp = useRef<number>(Date.now());
  const lastAcceptedGpsTimestamp = useRef<number>(0);

  const bgReady = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(isRecording);
  const recordingStartRef = useRef<number | null>(null);
  const maxElevationRef = useRef<number>(0);
  const maxSpeedRef = useRef<number>(0);

  // Backup throttling: save every N points or every interval, and on app state changes
  const POINT_THRESHOLD = 20; // save after this many new points
  const BACKUP_INTERVAL_MS = 30000; // 30s interval
  const lastBackupPointsRef = useRef<number>(0);
  const lastBackupTimeRef = useRef<number>(Date.now());

  // Keep refs synchronized with state so background handlers read fresh values
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { coordinatesRef.current = coordinates; }, [coordinates]);
  useEffect(() => { maxElevationRef.current = maxElevation; }, [maxElevation]);
  useEffect(() => { maxSpeedRef.current = maxSpeed; }, [maxSpeed]);

  useEffect(() => {
    // initialize background-geolocation SDK using shared handlers
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
          onLocation: (location: BGLocation) => processBGLocation(location, {
            isRecordingRef,
            setCurrentLocation,
            setAccuracy,
            setCoordinates,
            coordinatesRef,
            lastAcceptedGpsTimestamp,
            lastLocationTimestamp,
            setElevation,
            maxElevationRef,
            setMaxElevation,
            setSpeed,
            maxSpeedRef,
            setMaxSpeed,
            saveBackup,
            lastBackupPointsRef,
            lastBackupTimeRef,
            stopStartTimeRef,
          }),
          onLocationError: (err) => {
            console.warn('BG onLocation error', err);
            setAccuracy(undefined);
          },
          onMotionChange: makeMotionHandler({
            isRecordingRef,
            setCurrentLocation,
            setAccuracy,
            setCoordinates,
            coordinatesRef,
            lastAcceptedGpsTimestamp,
            lastLocationTimestamp,
            setElevation,
            maxElevationRef,
            setMaxElevation,
            setSpeed,
            maxSpeedRef,
            setMaxSpeed,
            saveBackup,
            lastBackupPointsRef,
            lastBackupTimeRef,
            stopStartTimeRef,
          }),
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

  // Throttled backups: save when enough new points accumulated
  useEffect(() => {
    if (!isRecordingRef.current) return;
    const len = coordinates.length;
    if (len === 0) return;
    if ((len - lastBackupPointsRef.current) >= POINT_THRESHOLD) {
      saveBackup(coordinates);
      lastBackupPointsRef.current = len;
      lastBackupTimeRef.current = Date.now();
    }
    // only depend on coordinates so we evaluate when points added
  }, [coordinates]);

  // Persist coordinates to storage on every change (same logic used in FollowScreen)
  usePersistCoordinates(isRecording, coordinates);
  // Some devices / SDK configs only emit `onLocation` events intermittently;
  // `getCurrentPosition` often returns fresher readings. Use it as a supplement
  // while recording to ensure the UI and path stay in sync.
  usePollingPosition({ isRecording, bgReadyRef: bgReady, isRecordingRef, setCurrentLocation, setAccuracy, setCoordinates, coordinatesRef });

  // (AppState listener removed — persistence handled on-change and via backups)

  useEffect(() => {
    // Only check current permission state on mount — don't auto-prompt every time.
    checkPermissionStatus();
    // Load any existing recording snapshot once on mount. Avoid polling
    // AsyncStorage repeatedly — `setCoordinates` is the single source of
    // truth for the UI while recording.
    loadRecordingState();

    return () => {
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
  useSignalWatchdog({ isRecording, lastLocationTimestampRef: lastLocationTimestamp, bgReadyRef: bgReady, setAccuracy, setCurrentLocation });

  useEffect(() => {
    if (!trailId && !incomingTrail && typeof params.trail !== 'string' && !isRecording) {
      setInitialTrail(undefined);
    }
  }, [trailId, incomingTrail, params.trail, isRecording]);

  useEffect(() => {
    if (initialTrail) {
      // no-op: initialTrail is used to seed map path only in RecordScreen
    }
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

  // followMode removed: RecordScreen relies on isRecording to control follow behavior

  const loadRecordingState = async () => {
    // delegate to shared helper
    await loadRecordingStateHelper({ setCoordinates, setIsRecording, setDuration, setMaxElevation, setMaxSpeed });
  };

  const requestPermissions = async () => {
    // use shared helper
    await requestPermissionsHelper({ bgReadyRef: bgReady, setHasPermission, setIsLoadingPermission, setCurrentLocation, requestBgPermissionAndInitialLocation });
  };

  const checkPermissionStatus = async () => {
    try {
      if (!bgReady.current) {
        setHasPermission(false);
        setIsLoadingPermission(false);
        return;
      }

      try {
        // Try to query native provider state first to avoid triggering permission UI
        // @ts-ignore
        const state = await BackgroundGeolocation.getProviderState?.() ?? await BackgroundGeolocation.getState?.();
        if (state) {
          const s: any = state; // provider return shapes vary across platforms/SDK versions
          const enabled = s.enabled === true;
          const authVal = s.authorization ?? s.authorizationStatus ?? s.status ?? null;
          const authStr = typeof authVal === 'string' ? authVal.toLowerCase() : null;
          const authorized = enabled || (authStr && (
            authStr.includes('always') || authStr.includes('when_in_use') || authStr.includes('authorized') || authStr.includes('granted') || authStr === 'authorized'
          ));
          if (authorized) {
            setHasPermission(true);
            setIsLoadingPermission(false);
            return;
          }
        }
      } catch (err) {
        // ignore and fallback to conservative behaviour
      }

      setHasPermission(false);
    } catch (error) {
      console.error('Permission check error:', error);
      setHasPermission(false);
    } finally {
      setIsLoadingPermission(false);
    }
  };

  const startRecording = async () => {
    await startRecordingShared({ setIsRecording, setCoordinates, setDuration, setMaxElevation, setMaxSpeed, setCurrentLocation, bgReadyRef: bgReady, resolveInitialRecordingCoordinate, timerRef, setStartLocation });
  };

  useEffect(() => { if (duration > 0) setPace(computePace(duration, coordinates)); }, [duration, coordinates]);

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

  const recenterMap = makeRecenterMapFactory({ mapRef, bgReadyRef: bgReady, currentLocationRef: { current: currentLocation }, setCurrentLocation, setAccuracy });

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

  // bottom-sheet controls provided by useBottomSheet

  const stopRecording = async () => {
    if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const snapshot = await stopRecordingShared({ timerRef, coordinates, maxElevation, maxSpeed, duration });
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
    const finalPace = computePace(finalDuration, finalCoords);

    const trail: Trail = {
      id: Date.now().toString(),
      date: Date.now(),
      distance,
      duration: finalDuration,
      sniffTime: 0, // TODO: restore sniffTime calculation (temporarily removed to avoid blocking location updates)
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
          try { await clearRecordingSession(); } catch (err) { console.warn('Error clearing recording storage on cancel:', err); }
          // Note: sniff time tracking temporarily removed — resets are skipped here
          setIsRecording(false); setCoordinates([]); setDuration(0); setMaxElevation(0); setMaxSpeed(0); stopStartTimeRef.current = null;
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

      {/* Removing watch dog notifications for now */}
      {/* <LocationWatchdog isRecording={isRecording} thresholdSeconds={12} /> */}

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
            userLocation={currentLocation}
          showsUserLocation
          followsUserLocation={isRecording}
          routeColor={theme.backgroundPrimary}
          routeWidth={5}
          routeOpacity={1}
          showsMyLocationButton={false}
            onUserLocationUpdate={(coord) => {
              // Use the same stable expo-location points used by TrailMap for recording
              setCurrentLocation(coord);
              if (isRecordingRef.current) {
                try {
                  appendCoordinateToPath(setCoordinates, coord, coordinatesRef.current);
                } catch (e) {
                  console.warn('Error appending point from TrailMap user location', e);
                  appendCoordinateToPath(setCoordinates, coord);
                }
              }
            }}
        />
      )}

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap} activeOpacity={0.8}>
        <Navigation size={24} color={theme.accentPrimary} />
      </TouchableOpacity>

      <Animated.View style={[styles.bottomSheet, { height: Animated.add(bottomSheetAnim, navbarHeight), bottom: 0 }]}>
        <View {...panResponder.panHandlers} style={styles.handleBar}>
          <TouchableOpacity style={styles.handleContainer} onPress={toggleBottomSheet} activeOpacity={0.7}><View style={styles.handle} /></TouchableOpacity>
        </View>

        <View style={[styles.bottomSheetContent, { paddingBottom: isExpanded ? navbarHeight : 12 }]}>
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
            sniffDuration={0} // TODO: restore sniffDuration prop once non-blocking sniffTime is implemented
            onStop={stopRecording}
            onClose={() => { router.back(); }}
            onCancel={cancelRecording}
            onCamera={handleCamera}
          />
        </View>
      </Animated.View>

    </View>
  );
}