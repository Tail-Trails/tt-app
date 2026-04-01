import { useEffect, useMemo, useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image as RNImage, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components';
import { useTrails } from '@/context/TrailsContext';
import { Trail } from '@/types/trail';
import styles from './follow-wrapup.styles';

export default function FollowWrapupPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { saveFollowTrail } = useTrails();
  const [draft, setDraft] = useState<Trail | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  const rawDraft = typeof params?.draft === 'string' ? decodeURIComponent(params.draft as string) : undefined;

  useEffect(() => {
    if (!rawDraft) return;
    try {
      const parsed = JSON.parse(rawDraft) as Trail;
      setDraft(parsed);
      setRating(typeof parsed?.rating === 'number' ? parsed.rating : 0);
      setReviewContent(parsed?.review || '');
    } catch {
      Alert.alert('Error', 'Unable to load follow-up details.');
    }
  }, [rawDraft]);

  const sourceTrailId = useMemo(() => {
    if (typeof draft?.originalTrailId === 'string' && draft.originalTrailId.length > 0) {
      return draft.originalTrailId;
    }
    return undefined;
  }, [draft]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.6,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      const uris = (result.assets || []).map((asset) => asset.uri);
      setPhotos((prev) => [...prev, ...uris]);
    }
  };

  const clearRecordingState = async () => {
    try {
      await AsyncStorage.removeItem('recording_start_time');
      await AsyncStorage.removeItem('recording_coordinates');
      await AsyncStorage.removeItem('recording_max_elevation');
      await AsyncStorage.removeItem('recording_max_speed');
      await AsyncStorage.removeItem('recording_last_update');
    } catch {
      // ignore
    }
  };

  const handleDone = async () => {
    if (!draft || !sourceTrailId) {
      Alert.alert('Error', 'Original trail not found.');
      return;
    }

    if (!rating) {
      Alert.alert('Rating required', 'Please rate the trail before finishing.');
      return;
    }

    if (!reviewContent.trim()) {
      Alert.alert('Review required', 'Please add a short review before finishing.');
      return;
    }

    setSaving(true);
    try {
      await saveFollowTrail(
        sourceTrailId,
        {
          ...draft,
          rating,
          review: reviewContent.trim(),
        },
        {
          rating,
          content: reviewContent.trim(),
        },
        photos,
      );

      if (true) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await clearRecordingState();
      router.replace('/');
    } catch (error: any) {
      console.error('Failed to save followed trail:', error);
      if (true) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', error?.message || 'Failed to save your followed trail.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 20 || 20 }]}> 
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Wrap up your follow</Text>
            <Text style={styles.subtitle}>Add a review and any photos from the trail you just followed.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>How was the trail?</Text>
            <Text style={styles.sectionSub}>Your rating and review help other walkers decide if this trail is right for them.</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= rating;
                return (
                  <TouchableOpacity
                    key={star}
                    style={[styles.starButton, active && styles.starButtonActive]}
                    onPress={() => setRating(star)}
                    disabled={saving}
                  >
                    <Text style={[styles.starText, active && styles.starTextActive]}>★</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              placeholder="What did you think of the trail?"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={reviewContent}
              onChangeText={setReviewContent}
              style={styles.input}
              editable={!saving}
              multiline
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add photos?</Text>
            <Text style={styles.sectionSub}>Share any highlights from your walk.</Text>

            <TouchableOpacity style={styles.addPhotoBox} onPress={pickImages} disabled={saving}>
              <Text style={styles.plusSign}>+</Text>
            </TouchableOpacity>

            <View style={styles.photoRow}>
              {photos.map((photo, index) => {
                const extraStyle: any = { zIndex: index };
                if (index === 1) extraStyle.transform = [{ rotate: '-6deg' }, { translateY: 6 }];
                if (index === 2) extraStyle.transform = [{ rotate: '-3deg' }, { translateY: 3 }];
                return <RNImage key={`${photo}-${index}`} source={{ uri: photo }} style={[styles.thumb, extraStyle]} />;
              })}
            </View>
          </View>

          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={saving}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doneButton, saving && styles.doneButtonDisabled]}
              onPress={handleDone}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.doneText}>Finish</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
