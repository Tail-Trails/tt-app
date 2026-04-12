import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { Text } from '@/components';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './dog-traits.styles';
import theme from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useDogs } from '@/context/DogsContext';
import { API_URL } from '@/lib/api';
import Slider from '@react-native-community/slider';

export default function DogTraitsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    nickname?: string;
    age: string;
    dob?: string;
    size: string;
    image?: string;
    isEditing?: string;
    from?: string;
  }>();
  const openedFromSettings = params.from === 'settings';
  const openedFromTab = params.from === 'profile' || params.from === 'settings';
  const { user } = useAuth();
  const { dogProfile, refreshDogProfile, createDogProfile, updateDogProfile } = useDogs();
  const { session } = useAuth();
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

  const handleCancel = () => {
    router.back();
  };

  useEffect(() => {
    if (dogProfile && isEditing) {
      // load existing trait values when editing
      // load existing trait values when editing (fallbacks kept)
      setDogTolerance(dogProfile.dogTolerance ?? 50);
      setNervousAroundPeople(!!dogProfile.nervous_around_people);
      setOffleashReliability(dogProfile.offleash_reliability ?? 50);
      setStimulationTolerance(dogProfile.stimulation_tolerance ?? 50);
      setHighPreyDrive(!!dogProfile.high_prey_drive);
      setWalkingNeed(dogProfile.walking_need ?? 50);
      setSensitiveToHeat(!!dogProfile.sensitive_to_heat);
    }
  }, [dogProfile, isEditing]);

  useEffect(() => {
    const loadTraits = async () => {
      if (!openedFromSettings || !isEditing || !dogProfile?.id || !session) return;
      try {
        const resp = await fetch(`${API_URL}/dog/${dogProfile.id}/dog-traits`, {
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (data) {
          setDogTolerance(data.dogTolerance ?? 50);
          setNervousAroundPeople(!!data.nervousAroundPeople);
          setOffleashReliability(data.offleashReliability ?? 50);
          setStimulationTolerance(data.stimulationTolerance ?? 50);
          setHighPreyDrive(!!data.highPreyDrive);
          setWalkingNeed(data.walkingNeed ?? 50);
          setSensitiveToHeat(!!data.sensitiveToHeat);
        }
      } catch (err) {
        console.error('Failed to load dog traits from /dog/{id}/dog-traits', err);
      }
    };
    loadTraits();
  }, [openedFromSettings, isEditing, dogProfile?.id, session]);

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
        // include date of birth if provided (ISO YYYY-MM-DD)
        dob: params.dob || undefined,
        image: params.image || undefined,
        // trait fields: sliders are 1-100 values, toggles are booleans
        dogTolerance: dogTolerance,
        nervousAroundPeople: nervousAroundPeople,
        offleashReliability: offleashReliability,
        stimulationTolerance: stimulationTolerance,
        highPreyDrive: highPreyDrive,
        walkingNeed: walkingNeed,
        sensitiveToHeat: sensitiveToHeat,
      };

      console.log('Dog profile data:', profileData);

      if (isEditing && dogProfile?.id) {
        if (openedFromSettings && session) {
          // Use specific dog-traits PUT endpoint
          const payload: any = {
            dogTolerance,
            nervousAroundPeople,
            offleashReliability,
            stimulationTolerance,
            highPreyDrive,
            walkingNeed,
            sensitiveToHeat,
          };
          try {
            const resp = await fetch(`${API_URL}/dog/${dogProfile.id}/dog-traits`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
              },
              body: JSON.stringify(payload),
            });
            if (!resp.ok) {
              const err = await resp.json().catch(() => ({}));
              throw new Error(err.detail?.[0]?.msg || 'Failed to update dog traits');
            }
            await refreshDogProfile();
          } catch (err) {
            console.error('Failed to update dog traits via /dog/{id}/dog-traits', err);
            throw err;
          }
        } else {
          await updateDogProfile({ ...profileData, id: dogProfile.id });
        }
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
          <TouchableOpacity onPress={handleCancel} style={styles.header}>
            <ArrowLeft size={20} color={theme.accentPrimary} />
          </TouchableOpacity>
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
          {!(openedFromSettings && isEditing) && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isSaving}
              testID="back-button"
            >
              <ChevronLeft size={24} color="#FFFE77" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.finishButton, isSaving && styles.finishButtonDisabled]}
            onPress={async () => {
              await handleFinish();
            }}
            disabled={isSaving}
            testID={openedFromSettings && isEditing ? 'save-button' : 'finish-button'}
          >
            {isSaving ? (
              <ActivityIndicator color="#1a1f0a" />
            ) : (
              <Text style={styles.finishButtonText}>{openedFromSettings && isEditing ? 'Save' : (isEditing ? 'Save' : 'Finish')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
