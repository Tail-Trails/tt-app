import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './dog-personality.styles';
import { RECALL_RELIABILITY_OPTIONS, PERSONALITY_TAGS, RecallReliability } from '@/types/dog-profile';
import { useAuth } from '@/context/AuthContext';
import { useDogs } from '@/context/DogsContext';

export default function DogPersonalityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    nickname?: string;
    age: string;
    size: string;
    photo?: string;
    isEditing?: string;
  }>();
  const { user } = useAuth();
  const { dogProfile, refreshDogProfile, createDogProfile, updateDogProfile } = useDogs();
  const insets = useSafeAreaInsets();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recallReliability, setRecallReliability] = useState<RecallReliability>('Fair');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const isEditing = params.isEditing === 'true';

  useEffect(() => {
    if (dogProfile && isEditing) {
      console.log('Loading existing personality tags for editing:', dogProfile.personality_tags);
      setSelectedTags(dogProfile.personality_tags || []);
      setRecallReliability(dogProfile.recall_reliability || 'Fair');
    }
  }, [dogProfile, isEditing]);

  const toggleTag = (tag: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFinish = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a dog profile');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSaving(true);

    try {
      console.log(isEditing ? 'Updating dog profile for user:' : 'Creating dog profile for user:', user.id);

      const profileData = {
        user_id: user.id,
        name: params.name,
        nickname: params.nickname || undefined,
        size: params.size as any,
        age: parseInt(params.age, 10),
        photo: params.photo || undefined,
        personality_tags: selectedTags,
        recall_reliability: recallReliability,
      };

      console.log('Dog profile data:', profileData);

      if (isEditing && dogProfile?.id) {
        await updateDogProfile({ ...profileData, id: dogProfile.id });
      } else {
        await createDogProfile(profileData);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (isEditing) {
        router.replace('/(tabs)/profile');
      } else {
        router.replace('/(tabs)/explore');
      }
    } catch (error: any) {
      console.error('Error saving dog profile:', error);
      Alert.alert('Error', error.message || 'Failed to save dog profile');
      setIsSaving(false);
    }

  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}> 
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Personality & Behaviour</Text>
            <Text style={styles.subtitle}>Choose the tags that best describe your dog</Text>
            {!isEditing && (
              <View style={styles.progressContainer}>
                <View style={styles.progressDot} />
                <View style={[styles.progressDot, styles.progressDotActive]} />
              </View>
            )}
          </View>

          <View style={styles.tagsContainer}>
            {PERSONALITY_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  selectedTags.includes(tag) && styles.tagSelected,
                ]}
                onPress={() => toggleTag(tag)}
                testID={`tag-${tag}`}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health & Safety</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Recall Reliability</Text>
            <Text style={styles.helperText}>How reliably does your dog return when called?</Text>
            <View style={styles.recallContainer}>
              {RECALL_RELIABILITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.recallOption,
                    recallReliability === option && styles.recallOptionSelected,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setRecallReliability(option);
                  }}
                  testID={`recall-${option}`}
                >
                  <Text
                    style={[
                      styles.recallText,
                      recallReliability === option && styles.recallTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isSaving}
            testID="back-button"
          >
            <ChevronLeft size={24} color="#FFFE77" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.finishButton, isSaving && styles.finishButtonDisabled]}
            onPress={handleFinish}
            disabled={isSaving}
            testID="finish-button"
          >
            {isSaving ? (
              <ActivityIndicator color="#1a1f0a" />
            ) : (
              <Text style={styles.finishButtonText}>{isEditing ? 'Save' : 'Finish'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
