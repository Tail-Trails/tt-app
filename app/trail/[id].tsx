import { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text } from '@/components';

import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import TrailMapPreview from '@/components/TrailMapPreview';
import * as Location from 'expo-location';
import { Clock, MapPin, Calendar, Edit3, Check, X, Navigation, TrendingUp, Tag, Camera, Activity, Star, ArrowLeft, Share2, Bookmark, MoreVertical, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrails } from '@/context/TrailsContext';
import { useAuth } from '@/context/AuthContext';
import { Trail } from '@/types/trail';

import { formatDistance, formatDuration } from '@/utils/distance';
import theme from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './[id].styles';
import { Typography } from '@/constants/typography';

const ENVIRONMENT_TAG_OPTIONS = [
  'Forest', 'Urban', 'Beach', 'Mountain', 'Rural', 'Park',
  'Shaded', 'Sunny', 'Crowded', 'Quiet', 'Paved', 'Trail'
];

const DIFFICULTY_OPTIONS = ['Easy', 'Moderate', 'Hard'];

export default function TrailDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { getTrailById, updateTrailName, updateTrailPhoto, updateTrailDetails, getTrailWithUser } = useTrails();
  const [trail, setTrail] = useState<Trail | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedRating, setEditedRating] = useState<number>(0);
  const [editedReview, setEditedReview] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [editedDifficulty, setEditedDifficulty] = useState<string>('');
  const [editedNameInDetails, setEditedNameInDetails] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isGettingDirections, setIsGettingDirections] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [heroActiveIndex, setHeroActiveIndex] = useState<number>(0);
  // Helper to render native icons on mobile and an emoji fallback on web where some icon libs
  // can produce text nodes that raise "Text strings must be rendered within a <Text> component".
  const IconOrEmoji = ({ IconComponent, emoji, size = 18, color }: { IconComponent: any; emoji?: string; size?: number; color?: string }) => {
    if (false) {
      // Use ThemedText so the emoji/text is correctly wrapped in a <Text> component on web
      return <Text style={{ ...Typography.body(color || '#000'), fontSize: size }}>{emoji || '•'}</Text>;
    }
    const Icon = IconComponent;
    return <Icon size={size} color={color} />;
  };
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    loadTrail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTrail = async () => {
    if (typeof id !== 'string') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const foundTrail = await getTrailById(id);
      if (foundTrail) {
        setTrail(foundTrail);
        setEditedName(foundTrail.name || '');
        setEditedRating(foundTrail.rating || 0);
        setEditedReview(foundTrail.review || '');
        setEditedTags(foundTrail.environment_tags || []);
        setEditedDifficulty(foundTrail.difficulty || '');
        setEditedNameInDetails(foundTrail.name || '');
      } else {
        const loadedTrail = await getTrailWithUser(id);
        if (loadedTrail) {
          setTrail(loadedTrail);
          setEditedName(loadedTrail.name || '');
          setEditedRating(loadedTrail.rating || 0);
          setEditedReview(loadedTrail.review || '');
          setEditedTags(loadedTrail.environment_tags || []);
          setEditedDifficulty(loadedTrail.difficulty || '');
          setEditedNameInDetails(loadedTrail.name || '');
        }
      }
    } catch (error) {
      console.error('Error loading trail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!trail || !editedName.trim()) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateTrailName(trail.id, editedName.trim());
      setTrail({ ...trail, name: editedName.trim() });
      setIsEditingName(false);
    } catch {
      Alert.alert('Error', 'Failed to update trail name. Please try again.');
    }
  };

  const handleSaveDetails = async () => {
    if (!trail) return;

    try {
      if (editedNameInDetails.trim() !== trail.name) {
        await updateTrailName(trail.id, editedNameInDetails.trim());
      }
      await updateTrailDetails(trail.id, {
        rating: editedRating > 0 ? editedRating : undefined,
        review: editedReview.trim() || undefined,
        environment_tags: editedTags.length > 0 ? editedTags : undefined,
        difficulty: editedDifficulty || undefined,
      });
      setTrail({
        ...trail,
        name: editedNameInDetails.trim(),
        rating: editedRating > 0 ? editedRating : undefined,
        review: editedReview.trim() || undefined,
        environment_tags: editedTags.length > 0 ? editedTags : undefined,
        difficulty: editedDifficulty || undefined,
      });
      setEditedName(editedNameInDetails.trim());
      setIsEditingDetails(false);
      Alert.alert('Success', 'Trail details updated!');
    } catch {
      Alert.alert('Error', 'Failed to update trail details. Please try again.');
    }
  };

  const handleGetDirections = async () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!trail) {
      Alert.alert('Error', 'Location not available for this trail');
      return;
    }

    // Determine trail start coordinates: prefer explicit start coords, then normalized coordinates, then raw path
    let destLat: number | undefined = trail.startLatitude as number | undefined;
    let destLng: number | undefined = trail.startLongitude as number | undefined;

    if ((destLat == null || destLng == null) && (trail.coordinates?.length ?? 0) > 0) {
      destLat = trail.coordinates![0].latitude;
      destLng = trail.coordinates![0].longitude;
    }

    if ((destLat == null || destLng == null) && (trail.path?.length ?? 0) > 0) {
      // backend path is [lon, lat]
      destLat = trail.path![0][1];
      destLng = trail.path![0][0];
    }

    if (destLat == null || destLng == null) {
      Alert.alert('Error', 'Trail start location not available');
      return;
    }

    setIsGettingDirections(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow location access to get directions');
        return;
      }

      const userLoc = await (await import('@/utils/location')).getBestAvailableLocation({ accuracy: Location.Accuracy.Highest });
      if (!userLoc) throw new Error('User location unavailable');
      const originLat = userLoc.coords.latitude;
      const originLng = userLoc.coords.longitude;

      const label = encodeURIComponent(trail.name || 'Trail Location');
      const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=walking&dir_action=navigate&destination_place_id=${label}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps application');
      }
    } catch (err) {
      console.error('Directions error', err);
      Alert.alert('Error', 'Failed to get directions');
    } finally {
      setIsGettingDirections(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(trail?.name || '');
    setIsEditingName(false);
  };

  const handleCancelDetailsEdit = () => {
    setEditedRating(trail?.rating || 0);
    setEditedReview(trail?.review || '');
    setEditedTags(trail?.environment_tags || []);
    setEditedDifficulty(trail?.difficulty || '');
    setEditedNameInDetails(trail?.name || '');
    setIsEditingDetails(false);
  };

  const toggleTag = (tag: string) => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const pickImageWeb = () => {
    if (false) {
      fileInputRef.current?.click();
    }
  };

  const handleWebFileChange = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file || !trail) return;

    if (!file.type.startsWith('image/')) {
      Alert.alert('Error', 'Please select an image file');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await updateTrailPhoto(trail.id, base64);
        setTrail({ ...trail, photo: base64 });
        Alert.alert('Success', 'Photo uploaded successfully!');
        setIsUploadingPhoto(false);
      };
      reader.onerror = () => {
        Alert.alert('Error', 'Failed to read image');
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
      setIsUploadingPhoto(false);
    }
  };

  const pickImageMobile = async () => {
    if (!trail) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingPhoto(true);
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateTrailPhoto(trail.id, base64Image);
        setTrail({ ...trail, photo: base64Image });
        Alert.alert('Success', 'Photo uploaded successfully!');
        setIsUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
      setIsUploadingPhoto(false);
    }
  };

  const handlePickImage = () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (false) {
      pickImageWeb();
    } else {
      pickImageMobile();
    }
  };

  const handleBack = () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleShare = () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleSave = () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSaved(!isSaved);
  };

  const handleMore = () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Options', 'Mark as completed option coming soon!');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.backgroundPrimary} />
        <Text style={styles.loadingText}>Loading trail...</Text>
      </View>
    );
  }

  if (!trail) {
    return (
      <View style={styles.loadingContainer}>
        <MapPin size={64} color="#9ca3af" />
        <Text style={styles.loadingText}>Trail not found</Text>
      </View>
    );
  }

  const coords = trail.coordinates ?? [];

  const region = coords.length > 0 ? {
    latitude: coords[0].latitude,
    longitude: coords[0].longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : undefined;

  const canEdit = trail.user_id === user?.id;

  const heroSlidesCount = ((trail as any).images?.length || 0) + (((trail as any).images?.length || 0) > 0 ? 1 : (trail.photo ? 1 : 0));

  return (
    <View style={[
      styles.container,
      { paddingBottom: Math.max(16, insets.bottom) },
    ]}>
      {false && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
        />
      )}

      <View style={[styles.headerButtons, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <ArrowLeft size={24} color={theme.accentPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
            <Bookmark size={22} color={theme.accentPrimary} fill={isSaved ? theme.accentPrimary : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleMore}>
            <MoreVertical size={22} color={theme.accentPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroImageContainer}>
            {Array.isArray((trail as any).images) && (trail as any).images.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.heroImageScroll}
                onMomentumScrollEnd={(e) => {
                  const offsetX = e.nativeEvent.contentOffset.x || 0;
                  const idx = Math.round(offsetX / Dimensions.get('window').width);
                  setHeroActiveIndex(idx);
                }}
                scrollEventThrottle={16}
              >
                {(trail as any).images.map((img: any, idx: number) => (
                  <Image
                    key={img?.id || img?.url || idx}
                    source={{ uri: img?.url || '' }}
                    style={[styles.heroImage, { width: Dimensions.get('window').width }]}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ))}
                <View style={[styles.heroImage, { width: Dimensions.get('window').width }]}> 
                  <TrailMapPreview
                    coordinates={coords}
                    path={trail.path}
                    startLatitude={trail.startLatitude}
                    startLongitude={trail.startLongitude}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            ) : trail.photo ? (
              <Image
                source={{ uri: trail.photo }}
                style={styles.heroImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <TrailMapPreview
                coordinates={coords}
                path={trail.path}
                startLatitude={trail.startLatitude}
                startLongitude={trail.startLongitude}
                style={styles.heroImage}
              />
            )}

            {heroSlidesCount > 1 && (
              <View style={styles.paginationDots} pointerEvents="box-none">
                {new Array(heroSlidesCount).fill(0).map((_, i) => {
                  const active = heroActiveIndex === i;
                  return <View key={`hero-dot-${i}`} style={[styles.dot, active && styles.dotActive]} />;
                })}
              </View>
            )}

            {canEdit && (
              <TouchableOpacity
                style={styles.changePhotoFab}
                onPress={handlePickImage}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator color={theme.textPrimary} size="small" />
                ) : (
                  <Camera size={20} color={theme.textPrimary} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <View style={styles.titleSection}>
              <View style={styles.dateRow}>
                <IconOrEmoji IconComponent={Calendar} emoji="📅" size={16} color={theme.textMuted} />
                <Text style={styles.dateText}>{new Date(trail.createdAt ?? trail.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
              {canEdit && isEditingName ? (
                <View style={styles.nameEditContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Enter trail name"
                    autoFocus
                    placeholderTextColor="#9ca3af"
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.saveIconButton]}
                      onPress={handleSaveName}
                    >
                      <Check size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.cancelIconButton]}
                      onPress={handleCancelEdit}
                    >
                      <X size={18} color={theme.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{trail.name || `Trail ${new Date(trail.createdAt ?? trail.date).toLocaleDateString()}`}</Text>
                </View>
              )}

              <View style={styles.authorRow}>
                {user?.name ? (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</Text>
                  </View>
                ) : (
                  <View style={styles.avatar} />
                )}
                <Text style={styles.authorName}>{user?.name || 'John Snow'}</Text>
              </View>
            </View>

            <View style={styles.statsSection}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ESTIMATED TIME</Text>
                <Text style={styles.statValue}>{formatDuration(trail.duration)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={styles.statValue}>{formatDistance(trail.distance)}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ELEVATION</Text>
                <Text style={styles.statValue}>{trail.elevation ? `${Math.round(trail.elevation)}m` : '0m'}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>MATCH</Text>
                <Text style={styles.statValue}>80%</Text>
              </View>
            </View>

            {(trail.description || trail.review) && !isEditingDetails && (
              <View style={styles.reviewCard}>
                <Text style={styles.reviewText}>{trail.description || trail.review}</Text>
              </View>
            )}

            {trail.city && (
              <View style={styles.locationRow}>
                <MapPin size={16} color={theme.textMuted} />
                <Text style={styles.location}>{trail.city}, {trail.country || 'Unknown'}</Text>
              </View>
            )}

            {canEdit && !isEditingDetails && (
              <TouchableOpacity
                style={styles.editDetailsButton}
                onPress={() => {
                  if (true) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setIsEditingDetails(true);
                }}
              >
                <Edit3 size={18} color={theme.backgroundPrimary} />
                <Text style={styles.editDetailsText}>Edit Trail Details</Text>
              </TouchableOpacity>
            )}

            {canEdit && isEditingDetails && (
              <View style={styles.editSection}>
                <Text style={styles.editSectionTitle}>Trail Name</Text>
                <TextInput
                  style={styles.nameInputInDetails}
                  value={editedNameInDetails}
                  onChangeText={setEditedNameInDetails}
                  placeholder="Enter trail name"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={[styles.editSectionTitle, { marginTop: 24 }]}>Rating</Text>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => {
                        if (true) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setEditedRating(star);
                      }}
                      style={styles.starButton}
                    >
                      <Star
                        size={32}
                        color={star <= editedRating ? '#f59e0b' : '#d1d5db'}
                        fill={star <= editedRating ? '#f59e0b' : 'none'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.editSectionTitle, { marginTop: 24 }]}>Review</Text>
                <TextInput
                  style={styles.reviewInput}
                  value={editedReview}
                  onChangeText={setEditedReview}
                  placeholder="Share your experience on this trail..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={[styles.editSectionTitle, { marginTop: 24 }]}>Difficulty</Text>
                <View style={styles.difficultyOptions}>
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty}
                      style={[
                        styles.difficultyChip,
                        editedDifficulty === difficulty && styles.difficultyChipSelected,
                      ]}
                      onPress={() => {
                        if (true) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setEditedDifficulty(difficulty);
                      }}
                    >
                      <Text
                        style={[
                          styles.difficultyChipText,
                          editedDifficulty === difficulty && styles.difficultyChipTextSelected,
                        ]}
                      >
                        {difficulty}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.editSectionTitle, { marginTop: 24 }]}>Environment Tags</Text>
                <View style={styles.tagsGrid}>
                  {ENVIRONMENT_TAG_OPTIONS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.editTagChip,
                        editedTags.includes(tag) && styles.editTagChipSelected,
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text
                        style={[
                          styles.editTagChipText,
                          editedTags.includes(tag) && styles.editTagChipTextSelected,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.editActionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelActionButton]}
                    onPress={handleCancelDetailsEdit}
                  >
                    <X size={20} color={theme.textPrimary} />
                    <Text style={styles.cancelActionText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveActionButton]}
                    onPress={handleSaveDetails}
                  >
                    <Check size={20} color="#fff" />
                    <Text style={styles.saveActionText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.mapSection}>
              <View style={styles.mapContainer}>
                <TrailMapPreview
                  coordinates={coords}
                  path={trail.path}
                  startLatitude={trail.startLatitude}
                  startLongitude={trail.startLongitude}
                  style={styles.map}
                />
              </View>
              <TouchableOpacity
                style={[styles.directionsButton, isGettingDirections && { opacity: 0.7 }]}
                onPress={handleGetDirections}
                disabled={isGettingDirections}
              >
                {isGettingDirections ? (
                  <ActivityIndicator size="small" color={theme.accentPrimary} />
                ) : (
                  <Navigation size={18} color={theme.accentPrimary} />
                )}
                <Text style={styles.directionsButtonText}>{isGettingDirections ? 'Opening...' : 'Get Directions'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startButton} onPress={() => {
                if (true) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                console.log('Starting trail:', trail.id);
                router.push(`/(tabs)/record?trailId=${trail.id}`);
              }}>
                <Text style={styles.startButtonText}>Start Trail</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.reviewsSection} onPress={() => {}}>
              <Text style={styles.reviewsTitle}>REVIEWS (12)</Text>
              <View style={styles.reviewsRow}>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={24} color={s <= (trail.rating || 0) ? theme.accentPrimary : theme.backgroundSecondaryVarient} fill={s <= (trail.rating || 0) ? theme.accentPrimary : 'none'} />
                  ))}
                </View>
                <IconOrEmoji IconComponent={ChevronRight} emoji=">" size={24} color={theme.textMuted} />
              </View>
            </TouchableOpacity>

            {trail.environment_tags && trail.environment_tags.length > 0 && !isEditingDetails && (
              <View style={styles.tagsSection}>
                <Text style={styles.reviewsTitle}>TERRAIN TAGS</Text>
                <View style={styles.tagsGrid}>
                  {trail.environment_tags.map((tag: string, index: number) => (
                    <View key={index} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
