import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PERSONALITY_TAGS, RECALL_RELIABILITY_OPTIONS, RecallReliability } from '@/types/dog-profile';
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


  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };



  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Personality & Behaviour</Text>
            <Text style={styles.subtitle}>
              Choose the tags that best describe your dog
            </Text>
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
            onPress={handleBack}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f0a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFE77',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a8ad8e',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3d4520',
  },
  progressDotActive: {
    backgroundColor: '#FFFE77',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#282E10',
    borderWidth: 1.5,
    borderColor: '#3d4520',
  },
  tagSelected: {
    backgroundColor: 'rgba(255, 254, 119, 0.15)',
    borderColor: '#FFFE77',
  },
  tagText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#a8ad8e',
  },
  tagTextSelected: {
    color: '#FFFE77',
    fontWeight: '600' as const,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#3d4520',
    backgroundColor: '#282E10',
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FFFE77',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFE77',
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#FFFE77',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonDisabled: {
    opacity: 0.6,
  },
  finishButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1a1f0a',
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFE77',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFE77',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#a8ad8e',
    marginBottom: 12,
  },
  recallContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  recallOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#282E10',
    borderWidth: 1.5,
    borderColor: '#3d4520',
    alignItems: 'center',
  },
  recallOptionSelected: {
    backgroundColor: 'rgba(255, 254, 119, 0.15)',
    borderColor: '#FFFE77',
  },
  recallText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#a8ad8e',
  },
  recallTextSelected: {
    color: '#FFFE77',
    fontWeight: '600' as const,
  },

});
