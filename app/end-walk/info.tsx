import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Image as RNImage } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useTrails } from '@/context/TrailsContext';
import styles from './info.styles';
import theme from '@/constants/colors';

export default function InfoPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { saveTrail } = useTrails();

  const [draft, setDraft] = useState<any>(null);
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);

  const rawDraft = typeof params?.draft === 'string' ? decodeURIComponent(params.draft as string) : undefined;

  useEffect(() => {
    if (!rawDraft) return;
    try {
      const parsed = JSON.parse(rawDraft);
      setDraft(parsed);
      setName(parsed?.name || '');
      setNotes(parsed?.notes || '');
      setPhotos(parsed?.photos || []);
      setPrivacy(parsed?.privacy || 'public');
    } catch (e) {
      // ignore
    }
  }, [rawDraft]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.6,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      const uris = (result.assets || []).map(a => a.uri);
      setPhotos(prev => [...prev, ...uris]);
    }
  };

  const onBack = () => router.back();

  const onDone = async () => {
    if (!draft) return router.push('/');
    setSaving(true);
    try {
      const toSave = {
        ...draft,
        name: name || draft.name || 'Untitled trail',
        notes: notes || draft.notes,
        photos,
        privacy,
      };
      await saveTrail(toSave);
      // Clear any recording state so the Record tab stops resuming recording
      try {
        const hasTask = await TaskManager.isTaskRegisteredAsync('background-location-task');
        if (hasTask) {
          await Location.stopLocationUpdatesAsync('background-location-task');
        }
      } catch (err) {
        // ignore
      }
      try {
        await AsyncStorage.removeItem('recording_start_time');
        await AsyncStorage.removeItem('recording_coordinates');
        await AsyncStorage.removeItem('recording_max_elevation');
        await AsyncStorage.removeItem('recording_max_speed');
        await AsyncStorage.removeItem('recording_last_update');
      } catch (err) {
        // ignore
      }
      router.replace('/');
    } catch (e) {
      console.warn('save failed', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top || 20 }]}>
        <ScrollView contentContainerStyle={styles.infoScroll}>
          <Text style={styles.infoHeader}>Name your trail</Text>
          <Text style={styles.infoSub}>This name will help you find it later</Text>

          <TextInput
            placeholder="Trail name"
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={name}
            onChangeText={setName}
            style={styles.nameInput}
          />

          <TouchableOpacity style={styles.addMoreToggle} onPress={() => setShowMore(s => !s)}>
            <Plus size={18} color={theme.textMuted} style={{ marginRight: 12 }} />
            <Text style={styles.addMoreText}>Add More Details</Text>
          </TouchableOpacity>

          {showMore && (
            <View style={styles.moreCard}>
              <Text style={styles.cardTitle}>Add photos?</Text>
              <Text style={styles.cardSub}>Show highlights from your walk</Text>

              <TouchableOpacity style={styles.addPhotoBox} onPress={pickImages}>
                <Text style={styles.plusSign}>+</Text>
              </TouchableOpacity>

              <View style={styles.photoRow}>
                {photos.map((p, i) => {
                  const extraStyle: any = { zIndex: i };
                  if (i === 1) extraStyle.transform = [{ rotate: '-6deg' }, { translateY: 6 }];
                  if (i === 2) extraStyle.transform = [{ rotate: '-3deg' }, { translateY: 3 }];
                  return <RNImage key={i} source={{ uri: p }} style={[styles.thumb, extraStyle]} />;
                })}
              </View>

              <Text style={styles.cardTitle}>Anything you'd like to share?</Text>
              <Text style={styles.cardSub}>Share helpful information regarding the trail</Text>
              <TextInput
                placeholder="Anything other dog walkers should know?"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={notes}
                onChangeText={setNotes}
                style={styles.notesInput}
                multiline
              />

              <Text style={[styles.cardTitle, { marginTop: 18 }]}>Privacy</Text>
              <Text style={styles.cardSub}>Choose who can see your trail</Text>
              <TouchableOpacity
                style={styles.privacyButton}
                onPress={() => setPrivacy(p => (p === 'public' ? 'private' : 'public'))}
              >
                <Text style={styles.privacyText}>{privacy === 'public' ? 'Public' : 'Private'}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 24 }} />

          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneButton} onPress={onDone} disabled={saving}>
              {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.doneText}>Done</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
