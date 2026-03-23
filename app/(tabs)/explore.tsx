import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { View, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Animated, TextInput, Modal, FlatList, Dimensions } from 'react-native';
import { Text } from '@/components';
import LottieLoader from '@/components/LottieLoader';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { getBestAvailableLocation } from '@/utils/location';
import * as Haptics from 'expo-haptics';
import { MapPin, Search, Heart, Umbrella, Bookmark, Star, X, BarChart3, Navigation, Icon, ChevronLeft, SlidersHorizontal, ArrowRight, MoreVertical, Trees, TrafficCone, Mountain } from 'lucide-react-native';
import theme from '@/constants/colors';
import { useTrails } from '@/context/TrailsContext';
import { Trail } from '@/types/trail';
import { formatDistance } from '@/utils/distance';
import TrailMapPreview from '@/components/TrailMapPreview';
import TrailCard from '@/components/TrailCard';
import styles from './explore.styles';


// TODO: For you (match score within 30Km), Nearby, Beaches, Forest, Road, Cliff
const CATEGORIES = [
  { id: 'for-you', name: 'For You', icon: Star },
  { id: 'nearby', name: 'Nearby', icon: MapPin },
  { id: 'beaches', name: 'Beaches', icon: Umbrella },
  { id: 'forest', name: 'Forest', icon: Trees },
  { id: 'road', name: 'Road', icon: TrafficCone },
  { id: 'cliff', name: 'Cliff', icon: Mountain },
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loadNearbyTrails, saveTrailBookmark, removeTrailBookmark, isTrailSaved } = useTrails();
  const [selectedCategory, setSelectedCategory] = useState<string>('for-you');
  const [nearbyTrails, setNearbyTrails] = useState<Trail[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(true);
  const [, setUserCity] = useState<string | undefined>(undefined);
  const [bookmarkAnimations, setBookmarkAnimations] = useState<Record<string, Animated.Value>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<{ id: string; name: string; location: string; type: string }[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const [isCardSwiping, setIsCardSwiping] = useState<Record<string, boolean>>({});
  const [cardWidths, setCardWidths] = useState<Record<string, number>>({});
  const mainScrollRef = React.useRef<ScrollView>(null);

  const loadUserLocationAndNearbyTrails = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await getBestAvailableLocation({ accuracy: Location.Accuracy.Balanced });

        // Skip reverse geocoding to avoid rate limits. We only need lat/lon for nearby search.
        setUserCity(undefined);
        if (location) {
          setCurrentLocation('Current location');
          const trails = await loadNearbyTrails(location.coords.latitude, location.coords.longitude);
          setNearbyTrails(trails);
        } else {
          setCurrentLocation('Location unavailable');
          const trails = await loadNearbyTrails();
          setNearbyTrails(trails);
        }
      } else {
        setCurrentLocation('Location unavailable');
        const trails = await loadNearbyTrails();
        setNearbyTrails(trails);
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setCurrentLocation('Location unavailable');
      const trails = await loadNearbyTrails();
      setNearbyTrails(trails);
    } finally {
      setIsLoadingNearby(false);
    }
  }, [loadNearbyTrails]);

  useEffect(() => {
    loadUserLocationAndNearbyTrails();
  }, [loadUserLocationAndNearbyTrails]);

  useFocusEffect(
    useCallback(() => {
      console.log('Explore tab focused - refreshing nearby trails');
      loadUserLocationAndNearbyTrails();
    }, [loadUserLocationAndNearbyTrails])
  );

  const loadSearchSuggestions = useCallback(() => {
    const query = searchQuery.toLowerCase();

    const suggestions = nearbyTrails
      .filter(trail => {
        const name = trail.name?.toLowerCase() || '';
        const city = trail.city?.toLowerCase() || '';
        const country = trail.country?.toLowerCase() || '';
        return name.includes(query) || city.includes(query) || country.includes(query);
      })
      .map(trail => ({
        id: trail.id,
        name: trail.name || `Trail ${new Date(trail.date).toLocaleDateString()}`,
        location: trail.city ? `${trail.city}, ${trail.country || 'Unknown'}` : 'Location unknown',
        type: 'trail',
      }))
      .slice(0, 6);

    setSearchSuggestions(suggestions);
  }, [searchQuery, nearbyTrails]);

  useEffect(() => {
    if (searchQuery.trim()) {
      loadSearchSuggestions();
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, loadSearchSuggestions]);

  const handleSearchBarPress = () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchSuggestions([]);
  };

  const handleSuggestionPress = (suggestionId: string) => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchSuggestions([]);
    router.push(`/trail/${suggestionId}`);
  };

  const handleCurrentLocationPress = () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchSuggestions([]);
  };

  const getBookmarkAnimation = (trailId: string) => {
    if (!bookmarkAnimations[trailId]) {
      const newAnim = new Animated.Value(1);
      setBookmarkAnimations(prev => ({ ...prev, [trailId]: newAnim }));
      return newAnim;
    }
    return bookmarkAnimations[trailId];
  };

  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleBookmarkPress = async (trailId: string, isRealTrail: boolean = false) => {
    if (!isRealTrail && !isValidUUID(trailId)) {
      console.log('Cannot bookmark mock trail:', trailId);
      if (true) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

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

  const handleNavigateToTrail = (trailId: string) => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/trail/${trailId}`);
  };

  const handleCategoryPress = (categoryId: string) => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId);
  };

  const getFilteredTrails = useCallback((trails: Trail[]) => {
    let filtered = trails;

    if (selectedCategory === 'popular') {
      filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (selectedCategory === 'beaches') {
      filtered = filtered.filter((trail) => {
        const tags = trail.environment_tags || [];
        return tags.some(tag => tag.toLowerCase().includes('beach'));
      });
    }

    return filtered;
  }, [selectedCategory]);

  const filteredTrails = getFilteredTrails(nearbyTrails);

  return (
    <View style={styles.safeContainer}>
      <ScrollView
        ref={mainScrollRef}
        scrollEnabled={!Object.values(isCardSwiping).some(Boolean)}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={[styles.stickyHeader, { paddingTop: insets.top + 16 }]}>
          {/* <View style={styles.stickySearchContainer}>
            <TouchableOpacity
              style={styles.searchBar}
              onPress={handleSearchBarPress}
              activeOpacity={0.7}
            >
              <Search size={22} color={theme.textMuted} />
              <Text style={styles.searchPlaceholder}>Find Trails</Text>
              <View style={styles.filterButton}>
                <SlidersHorizontal size={18} color={theme.accentPrimary} />
              </View>
            </TouchableOpacity>
            
          </View> */}

          <View style={styles.categoriesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;

                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      isSelected && styles.categoryButtonActive,
                    ]}
                    onPress={() => handleCategoryPress(category.id)}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? theme.backgroundSecondary : theme.textMuted}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
        <View style={styles.categoryTrailsSection}>
          {isLoadingNearby ? (
            <View style={styles.loadingContainer}>
              <LottieLoader size={120} />
              <Text style={styles.loadingText}>Loading trails...</Text>
            </View>
          ) : filteredTrails.length > 0 ? (
            filteredTrails.map((trail) => {
              const isSaved = isTrailSaved(trail.id);
              return (
                <TrailCard
                  key={trail.id}
                  trail={trail}
                  onPress={(id) => handleNavigateToTrail(id)}
                  onBookmarkPress={(id) => handleBookmarkPress(id, isValidUUID(id))}
                  isSaved={isSaved}
                  onSwipeStateChange={(id, swiping) => setIsCardSwiping(prev => ({ ...prev, [id]: swiping }))}
                />
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <MapPin size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>
                No trails found yet. Record a trail to share with others!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseSearchModal}
      >
        <View style={[styles.searchModalContainer, { paddingTop: insets.top }]}>
          <View style={styles.searchModalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCloseSearchModal}
            >
              <ChevronLeft size={24} color="#5d6b4a" />
            </TouchableOpacity>
            <View style={styles.searchModalInputContainer}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Find trails"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.searchModalContent}>
            {searchQuery.trim() === '' && (
              <TouchableOpacity
                style={styles.currentLocationItem}
                onPress={handleCurrentLocationPress}
              >
                <View style={styles.locationIconContainer}>
                  <Navigation size={20} color="#5d6b4a" />
                </View>
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationTitle}>Current location</Text>
                  <Text style={styles.locationSubtitle}>{currentLocation}</Text>
                </View>
              </TouchableOpacity>
            )}

            {searchSuggestions.length > 0 && (
              <FlatList
                data={searchSuggestions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(item.id)}
                  >
                    <View style={styles.suggestionIconContainer}>
                      <MapPin size={20} color="#64748b" />
                    </View>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionTitle}>{item.name}</Text>
                      <Text style={styles.suggestionSubtitle}>{item.location}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
