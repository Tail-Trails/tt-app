import React from 'react';
import { View, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Bookmark, BarChart3, MapPin, Star, MoreVertical, Navigation, Ruler } from 'lucide-react-native';
import theme from '@/constants/colors';
import TrailMapPreview from '@/components/TrailMapPreview';
import TrailPathPreview from '@/components/TrailPathPreview';
import { LinearGradient } from 'expo-linear-gradient';
import { Trail } from '@/types/trail';
import { useDogs } from '@/context/DogsContext';
import styles from '@/components/TrailCard.styles';
import { Text } from '@/components';
import { formatDistance } from '@/utils/distance';

type Props = {
  trail: Trail;
  onPress?: (id: string) => void;
  onBookmarkPress?: (id: string) => void;
  isSaved?: boolean;
  onSwipeStateChange?: (id: string, swiping: boolean) => void;
  containerStyle?: any;
  imageStyle?: any;
  variant?: 'large' | 'vertical';
};

export default function TrailCard({ trail, onPress, onBookmarkPress, isSaved, onSwipeStateChange, containerStyle, imageStyle, variant = 'large' }: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [cardWidth, setCardWidth] = React.useState<number>(Dimensions.get('window').width);
  const anim = React.useRef(new Animated.Value(1)).current;
  const { dogProfile } = useDogs();

  const dog = React.useMemo(() => {
    if (!dogProfile) return null;
    return dogProfile; // For now we just take the first dog, but this could be enhanced to select the most relevant dog for the trail
  }, [dogProfile]);

  const images: string[] = React.useMemo(() => {
    if (Array.isArray((trail as any).images) && (trail as any).images.length > 0) {
      return (trail as any).images.map((i: any) => i?.url).filter(Boolean);
    }
    if (trail.photo) return [trail.photo];
    return [];
  }, [trail]);

  const isShowingImage = React.useMemo(() => {
    if (images.length > 0) return (activeIndex || 0) < images.length;
    return !!trail.photo;
  }, [images.length, activeIndex, trail.photo]);

  const distanceFromUserValue = React.useMemo(() => {
    return (trail as any).distanceFromUser ?? (trail as any).distance_from_user ?? (trail as any).distanceFromUserMeters ?? (trail as any).distance_from_user_meters;
  }, [trail]);

  const dogMatchValue = React.useMemo(() => {
    const v = (trail as any).dogMatchScore ?? (trail as any).dog_match_score ?? (trail as any).dogMatch;
    return typeof v === 'number' ? v : undefined;
  }, [trail]);

  const handleTouchStart = () => {
    setIsSwiping(true);
    onSwipeStateChange?.(trail.id, true);
  };

  const clearSwiping = (delay = 120) => {
    setTimeout(() => {
      setIsSwiping(false);
      onSwipeStateChange?.(trail.id, false);
    }, delay);
  };

  const triggerBookmarkAnim = () => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleBookmark = (e: any) => {
    e.stopPropagation();
    triggerBookmarkAnim();
    onBookmarkPress?.(trail.id);
  };

  if (variant === 'vertical') {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => { if (!isSwiping && onPress) onPress(trail.id); }}
        style={[styles.trailCard, styles.trailCardVertical, containerStyle]}
      >
        {trail.photo ? (
          <Image source={{ uri: trail.photo }} style={styles.trailImage} contentFit="cover" />
        ) : (
          <TrailMapPreview
            coordinates={trail.coordinates}
            path={trail.path}
            style={styles.trailImage}
            startLatitude={trail.startLatitude}
            startLongitude={trail.startLongitude}
          />
        )}

        <TouchableOpacity style={styles.bookmarkButtonVertical} onPress={handleBookmark}>
          <Animated.View style={{ transform: [{ scale: anim }] }}>
            <Bookmark size={20} color={isSaved ? '#000' : theme.textMuted} fill={isSaved ? '#000' : 'none'} strokeWidth={2} />
          </Animated.View>
        </TouchableOpacity>
        <View style={styles.trailContentBelow}>
          <Text style={styles.trailName}>{trail.name || `Trail ${new Date(trail.date).toLocaleDateString()}`}</Text>
          <Text style={styles.trailLocation}>{trail.city ? `${trail.city}, ${trail.country || 'Unknown'}` : 'Location unknown'}</Text>
          <View style={styles.trailBadges}>
            {trail.difficulty && (
              <View style={styles.trailBadge}>
                <BarChart3 size={14} color={theme.accentPrimary} strokeWidth={2.5} />
                <Text style={styles.trailBadgeText}>{trail.difficulty}</Text>
              </View>
            )}
            {Number.isFinite((trail as any).distance) && (
              <View style={styles.trailBadge}>
                <MapPin size={14} color={theme.accentPrimary} strokeWidth={2.5} />
                <Text style={styles.trailBadgeText}>{formatDistance((trail as any).distance)}</Text>
              </View>
            )}
            {Number.isFinite(distanceFromUserValue) && (
              <View style={styles.trailBadge}>
                <MapPin size={14} color={theme.accentPrimary} strokeWidth={2.5} />
                <Text style={styles.trailBadgeText}>{formatDistance(distanceFromUserValue as number)}</Text>
              </View>
            )}
            {Number.isFinite((trail as any).rating) && (
              <View style={styles.trailBadge}>
                <Star size={14} color={theme.accentPrimary} fill={theme.accentPrimary} strokeWidth={2} />
                <Text style={styles.trailBadgeText}>{(trail as any).rating.toFixed(1)}</Text>
              </View>
            )}
            {Number.isFinite(dogMatchValue) && (
              <View style={styles.trailBadge}>
                <Star size={14} color={theme.accentPrimary} fill={theme.accentPrimary} strokeWidth={2} />
                <Text style={styles.trailBadgeText}>{`${Math.round(dogMatchValue as number)}%`}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      delayPressIn={80}
      onPress={() => { if (!isSwiping && onPress) onPress(trail.id); }}
      style={[styles.largeTrailCard, containerStyle]}
    >
      <View
        style={[styles.largeTrailImageContainer, { width: '100%' }]}
        onLayout={(e) => setCardWidth(e.nativeEvent.layout.width || Dimensions.get('window').width)}
      >
        {/* Show only the first image (if available), remove side-scroll, make whole image area clickable */}
        {images.length > 0 ? (
          <Image
            key={`${trail.id}-img-0`}
            source={{ uri: images[0] }}
            style={[styles.largeTrailImage, { width: cardWidth }, imageStyle]}
            contentFit="cover"
          />
        ) : trail.photo ? (
          <Image source={{ uri: trail.photo }} style={[styles.largeTrailImage, { width: cardWidth }, imageStyle]} contentFit="cover" />
        ) : (
          <View style={[styles.largeTrailImage, { width: cardWidth }, imageStyle]}>
            <TrailMapPreview
              coordinates={trail.coordinates}
              path={trail.path}
              style={{ flex: 1 }}
              startLatitude={trail.startLatitude}
              startLongitude={trail.startLongitude}
            />
          </View>
        )}

        {(trail.path || trail.coordinates) && isShowingImage && (
          <View style={styles.rightOverlay} pointerEvents="none">
            <View style={styles.rightOverlayMap}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.75)' ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 12 }}
                pointerEvents="none"
              />
              <TrailPathPreview
                coordinates={trail.coordinates}
                path={trail.path}
                style={{ flex: 1 }}
                strokeColor="#ffffff"
                strokeWidth={2.3}
                backgroundColor={'transparent'}
              />
            </View>
          </View>
        )}

        {/* removed horizontal dots/indicator since side-scroll was removed */}

        {/* <TouchableOpacity style={styles.bookmarkButton} onPress={handleBookmark}>
          <Bookmark size={18} color={isSaved ? '#000' : theme.textMuted} />
        </TouchableOpacity> */}
      </View>

      {/* TODO: fix distance from you in profile */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{trail.name || `Trail ${new Date(trail.date).toLocaleDateString()}`}</Text>
          {/* <TouchableOpacity>
            <MoreVertical size={20} color={theme.textPrimary} />
          </TouchableOpacity> */}
        </View>

        <Text style={styles.cardLocation}>{formatDistance(distanceFromUserValue as number)} from you</Text>

        <View style={styles.cardBadges}>
          {Number.isFinite(dogMatchValue) && (
            <View style={styles.badge}>
              <Image source={{ uri: dog?.image }} style={{ width: 14, height: 14, borderRadius: 7 }} contentFit="cover" />
              <Text style={styles.badgeText}>{`${Math.round(dogMatchValue as number)}%`}</Text>
            </View>
          )}
          {trail.difficulty && (
            <View style={styles.badge}>
              <BarChart3 size={14} color={theme.accentPrimary} strokeWidth={2.5} />
              <Text style={styles.badgeText}>{trail.difficulty}</Text>
            </View>
          )}
          {Number.isFinite((trail as any).distance) && (
            <View style={styles.badge}>
              {/* <Ruler size={14} color={theme.accentPrimary} strokeWidth={2.5} /> */}
              <Text style={styles.badgeText}>{formatDistance((trail as any).distance)}</Text>
            </View>
          )}
          {Number.isFinite((trail as any).rating) && (
            <View style={styles.badge}>
              <Star size={14} color={theme.accentPrimary} fill={theme.accentPrimary} strokeWidth={2} />
              <Text style={styles.badgeText}>{(trail as any).rating.toFixed(1)}</Text>
            </View>
          )}
          
        </View>
      </View>
    </TouchableOpacity>
  );
}
