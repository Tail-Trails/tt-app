import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '@/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import accountStyles from './account.styles';
import theme from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '@/lib/api';
import * as Haptics from 'expo-haptics';

const Icon = require('../../../assets/images/icon.png');

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useAuth();
  const { userProfile, updateAccount } = useAccount();
  const { user, session } = auth || {};

  const [editedName, setEditedName] = React.useState<string>('');
  const [editedPhoto, setEditedPhoto] = React.useState<string | number>('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const defaultName = userProfile?.name || user?.email?.split('@')[0] || '';
    const defaultPhoto = userProfile?.image || Icon;
    setEditedName(defaultName);
    setEditedPhoto(defaultPhoto);
  }, [user, userProfile]);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditedPhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      let finalPhoto: string | undefined;

      if (typeof editedPhoto === 'string' && editedPhoto && !editedPhoto.startsWith('http')) {
        if (!session?.accessToken || !user?.id) throw new Error('No active session for upload');

        const form = new FormData();
        const uriParts = editedPhoto.split('/');
        const fileName = uriParts[uriParts.length - 1] || `photo_${Date.now()}.jpg`;
        const extMatch = fileName.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
        const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        // @ts-ignore
        form.append('file', { uri: editedPhoto, name: fileName, type: mimeType });
        form.append('filename', fileName);
        form.append('dog_id', '');
        form.append('trail_id', '');
        form.append('user_id', user.id);

        const uploadResp = await fetch(`${API_URL}/uploads`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            accept: 'application/json',
          },
          body: form as any,
        });

        if (!uploadResp.ok) {
          const errText = await uploadResp.text();
          throw new Error(`Upload failed: ${uploadResp.status} ${errText}`);
        }

        const uploadData = await uploadResp.json();
        finalPhoto = uploadData.public_url || uploadData.publicUrl || uploadData.url;
        if (!finalPhoto) throw new Error('Upload did not return a public URL');
      } else if (typeof editedPhoto === 'string' && editedPhoto.startsWith('http')) {
        finalPhoto = editedPhoto;
      }

      await updateAccount({ name: editedName.trim(), image: finalPhoto });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully!');
      router.push('/settings');
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[accountStyles.container, { paddingTop: insets.top }]}> 
      <View style={accountStyles.header}>
        <TouchableOpacity style={accountStyles.backButton} onPress={() => router.push('/settings')}>
          <ArrowLeft size={20} color={theme.accentPrimary} />
        </TouchableOpacity>
        <Text style={accountStyles.title}>Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={accountStyles.modalContent}>
        <View style={accountStyles.photoSection}>
          <TouchableOpacity style={accountStyles.photoContainer} onPress={handlePickImage}>
            {editedPhoto ? (
              <Image source={editedPhoto} style={accountStyles.editPhoto} contentFit="cover" />
            ) : (
              <View style={[accountStyles.editPhoto, accountStyles.initialAvatar]}>
                <Text style={accountStyles.initialAvatarText}>{(editedName || userProfile?.name || user?.email || 'A').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={accountStyles.cameraOverlay}>
              <Camera size={20} color={theme.accentPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={accountStyles.photoHint}>Tap to change photo</Text>
        </View>

        <View style={accountStyles.inputSection}>
          <Text style={accountStyles.inputLabel}>Name</Text>
          <TextInput style={accountStyles.input} value={editedName} onChangeText={setEditedName} placeholder="Enter your name" placeholderTextColor={theme.textMuted} />
        </View>

        <View style={accountStyles.inputSection}>
          <Text style={accountStyles.inputLabel}>Email</Text>
          <View style={accountStyles.disabledInput}>
            <Text style={accountStyles.disabledInputText}>{user?.email}</Text>
          </View>
          <Text style={accountStyles.inputHint}>Email cannot be changed</Text>
        </View>

        <View style={[accountStyles.modalFooter, { paddingBottom: insets.bottom + 20 }]}> 
          <TouchableOpacity style={[accountStyles.saveButton, isSaving && accountStyles.saveButtonDisabled]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={theme.accentPrimary} /> : <Text style={accountStyles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
