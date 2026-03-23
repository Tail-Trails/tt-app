import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Platform, Image as RNImage } from 'react-native';
import { Text } from '@/components';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrails } from '@/context/TrailsContext';
import { useAuth } from '@/context/AuthContext';
import { Check, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import theme from '@/constants/colors';
import styles from './edit.styles';
import * as ImagePicker from 'expo-image-picker';

// TODO: Make this whole page editable for users' own trails, including name, photos, review, rating, difficulty, tags

export default function EditTrailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { getTrailById, updateTrailName, updateTrailDetails } = useTrails();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [trail, setTrail] = useState<any>(null);

  const [name, setName] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (typeof id !== 'string') return setIsLoading(false);
      setIsLoading(true);
      try {
        const t = await getTrailById(id);
        setTrail(t);
        setName(t?.name || '');
          setPhotos((t as any)?.photos || (t as any)?.urls || []);
        setRating(t?.rating || 0);
        setReview(t?.review || '');
        setDifficulty(t?.difficulty || '');
        setTags(t?.environment_tags || []);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load trail');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleCancel = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!trail) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSaving(true);

    try {
      if (name.trim() && name.trim() !== trail.name) {
        await updateTrailName(trail.id, name.trim());
      }

      await updateTrailDetails(trail.id, {
        rating: rating > 0 ? rating : undefined,
        review: review.trim() || undefined,
        environment_tags: tags.length > 0 ? tags : undefined,
        difficulty: difficulty || undefined,
      });

      // If user added photos, upload/update them on the trail
      if (photos && photos.length > 0) {
        try {
          await updateTrailPhoto(trail.id, photos);
        } catch (err) {
          console.warn('Failed to update photos:', err);
        }
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Success', 'Trail updated');
      router.back();
    } catch (err: any) {
      console.error('Error saving trail:', err);
      Alert.alert('Error', err.message || 'Failed to save changes');
      setIsSaving(false);
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.6,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map(a => {
          if (a.base64) return `data:image/jpeg;base64,${a.base64}`;
          return a.uri;
        });
        setPhotos(prev => [...prev, ...uris]);
      }
    } catch (err) {
      console.error('Image pick error', err);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accentPrimary} />
      </View>
    );
  }

  if (!trail) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No trail found</Text>
      </View>
    );
  }

  const canEdit = trail.userId === user?.id;

  if (!canEdit) {
    return (
      <View style={styles.loadingContainer}>
        <Text>You do not have permission to edit this trail.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}> 
      <View style={styles.sectionHeader}>
        <TouchableOpacity onPress={handleCancel} style={styles.iconButton}>
          <ArrowLeft size={20} color={theme.accentPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Trail</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Trail name" style={styles.input} />

        <Text style={styles.label}>Rating</Text>
        <TextInput value={String(rating || '')} onChangeText={(t) => setRating(Number(t) || 0)} placeholder="0-5" keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'} style={styles.input} />

        <Text style={styles.label}>Review</Text>
        <TextInput value={review} onChangeText={setReview} placeholder="Share your experience" style={[styles.input]} multiline numberOfLines={4} />

        <Text style={styles.label}>Difficulty</Text>
        <TextInput value={difficulty} onChangeText={setDifficulty} placeholder="Easy, Moderate, Hard" style={styles.input} />
        <View style={styles.moreCard}>
          <Text style={styles.cardTitle}>Add photos?</Text>
          <Text style={styles.cardSub}>Add highlights from this trail</Text>

          <TouchableOpacity style={styles.addPhotoBox} onPress={pickImages}>
            <Text style={styles.plusSign}>+</Text>
          </TouchableOpacity>

          <View style={styles.photoRow}>
            {photos.map((p, i) => (
              <RNImage key={i} source={{ uri: p }} style={[styles.thumb, { zIndex: i }]} />
            ))}
          </View>
        </View>
      </View>
      {/* Footer save button fixed to bottom */}
      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 20) }]}>
        <TouchableOpacity onPress={handleSave} style={[styles.footerSaveButton, isSaving && styles.finishButtonDisabled]} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#1a1f0a" />
          ) : (
            <Text style={styles.footerSaveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}