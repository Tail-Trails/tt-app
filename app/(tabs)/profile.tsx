import React from 'react';
import { SvgXml } from 'react-native-svg';
import {
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Text } from '@/components';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import { useDogs } from '@/context/DogsContext';
import { useTrails } from '@/context/TrailsContext';

import { Mail, LogOut, Dog, MapPin, Star, BarChart3, Bookmark, LucideTableOfContents, ArrowRight } from 'lucide-react-native';
import theme from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './profile.styles';
import { useRouter } from 'expo-router';
import { formatDistance } from '@/utils/distance';
import { LinearGradient } from 'expo-linear-gradient';
import TrailMapPreview from '@/components/TrailMapPreview';
import TrailCard from '@/components/TrailCard';
// Use bundler require for local asset so Metro/Expo can resolve it reliably
const Icon = require('../../assets/images/icon.png');

type ProfileTab = 'created' | 'saved' | 'reviews';

export default function ProfileScreen() {
  const auth = useAuth();
  if (!auth) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.backgroundPrimary} />
        </View>
      </View>
    );
  }
  const { user, signOut, session } = auth;
  const { userProfile, isLoading: isAccountLoading, collectibleSvgs } = useAccount();
  const { dogProfile, isDogProfileLoading } = useDogs();
  const { trails, savedTrails, isLoading: isTrailsLoading, saveTrailBookmark, removeTrailBookmark, isTrailSaved } = useTrails();
  const [isCardSwiping, setIsCardSwiping] = React.useState<Record<string, boolean>>({});
  const mainScrollRef = React.useRef<ScrollView | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedTab, setSelectedTab] = React.useState<ProfileTab>('created');
  const [bookmarkAnimations, setBookmarkAnimations] = React.useState<Record<string, Animated.Value>>({});
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const totalWalks = trails.length;
  const totalTime = trails.reduce((acc, trail) => acc + (Number.isFinite((trail as any).duration) ? (trail as any).duration : 0), 0);
  const totalDistance = trails.reduce((acc, trail) => acc + (Number.isFinite((trail as any).distance) ? (trail as any).distance : 0), 0);

  const getDayStreak = () => {
    try {
      const dayMs = 24 * 60 * 60 * 1000;
      const daysSet = new Set<number>();
      trails.forEach(t => {
        if (!t.date) return;
        const d = new Date(t.date);
        d.setHours(0, 0, 0, 0);
        daysSet.add(d.getTime());
      });

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let cursor = today.getTime();

      while (daysSet.has(cursor)) {
        streak++;
        cursor -= dayMs;
      }

      return streak;
    } catch (e) {
      return 0;
    }
  };

  const dayStreak = getDayStreak();

  const [dogSvg, setDogSvg] = React.useState<string | null>(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch(`${API_URL}/uploads/proxy/stats/dog.svg`);
        if (!resp.ok) return;
        const txt = await resp.text();
        if (mounted) setDogSvg(txt);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Collectibles — provided by AccountContext

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}.${Math.floor(minutes / 6)}h`;
    }
    return `${minutes}m`;
  };

  const handleTabPress = (tab: ProfileTab) => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTab(tab);
  };

  const handleNavigateToTrail = (trailId: string) => {
    if (true) {
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
    if (true) {
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
        if (true) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleSignOut = async () => {
    if (true) {
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
            if (true) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setIsLoading(true);
            try {
              await signOut();
            } catch (error: any) {
              if (true) {
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
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: '/onboarding/dog-profile', params: { from: 'profile' } } as any);
  };

  const getDisplayedTrails = () => {
    if (selectedTab === 'created') return trails;
    if (selectedTab === 'saved') return savedTrails;
    return [];
  };

  const displayedTrails = getDisplayedTrails();

  React.useEffect(() => {
    if (displayedTrails && displayedTrails.length > 0) {
      try {
        // console.log('ProfileScreen.displayedTrails sample:', displayedTrails[0]);
      } catch (err) {
        // ignore
      }
    }
  }, [displayedTrails]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={mainScrollRef}
        scrollEnabled={!Object.values(isCardSwiping).some(Boolean)}
        style={styles.scrollContainer}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.userSection}>
          <View style={styles.userHeader}>
            <TouchableOpacity style={styles.userAvatar} onPress={() => router.push('/settings/account')}>
              {(userProfile?.image || Icon) ? (
                <Image
                  source={userProfile?.image || Icon}
                  style={styles.userAvatarImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.initialAvatar}>
                  <Text style={styles.initialAvatarText}>{(userProfile?.name || user?.email || 'A').charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userProfile?.name || user?.email?.split('@')[0] || 'Account Holder'}</Text>
              <View style={styles.userEmailRow}>
                <Mail size={14} color={theme.textSecondary} />
                <Text style={styles.userEmail}>{user?.email || 'Not available'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
              accessibilityLabel="Open settings"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <LucideTableOfContents size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {isDogProfileLoading ? (
          <View style={styles.dogCardContainer}>
            <View style={styles.loadingDogCard}>
              <ActivityIndicator size="large" color={theme.accentPrimary} />
            </View>
          </View>
        ) : dogProfile ? (
          <View style={styles.dogCardContainer}>
            <TouchableOpacity style={styles.dogCardRow} onPress={handleEditDogProfile} activeOpacity={0.9}>
              <View style={styles.dogCardLeft}>
                <View style={styles.dogPhotoContainerLeft}>
                  {dogProfile.image ? (
                    <Image
                      source={dogProfile.image}
                      style={styles.dogPhotoLarge}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={[styles.dogPhotoLarge, styles.dogPhotoPlaceholder]}>
                      <Dog size={48} color={theme.accentPrimary} />
                    </View>
                  )}
                </View>

                <Text style={styles.dogName}>{dogProfile.name}</Text>
                {dogProfile.nickname ? (
                  <Text style={styles.dogNickname}>{dogProfile.nickname}</Text>
                ) : (
                  <View style={styles.nicknameSpacing} />
                )}
              </View>

              <View style={styles.dogCardRight}>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValueLarge}>{dayStreak}</Text>
                    <Text style={styles.statLabelSmall}>Streak</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValueLarge}>{totalWalks}</Text>
                    <Text style={styles.statLabelSmall}>Walks</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValueLarge}>{formatTime(totalTime)}</Text>
                    <Text style={styles.statLabelSmall}>Total Time</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValueLarge}>{formatDistance(totalDistance)}</Text>
                    <Text style={styles.statLabelSmall}>Total Dist.</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.dogCardContainer}>
            <View style={styles.noDogCard}>
              <Dog size={48} color={theme.textMuted} />
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

          {/* Collectibles card */}
          <View style={styles.statsCardContainer}>
            <TouchableOpacity style={styles.collectiblesContainer} onPress={() => router.push('/collectible')}>
              <View style={styles.statsCardHeader}>
                <Text style={styles.statsTitle}>Collectibles</Text>
              </View>

              <View style={styles.statsCardContent}>
                <View style={styles.statsSvgContainer}>
                  <View style={styles.statsSvgRow}>
                    {collectibleSvgs.map((xml, i) => (
                      <View
                        key={i}
                        style={styles.collectibleItem}
                      >
                        {xml ? (
                          <SvgXml xml={xml} width={64} height={64} />
                        ) : (
                          <View style={styles.collectiblePlaceholder} />
                        )}
                        <View style={[styles.collectibleOverlay, i === 0 ? { opacity: 0 } : { opacity: 0.55 }]} />
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'created' && styles.tabActive]}
            onPress={() => handleTabPress('created')}
          >
            <Text style={[styles.tabText, selectedTab === 'created' && styles.tabTextActive]}>Created</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'saved' && styles.tabActive]}
            onPress={() => handleTabPress('saved')}
          >
            <Text style={[styles.tabText, selectedTab === 'saved' && styles.tabTextActive]}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'reviews' && styles.tabActive]}
            onPress={() => handleTabPress('reviews')}
          >
            <Text style={[styles.tabText, selectedTab === 'reviews' && styles.tabTextActive]}>Reviews</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trailsSection}>
          {isTrailsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.backgroundPrimary} />
            </View>
          ) : displayedTrails.length > 0 ? (
            <View style={styles.verticalTrailsContainer}>
              {displayedTrails.map((trail) => {
                const isSaved = isTrailSaved(trail.id);
                return (
                  <TrailCard
                    key={trail.id}
                    trail={trail}
                    onPress={(id) => handleNavigateToTrail(id)}
                    onBookmarkPress={(id) => handleBookmarkPress(id)}
                    isSaved={isSaved}
                    onSwipeStateChange={(id, swiping) => setIsCardSwiping(prev => ({ ...prev, [id]: swiping }))}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MapPin size={48} color={theme.textMuted} />
              <Text style={styles.emptyText}>
                {selectedTab === 'created'
                  ? 'No trails created yet'
                  : selectedTab === 'saved'
                    ? 'Trail saving, coming soon!'
                    : 'No reviews yet'}
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
