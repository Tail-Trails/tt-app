import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Text } from '@/components';

import { useRouter, Stack } from 'expo-router';

import { useDogs } from '@/context/DogsContext';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { ChevronDown, Camera, Upload, X } from 'lucide-react-native';
import theme from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './dog-basics.styles';

import { DogSize, DOG_SIZES } from '@/types/dog-profile';

export default function DogBasicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dogProfile } = useDogs();
  const [name, setName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [size, setSize] = useState<DogSize | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showSizePicker, setShowSizePicker] = useState<boolean>(false);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);

  useEffect(() => {
    if (dogProfile) {
      console.log('Loading existing dog profile for editing:', dogProfile);
      setName(dogProfile.name);
      setNickname(dogProfile.nickname || '');
      setAge(dogProfile.age.toString());
      setSize(dogProfile.size);
      setPhoto(dogProfile.image || null);
    }
  }, [dogProfile]);

  const pickImage = async () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

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
      if (true) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const takePhoto = async () => {
    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

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
      if (true) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
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

  const handleNext = () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your dog\'s name');
      return;
    }

    if (!size) {
      Alert.alert('Missing Information', 'Please select your dog\'s size');
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge < 0 || parsedAge > 30) {
      Alert.alert('Invalid Age', 'Please enter a valid age (0-30 years)');
      return;
    }

    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const navigationMethod = dogProfile ? 'replace' : 'push';
    router[navigationMethod]({
      pathname: '/onboarding/dog-personality' as any,
      params: {
        name: name.trim(),
        nickname: nickname.trim(),
        age: parsedAge.toString(),
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
        <TouchableOpacity
          style={[styles.closeButton, { position: 'absolute', right: 16, top: insets.top + 12 }]}
          onPress={() => router.back()}
          accessibilityLabel="Close"
        >
          <X size={20} color={theme.accentPrimary} />
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
            placeholder="Enter your dog&apos;s name"
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
              if (true) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
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
                    if (true) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSize(s);
                    setShowSizePicker(false);
                  }}
                  testID={`size-option-${s}`}
                >
                  <Text style={[styles.pickerOptionText, size === s && styles.pickerOptionTextSelected]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Age (years) *</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter age"
            placeholderTextColor="#5a6040"
            keyboardType="numeric"
            testID="dog-age-input"
          />
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { marginBottom: insets.bottom + 20 }]}
          onPress={handleNext}
          testID="next-button"
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}