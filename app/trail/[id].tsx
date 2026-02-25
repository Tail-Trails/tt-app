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
import { Text } from '@/components';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
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
    if (true) {
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

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + 70, paddingBottom: Math.max(16, insets.bottom), paddingHorizontal: 16 + (insets.left || 0) },
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
          <ArrowLeft size={24} />
        </TouchableOpacity>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Share2 size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
            <Bookmark size={22} fill={isSaved ? theme.textPrimary : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleMore}>
            <MoreVertical size={22} />
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
                    <ActivityIndicator color={theme.textPrimary} size="small" />
                  ) : (
                    <Camera size={20} color={theme.textPrimary} />
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
                <ActivityIndicator size="large" color={theme.backgroundPrimary} />
              ) : (
                <>
                  <View style={styles.addPhotoIcon}>
                    <Camera size={32} color={theme.backgroundPrimary} />
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
              <View style={styles.dateRow}>
                <IconOrEmoji IconComponent={Calendar} emoji="📅" size={16} color={theme.accentPrimary} />
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

              {trail.city && (
                <View style={styles.locationRow}>
                  <MapPin size={16} color={theme.textPrimary} />
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
                  <MapPin size={20} color={theme.textPrimary} strokeWidth={2.5} />
                </View>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{formatDistance(trail.distance)}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Clock size={20} color={theme.textPrimary} strokeWidth={2.5} />
                </View>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{formatDuration(trail.duration)}</Text>
              </View>

              {trail.difficulty && (
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <IconOrEmoji IconComponent={TrendingUp} emoji="⛰️" size={20} color={theme.textPrimary} />
                  </View>
                  <Text style={styles.statLabel}>Difficulty</Text>
                  <Text style={styles.statValue}>{trail.difficulty}</Text>
                </View>
              )}
            </View>

            {trail.environment_tags && trail.environment_tags.length > 0 && !isEditingDetails && (
              <View style={styles.tagsSection}>
                <View style={styles.sectionHeader}>
                  <IconOrEmoji IconComponent={Tag} emoji="🏷️" size={18} color={theme.textPrimary} />
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
              <View style={styles.sectionHeader}>
                <IconOrEmoji IconComponent={Navigation} emoji="🧭" size={18} color={theme.textPrimary} />
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
                <IconOrEmoji IconComponent={Navigation} emoji="🧭" size={18} color="#fff" />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
              <View style={{ height: 16 }} />

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <TouchableOpacity style={styles.startButton} onPress={() => {
                  if (true) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push(`/(tabs)/record?trailId=${trail.id}`);
                }}>
                  <Text style={styles.startButtonText}>Start Trail</Text>
                </TouchableOpacity>

                <View style={styles.reviewsCard}>
                  <Text style={styles.reviewsTitle}>Reviews</Text>
                  <View style={styles.reviewStars}>
                    {[1,2,3,4,5].map((s)=> (
                      <Star key={s} size={20} color={s <= (trail.rating || 0) ? '#f59e0b' : '#374151'} />
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Replaced modal with navigation to record screen. */}
            </View>

            <View>
              <Text style={styles.detailsTitle}>Additional Details</Text>

              {trail.maxElevation !== undefined && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <IconOrEmoji IconComponent={TrendingUp} emoji="⛰️" size={18} color={theme.backgroundPrimary} />
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
                    <IconOrEmoji IconComponent={Activity} emoji="🏃" size={18} color={theme.backgroundPrimary} />
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
                    <IconOrEmoji IconComponent={Activity} emoji="⚡" size={18} color={theme.backgroundPrimary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Max Speed</Text>
                    <Text style={styles.detailValue}>{trail.speed.toFixed(1)} km/h</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconOrEmoji IconComponent={Calendar} emoji="📅" size={18} color={theme.backgroundPrimary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {new Date(trail.createdAt ?? trail.date).toLocaleString('en-US', {
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
