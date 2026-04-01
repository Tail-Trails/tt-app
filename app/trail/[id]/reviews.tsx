import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MessageSquareQuote, Plus, Star, X } from 'lucide-react-native';
import { Text } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import colors from '@/constants/colors';
import styles from './reviews.styles';
import * as Haptics from 'expo-haptics';

type TrailReview = {
  id: string;
  rating: number;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
};

function formatReviewDate(value?: string) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TrailReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<TrailReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [draftRating, setDraftRating] = useState(0);
  const [draftContent, setDraftContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    if (typeof id !== 'string') {
      setErrorMessage('Trail id missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {};
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }

      const response = await fetch(`${API_URL}/trail/${id}/reviews`, { headers });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('Failed to load trail reviews:', response.status, body);
        throw new Error('Failed to load reviews.');
      }

      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Trail reviews fetch error:', error);
      setErrorMessage('Unable to load reviews right now.');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.accessToken]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, review) => sum + (Number.isFinite(review.rating) ? review.rating : 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const handleSubmitReview = useCallback(async () => {
    if (typeof id !== 'string') {
      Alert.alert('Error', 'Trail id missing.');
      return;
    }

    if (!session?.accessToken) {
      Alert.alert('Sign in required', 'Please sign in to leave a review.');
      return;
    }

    if (!draftRating) {
      Alert.alert('Rating required', 'Please choose a rating before submitting your review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/trail/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          rating: draftRating,
          content: draftContent.trim(),
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('Failed to create trail review:', response.status, body);
        throw new Error('Failed to submit review.');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDraftRating(0);
      setDraftContent('');
      setShowCompose(false);
      await loadReviews();
    } catch (error) {
      console.error('Trail review submit error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Unable to submit your review right now.');
    } finally {
      setIsSubmitting(false);
    }
  }, [draftContent, draftRating, id, loadReviews, session?.accessToken]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentPrimary} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}> 
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.accentPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Trail Reviews</Text>
              <Text style={styles.subtitle}>{`${reviews.length} review${reviews.length === 1 ? '' : 's'}`}</Text>
            </View>
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCompose((prev) => !prev);
              }}
            >
              {showCompose ? (
                <X size={20} color={colors.backgroundPrimary} />
              ) : (
                <Plus size={20} color={colors.backgroundPrimary} />
              )}
            </TouchableOpacity>
          </View>

          {showCompose && <View style={styles.composeCard}>
            <Text style={styles.composeTitle}>Leave a review</Text>
            <Text style={styles.composeSubtitle}>Tell other walkers what this trail is like.</Text>

            <View style={styles.composeStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= draftRating;
                return (
                  <TouchableOpacity
                    key={`draft-star-${star}`}
                    style={styles.composeStarButton}
                    onPress={() => {
                      if (true) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setDraftRating(star);
                    }}
                    disabled={isSubmitting}
                  >
                    <Star
                      size={28}
                      color={active ? colors.accentPrimary : colors.backgroundSecondaryVarient}
                      fill={active ? colors.accentPrimary : 'none'}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.composeInput}
              placeholder="What did you think of this trail?"
              placeholderTextColor={colors.textMuted}
              value={draftContent}
              onChangeText={setDraftContent}
              editable={!isSubmitting}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />

            <View style={styles.composeFooter}>
              <Text style={styles.composeHint}>{`${draftContent.trim().length}/500`}</Text>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!draftRating || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={!draftRating || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.backgroundPrimary} />
                ) : (
                  <Text style={styles.submitButtonText}>Post review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>}

          {errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadReviews}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <MessageSquareQuote size={28} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptyText}>Be the first to share what this trail is like.</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Average rating</Text>
                <Text style={styles.summaryValue}>{averageRating ? averageRating.toFixed(1) : 'N/A'}</Text>
                <Text style={styles.summaryMeta}>{`${reviews.length} total review${reviews.length === 1 ? '' : 's'}`}</Text>
              </View>

              {reviews.map((review, index) => (
                <View key={`${review.id}-${index}`} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={`${review.id}-${index}-${star}`}
                          size={18}
                          color={star <= review.rating ? colors.accentPrimary : colors.backgroundSecondaryVarient}
                          fill={star <= review.rating ? colors.accentPrimary : 'none'}
                          strokeWidth={2}
                        />
                      ))}
                      <Text style={styles.ratingText}>{`${review.rating}/5`}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatReviewDate(review.createdAt)}</Text>
                  </View>

                  <Text style={styles.reviewContent}>{review.content?.trim() || 'No written review provided.'}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
