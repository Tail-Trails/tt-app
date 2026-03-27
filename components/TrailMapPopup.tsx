import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Ruler, Star, ChevronRight, X } from 'lucide-react-native';
import { Text } from '@/components';
import TrailMapPreview from '@/components/TrailMapPreview';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Trail } from '@/types/trail';
import { formatDistance } from '@/utils/distance';

interface TrailMapPopupProps {
  trail: Trail | null;
  onClose: () => void;
  onViewTrail: (id: string) => void;
}

export default function TrailMapPopup({ trail, onClose, onViewTrail }: TrailMapPopupProps) {
  const slideAnim = useRef(new Animated.Value(200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (trail) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 200,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [trail]);

  if (!trail) return null;

  const images: string[] = Array.isArray((trail as any).images) && (trail as any).images.length > 0
    ? (trail as any).images.map((i: any) => i?.url).filter(Boolean)
    : trail.photo ? [trail.photo] : [];

  const heroImage = images[0];

  const distanceFromUser = (trail as any).distanceFromUser ?? (trail as any).distance_from_user;
  const dogMatch = Number.isFinite(trail.dogMatchScore) ? trail.dogMatchScore : undefined;
  const rating = Number.isFinite(trail.rating) && trail.rating! > 0 ? trail.rating : undefined;
  const trailName = trail.name || `Trail ${new Date(trail.date).toLocaleDateString()}`;
  const location = trail.city ? `${trail.city}${trail.country ? `, ${trail.country}` : ''}` : null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.97}
        style={styles.card}
        onPress={() => onViewTrail(trail.id)}
      >
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={16} color={theme.textMuted} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.inner}>
          {/* Thumbnail */}
          <View style={styles.thumbnail}>
            {heroImage ? (
              <Image
                source={{ uri: heroImage }}
                style={styles.thumbnailImage}
                contentFit="cover"
              />
            ) : (
              <TrailMapPreview
                coordinates={trail.coordinates}
                path={trail.path}
                style={styles.thumbnailImage}
                startLatitude={trail.startLatitude}
                startLongitude={trail.startLongitude}
              />
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{trailName}</Text>

            {location && (
              <View style={styles.row}>
                <MapPin size={12} color={theme.textMuted} strokeWidth={2} />
                <Text style={styles.meta} numberOfLines={1}>{location}</Text>
              </View>
            )}

            <View style={styles.badges}>
              {dogMatch !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{`🐾 ${dogMatch.toFixed(1)}%`}</Text>
                </View>
              )}
              {Number.isFinite(trail.distance) && trail.distance > 0 && (
                <View style={styles.badge}>
                  <Ruler size={11} color={theme.accentPrimary} strokeWidth={2} />
                  <Text style={styles.badgeText}>{formatDistance(trail.distance)}</Text>
                </View>
              )}
              {Number.isFinite(distanceFromUser) && (
                <View style={styles.badge}>
                  <MapPin size={11} color={theme.textMuted} strokeWidth={2} />
                  <Text style={styles.badgeText}>{`${formatDistance(distanceFromUser)} away`}</Text>
                </View>
              )}
              {rating !== undefined && (
                <View style={styles.badge}>
                  <Star size={11} color={theme.accentPrimary} fill={theme.accentPrimary} strokeWidth={2} />
                  <Text style={styles.badgeText}>{rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Arrow */}
          <View style={styles.arrow}>
            <ChevronRight size={20} color={theme.textMuted} strokeWidth={2} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  card: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.backgroundSecondaryVarient,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.backgroundPrimary,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...Typography.label(theme.textPrimary),
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    ...Typography.caption(theme.textMuted),
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.backgroundPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  badgeText: {
    ...Typography.caption(theme.accentPrimary),
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  arrow: {
    flexShrink: 0,
    paddingLeft: 4,
  },
});
