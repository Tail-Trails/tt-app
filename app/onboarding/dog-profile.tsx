import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/components';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useDogs } from '@/context/DogsContext';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ChevronDown, Camera, Upload, ArrowLeft } from 'lucide-react-native';
import theme from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './dog-profile.styles';

import { DogSize, DOG_SIZES } from '@/types/dog-profile';

export default function DogProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dogProfile, updateDogProfile } = useDogs();
  const params = useLocalSearchParams<{ from?: string }>();
  const openedFromTab = params.from === 'profile' || params.from === 'settings';
  const openedFromSettings = params.from === 'settings';
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [name, setName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [size, setSize] = useState<DogSize | null>(null);
  const [showDOBPicker, setShowDOBPicker] = useState<boolean>(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showSizePicker, setShowSizePicker] = useState<boolean>(false);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);

  useEffect(() => {
    if (dogProfile) {
      setName(dogProfile.name);
      setNickname(dogProfile.nickname || '');
      if (dogProfile.dob) {
        const d = new Date(dogProfile.dob);
        if (!isNaN(d.getTime())) {
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const yyyy = d.getFullYear();
          setAge(`${mm}/${dd}/${yyyy}`);
          setDobDate(d);
        } else {
          setAge(dogProfile.age?.toString() || '');
        }
      } else {
        setAge(dogProfile.age?.toString() || '');
      }
      setSize(dogProfile.size);
      setPhoto(dogProfile.image || null);
    }
  }, [dogProfile]);

  const dobInputRef = useRef<TextInput | null>(null);

  const formatDateToMMDDYYYY = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // Use community datetimepicker instead of react-native-date-picker to avoid native module incompatibilities
  const NativeDatePicker = null; // keep variable for compatibility checks elsewhere if needed

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photo library');
      return;
    }

    setIsLoadingImage(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    setIsLoadingImage(false);

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera access to take photos');
      return;
    }

    setIsLoadingImage(true);
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    setIsLoadingImage(false);

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleNext = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', "Please enter your dog's name");
      return;
    }

    if (!size) {
      Alert.alert('Missing Information', "Please select your dog's size");
      return;
    }

    let parsedAge: number | null = null;
    let dobValue: string | null = null;

    const dobInput = (age || '').trim();
    const mmddyyyy = /^\d{2}\/\d{2}\/\d{4}$/;
    const yyyymmdd = /^\d{4}-\d{2}-\d{2}$/;

    if (mmddyyyy.test(dobInput)) {
      const parts = dobInput.split('/').map((p) => parseInt(p, 10));
      const dt = new Date(parts[2], (parts[0] || 1) - 1, parts[1] || 1);
      if (isNaN(dt.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid date in MM/DD/YYYY format');
        return;
      }
      const today = new Date();
      let years = today.getFullYear() - dt.getFullYear();
      const m = today.getMonth() - dt.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dt.getDate())) years--;
      parsedAge = years;
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const yyyy = dt.getFullYear();
      dobValue = `${mm}/${dd}/${yyyy}`;
    } else if (yyyymmdd.test(dobInput)) {
      const parts = dobInput.split('-').map((p) => parseInt(p, 10));
      const dt = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
      if (isNaN(dt.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format');
        return;
      }
      const today = new Date();
      let years = today.getFullYear() - dt.getFullYear();
      const m = today.getMonth() - dt.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dt.getDate())) years--;
      parsedAge = years;
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const yyyy = dt.getFullYear();
      dobValue = `${mm}/${dd}/${yyyy}`;
    } else {
      const num = parseInt(dobInput, 10);
      if (!dobInput || isNaN(num) || num < 0 || num > 30) {
        Alert.alert('Invalid Age/Date', 'Please enter a valid date (MM/DD/YYYY) or age (0-30 years)');
        return;
      }
      parsedAge = num;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If opened from profile/settings and editing, save and return to profile tab
    if (openedFromTab && dogProfile) {
      setIsSaving(true);
      try {
        const updated: any = {
          ...dogProfile,
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          size,
        };
        if (parsedAge !== null) updated.age = parsedAge;
        if (dobValue) updated.dob = dobValue;
        if (photo) updated.image = photo;
        await updateDogProfile(updated as any);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)/profile');
      } catch (err) {
        console.error('Failed to update dog profile from profile tab:', err);
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    const navigationMethod = dogProfile ? 'replace' : 'push';
    router[navigationMethod]({
      pathname: '/onboarding/dog-traits' as any,
      params: {
        name: name.trim(),
        nickname: nickname.trim(),
        age: parsedAge!.toString(),
        dob: dobValue || '',
        size,
        image: photo || '',
        isEditing: dogProfile ? 'true' : 'false',
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}> 
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (openedFromTab) router.back(); else router.push('/profile');
        }}>
          <ArrowLeft size={20} color={theme.accentPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{dogProfile ? 'Edit dog profile' : 'Tell us about your dog'}</Text>
          <Text style={styles.subtitle}>{dogProfile ? 'Update your dog\'s information' : 'Let\'s start with the basics'}</Text>
          {!dogProfile && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressDot} />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.photoContainer}
          onPress={handleImagePicker}
          disabled={isLoadingImage}
        >
          {isLoadingImage ? (
            <ActivityIndicator size="large" color="#FFFE77" />
          ) : photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera size={32} color="#FFFE77" />
              <Text style={styles.photoPlaceholderText}>Add Photo</Text>
            </View>
          )}
          {photo && !isLoadingImage && (
            <View style={styles.photoOverlay}>
              <Upload size={24} color="#1a1f0a" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formSection}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your dog\'s name"
            placeholderTextColor="#5a6040"
            autoCapitalize="words"
            testID="dog-name-input"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Nickname (Optional)</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Enter a nickname"
            placeholderTextColor="#5a6040"
            autoCapitalize="words"
            testID="dog-nickname-input"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Size *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSizePicker(!showSizePicker);
            }}
            testID="size-picker-button"
          >
            <Text style={[styles.pickerButtonText, !size && styles.pickerButtonTextPlaceholder]}>
              {size || 'Select size'}
            </Text>
            <ChevronDown size={20} color="#a8ad8e" />
          </TouchableOpacity>
          {showSizePicker && (
            <View style={styles.pickerOptions}>
              {DOG_SIZES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pickerOption, size === s && styles.pickerOptionSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSize(s);
                    setShowSizePicker(false);
                  }}
                  testID={`size-option-${s}`}
                >
                  <Text style={[styles.pickerOptionText, size === s && styles.pickerOptionTextSelected]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Date of birth *</Text>
          <TextInput
            ref={dobInputRef}
            style={styles.input}
            value={age}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '').slice(0, 8);
              let formatted = digits;
              if (digits.length > 4) {
                formatted = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`;
              } else if (digits.length > 2) {
                formatted = `${digits.slice(0,2)}/${digits.slice(2,4)}`;
              }
              setAge(formatted);
            }}
            onFocus={() => {
              dobInputRef.current?.blur();
              setShowDOBPicker(true);
            }}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#5a6040"
            keyboardType="default"
            testID="dog-dob-input"
          />
        </View>

        {Platform.OS !== 'web' && showDOBPicker ? (
          <DateTimePicker
            value={dobDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(_event, selectedDate) => {
              setShowDOBPicker(false);
              if (selectedDate) {
                setDobDate(selectedDate);
                setAge(formatDateToMMDDYYYY(selectedDate));
              }
            }}
          />
        ) : null}

        <TouchableOpacity
          style={[styles.nextButton, { marginBottom: insets.bottom + 20 }]}
          onPress={handleNext}
          disabled={isSaving}
          testID={openedFromSettings ? 'save-button' : 'next-button'}
        >
          {isSaving ? (
            <ActivityIndicator color="#1a1f0a" />
          ) : (
            <Text style={styles.nextButtonText}>{openedFromSettings && dogProfile ? 'Save' : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
