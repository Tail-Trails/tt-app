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
} from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';

import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import TrailMap from '@/components/TrailMap';
import { Clock, MapPin, Calendar, Edit3, Check, X, Navigation, TrendingUp, Tag, Camera, Activity, Star, ArrowLeft, Share2, Bookmark, MoreVertical } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrails } from '@/context/TrailsContext';
import { useAuth } from '@/context/AuthContext';
import { Trail } from '@/types/trail';

import { formatDistance, formatDuration } from '@/utils/distance';
import colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  // Helper to render native icons on mobile and an emoji fallback on web where some icon libs
  // can produce text nodes that raise "Text strings must be rendered within a <Text> component".
  const IconOrEmoji = ({ IconComponent, emoji, size = 18, color }: { IconComponent: any; emoji?: string; size?: number; color?: string }) => {
    if (Platform.OS === 'web') {
      // Use ThemedText so the emoji/text is correctly wrapped in a <Text> component on web
      return <Text style={{ fontSize: size, color: color || undefined }}>{emoji || '•'}</Text>;
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
      const foundTrail = getTrailById(id);
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

  const handleGetDirections = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!trail || (trail.coordinates?.length ?? 0) === 0) {
      Alert.alert('Error', 'Location not available for this trail');
      return;
    }

    const latitude = trail.coordinates[0].latitude;
    const longitude = trail.coordinates[0].longitude;
    const label = trail.name || 'Trail Location';

    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
      default: 'https://www.google.com/maps',
    });

    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latitude},${longitude}`,
      android: `${scheme}${latitude},${longitude}?q=${label}`,
      default: `${scheme}/search/?api=1&query=${latitude},${longitude}`,
    });

    Linking.canOpenURL(url as string).then((supported) => {
      if (supported) {
        Linking.openURL(url as string);
      } else {
        Alert.alert('Error', 'Unable to open maps application');
      }
    });
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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const pickImageWeb = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (Platform.OS === 'web') {
      pickImageWeb();
    } else {
      pickImageMobile();
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleShare = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSaved(!isSaved);
  };

  const handleMore = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Options', 'Mark as completed option coming soon!');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
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
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Share2 size={22} color="#1f2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
            <Bookmark size={22} color="#1f2937" fill={isSaved ? '#1f2937' : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleMore}>
            <MoreVertical size={22} color="#1f2937" />
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
          {trail.photo ? (
            <View style={styles.heroImageContainer}>
              <Image
                source={{ uri: trail.photo }}
                style={styles.heroImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
                style={styles.heroGradient}
              />
              {canEdit && (
                <TouchableOpacity
                  style={styles.changePhotoFab}
                  onPress={handlePickImage}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Camera size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : canEdit && (
            <TouchableOpacity
              style={styles.addPhotoContainer}
              onPress={handlePickImage}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <>
                  <View style={styles.addPhotoIcon}>
                    <Camera size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.addPhotoText}>Add a photo</Text>
                  <Text style={styles.addPhotoSubtext}>Make your trail memorable</Text>
                </>
              )}
            </TouchableOpacity>
          )}


        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.content}>
          <View style={styles.titleSection}>
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
                    <X size={18} color={colors.darkGreen} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.titleRow}>
                <Text style={styles.title}>{trail.name || `Trail ${new Date(trail.date).toLocaleDateString()}`}</Text>
              </View>
            )}
            
            {trail.city && (
              <View style={styles.locationRow}>
                <MapPin size={16} color={colors.lightGreen} />
                <Text style={styles.location}>{trail.city}, {trail.country || 'Unknown'}</Text>
              </View>
            )}

            {trail.rating && !isEditingDetails && (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    color={star <= trail.rating! ? '#f59e0b' : '#d1d5db'}
                    fill={star <= trail.rating! ? '#f59e0b' : 'none'}
                  />
                ))}
              </View>
            )}
          </View>

          {trail.review && !isEditingDetails && (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewText}>{trail.review}</Text>
            </View>
          )}

          <View style={styles.statsSection}>
            <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                <MapPin size={20} color="#ffffff" strokeWidth={2.5} />
              </View>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{formatDistance(trail.distance)}</Text>
            </View>

            <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                <Clock size={20} color="#ffffff" strokeWidth={2.5} />
              </View>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{formatDuration(trail.duration)}</Text>
            </View>

            {trail.difficulty && (
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <IconOrEmoji IconComponent={TrendingUp} emoji="⛰️" size={20} color="#ffffff" />
                </View>
                <Text style={styles.statLabel}>Difficulty</Text>
                <Text style={styles.statValue}>{trail.difficulty}</Text>
              </View>
            )}
          </View>

          {trail.environment_tags && trail.environment_tags.length > 0 && !isEditingDetails && (
            <View style={styles.tagsSection}>
              <View style={styles.sectionHeader}>
                <IconOrEmoji IconComponent={Tag} emoji="🏷️" size={18} color={colors.darkGreen} />
                <Text style={styles.sectionTitle}>Environment</Text>
              </View>
              <View style={styles.tagsGrid}>
                {trail.environment_tags.map((tag: string, index: number) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {canEdit && !isEditingDetails && (
            <TouchableOpacity
              style={styles.editDetailsButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setIsEditingDetails(true);
              }}
            >
              <Edit3 size={18} color={colors.primary} />
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
                      if (Platform.OS !== 'web') {
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
                      if (Platform.OS !== 'web') {
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
                  <X size={20} color={colors.darkGreen} />
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
            <View style={styles.sectionHeader}>
              <IconOrEmoji IconComponent={Navigation} emoji="🧭" size={18} color={colors.darkGreen} />
              <Text style={styles.sectionTitle}>Route Map</Text>
            </View>
            <View style={styles.mapContainer}>
              <TrailMap
                coordinates={coords}
                style={styles.map}
                initialRegion={region || undefined}
                scrollEnabled={false}
                zoomEnabled={false}
              />
            </View>
            <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
              <Navigation size={18} color="#fff" />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text style={styles.detailsTitle}>Additional Details</Text>
            
            {trail.maxElevation !== undefined && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                    <IconOrEmoji IconComponent={TrendingUp} emoji="⛰️" size={18} color={colors.primary} />
                  </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Elevation Gain</Text>
                  <Text style={styles.detailValue}>{trail.maxElevation}m</Text>
                </View>
              </View>
            )}

            {trail.pace && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconOrEmoji IconComponent={Activity} emoji="🏃" size={18} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Pace</Text>
                  <Text style={styles.detailValue}>{trail.pace} /km</Text>
                </View>
              </View>
            )}

            {trail.speed && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconOrEmoji IconComponent={Activity} emoji="⚡" size={18} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Max Speed</Text>
                  <Text style={styles.detailValue}>{trail.speed.toFixed(1)} km/h</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <IconOrEmoji IconComponent={Calendar} emoji="📅" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {new Date(trail.date).toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.lightGreen,
    fontWeight: '500' as const,
  },
  heroSection: {
    position: 'relative',
  },
  heroImageContainer: {
    width: '100%',
    height: 500,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  changePhotoFab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  addPhotoContainer: {
    width: '100%',
    height: 280,
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  addPhotoIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.darkGreen,
    marginBottom: 4,
  },
  addPhotoSubtext: {
    fontSize: 14,
    color: colors.mediumGreen,
  },
  contentWrapper: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    zIndex: 10,
  },
  content: {
    padding: 24,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.darkGreen,
    lineHeight: 40,
  },
  editIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  nameEditContainer: {
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.darkGreen,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  nameInputInDetails: {
    fontSize: 16,
    color: colors.darkGreen,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.lightGreen,
    borderRadius: 12,
    padding: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveIconButton: {
    backgroundColor: colors.primary,
  },
  cancelIconButton: {
    backgroundColor: colors.lightGreen,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  location: {
    fontSize: 16,
    color: colors.mediumGreen,
    fontWeight: '500' as const,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.paleYellow,
  },
  reviewText: {
    fontSize: 16,
    color: colors.darkGreen,
    lineHeight: 24,
  },
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    color: colors.mediumGreen,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    color: colors.darkGreen,
    fontWeight: '700' as const,
  },
  tagsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.darkGreen,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  tagChip: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.darkGreen,
  },
  editDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  editDetailsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  editSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  editSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.darkGreen,
    marginBottom: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  reviewInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.lightGreen,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.darkGreen,
    minHeight: 120,
  },
  difficultyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.lightGreen,
    alignItems: 'center',
  },
  difficultyChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyChipText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.mediumGreen,
  },
  difficultyChipTextSelected: {
    color: '#fff',
  },
  editTagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.lightGreen,
  },
  editTagChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  editTagChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.mediumGreen,
  },
  editTagChipTextSelected: {
    color: '#fff',
  },
  editActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelActionButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.lightGreen,
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.darkGreen,
  },
  saveActionButton: {
    backgroundColor: colors.primary,
  },
  saveActionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  mapSection: {
    marginBottom: 20,
  },
  mapContainer: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lightGreen,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webMapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
  },
  webMapText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.mediumGreen,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.darkGreen,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.mediumGreen,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.darkGreen,
    fontWeight: '500' as const,
  },
});
