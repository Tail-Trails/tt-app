import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Search,
  MapPin,
  Heart,
  Umbrella,
  Bookmark,
  Star,
  X,
  BarChart3,
  Navigation,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTrails } from '@/context/TrailsContext';
import { Trail } from '@/types/trail';
import { formatDistance } from '@/utils/distance';
import TrailMapPreview from '@/components/TrailMapPreview';


const CATEGORIES = [
  { id: 'nearby', name: 'Nearby', icon: MapPin },
  { id: 'popular', name: 'Popular', icon: Heart },
  { id: 'beaches', name: 'Beaches', icon: Umbrella },
];


export default function ExploreWebScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loadNearbyTrails, saveTrailBookmark, removeTrailBookmark, isTrailSaved } = useTrails();
  const [selectedCategory, setSelectedCategory] = useState<string>('nearby');
  const [nearbyTrails, setNearbyTrails] = useState<Trail[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(true);
  const [, setUserCity] = useState<string | undefined>(undefined);
  const [bookmarkAnimations, setBookmarkAnimations] = useState<Record<string, Animated.Value>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<{id: string; name: string; location: string; type: string}[]>([]);
  const [showPicker, setShowPicker] = useState<boolean>(false);

  const loadUserLocationAndNearbyTrails = useCallback(async () => {
    // On web, try to request browser location; fallback to no-coords call
    setCurrentLocation('Current location');
    try {
      if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          try {
            const trails = await loadNearbyTrails(pos.coords.latitude, pos.coords.longitude);
            setNearbyTrails(trails);
          } catch (err) {
            console.error('Failed to load nearby trails with browser location:', err);
            const trails = await loadNearbyTrails();
            setNearbyTrails(trails);
          } finally {
            setIsLoadingNearby(false);
          }
        }, async () => {
          const trails = await loadNearbyTrails();
          setNearbyTrails(trails);
          setIsLoadingNearby(false);
        });
        return;
      }

      const trails = await loadNearbyTrails();
      setNearbyTrails(trails);
    } catch (error) {
      console.error('Failed to load nearby trails (web):', error);
      setNearbyTrails([]);
    } finally {
      setIsLoadingNearby(false);
    }
  }, [loadNearbyTrails]);

  useEffect(() => {
    loadUserLocationAndNearbyTrails();
  }, [loadUserLocationAndNearbyTrails]);

  useFocusEffect(
    useCallback(() => {
      console.log('Explore tab focused - refreshing nearby trails (web)');
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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchSuggestions([]);
  };

  const handleSuggestionPress = (suggestionId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchSuggestions([]);
    router.push(`/trail/${suggestionId}`);
  };

  const handleCurrentLocationPress = () => {
    if (Platform.OS !== 'web') {
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
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

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

  const handleNavigateToTrail = (trailId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/trail/${trailId}`);
  };

  const handleCategoryPress = (categoryId: string) => {
    if (Platform.OS !== 'web') {
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

  // Map / picker state for web
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [containerReady, setContainerReady] = useState<boolean>(false);

  // use a ref callback to detect when the div is mounted
  const setMapContainer = (el: HTMLDivElement | null) => {
    mapContainerRef.current = el;
    setContainerReady(!!el);
  };

  useEffect(() => {
    if (!containerReady || !mapContainerRef.current || !showPicker) return;

    // prevent double-init
    if (mapRef.current) return;

    const defaultCenter: [number, number] = selectedCoords ? [selectedCoords.longitude, selectedCoords.latitude] : [0, 0];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: defaultCenter,
      zoom: selectedCoords ? 10 : 1,
    });
    mapRef.current = map;

    map.on('load', () => {
      // Add a point source for picker marker
      if (!map.getSource('picker')) {
        map.addSource('picker', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({
          id: 'picker-layer',
          type: 'circle',
          source: 'picker',
          paint: { 'circle-radius': 8, 'circle-color': '#2563eb', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 }
        });
      }
    });

    map.on('click', (e: any) => {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      setSelectedCoords({ latitude: lat, longitude: lng });
      const src = map.getSource('picker') as maplibregl.GeoJSONSource | undefined;
      if (src) {
        src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] } }] } as any);
      }
      map.flyTo({ center: [lng, lat], zoom: 12 });
    });

    return () => {
      try {
        map.remove();
      } catch (e) {
        // ignore
      }
      mapRef.current = null;
    };
  }, [containerReady, showPicker, selectedCoords]);

  const handleSearchNearby = async () => {
    setIsLoadingNearby(true);
    try {
      if (selectedCoords) {
        const trails = await loadNearbyTrails(selectedCoords.latitude, selectedCoords.longitude, distanceKm);
        setNearbyTrails(trails);
      } else if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const trails = await loadNearbyTrails(pos.coords.latitude, pos.coords.longitude, distanceKm);
          setNearbyTrails(trails);
        }, async () => {
          const trails = await loadNearbyTrails(undefined, undefined, distanceKm);
          setNearbyTrails(trails);
        });
      } else {
        const trails = await loadNearbyTrails(undefined, undefined, distanceKm);
        setNearbyTrails(trails);
      }
    } catch (err) {
      console.error('Search nearby failed:', err);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  const filteredTrails = getFilteredTrails(nearbyTrails);

  return (
    <View style={styles.safeContainer}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={[styles.stickyHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.stickySearchContainer}>
            <TouchableOpacity 
              style={styles.searchBar}
              onPress={handleSearchBarPress}
              activeOpacity={0.7}
            >
              <Search size={20} color="#9ca3af" />
              <Text style={styles.searchPlaceholder}>Find trails</Text>
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <TouchableOpacity 
                style={styles.demoButton}
                onPress={() => router.push('/trail/demo-trail')}
              >
                <Text style={styles.demoButtonText}>Demo</Text>
              </TouchableOpacity>
            )}
          </View>

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
                      color={isSelected ? '#fff' : '#9ca3af'}
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

        {/* Web-specific map picker and distance selector (hideable) */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <TouchableOpacity onPress={() => setShowPicker((s) => !s)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600' }}>Location & Distance</Text>
            {showPicker ? <ChevronUp size={20} color="#5d6b4a" /> : <ChevronDown size={20} color="#5d6b4a" />}
          </TouchableOpacity>

          {showPicker ? (
            <>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Pick a location on the map or use your current location</Text>
              <div ref={setMapContainer as any} style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[5, 10, 25, 50].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: distanceKm === d ? '#5d6b4a' : '#fff', borderWidth: 1, borderColor: '#e5e7eb' }}
                      onPress={() => setDistanceKm(d)}
                    >
                      <Text style={{ color: distanceKm === d ? '#fff' : '#282E10', fontWeight: '600' }}>{d} km</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={handleSearchNearby} style={{ marginLeft: 'auto', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#64748b', borderRadius: 10 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Search Nearby</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ color: '#64748b' }}>{selectedCoords ? `${selectedCoords.latitude.toFixed(4)}, ${selectedCoords.longitude.toFixed(4)}` : 'Using current location'}</Text>
              <Text style={{ color: '#64748b' }}>{distanceKm} km</Text>
              <TouchableOpacity onPress={handleSearchNearby} style={{ marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#64748b', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      <View style={styles.categoryTrailsSection}>
        {isLoadingNearby ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading trails...</Text>
          </View>
          ) : (filteredTrails && filteredTrails.length > 0) ? (
            filteredTrails.map((trail) => {
            const anim = getBookmarkAnimation(trail.id);
            const isSaved = isTrailSaved(trail.id);
            return (
            <TouchableOpacity
              key={trail.id}
              style={styles.largeTrailCard}
              onPress={() => handleNavigateToTrail(trail.id)}
            >
              {trail.photo ? (
                <Image
                  source={{ uri: trail.photo }}
                  style={styles.largeTrailImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <TrailMapPreview coordinates={trail.coordinates} path={(trail as any).path} style={styles.largeTrailImage} />
              )}
              
              <LinearGradient
                colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.25)', 'rgba(0, 0, 0, 0.6)']}
                locations={[0, 0.3, 0.6, 1]}
                style={styles.cardGradient}
              />
              
              <TouchableOpacity 
                style={styles.bookmarkButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleBookmarkPress(trail.id, true);
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
              
              <View style={styles.cardOverlayContent}>
                <Text style={styles.overlayTrailName}>
                  {trail.name || `Trail ${new Date(trail.date).toLocaleDateString()}`}
                </Text>
                <Text style={styles.overlayLocation}>
                  {trail.city ? `${trail.city}, ${trail.country || 'Unknown'}` : 'Location unknown'}
                </Text>
                <View style={styles.overlayBadges}>
                  {trail.difficulty && (
                    <View style={styles.badge}>
                      <BarChart3 size={14} color="#d4d4a0" strokeWidth={2.5} />
                      <Text style={styles.badgeText}>{trail.difficulty}</Text>
                    </View>
                  )}
                  <View style={styles.badge}>
                    <MapPin size={14} color="#d4d4a0" strokeWidth={2.5} />
                    <Text style={styles.badgeText}>{formatDistance(trail.distance)}</Text>
                  </View>
                  {typeof (trail as any).distance_from_user === 'number' && (
                    <View style={styles.badge}>
                      <MapPin size={14} color="#d4d4a0" strokeWidth={2.5} />
                      <Text style={styles.badgeText}>{formatDistance((trail as any).distance_from_user)}</Text>
                    </View>
                  )}
                  {trail.rating && (
                    <View style={styles.badge}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" strokeWidth={2} />
                      <Text style={styles.badgeText}>{trail.rating.toFixed(1)}</Text>
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
              No trails found nearby. Try a wider search or record a trail to share with others.
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

const styles = StyleSheet.create({
  ...require('./explore.styles').default
});
