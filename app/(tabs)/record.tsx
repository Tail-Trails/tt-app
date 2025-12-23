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
  ScrollView,
} from 'react-native';

import TrailMap from '@/components/TrailMap';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Play, Square, MapPin, Watch, Bell, ChevronUp, ChevronDown, Navigation } from 'lucide-react-native';
import { useTrails } from '@/context/TrailsContext';
import { useAuth } from '@/context/AuthContext';
import { Coordinate, Trail } from '@/types/trail';
import { calculateTotalDistance, formatDistance, formatDuration } from '@/utils/distance';

const LOCATION_TRACKING_TASK = 'background-location-task';

if (Platform.OS !== 'web') {
  TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: { data: any; error: any }) => {
    if (error) {
      console.error('Background location error:', error);
      return;
    }
    if (data) {
      const { locations } = data as any;
      const location = locations[0];
      
      if (location) {
        console.log('Background location update:', location.coords);
        
        try {
          const coordsStr = await AsyncStorage.getItem('recording_coordinates');
          const coords = coordsStr ? JSON.parse(coordsStr) : [];
          
          const newCoord = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          coords.push(newCoord);
          await AsyncStorage.setItem('recording_coordinates', JSON.stringify(coords));
          
          if (location.coords.altitude) {
            const currentElevation = Math.max(0, location.coords.altitude);
            const maxElevationStr = await AsyncStorage.getItem('recording_max_elevation');
            const maxElevation = maxElevationStr ? parseFloat(maxElevationStr) : 0;
            
            if (currentElevation > maxElevation) {
              await AsyncStorage.setItem('recording_max_elevation', currentElevation.toString());
            }
          }
          
          if (location.coords.speed && location.coords.speed > 0) {
            const currentSpeed = location.coords.speed * 3.6;
            const maxSpeedStr = await AsyncStorage.getItem('recording_max_speed');
            const maxSpeed = maxSpeedStr ? parseFloat(maxSpeedStr) : 0;
            
            if (currentSpeed > maxSpeed) {
              await AsyncStorage.setItem('recording_max_speed', currentSpeed.toString());
            }
          }

          await AsyncStorage.setItem('recording_last_update', Date.now().toString());
        } catch (err) {
          console.error('Error storing location:', err);
        }
      }
    }
  });
}

export default function RecordScreen() {
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
  // geocoding removed — we rely on coordinates only

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bottomSheetHeight = Dimensions.get('window').height * 0.5;
  const collapsedHeight = 280;
  const navbarHeight = Platform.OS === 'ios' ? 100 : 92;
  const bottomSheetAnim = useRef(new Animated.Value(collapsedHeight)).current;
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [elevation, setElevation] = useState<number>(0);
  const [maxElevation, setMaxElevation] = useState<number>(0);
  const [pace, setPace] = useState<string>('0:00');
  const [speed, setSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [draftTrail, setDraftTrail] = useState<Partial<Trail> | null>(null);
  // fields for the save form
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPhoto, setFormPhoto] = useState<string | undefined>(undefined);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formDifficulty, setFormDifficulty] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS !== 'web') {
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

  const loadRecordingState = async () => {
    try {
      const coordsStr = await AsyncStorage.getItem('recording_coordinates');
      if (coordsStr) {
        const coords = JSON.parse(coordsStr);
        setCoordinates(coords);
      }
      
      const maxElevationStr = await AsyncStorage.getItem('recording_max_elevation');
      if (maxElevationStr) {
        setMaxElevation(parseFloat(maxElevationStr));
      }
      
      const maxSpeedStr = await AsyncStorage.getItem('recording_max_speed');
      if (maxSpeedStr) {
        setMaxSpeed(parseFloat(maxSpeedStr));
      }

      if (isRecording) {
        const startTimeStr = await AsyncStorage.getItem('recording_start_time');
        if (startTimeStr) {
          const startTime = parseInt(startTimeStr);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setDuration(elapsed);
        }
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
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coord = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(coord);
          console.log('Initial location:', coord);
        } catch (locError: any) {
          console.warn('Error getting initial location:', locError.message);
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
    if (Platform.OS !== 'web') {
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
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
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
          distanceInterval: 3,
          timeInterval: 1000,
          foregroundService: {
            notificationTitle: 'Recording Trail',
            notificationBody: 'TailTrails is tracking your walk',
            notificationColor: '#2563eb',
          },
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
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
          distanceInterval: 3,
          timeInterval: 1000,
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
        if (Platform.OS !== 'web') {
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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isExpanded) {
      collapseBottomSheet();
    } else {
      expandBottomSheet();
    }
  };

  const stopRecording = async () => {
    if (Platform.OS !== 'web') {
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
    // Instead of POSTing immediately, open save modal with draft data
    setDraftTrail(trail);
    setFormName(trail.name || '');
    setFormDescription((trail as any).description || '');
    setFormPhoto((trail as any).photo || undefined);
    setFormTags((trail as any).tags || []);
    setFormDifficulty((trail as any).difficulty || undefined);
    setShowSaveModal(true);
    return;
  };

  const submitSave = async () => {
    if (!draftTrail) return;
    const toSave: Trail = {
      ...(draftTrail as Trail),
      name: formName || (draftTrail as any).name || 'Untitled Trail',
      description: formDescription,
      photo: formPhoto,
      tags: formTags,
      difficulty: formDifficulty,
    };

    try {
      await saveTrail(toSave);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
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

      await AsyncStorage.removeItem('recording_coordinates');
      await AsyncStorage.removeItem('recording_max_elevation');
      await AsyncStorage.removeItem('recording_max_speed');
      await AsyncStorage.removeItem('recording_start_time');
      await AsyncStorage.removeItem('recording_last_update');

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


  if (isLoadingPermission && Platform.OS !== 'web') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5d6b4a" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  // if (Platform.OS === 'web') {
  //   return (
  //     <View style={styles.webContainer}>
  //       <MapPin size={64} color="#666" />
  //       <Text style={styles.webText}>GPS walk tracking is only available on mobile.</Text>
  //     </View>
  //   );
  // }

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
            if (Platform.OS !== 'web') {
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
  
  const progress = existingTrail && isRecording && coordinates.length > 0 && existingTrail.coordinates.length > 0
    ? Math.min((distance / existingTrail.distance) * 100, 100)
    : 0;
  
  const showProgress = !!existingTrail;

  const recenterMap = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (mapRef.current) {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
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

  return (
    <View style={styles.container}>
      {currentLocation && (
        <TrailMap
          ref={mapRef}
          coordinates={coordinates}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          followsUserLocation={isRecording}
          showsMyLocationButton={false}
        />
      )}

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={recenterMap}
        activeOpacity={0.8}
      >
        <Navigation size={24} color="#5d6b4a" />
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
            {isExpanded ? (
              <ChevronDown size={20} color="#9ca3af" />
            ) : (
              <ChevronUp size={20} color="#9ca3af" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSheetContent}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Time</Text>
              <Text style={styles.statItemValue}>{formatDuration(duration)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Distance</Text>
              <Text style={styles.statItemValue}>{formatDistance(distance)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Elevation</Text>
              <Text style={styles.statItemValue}>{elevation.toFixed(0)}m</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Pace</Text>
              <Text style={styles.statItemValue}>{pace}/km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Speed</Text>
              <Text style={styles.statItemValue}>{speed.toFixed(1)} km/h</Text>
            </View>
            {showProgress && (
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Progress</Text>
                <Text style={styles.statItemValue}>{progress.toFixed(0)}%</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <>
                <Square size={24} color="#fff" fill="#fff" />
                <Text style={styles.recordButtonText}>Stop & Save</Text>
              </>
            ) : (
              <>
                <Play size={24} color="#fff" fill="#fff" />
                <Text style={styles.recordButtonText}>Start Trail</Text>
              </>
            )}
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />
              
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  Alert.alert('Apple Watch', 'Connect your Apple Watch to sync workout data.');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <Watch size={24} color="#5d6b4a" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Apple Watch</Text>
                  <Text style={styles.optionSubtitle}>Not connected</Text>
                </View>
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>Connect</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  Alert.alert('Alerts', 'Configure alerts for distance milestones and pace notifications.');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <Bell size={24} color="#5d6b4a" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Alerts</Text>
                  <Text style={styles.optionSubtitle}>Distance & pace notifications</Text>
                </View>
                <View style={[styles.optionBadge, styles.optionBadgeActive]}>
                  <Text style={[styles.optionBadgeText, styles.optionBadgeTextActive]}>Active</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
      <Modal
        visible={showSaveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={cancelSave}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Save Trail</Text>
              <TextInput
                placeholder="Trail name"
                value={formName}
                onChangeText={setFormName}
                style={styles.input}
              />
              <TextInput
                placeholder="Description"
                value={formDescription}
                onChangeText={setFormDescription}
                style={[styles.input, { height: 100 }]}
                multiline
              />
              <TextInput
                placeholder="Photo URL (optional)"
                value={formPhoto}
                onChangeText={setFormPhoto}
                style={styles.input}
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={styles.modalButton} onPress={cancelSave}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={submitSave}>
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save Trail</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F2',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7F2',
    padding: 20,
  },
  webText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7F2',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7F2',
    padding: 32,
  },
  permissionTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
    textAlign: 'center',
  },
  permissionText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#5d6b4a',
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  statsContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    color: '#1f2937',
    fontWeight: '700' as const,
  },
  controlContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: '#5d6b4a',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#dc2626',
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#F8F7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handleContainer: {
    alignItems: 'center',
    gap: 4,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 92,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    width: '31%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statItemValue: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '700' as const,
  },
  expandedContent: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(93, 107, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  optionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  optionBadgeActive: {
    backgroundColor: 'rgba(93, 107, 74, 0.15)',
  },
  optionBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  optionBadgeTextActive: {
    color: '#5d6b4a',
  },
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
  recenterButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
