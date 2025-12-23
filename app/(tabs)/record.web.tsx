import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';

import TrailMap from '@/components/TrailMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Play, Square, MapPin, Watch, Bell, ChevronUp, ChevronDown, Navigation } from 'lucide-react-native';
import { useTrails } from '@/context/TrailsContext';
import { useAuth } from '@/context/AuthContext';
import { Coordinate, Trail } from '@/types/trail';
import { calculateTotalDistance, formatDistance, formatDuration } from '@/utils/distance';

const LOCATION_KEY = 'recording_coordinates';
const START_TIME_KEY = 'recording_start_time';
const MAX_ELEV_KEY = 'recording_max_elevation';
const MAX_SPEED_KEY = 'recording_max_speed';
const LAST_UPDATE_KEY = 'recording_last_update';

export default function RecordScreenWeb() {
  const { saveTrail, getTrailById } = useTrails();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const trailId = typeof params.trailId === 'string' ? params.trailId : undefined;
  const existingTrail = trailId ? getTrailById(trailId) : undefined;
  const mapRef = useRef<any>(null);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoadingPermission, setIsLoadingPermission] = useState<boolean>(true);
  const [startLocation, setStartLocation] = useState<{ city?: string; country?: string } | null>(null);
  const geocodeCache = useRef<Map<string, { city?: string; country?: string }>>(new Map());

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<any>(null);

  const bottomSheetHeight = Dimensions.get('window').height * 0.5;
  const collapsedHeight = 280;
  const navbarHeight = 92;
  const bottomSheetAnim = useRef(new Animated.Value(collapsedHeight)).current;
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [elevation, setElevation] = useState<number>(0);
  const [maxElevation, setMaxElevation] = useState<number>(0);
  const [pace, setPace] = useState<string>('0:00');
  const [speed, setSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [draftTrail, setDraftTrail] = useState<Partial<Trail> | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPhoto, setFormPhoto] = useState<string | undefined>(undefined);

  useEffect(() => {
    // On web, check permissions via the Permissions API when available
    (async () => {
      try {
        if ((navigator as any).permissions && (navigator as any).permissions.query) {
          const status = await (navigator as any).permissions.query({ name: 'geolocation' });
          setHasPermission(status.state === 'granted');
          status.onchange = () => setHasPermission(status.state === 'granted');
        } else {
          // Fallback: attempt to get current position to trigger prompt
          try {
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(() => resolve(true), () => resolve(false), { timeout: 5000 });
            });
            setHasPermission(true);
          } catch (e) {
            setHasPermission(false);
          }
        }
      } catch (err) {
        console.warn('Permission check failed', err);
        setHasPermission(null);
      } finally {
        setIsLoadingPermission(false);
        loadRecordingState();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecordingState = async () => {
    try {
      const coordsStr = await AsyncStorage.getItem(LOCATION_KEY);
      if (coordsStr) {
        const coords = JSON.parse(coordsStr);
        setCoordinates(coords);
      }

      const maxElevationStr = await AsyncStorage.getItem(MAX_ELEV_KEY);
      if (maxElevationStr) setMaxElevation(parseFloat(maxElevationStr));

      const maxSpeedStr = await AsyncStorage.getItem(MAX_SPEED_KEY);
      if (maxSpeedStr) setMaxSpeed(parseFloat(maxSpeedStr));

      const startTimeStr = await AsyncStorage.getItem(START_TIME_KEY);
      if (startTimeStr) {
        const elapsed = Math.floor((Date.now() - parseInt(startTimeStr)) / 1000);
        setDuration(elapsed);
        setIsRecording(true);
        startTimer();
      }
    } catch (error) {
      console.error('Error loading recording state:', error);
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(async () => {
      try {
        const startTimeStr = await AsyncStorage.getItem(START_TIME_KEY);
        if (startTimeStr) {
          const elapsed = Math.floor((Date.now() - parseInt(startTimeStr)) / 1000);
          setDuration(elapsed);
        }
      } catch (e) {}
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    console.log('Starting web recording...');
    setIsRecording(true);
    setCoordinates([]);
    setDuration(0);
    setMaxElevation(0);
    setMaxSpeed(0);

    try {
      const startTime = Date.now();
      await AsyncStorage.setItem(START_TIME_KEY, startTime.toString());
      await AsyncStorage.removeItem(LOCATION_KEY);
      await AsyncStorage.removeItem(MAX_ELEV_KEY);
      await AsyncStorage.removeItem(MAX_SPEED_KEY);
      await AsyncStorage.removeItem(LAST_UPDATE_KEY);

      // get initial position
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const coord = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify([coord]));
        setCoordinates([coord]);
        setCurrentLocation(coord);
      }, (err) => {
        console.warn('Initial geolocation failed', err);
      }, { enableHighAccuracy: true, timeout: 10000 });

      // start watch
      const id = navigator.geolocation.watchPosition(async (pos) => {
        const coord = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCurrentLocation(coord);
        setCoordinates(prev => {
          const newCoords = [...prev, coord];
          AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(newCoords)).catch(() => {});
          return newCoords;
        });

        await AsyncStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
      }, (err) => {
        console.error('watchPosition error', err);
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });

      watchIdRef.current = id as unknown as number;

      // request wake lock (Chromium) to keep screen on
      try {
        // @ts-ignore
        if ((navigator as any).wakeLock && (navigator as any).wakeLock.request) {
          // @ts-ignore
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (e) {
        console.warn('Wake lock request failed', e);
      }

      startTimer();
    } catch (error: any) {
      console.error('Recording error:', error);
      Alert.alert('Error', error?.message || 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping web recording...');
    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (wakeLockRef.current && wakeLockRef.current.release) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }

      stopTimer();

      const coordsStr = await AsyncStorage.getItem(LOCATION_KEY);
      const finalCoords = coordsStr ? JSON.parse(coordsStr) : coordinates;

      const maxElevationStr = await AsyncStorage.getItem(MAX_ELEV_KEY);
      const finalMaxElevation = maxElevationStr ? parseFloat(maxElevationStr) : maxElevation;

      const maxSpeedStr = await AsyncStorage.getItem(MAX_SPEED_KEY);
      const finalMaxSpeed = maxSpeedStr ? parseFloat(maxSpeedStr) : maxSpeed;

      const startTimeStr = await AsyncStorage.getItem(START_TIME_KEY);
      const finalDuration = startTimeStr ? Math.floor((Date.now() - parseInt(startTimeStr)) / 1000) : duration;

      if (!finalCoords || finalCoords.length < 2) {
        Alert.alert('No Trail Data', 'Not enough data to save this trail. Try walking a bit more!');
        setIsRecording(false);
        setCoordinates([]);
        setDuration(0);
        await AsyncStorage.removeItem(LOCATION_KEY);
        await AsyncStorage.removeItem(MAX_ELEV_KEY);
        await AsyncStorage.removeItem(MAX_SPEED_KEY);
        await AsyncStorage.removeItem(START_TIME_KEY);
        await AsyncStorage.removeItem(LAST_UPDATE_KEY);
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
        coordinates: finalCoords,
        city: startLocation?.city,
        country: startLocation?.country,
        pace: finalPace,
        speed: finalMaxSpeed,
        maxElevation: finalMaxElevation,
      };

      // open save modal with draft data instead of saving immediately
      setDraftTrail(trail);
      setFormName(trail.name || '');
      setFormDescription((trail as any).description || '');
      setFormPhoto((trail as any).photo || undefined);
      setShowSaveModal(true);
    } catch (error) {
      console.error('Stop error:', error);
      Alert.alert('Error', 'Failed to stop recording');
      setIsRecording(false);
    }
  };

  const submitSave = async () => {
    if (!draftTrail) return;
    const toSave: Trail = {
      ...(draftTrail as Trail),
      name: formName || (draftTrail as any).name || 'Untitled Trail',
      description: formDescription,
      photo: formPhoto,
    };

    try {
      await saveTrail(toSave);
      setShowSaveModal(false);
      setDraftTrail(null);
      setIsRecording(false);
      setCoordinates([]);
      setDuration(0);
      setStartLocation(null);
      setElevation(0);
      setMaxElevation(0);
      setPace('0:00');
      setSpeed(0);
      setMaxSpeed(0);

      await AsyncStorage.removeItem(LOCATION_KEY);
      await AsyncStorage.removeItem(MAX_ELEV_KEY);
      await AsyncStorage.removeItem(MAX_SPEED_KEY);
      await AsyncStorage.removeItem(START_TIME_KEY);
      await AsyncStorage.removeItem(LAST_UPDATE_KEY);

      const savedId = (toSave as any).id || null;
      if (savedId) router.push(`/trail/${savedId}`);
      else Alert.alert('Success', 'Trail saved successfully!');
    } catch (err) {
      console.error('Save failed', err);
      Alert.alert('Error', 'Failed to save trail');
    }
  };

  const cancelSave = () => {
    setShowSaveModal(false);
    setDraftTrail(null);
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
        const threshold = (bottomSheetHeight + collapsedHeight) / 2;
        const currentValue = (bottomSheetAnim as any)._value;
        if (gestureState.dy < -50) expandBottomSheet();
        else if (gestureState.dy > 50) collapseBottomSheet();
        else if (currentValue > threshold) expandBottomSheet();
        else collapseBottomSheet();
      },
    })
  ).current;

  const expandBottomSheet = () => {
    setIsExpanded(true);
    Animated.spring(bottomSheetAnim, { toValue: bottomSheetHeight, useNativeDriver: false, tension: 50, friction: 8 }).start();
  };

  const collapseBottomSheet = () => {
    setIsExpanded(false);
    Animated.spring(bottomSheetAnim, { toValue: collapsedHeight, useNativeDriver: false, tension: 50, friction: 8 }).start();
  };

  const toggleBottomSheet = () => { if (isExpanded) collapseBottomSheet(); else expandBottomSheet(); };

  if (isLoadingPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5d6b4a" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <MapPin size={64} color="#666" />
        <Text style={styles.permissionTitle}>Location Permission Required</Text>
        <Text style={styles.permissionText}>
          This page needs access to your location to track your walks. Please allow location access in your browser.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => {
          navigator.geolocation.getCurrentPosition(() => setHasPermission(true), () => setHasPermission(false));
        }}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const distance = calculateTotalDistance(coordinates);
  const progress = existingTrail && isRecording && coordinates.length > 0 && existingTrail.coordinates.length > 0
    ? Math.min((distance / existingTrail.distance) * 100, 100)
    : 0;
  const showProgress = !!existingTrail;

  const recenterMap = async () => {
    if (mapRef.current) {
      try {
        navigator.geolocation.getCurrentPosition((pos) => {
          const coord = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setCurrentLocation(coord);
          mapRef.current.animateToRegion({ latitude: coord.latitude, longitude: coord.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
        });
      } catch (error) {
        console.error('Error getting current location:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {currentLocation && (
        <TrailMap
          ref={mapRef}
          coordinates={coordinates}
          style={styles.map}
          initialRegion={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
          showsUserLocation
          followsUserLocation={isRecording}
          showsMyLocationButton={false}
        />
      )}

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap} activeOpacity={0.8}>
        <Navigation size={24} color="#5d6b4a" />
      </TouchableOpacity>

      <Animated.View style={[styles.bottomSheet, { height: Animated.add(bottomSheetAnim, navbarHeight), bottom: 0 }]}>
        <View {...panResponder.panHandlers} style={styles.handleBar}>
          <TouchableOpacity style={styles.handleContainer} onPress={toggleBottomSheet} activeOpacity={0.7}>
            <View style={styles.handle} />
            {isExpanded ? (<ChevronDown size={20} color="#9ca3af" />) : (<ChevronUp size={20} color="#9ca3af" />)}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSheetContent}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}><Text style={styles.statItemLabel}>Time</Text><Text style={styles.statItemValue}>{formatDuration(duration)}</Text></View>
            <View style={styles.statItem}><Text style={styles.statItemLabel}>Distance</Text><Text style={styles.statItemValue}>{formatDistance(distance)}</Text></View>
            <View style={styles.statItem}><Text style={styles.statItemLabel}>Elevation</Text><Text style={styles.statItemValue}>{elevation.toFixed(0)}m</Text></View>
            <View style={styles.statItem}><Text style={styles.statItemLabel}>Pace</Text><Text style={styles.statItemValue}>{pace}/km</Text></View>
            <View style={styles.statItem}><Text style={styles.statItemLabel}>Speed</Text><Text style={styles.statItemValue}>{speed.toFixed(1)} km/h</Text></View>
            {showProgress && (<View style={styles.statItem}><Text style={styles.statItemLabel}>Progress</Text><Text style={styles.statItemValue}>{progress.toFixed(0)}%</Text></View>)}
          </View>

          <TouchableOpacity style={[styles.recordButton, isRecording && styles.recordButtonActive]} onPress={isRecording ? stopRecording : startRecording} activeOpacity={0.8}>
            {isRecording ? (<><Square size={24} color="#fff" fill="#fff" /><Text style={styles.recordButtonText}>Stop & Save</Text></>) : (<><Play size={24} color="#fff" fill="#fff" /><Text style={styles.recordButtonText}>Start Trail</Text></>) }
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert('Apple Watch', 'Connect your Apple Watch to sync workout data.')} activeOpacity={0.7}>
                <View style={styles.optionIconContainer}><Watch size={24} color="#5d6b4a" /></View>
                <View style={styles.optionTextContainer}><Text style={styles.optionTitle}>Apple Watch</Text><Text style={styles.optionSubtitle}>Not connected</Text></View>
                <View style={styles.optionBadge}><Text style={styles.optionBadgeText}>Connect</Text></View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionRow} onPress={() => Alert.alert('Alerts', 'Configure alerts for distance milestones and pace notifications.')} activeOpacity={0.7}>
                <View style={styles.optionIconContainer}><Bell size={24} color="#5d6b4a" /></View>
                <View style={styles.optionTextContainer}><Text style={styles.optionTitle}>Alerts</Text><Text style={styles.optionSubtitle}>Distance & pace notifications</Text></View>
                <View style={[styles.optionBadge, styles.optionBadgeActive]}><Text style={[styles.optionBadgeText, styles.optionBadgeTextActive]}>Active</Text></View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
      <Modal visible={showSaveModal} animationType="slide" transparent={true} onRequestClose={cancelSave}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Save Trail</Text>
              <Text style={{ fontSize: 14, marginTop: 8 }}>Name</Text>
              <TextInput placeholder="Trail name" value={formName} onChangeText={setFormName} style={styles.input} />
              <Text style={{ fontSize: 14, marginTop: 8 }}>Description</Text>
              <TextInput placeholder="Description" value={formDescription} onChangeText={setFormDescription} style={[styles.input, { height: 100 }]} multiline />
              <Text style={{ fontSize: 14, marginTop: 8 }}>Photo URL (optional)</Text>
              <TextInput placeholder="Photo URL" value={formPhoto} onChangeText={setFormPhoto as any} style={styles.input} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={styles.modalButton} onPress={cancelSave}><Text style={styles.modalButtonText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={submitSave}><Text style={[styles.modalButtonText, { color: '#fff' }]}>Save Trail</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Reuse the same styles as native version for consistent UI
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F2' },
  map: { ...StyleSheet.absoluteFillObject },
  webContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7F2', padding: 20 },
  webText: { marginTop: 16, fontSize: 16, color: '#666', textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7F2' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7F2', padding: 32 },
  permissionTitle: { marginTop: 16, fontSize: 20, fontWeight: '700' as const, color: '#1f2937', textAlign: 'center' },
  permissionText: { marginTop: 8, fontSize: 16, color: '#6b7280', textAlign: 'center' },
  permissionButton: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 16, backgroundColor: '#5d6b4a', borderRadius: 12 },
  permissionButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#fff' },
  statsContainer: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  statLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' as const, marginBottom: 4 },
  statValue: { fontSize: 24, color: '#1f2937', fontWeight: '700' as const },
  controlContainer: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  recordButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 20, backgroundColor: '#5d6b4a', borderRadius: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  recordButtonActive: { backgroundColor: '#dc2626' },
  recordButtonText: { fontSize: 18, fontWeight: '700' as const, color: '#fff' },
  bottomSheet: { position: 'absolute', left: 0, right: 0, backgroundColor: '#F8F7F2', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20 },
  handleBar: { paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  handleContainer: { alignItems: 'center', gap: 4 },
  handle: { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2 },
  bottomSheetContent: { flex: 1, paddingHorizontal: 20, paddingBottom: 92 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statItem: { width: '31%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center' },
  statItemLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6 },
  statItemValue: { fontSize: 18, color: '#1f2937', fontWeight: '700' as const },
  expandedContent: { marginTop: 8 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 12 },
  optionIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(93, 107, 74, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '600' as const, color: '#1f2937', marginBottom: 2 },
  optionSubtitle: { fontSize: 13, color: '#6b7280' },
  optionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#e5e7eb' },
  optionBadgeActive: { backgroundColor: 'rgba(93, 107, 74, 0.15)' },
  optionBadgeText: { fontSize: 12, fontWeight: '600' as const, color: '#6b7280' },
  optionBadgeTextActive: { color: '#5d6b4a' },
  recenterButton: { position: 'absolute', top: 60, right: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#5d6b4a',
    marginLeft: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
  },
});
