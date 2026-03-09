import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { Text } from '@/components';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './dog-traits.styles';
import theme from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useDogs } from '@/context/DogsContext';
import Slider from '@react-native-community/slider';

export default function DogTraitsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    nickname?: string;
    age: string;
    size: string;
    image?: string;
    isEditing?: string;
  }>();
  const { user } = useAuth();
  const { dogProfile, refreshDogProfile, createDogProfile, updateDogProfile } = useDogs();
  const insets = useSafeAreaInsets();
  // recall_reliability removed — using explicit trait fields only
  // New trait states (1-100 sliders or boolean toggles)
  const [dogTolerance, setDogTolerance] = useState<number>(50);
  const [nervousAroundPeople, setNervousAroundPeople] = useState<boolean>(false);
  const [offleashReliability, setOffleashReliability] = useState<number>(50);
  const [stimulationTolerance, setStimulationTolerance] = useState<number>(50);
  const [highPreyDrive, setHighPreyDrive] = useState<boolean>(false);
  const [walkingNeed, setWalkingNeed] = useState<number>(50);
  const [sensitiveToHeat, setSensitiveToHeat] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const isEditing = params.isEditing === 'true';

  useEffect(() => {
    if (dogProfile && isEditing) {
      // load existing trait values when editing
      // load existing trait values when editing (fallbacks kept)
      setDogTolerance(dogProfile.dog_tolerance ?? 50);
      setNervousAroundPeople(!!dogProfile.nervous_around_people);
      setOffleashReliability(dogProfile.offleash_reliability ?? 50);
      setStimulationTolerance(dogProfile.stimulation_tolerance ?? 50);
      setHighPreyDrive(!!dogProfile.high_prey_drive);
      setWalkingNeed(dogProfile.walking_need ?? 50);
      setSensitiveToHeat(!!dogProfile.sensitive_to_heat);
    }
  }, [dogProfile, isEditing]);

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
        image: params.image || undefined,
        // trait fields: sliders are 1-100 values, toggles are booleans
        dog_tolerance: dogTolerance,
        nervous_around_people: nervousAroundPeople,
        offleash_reliability: offleashReliability,
        stimulation_tolerance: stimulationTolerance,
        high_prey_drive: highPreyDrive,
        walking_need: walkingNeed,
        sensitive_to_heat: sensitiveToHeat,
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
            <Text style={styles.title}>Dog Traits</Text>
            <Text style={styles.subtitle}>Help us understand your dog</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Dog tolerance</Text>
            <Slider
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={dogTolerance}
              onValueChange={(v: number) => setDogTolerance(Math.round(v))}
              minimumTrackTintColor="#3d4520"
              maximumTrackTintColor="#646a3a"
              thumbTintColor="#FFFFFF"
              style={styles.slider}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperLeft}>Reactive</Text>
              <Text style={styles.helperRight}>Friendly</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Nervous around people</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.helperText}>Yes / No</Text>
              <Switch
                value={nervousAroundPeople}
                onValueChange={setNervousAroundPeople}
                trackColor={{ false: '#282E10', true: '#3d4520' }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Off-leash reliability</Text>
            <Slider
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={offleashReliability}
              onValueChange={(v: number) => setOffleashReliability(Math.round(v))}
              minimumTrackTintColor="#3d4520"
              maximumTrackTintColor="#646a3a"
              thumbTintColor="#FFFFFF"
              style={styles.slider}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperLeft}>Unreliable</Text>
              <Text style={styles.helperRight}>Reliable</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Stimulation tolerance</Text>
            <Slider
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={stimulationTolerance}
              onValueChange={(v: number) => setStimulationTolerance(Math.round(v))}
              minimumTrackTintColor="#3d4520"
              maximumTrackTintColor="#646a3a"
              thumbTintColor="#FFFFFF"
              style={styles.slider}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperLeft}>Low tolerance</Text>
              <Text style={styles.helperRight}>High tolerance</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>High prey drive</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.helperText}>Yes / No</Text>
              <Switch
                value={highPreyDrive}
                onValueChange={setHighPreyDrive}
                trackColor={{ false: '#282E10', true: '#3d4520' }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Walking need</Text>
            <Slider
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={walkingNeed}
              onValueChange={(v: number) => setWalkingNeed(Math.round(v))}
              minimumTrackTintColor="#3d4520"
              maximumTrackTintColor="#646a3a"
              thumbTintColor="#FFFFFF"
              style={styles.slider}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperLeft}>Short walks</Text>
              <Text style={styles.helperRight}>Long walks</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Sensitive to heat</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.helperText}>Yes / No</Text>
              <Switch
                value={sensitiveToHeat}
                onValueChange={setSensitiveToHeat}
                trackColor={{ false: theme.backgroundSecondary, true: theme.backgroundSecondaryVarient }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
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
