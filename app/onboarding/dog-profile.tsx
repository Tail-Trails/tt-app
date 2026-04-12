import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ScrollView, Platform, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/components';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useDogs } from '@/context/DogsContext';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
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
  const { dogProfile, updateDogProfile, refreshDogProfile } = useDogs();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ from?: string }>();
  const openedFromTab = params.from === 'profile' || params.from === 'settings';
  const openedFromSettings = params.from === 'settings';
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [name, setName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [tempDobDate, setTempDobDate] = useState<Date | null>(null);
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
          setAge(formatDateToDisplay(d));
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

  useEffect(() => {
    const loadProfile = async () => {
      if (!openedFromSettings || !dogProfile?.id || !session) return;
      try {
        const resp = await fetch(`${API_URL}/dog/${dogProfile.id}/dog-profile`, {
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (data) {
          setName(data.name || '');
          setNickname(data.nickname || '');
          if (data.dob) {
            const d = new Date(data.dob);
            if (!isNaN(d.getTime())) {
              setAge(formatDateToDisplay(d));
              setDobDate(d);
            } else {
              setAge(data.age?.toString() || '');
            }
          } else {
            setAge(data.age?.toString() || '');
          }
          setSize(data.size || null);
          setPhoto(data.image || null);
        }
      } catch (err) {
        console.error('Failed to load dog profile from /dog/{id}/dog-profile', err);
      }
    };
    loadProfile();
  }, [openedFromSettings, dogProfile?.id, session]);

  // dobInputRef removed — using direct picker trigger instead of text input

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const formatDateToMMDDYYYY = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const formatDateToDisplay = (d: Date) => {
    const dd = String(d.getDate());
    const month = MONTH_NAMES[d.getMonth()];
    const yyyy = d.getFullYear();
    return `${dd} ${month} ${yyyy}`;
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
    const ddMonthyyyy = /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/;

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
    } else if (ddMonthyyyy.test(dobInput)) {
      const parts = dobInput.split(/\s+/);
      const day = parseInt(parts[0], 10);
      const monthToken = parts[1];
      const year = parseInt(parts[2], 10);
      const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(monthToken.toLowerCase().slice(0,3)));
      if (monthIndex === -1) {
        Alert.alert('Invalid Date', 'Please enter a valid date like "10 August 2021"');
        return;
      }
      const dt = new Date(year, monthIndex, day);
      if (isNaN(dt.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid date like "10 August 2021"');
        return;
      }
      const today = new Date();
      let years = today.getFullYear() - dt.getFullYear();
      const m = today.getMonth() - dt.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dt.getDate())) years--;
      parsedAge = years;
      dobValue = formatDateToMMDDYYYY(dt);
    } else {
      const num = parseInt(dobInput, 10);
      if (!dobInput || isNaN(num) || num < 0 || num > 30) {
        Alert.alert('Invalid Age/Date', 'Please enter a valid date (MM/DD/YYYY), date (DD Month YYYY) or age (0-30 years)');
        return;
      }
      parsedAge = num;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If opened from profile tab (not settings) and editing, use context update
    if (openedFromTab && dogProfile) {
      // If opened from Settings, use the specific /dog/{id}/dog-profile endpoint
      if (openedFromSettings) {
        setIsSaving(true);
        try {
          const updated: any = {
            name: name.trim(),
            nickname: nickname.trim() || undefined,
            size,
          };
          if (parsedAge !== null) updated.age = parsedAge;
          if (dobValue) updated.dob = dobValue;

          // Handle image upload if local URI
          if (typeof photo === 'string' && photo && !photo.startsWith('http')) {
            const uri = photo as string;
            const uriParts = uri.split('/');
            const fileName = uriParts[uriParts.length - 1] || `dog_${Date.now()}.jpg`;
            const extMatch = fileName.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
            const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
            const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

            const form = new FormData();
            // @ts-ignore
            form.append('file', { uri, name: fileName, type: mimeType });
            form.append('filename', fileName);
            form.append('dog_id', dogProfile.id);
            form.append('trail_id', '');
            form.append('user_id', '');

            const uploadResp = await fetch(`${API_URL}/uploads`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.accessToken}`,
                'accept': 'application/json',
              },
              body: form as any,
            });

            if (!uploadResp.ok) {
              const errText = await uploadResp.text();
              throw new Error(`Upload failed: ${uploadResp.status} ${errText}`);
            }

            const uploadData = await uploadResp.json();
            const publicUrl = uploadData.public_url || uploadData.publicUrl || uploadData.url;
            if (!publicUrl) throw new Error('Upload did not return a public URL');
            updated.image = publicUrl;
          } else if (photo) {
            updated.image = photo;
          }

          const resp = await fetch(`${API_URL}/dog/${dogProfile.id}/dog-profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.accessToken}`,
            },
            body: JSON.stringify(updated),
          });

          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.detail?.[0]?.msg || 'Failed to update dog profile');
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // refresh context data
          try { await refreshDogProfile(); } catch (e) { /* ignore */ }
          router.replace('/(tabs)/profile');
        } catch (err: any) {
          console.error('Failed to update dog profile from settings endpoint:', err);
          Alert.alert('Error', err.message || 'Failed to save changes. Please try again.');
        } finally {
          setIsSaving(false);
        }
        return;
      }

      // fallback: maintain existing context update for profile tab
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
          {/* {photo && !isLoadingImage && (
            <View style={styles.photoOverlay}>
              <Upload size={24} color="#1a1f0a" />
            </View>
          )} */}
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
          <TouchableOpacity
            style={[styles.input, styles.dateInput]}
            onPress={() => {
              setTempDobDate(dobDate || new Date());
              setShowDOBPicker(true);
            }}
            testID="dog-dob-input"
          >
            <Text style={age ? { color: theme.accentPrimary } : { color: '#5a6040' }}>
              {age || '10 August 2021'}
            </Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'ios' && showDOBPicker ? (
          <Modal
            transparent
            animationType="slide"
            visible={showDOBPicker}
            onRequestClose={() => setShowDOBPicker(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowDOBPicker(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
            </TouchableWithoutFeedback>
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
              <View style={{ backgroundColor: '#12130f', padding: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                <DateTimePicker
                  value={tempDobDate || dobDate || new Date()}
                  mode="date"
                  display="spinner"
                  textColor={theme.accentPrimary}
                  maximumDate={new Date()}
                  onChange={(_event, selectedDate) => {
                    if (selectedDate) {
                      setTempDobDate(selectedDate);
                    }
                  }}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 12, paddingVertical: 20 }}
                    onPress={() => {
                      setTempDobDate(null);
                      setShowDOBPicker(false);
                    }}
                  >
                    <Text style={{ color: '#9aa08a' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ paddingHorizontal: 12, paddingVertical: 20 }}
                    onPress={() => {
                      if (tempDobDate) {
                        setDobDate(tempDobDate);
                        setAge(formatDateToDisplay(tempDobDate));
                      }
                      setTempDobDate(null);
                      setShowDOBPicker(false);
                    }}
                  >
                    <Text style={{ color: theme.accentPrimary }}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ) : Platform.OS !== 'web' && showDOBPicker ? (
          <DateTimePicker
            value={dobDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            textColor={Platform.OS === 'ios' ? theme.accentPrimary : undefined}
            maximumDate={new Date()}
            onChange={(_event, selectedDate) => {
              setShowDOBPicker(false);
              if (selectedDate) {
                setDobDate(selectedDate);
                setAge(formatDateToDisplay(selectedDate));
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
            <Text style={styles.nextButtonText}>{openedFromSettings ? 'Save' : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
