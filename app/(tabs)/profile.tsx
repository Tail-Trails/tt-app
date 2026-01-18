import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  Animated,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import { useDogs } from '@/context/DogsContext';
import { useTrails } from '@/context/TrailsContext';

import { Mail, LogOut, Dog, Camera, X, MapPin, Star, BarChart3, Bookmark } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './profile.styles';
import { useRouter } from 'expo-router';
import { formatDistance } from '@/utils/distance';
import { LinearGradient } from 'expo-linear-gradient';
import TrailMapPreview from '@/components/TrailMapPreview';
// Use bundler require for local asset so Metro/Expo can resolve it reliably
const Icon = require('../../assets/images/icon.png');

type ProfileTab = 'created' | 'saved' | 'reviews';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { userProfile, updateAccount, isLoading: isAccountLoading } = useAccount();
  const { dogProfile, isDogProfileLoading } = useDogs();
  const { trails, savedTrails, isLoading: isTrailsLoading, saveTrailBookmark, removeTrailBookmark, isTrailSaved } = useTrails();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [showEditModal, setShowEditModal] = React.useState<boolean>(false);
  const [editedName, setEditedName] = React.useState<string>('');
  const [editedPhoto, setEditedPhoto] = React.useState<string | number>('');
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [selectedTab, setSelectedTab] = React.useState<ProfileTab>('created');
  const [bookmarkAnimations, setBookmarkAnimations] = React.useState<Record<string, Animated.Value>>({});
  const insets = useSafeAreaInsets();
  const router = useRouter();

  React.useEffect(() => {
    const defaultName = userProfile?.name || user?.email?.split('@')[0] || '';
    // Use profile photo if available, otherwise use bundled app icon as default
    const defaultPhoto = userProfile?.photo || Icon;
    setEditedName(defaultName);
    setEditedPhoto(defaultPhoto);
  }, [user, userProfile]);

  const totalWalks = trails.length;
  const totalTime = trails.reduce((acc, trail) => acc + (trail.duration || 0), 0);
  const totalDistance = trails.reduce((acc, trail) => acc + trail.distance, 0);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}.${Math.floor(minutes / 6)}h`;
    }
    return `${minutes}m`;
  };

  const handleTabPress = (tab: ProfileTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTab(tab);
  };

  const handleNavigateToTrail = (trailId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/trail/${trailId}`);
  };

  const getBookmarkAnimation = (trailId: string) => {
    if (!bookmarkAnimations[trailId]) {
      const newAnim = new Animated.Value(1);
      setBookmarkAnimations(prev => ({ ...prev, [trailId]: newAnim }));
      return newAnim;
    }
    return bookmarkAnimations[trailId];
  };

  const handleBookmarkPress = async (trailId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const anim = getBookmarkAnimation(trailId);
    const isSaved = isTrailSaved(trailId);

    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (isSaved) {
        await removeTrailBookmark(trailId);
      } else {
        await saveTrailBookmark(trailId);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setIsLoading(true);
            try {
              await signOut();
            } catch (error: any) {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
              Alert.alert('Error', error.message || 'Failed to sign out');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditDogProfile = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/onboarding/dog-basics');
  };

  const handleOpenEditModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowEditModal(false);
    const defaultName = userProfile?.name || user?.email?.split('@')[0] || '';
    const defaultPhoto = userProfile?.photo || Icon;
    setEditedName(defaultName);
    setEditedPhoto(defaultPhoto);
  };

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditedPhoto(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await updateAccount({
        name: editedName.trim(),
        // Only send photo if it's a string (uploaded/remote URL). Bundled assets are numbers and shouldn't be sent.
        photo: typeof editedPhoto === 'string' && editedPhoto ? editedPhoto : undefined,
      });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', error?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayedTrails = () => {
    if (selectedTab === 'created') return trails;
    if (selectedTab === 'saved') return savedTrails;
    return [];
  };

  const displayedTrails = getDisplayedTrails();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.userSection}>
        <View style={styles.userHeader}>
          <TouchableOpacity style={styles.userAvatar} onPress={handleOpenEditModal}>
            {editedPhoto ? (
              <Image
                source={editedPhoto}
                style={styles.userAvatarImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.initialAvatar}>
                <Text style={styles.initialAvatarText}>{(editedName || userProfile?.name || user?.email || 'A').charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile?.name || editedName || 'Account Holder'}</Text>
            <View style={styles.userEmailRow}>
              <Mail size={14} color={colors.primary} />
              <Text style={styles.userEmail}>{user?.email || 'Not available'}</Text>
            </View>
          </View>
        </View>
      </View>

      {isDogProfileLoading ? (
        <View style={styles.dogCardContainer}>
          <View style={styles.loadingDogCard}>
            <ActivityIndicator size="large" color={colors.paleYellow} />
          </View>
        </View>
      ) : dogProfile ? (
        <View style={styles.dogCardContainer}>
          <TouchableOpacity style={styles.dogCard} onPress={handleEditDogProfile}>
            <View style={styles.dogPhotoContainer}>
              {dogProfile.photo ? (
                <Image
                  source={dogProfile.photo}
                  style={styles.dogPhoto}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.dogPhoto, styles.dogPhotoPlaceholder]}>
                  <Dog size={40} color="#9ca3af" />
                </View>
              )}
            </View>
            
            <Text style={styles.dogName}>{dogProfile.name}</Text>
            {dogProfile.nickname && (
              <Text style={styles.dogNickname}>
                {dogProfile.nickname}
              </Text>
            )}
            {!dogProfile.nickname && <View style={styles.nicknameSpacing} />}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalWalks}</Text>
                <Text style={styles.statLabel}>Walks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatTime(totalTime)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDistance(totalDistance)}</Text>
                <Text style={styles.statLabel}>Total Dist.</Text>
              </View>
            </View>

            <View style={styles.dogInfoRow}>
              <View style={styles.dogInfoBadge}>
                <Text style={styles.dogInfoText}>{dogProfile.age} years</Text>
              </View>
              <View style={styles.dogInfoBadge}>
                <Text style={styles.dogInfoText}>Size {dogProfile.size}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.dogCardContainer}>
          <View style={styles.noDogCard}>
            <Dog size={48} color="#9ca3af" />
            <Text style={styles.noDogText}>No dog profile yet</Text>
            <TouchableOpacity
              style={styles.addDogButton}
              onPress={handleEditDogProfile}
            >
              <Text style={styles.addDogButtonText}>Add Dog Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'created' && styles.tabActive]}
          onPress={() => handleTabPress('created')}
        >
          <Text style={[styles.tabCount, selectedTab === 'created' && styles.tabCountActive]}>{trails.length}</Text>
          <Text style={[styles.tabText, selectedTab === 'created' && styles.tabTextActive]}>Created</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'saved' && styles.tabActive]}
          onPress={() => handleTabPress('saved')}
        >
          <Text style={[styles.tabCount, selectedTab === 'saved' && styles.tabCountActive]}>{savedTrails.length}</Text>
          <Text style={[styles.tabText, selectedTab === 'saved' && styles.tabTextActive]}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'reviews' && styles.tabActive]}
          onPress={() => handleTabPress('reviews')}
        >
          <Text style={[styles.tabCount, selectedTab === 'reviews' && styles.tabCountActive]}>0</Text>
          <Text style={[styles.tabText, selectedTab === 'reviews' && styles.tabTextActive]}>Reviews</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trailsSection}>
        {isTrailsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : displayedTrails.length > 0 ? (
          displayedTrails.map((trail) => {
            const anim = getBookmarkAnimation(trail.id);
            const isSaved = isTrailSaved(trail.id);
            return (
            <TouchableOpacity
              key={trail.id}
              style={styles.trailCard}
              onPress={() => handleNavigateToTrail(trail.id)}
            >
              {trail.photo ? (
                <Image source={{ uri: trail.photo }} style={styles.trailImage} />
              ) : (
                <TrailMapPreview
                  coordinates={trail.coordinates}
                  path={(trail as any).path}
                  style={styles.trailImage}
                  startLatitude={(trail as any).startLatitude}
                  startLongitude={(trail as any).startLongitude}
                />
              )}
              
              <LinearGradient
                colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.25)', 'rgba(0, 0, 0, 0.6)']}
                locations={[0, 0.3, 0.6, 1]}
                style={styles.trailGradient}
              />
              
              <TouchableOpacity 
                style={styles.bookmarkButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleBookmarkPress(trail.id);
                }}
              >
                <Animated.View style={{ transform: [{ scale: anim }] }}>
                  <Bookmark 
                    size={20} 
                    color={isSaved ? "#000" : "#64748b"} 
                    fill={isSaved ? "#000" : "none"}
                    strokeWidth={2} 
                  />
                </Animated.View>
              </TouchableOpacity>
              
              <View style={styles.trailContent}>
                <Text style={styles.trailName}>
                  {trail.name || `Trail ${new Date(trail.date).toLocaleDateString()}`}
                </Text>
                <Text style={styles.trailLocation}>
                  {trail.city ? `${trail.city}, ${trail.country || 'Unknown'}` : 'Location unknown'}
                </Text>
                <View style={styles.trailBadges}>
                  {trail.difficulty && (
                    <View style={styles.trailBadge}>
                      <BarChart3 size={14} color="#d4d4a0" strokeWidth={2.5} />
                      <Text style={styles.trailBadgeText}>{trail.difficulty}</Text>
                    </View>
                  )}
                  <View style={styles.trailBadge}>
                    <MapPin size={14} color="#d4d4a0" strokeWidth={2.5} />
                    <Text style={styles.trailBadgeText}>{formatDistance(trail.distance)}</Text>
                  </View>
                  {trail.rating && (
                    <View style={styles.trailBadge}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" strokeWidth={2} />
                      <Text style={styles.trailBadgeText}>{trail.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <MapPin size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {selectedTab === 'created' 
                ? 'No trails created yet'
                : selectedTab === 'saved'
                ? 'No trails saved yet'
                : 'No reviews yet'}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.signOutButton, isLoading && styles.signOutButtonDisabled]}
        onPress={handleSignOut}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <LogOut size={20} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseEditModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseEditModal}
            >
              <X size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={handlePickImage}
              >
                {editedPhoto ? (
                  <Image
                    source={editedPhoto}
                    style={styles.editPhoto}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.editPhoto, styles.initialAvatar] }>
                    <Text style={styles.initialAvatarText}>{(editedName || userProfile?.name || user?.email || 'A').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <Camera size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>Tap to change photo</Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{user?.email}</Text>
              </View>
              <Text style={styles.inputHint}>Email cannot be changed</Text>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </View>
  );
}

// styles are imported from profile.styles.ts
