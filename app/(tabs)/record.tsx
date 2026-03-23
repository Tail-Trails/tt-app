import { useState, useEffect, useRef } from 'react';
import { View, Platform, TouchableOpacity, Alert, ActivityIndicator, Animated, PanResponder, Dimensions, ScrollView } from 'react-native';
import { Text } from '@/components';
import TrailMap from '@/components/TrailMap';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, Navigation } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import styles from './record.styles';
import theme from '@/constants/colors';
import RecordOverlay from '@/components/RecordOverlay';
import { useTrails } from '@/context/TrailsContext';
import { useAuth } from '@/context/AuthContext';
import { Coordinate, Trail } from '@/types/trail';
import { calculateTotalDistance } from '@/utils/distance';
import { useKeepAwake } from 'expo-keep-awake';

const LOCATION_TRACKING_TASK = 'background-location-task';

// TODO: trail drops when record starts - fix this

TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: any) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    const location = locations[0];
    if (!location) return;

    try {
      // Get existing coords
      const coordsStr = await AsyncStorage.getItem('recording_coordinates');
      let coords = coordsStr ? JSON.parse(coordsStr) : [];

      const newCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Simple duplicate prevention (prevents bloating storage with identical points)
      const lastCoord = coords[coords.length - 1];
      if (lastCoord &&
        lastCoord.latitude === newCoord.latitude &&
        lastCoord.longitude === newCoord.longitude) {
        return;
      }

      coords.push(newCoord);
      await AsyncStorage.setItem('recording_coordinates', JSON.stringify(coords));

      // Update Elevation/Speed only if they exist
      if (location.coords.altitude) {
        const alt = Math.max(0, location.coords.altitude);
        const maxAlt = await AsyncStorage.getItem('recording_max_elevation');
        if (!maxAlt || alt > parseFloat(maxAlt)) {
          await AsyncStorage.setItem('recording_max_elevation', alt.toString());
        }
      }

      await AsyncStorage.setItem('recording_last_update', Date.now().toString());
    } catch (err) {
      console.error('BG Task Storage Error:', err);
    }
  }
});

export default function RecordScreen({ trail: incomingTrail }: { trail?: Trail } = {}) {
  const { saveTrail, getTrailById, getTrailWithUser } = useTrails();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const trailId = typeof params.trailId === 'string' ? params.trailId : undefined;
  // If a full trail object was passed via query param `trail`, prefer it (JSON-encoded).
  let paramTrail: Trail | undefined = undefined;
  if (typeof params.trail === 'string') {
    try {
      // params from URL are encoded; decode then parse
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
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
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

  // Follow-only mode state when viewing an existing trail (via ?trailId=)
  const [followMode, setFollowMode] = useState<boolean>(!!initialTrail);
  const [userLocationFollow, setUserLocationFollow] = useState<Coordinate | null>(null);
  const followLocationRef = useRef<Location.LocationSubscription | null>(null);

  // 1. Keep the JS thread alive while this screen is mounted/active
  useKeepAwake();

  useEffect(() => {
    if (true) {
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
    } else {
      setIsLoadingPermission(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the screen is opened without a trailId or incoming trail (e.g. via the tab bar),
  // ensure we don't keep a previous `initialTrail` around — unless the user is actively recording.
  useEffect(() => {
    if (!trailId && !incomingTrail && typeof params.trail !== 'string' && !isRecording) {
      setInitialTrail(undefined);
      setFollowMode(false);
    }
  }, [trailId, incomingTrail, params.trail, isRecording]);

  // If opened with an existing trail, enable follow mode and show the trail coordinates
  useEffect(() => {
    if (initialTrail) {
      setFollowMode(true);
    }
  }, [initialTrail]);

  // DEBUG: log when initialTrail or trailId changes to help debugging navigation
  useEffect(() => {
    try {
      console.log('RecordScreen debug - initialTrail:', initialTrail ? { id: initialTrail.id, coords: (initialTrail.coordinates?.length ?? initialTrail.path?.length ?? 0) } : null, 'trailId:', trailId);
    } catch (err) {
      console.warn('RecordScreen debug log failed', err);
    }
  }, [initialTrail, trailId]);

  // If we have a trailId but no trail object yet, fetch it from the API/context
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!initialTrail && trailId) {
        try {
          const t = await getTrailWithUser(trailId);
          if (mounted && t) setInitialTrail(t);
        } catch (err) {
          console.warn('Failed to load trail by id in RecordScreen:', err);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, [initialTrail, trailId, getTrailWithUser]);

  // Start/stop following user location when followMode changes
  useEffect(() => {
    let active = true;

    const startFollow = async () => {
      if (!hasPermission) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Location permission is required to follow the trail');
          return;
        }
        setHasPermission(true);
      }

      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 8,
            timeInterval: 10000,
          },
          (loc) => {
            if (!active) return;
            const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setUserLocationFollow(coord);
            setCurrentLocation(coord);
          }
        );
        followLocationRef.current = sub;
      } catch (err) {
        console.error('Follow watchPosition error', err);
      }
    };

    if (followMode) {
      startFollow();
    } else {
      if (followLocationRef.current) {
        followLocationRef.current.remove();
        followLocationRef.current = null;
      }
      setUserLocationFollow(null);
    }

    return () => {
      active = false;
      if (followLocationRef.current) {
        followLocationRef.current.remove();
        followLocationRef.current = null;
      }
    };
  }, [followMode, hasPermission]);

  const loadRecordingState = async () => {
    try {
      const startTimeStr = await AsyncStorage.getItem('recording_start_time');

      if (!startTimeStr) {
        // No active recording: clear any stale saved coordinates so the map is empty
        await AsyncStorage.removeItem('recording_coordinates');
        setCoordinates([]);
        setIsRecording(false);
        setDuration(0);
      } else {
        // There's an active recording in storage - resume state
        setIsRecording(true);
        const coordsStr = await AsyncStorage.getItem('recording_coordinates');
        if (coordsStr) {
          const coords = JSON.parse(coordsStr);
          setCoordinates(coords);
        }

        const startTime = parseInt(startTimeStr);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
      }

      const maxElevationStr = await AsyncStorage.getItem('recording_max_elevation');
      if (maxElevationStr) {
        setMaxElevation(parseFloat(maxElevationStr));
      }

      const maxSpeedStr = await AsyncStorage.getItem('recording_max_speed');
      if (maxSpeedStr) {
        setMaxSpeed(parseFloat(maxSpeedStr));
      }
    } catch (error) {
      console.error('Error loading recording state:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      console.log('Requesting location permissions...');

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      console.log('Foreground permission status:', foregroundStatus);

      if (foregroundStatus === 'granted') {
        try {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          console.log('Background permission status:', backgroundStatus);

          if (backgroundStatus !== 'granted') {
            Alert.alert(
              'Background Location Required',
              'To continue recording your trail when the screen is locked, please enable "Allow all the time" in location settings.',
              [{ text: 'OK' }]
            );
          }
        } catch (bgError: any) {
          console.warn('Background permission error (non-critical):', bgError.message);
        }

        setHasPermission(true);

        try {
          const location = await (await import('@/utils/location')).getBestAvailableLocation({ accuracy: Location.Accuracy.Balanced });
          if (location) {
            const coord = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setCurrentLocation(coord);
            console.log('Initial location:', coord);
          } else {
            console.warn('Initial location not available (no current or last-known position)');
          }
        } catch (locError: any) {
          console.warn('Error getting initial location:', locError?.message || locError);
        }
      } else {
        setHasPermission(false);
        Alert.alert(
          'Permission Required',
          'Location permission is required to track your walks.',
          [{ text: 'OK' }]
        );
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

  // removed getReverseGeocode to avoid geocoding rate limits; we don't need city/country

  const startRecording = async () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    console.log('Starting recording...');
    setIsRecording(true);
    setCoordinates([]);
    setDuration(0);
    setMaxElevation(0);
    setMaxSpeed(0);

    try {
      const startTime = Date.now();
      await AsyncStorage.setItem('recording_start_time', startTime.toString());
      await AsyncStorage.removeItem('recording_coordinates');
      await AsyncStorage.removeItem('recording_max_elevation');
      await AsyncStorage.removeItem('recording_max_speed');
      await AsyncStorage.removeItem('recording_last_update');

      const location = await (await import('@/utils/location')).getBestAvailableLocation({ accuracy: Location.Accuracy.Balanced });

      // do not perform reverse geocoding — only keep coordinates
      setStartLocation(null);

      const initialCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      await AsyncStorage.setItem('recording_coordinates', JSON.stringify([initialCoord]));
      setCoordinates([initialCoord]);
      setCurrentLocation(initialCoord);

      try {
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 8,
          timeInterval: 1000,
          foregroundService: {
            notificationTitle: 'Recording Trail',
            notificationBody: 'TailTrails is tracking your walk',
            notificationColor: theme.accentPrimary
          },
          // --- CRITICAL IOS SETTINGS ---
          pausesUpdatesAutomatically: false, // Prevents iOS from "detecting" a stop
          showsBackgroundLocationIndicator: true, // Shows the blue pill in status bar
          activityType: Location.ActivityType.Fitness, // Tells iOS this is a workout
          deferredUpdatesInterval: 5000, // Wait 5 seconds before batching
          deferredUpdatesDistance: 5,    // Wait 5 meters before batching
        });
        console.log('Background location tracking started successfully');
      } catch (bgLocationError: any) {
        console.warn('Background location not available:', bgLocationError.message);
        if (bgLocationError.message?.includes('Background location') || bgLocationError.message?.includes('UIBackgroundModes')) {
          Alert.alert(
            'Background Tracking Unavailable',
            'Background location tracking requires a custom development build. The app will continue recording in foreground mode only. Please keep the app open while recording.',
            [{ text: 'OK' }]
          );
        }
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 8,
          timeInterval: 10000,
        },
        async (location) => {
          const coord = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          console.log('Foreground position update:', coord, 'Accuracy:', location.coords.accuracy);
          setCurrentLocation(coord);

          setCoordinates(prev => {
            const newCoords = [...prev, coord];
            console.log('Total coordinates:', newCoords.length, 'Distance:', calculateTotalDistance(newCoords), 'm');
            AsyncStorage.setItem('recording_coordinates', JSON.stringify(newCoords)).catch(err => {
              console.error('Error saving coordinates:', err);
            });
            return newCoords;
          });

          if (location.coords.altitude) {
            const currentElevation = Math.max(0, location.coords.altitude);
            setElevation(currentElevation);
            if (currentElevation > maxElevation) {
              setMaxElevation(currentElevation);
              await AsyncStorage.setItem('recording_max_elevation', currentElevation.toString());
            }
          }

          if (location.coords.speed && location.coords.speed > 0) {
            const currentSpeed = location.coords.speed * 3.6;
            setSpeed(currentSpeed);
            if (currentSpeed > maxSpeed) {
              setMaxSpeed(currentSpeed);
              await AsyncStorage.setItem('recording_max_speed', currentSpeed.toString());
            }
          }
        }
      );

      timerRef.current = setInterval(async () => {
        try {
          const startTimeStr = await AsyncStorage.getItem('recording_start_time');
          if (startTimeStr) {
            const startTime = parseInt(startTimeStr);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setDuration(elapsed);
          }
        } catch (error) {
          console.error('Error calculating duration:', error);
        }
      }, 1000);
    } catch (error: any) {
      console.error('Recording error:', error);
      let errorMessage = 'Failed to start recording. Please try again.';

      if (error.message?.includes('rate limit')) {
        errorMessage = 'Please wait a moment before starting a new recording. Location service is temporarily limited.';
      } else if (error.message?.includes('Background location') || error.message?.includes('UIBackgroundModes')) {
        errorMessage = 'Background location tracking requires a custom development build. Please build the app with EAS or use foreground-only mode.';
      }

      Alert.alert('Error', errorMessage);
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

  const initialHeight = useRef<number>(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        initialHeight.current = (bottomSheetAnim as any)._value;
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = initialHeight.current - gestureState.dy;

        if (newValue >= collapsedHeight && newValue <= bottomSheetHeight) {
          bottomSheetAnim.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (true) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const threshold = (bottomSheetHeight + collapsedHeight) / 2;
        const currentValue = (bottomSheetAnim as any)._value;

        if (gestureState.dy < -50) {
          expandBottomSheet();
        } else if (gestureState.dy > 50) {
          collapseBottomSheet();
        } else if (currentValue > threshold) {
          expandBottomSheet();
        } else {
          collapseBottomSheet();
        }
      },
    })
  ).current;

  const expandBottomSheet = () => {
    setIsExpanded(true);
    Animated.spring(bottomSheetAnim, {
      toValue: bottomSheetHeight,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  };

  const collapseBottomSheet = () => {
    setIsExpanded(false);
    Animated.spring(bottomSheetAnim, {
      toValue: collapsedHeight,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  };

  const toggleBottomSheet = () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isExpanded) {
      collapseBottomSheet();
    } else {
      expandBottomSheet();
    }
  };

  const stopRecording = async () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    console.log('Stopping recording...');

    try {
      const hasTask = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK);
      if (hasTask) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      }
    } catch (error) {
      console.error('Error stopping background location:', error);
    }

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const coordsStr = await AsyncStorage.getItem('recording_coordinates');
    const finalCoords = coordsStr ? JSON.parse(coordsStr) : coordinates;

    const maxElevationStr = await AsyncStorage.getItem('recording_max_elevation');
    const finalMaxElevation = maxElevationStr ? parseFloat(maxElevationStr) : maxElevation;

    const maxSpeedStr = await AsyncStorage.getItem('recording_max_speed');
    const finalMaxSpeed = maxSpeedStr ? parseFloat(maxSpeedStr) : maxSpeed;

    const startTimeStr = await AsyncStorage.getItem('recording_start_time');
    const finalDuration = startTimeStr ? Math.floor((Date.now() - parseInt(startTimeStr)) / 1000) : duration;

    if (finalCoords.length < 2) {
      Alert.alert('No Trail Data', 'Not enough data to save this trail. Try walking a bit more!');
      setIsRecording(false);
      setCoordinates([]);
      setDuration(0);
      await AsyncStorage.removeItem('recording_coordinates');
      await AsyncStorage.removeItem('recording_max_elevation');
      await AsyncStorage.removeItem('recording_max_speed');
      await AsyncStorage.removeItem('recording_start_time');
      await AsyncStorage.removeItem('recording_last_update');
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
    // Navigate to end-walk flow with draft trail data for finalization
    try {
      const draftParam = encodeURIComponent(JSON.stringify(trail));
      router.push(`/end-walk/summary?draft=${draftParam}`);
    } catch (err) {
      console.error('Failed to navigate to end-walk summary:', err);
    }
    return;
  };

  const cancelRecording = async () => {
    Alert.alert(
      'Cancel recording?',
      'Discard this recording and all collected data. This cannot be undone.',
      [
        { text: 'Keep Recording', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              if (true) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              const hasTask = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK);
              if (hasTask) {
                await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
              }
            } catch (err) {
              console.warn('Error stopping background task on cancel:', err);
            }

            if (locationSubscription.current) {
              locationSubscription.current.remove();
              locationSubscription.current = null;
            }

            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            try {
              await AsyncStorage.removeItem('recording_start_time');
              await AsyncStorage.removeItem('recording_coordinates');
              await AsyncStorage.removeItem('recording_max_elevation');
              await AsyncStorage.removeItem('recording_max_speed');
              await AsyncStorage.removeItem('recording_last_update');
            } catch (err) {
              console.warn('Error clearing recording storage on cancel:', err);
            }

            setIsRecording(false);
            setCoordinates([]);
            setDuration(0);
            setMaxElevation(0);
            setMaxSpeed(0);
          },
        },
      ]
    );
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
        <Text style={styles.permissionText}>
          This app needs access to your location to track your dog walks.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            if (true) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            requestPermissions();
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const distance = calculateTotalDistance(coordinates);

  // Normalize trail coordinates: API returns `path` as [lon, lat] arrays, convert to {latitude,longitude}
  const initialTrailCoordinates: Coordinate[] | undefined = initialTrail
    ? (initialTrail.coordinates && initialTrail.coordinates.length > 0
      ? initialTrail.coordinates
      : initialTrail.path && initialTrail.path.length > 0
        ? initialTrail.path.map((p: any) => ({ latitude: p[1], longitude: p[0] }))
        : undefined)
    : undefined;

  const progress = initialTrail && isRecording && coordinates.length > 0 && initialTrailCoordinates && initialTrailCoordinates.length > 0
    ? Math.min((distance / (initialTrail.distance || distance)) * 100, 100)
    : 0;

  const showProgress = !!initialTrail;

  const recenterMap = async () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (mapRef.current) {
      try {
        const location = await (await import('@/utils/location')).getBestAvailableLocation({ accuracy: Location.Accuracy.Balanced });
        const coord = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(coord);
        mapRef.current.animateToRegion({
          latitude: coord.latitude,
          longitude: coord.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      } catch (error) {
        console.error('Error getting current location:', error);
        if (currentLocation) {
          mapRef.current.animateToRegion({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500);
        }
      }
    }
  };

  const handleCamera = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not supported', 'Camera capture is not supported on web.');
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const uri = result.assets[0].uri;
      // Save photo URIs to recording_photos so they can be associated with this recording later
      try {
        const photosStr = await AsyncStorage.getItem('recording_photos');
        const photos = photosStr ? JSON.parse(photosStr) : [];
        photos.push({ uri, timestamp: Date.now() });
        await AsyncStorage.setItem('recording_photos', JSON.stringify(photos));
        Alert.alert('Photo saved', 'Captured photo saved to this recording.');
      } catch (err) {
        console.error('Error saving recording photo:', err);
        Alert.alert('Error', 'Failed to save photo');
      }
    } catch (err) {
      console.error('Camera error', err);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  // adjust bottom sheet content padding when collapsed so compact stats aren't pushed out
  const contentPaddingBottom = isExpanded ? navbarHeight : 12;

  return (
    <View style={styles.container}>
      {(currentLocation || initialTrail) && (
        <TrailMap
          ref={mapRef}
          coordinates={initialTrail && !isRecording ? initialTrailCoordinates ?? initialTrail.coordinates : coordinates}
          style={styles.map}
          initialRegion={
            currentLocation
              ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
              : initialTrailCoordinates && initialTrailCoordinates.length > 0
                ? {
                  latitude: initialTrailCoordinates[0].latitude,
                  longitude: initialTrailCoordinates[0].longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
                : undefined
          }
          userLocation={userLocationFollow ?? currentLocation}
          showsUserLocation
          followsUserLocation={followMode || isRecording}
          showsMyLocationButton={false}
        />
      )}

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={recenterMap}
        activeOpacity={0.8}
      >
        <Navigation size={24} color={theme.accentPrimary} />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: Animated.add(bottomSheetAnim, navbarHeight),
            bottom: 0,
          },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.handleBar}>
          <TouchableOpacity
            style={styles.handleContainer}
            onPress={toggleBottomSheet}
            activeOpacity={0.7}
          >
            <View style={styles.handle} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.bottomSheetContent}
          contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            onStop={stopRecording}
            onClose={() => {
              if (followLocationRef.current) {
                followLocationRef.current.remove();
                followLocationRef.current = null;
              }
              setFollowMode(false);
              router.back();
            }}
            onCancel={cancelRecording}
            onCamera={handleCamera}
          />
        </ScrollView>
      </Animated.View>

    </View>
  );
}

// styles are imported from record.styles.ts
