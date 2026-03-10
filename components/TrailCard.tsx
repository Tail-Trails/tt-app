import React from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Bookmark, BarChart3, MapPin, Star, MoreVertical, Navigation } from 'lucide-react-native';
import theme from '@/constants/colors';
import TrailMapPreview from '@/components/TrailMapPreview';
import { Trail } from '@/types/trail';
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

  const images: string[] = React.useMemo(() => {
    if (Array.isArray((trail as any).images) && (trail as any).images.length > 0) {
      return (trail as any).images.map((i: any) => i?.url).filter(Boolean);
    }
    if (trail.photo) return [trail.photo];
    return [];
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
            <View style={styles.trailBadge}>
              <MapPin size={14} color={theme.accentPrimary} strokeWidth={2.5} />
              <Text style={styles.trailBadgeText}>{formatDistance(trail.distance)}</Text>
            </View>
            {trail.rating && (
              <View style={styles.trailBadge}>
                <Star size={14} color={theme.accentPrimary} fill={theme.accentPrimary} strokeWidth={2} />
                <Text style={styles.trailBadgeText}>{trail.rating.toFixed(1)}</Text>
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
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            onTouchStart={handleTouchStart}
            onScrollEndDrag={() => clearSwiping(150)}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x || 0;
              const idx = Math.round(offsetX / cardWidth);
              setActiveIndex(idx);
              clearSwiping(100);
            }}
            contentContainerStyle={styles.largeTrailImageScroll}
          >
            {images.map((url, i) => (
              <Image key={`${trail.id}-img-${i}`} source={{ uri: url }} style={[styles.largeTrailImage, { width: cardWidth }, imageStyle]} contentFit="cover" />
            ))}
            <View style={[styles.largeTrailImage, { width: cardWidth }]}>
              <TrailMapPreview coordinates={trail.coordinates} path={trail.path} style={{ flex: 1 }} startLatitude={trail.startLatitude} startLongitude={trail.startLongitude} />
            </View>
          </ScrollView>
        ) : (
          trail.photo ? (
            <Image source={{ uri: trail.photo }} style={[styles.largeTrailImage, imageStyle]} contentFit="cover" />
          ) : (
            <View style={[styles.largeTrailImage, styles.placeholderImage]}>
              {/* empty placeholder */}
            </View>
          )
        )}

        <View style={styles.largeTrailDots} pointerEvents="none">
          {new Array(images.length + 1).fill(0).map((_, i) => (
            <View key={`${trail.id}-dot-${i}`} style={[styles.dot, (activeIndex || 0) === i && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.bookmarkButton} onPress={handleBookmark}>
          <Bookmark size={18} color={isSaved ? '#000' : theme.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{trail.name || `Trail ${new Date(trail.date).toLocaleDateString()}`}</Text>
          <TouchableOpacity>
            <MoreVertical size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardLocation}>{trail.city ? `${trail.city}, ` : ''}{trail.country || 'Portugal'}</Text>

        <View style={styles.cardBadges}>
          {trail.difficulty && (
            <View style={styles.badge}>
              <BarChart3 size={14} color={theme.accentPrimary} strokeWidth={2.5} />
              <Text style={styles.badgeText}>{trail.difficulty}</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Navigation size={14} color={theme.accentPrimary} strokeWidth={2.5} />
            <Text style={styles.badgeText}>{formatDistance(trail.distance)}</Text>
          </View>
          {typeof (trail as any).distance_from_user === 'number' && (
            <View style={styles.badge}>
              <MapPin size={14} color={theme.accentPrimary} strokeWidth={2.5} />
              <Text style={styles.badgeText}>{formatDistance((trail as any).distance_from_user)}</Text>
            </View>
          )}
          {trail.rating && (
            <View style={styles.badge}>
              <Star size={14} color={theme.accentPrimary} fill={theme.accentPrimary} strokeWidth={2} />
              <Text style={styles.badgeText}>{trail.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
