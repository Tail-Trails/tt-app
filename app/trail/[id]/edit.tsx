import { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, Image as RNImage } from 'react-native';
import { Text } from '@/components';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrails } from '@/context/TrailsContext';
import TrailTraits from '@/components/TrailTraits';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import theme from '@/constants/colors';
import styles from './edit.styles';
import * as ImagePicker from 'expo-image-picker';

export default function EditTrailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { getTrailById, updateTrailDetails, updateTrailPhoto, deleteTrailImage } = useTrails();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [trail, setTrail] = useState<any>(null);
  const initialTrailRef = useRef<{ name: string; description: string; photoKeys: string[]; dogTraffic?: number; footTraffic?: number; paths?: number; exposure?: number; offLeash?: boolean; wildlife?: boolean } | null>(null);

  const normalizePhotos = (value: any): { id?: string; uri: string; local?: boolean }[] => {
    if (Array.isArray(value?.images)) {
      return value.images
        .map((image: any) => {
          if (typeof image === 'string') return { uri: image };
          if (image?.url) return { id: image.id, uri: image.url };
          return null;
        })
        .filter((image: any) => !!image?.uri);
    }
    return (value?.photos || value?.urls || [])
      .filter((url: any) => typeof url === 'string' && url.length > 0)
      .map((uri: string) => ({ uri }));
  };

  useEffect(() => {
    (async () => {
      if (typeof id !== 'string') return setIsLoading(false);
      setIsLoading(true);
      try {
        const t = await getTrailById(id);
        const normalizedPhotos = normalizePhotos(t);
        initialTrailRef.current = {
          name: String((t as any)?.name || ''),
          description: String((t as any)?.description || ''),
          photoKeys: normalizedPhotos.map((photo) => photo.id || photo.uri),
          dogTraffic: (t as any)?.dogTraffic ?? 50,
          footTraffic: (t as any)?.footTraffic ?? 50,
          paths: (t as any)?.paths ?? 50,
          exposure: (t as any)?.exposure ?? 50,
          offLeash: !!(t as any)?.offLeash,
          wildlife: !!(t as any)?.wildlife,
        };
        setTrail({
          ...t,
          photos: normalizedPhotos,
        });
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load trail');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [getTrailById, id]);

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
      const initial = initialTrailRef.current;
      const currentName = String(trail.name || '');
      const currentDescription = String(trail.description || '');
      const currentPhotos = Array.isArray(trail.photos) ? trail.photos : [];
      const currentPhotoKeys = currentPhotos.map((photo: any) => photo?.id || photo?.uri).filter(Boolean);
      const localPhotosToUpload = currentPhotos.filter((photo: any) => !photo?.id && typeof photo?.uri === 'string').map((photo: any) => photo.uri);

      const detailsChanged = !initial
        || currentName !== initial.name
        || currentDescription !== initial.description
        || (Number(trail.dogTraffic || 0) !== Number(initial.dogTraffic || 0))
        || (Number(trail.footTraffic || 0) !== Number(initial.footTraffic || 0))
        || (Number(trail.paths || 0) !== Number(initial.paths || 0))
        || (Number(trail.exposure || 0) !== Number(initial.exposure || 0))
        || (!!trail.offLeash !== !!initial.offLeash)
        || (!!trail.wildlife !== !!initial.wildlife);

      const photosChanged = !initial
        || currentPhotoKeys.length !== initial.photoKeys.length
        || currentPhotoKeys.some((photoKey: string, index: number) => photoKey !== initial.photoKeys[index]);

      if (!detailsChanged && !photosChanged) {
        router.back();
        return;
      }

      if (detailsChanged) {
        await updateTrailDetails(trail.id, {
          name: trail.name,
          description: trail.description,
          dogTraffic: trail.dogTraffic,
          footTraffic: trail.footTraffic,
          paths: trail.paths,
          exposure: trail.exposure,
          offLeash: trail.offLeash,
          wildlife: trail.wildlife,
        });
      }

      // If user added photos, upload/update them on the trail
      if (photosChanged && localPhotosToUpload.length > 0) {
        try {
          await updateTrailPhoto(trail.id, localPhotosToUpload);
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
        setTrail((prev: any) => ({
          ...prev,
          photos: [...(prev?.photos || []), ...uris.map((uri) => ({ uri, local: true }))],
        }));
      }
    } catch (err) {
      console.error('Image pick error', err);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleDeleteImage = (index: number) => {
    const target = trail?.photos?.[index];
    if (!target) return;

    Alert.alert('Delete image?', 'This will remove the image from this trail.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (target.id) {
              await deleteTrailImage(trail.id, target.id);
            }
            setTrail((prev: any) => ({
              ...prev,
              photos: (prev?.photos || []).filter((_: any, i: number) => i !== index),
            }));
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          } catch (err: any) {
            console.error('Delete image error', err);
            Alert.alert('Error', err?.message || 'Failed to delete image');
          }
        },
      },
    ]);
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

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(120, insets.bottom + 80) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput value={trail.name || ''} onChangeText={(t) => setTrail((prev: any) => ({ ...prev, name: t }))} placeholder="Trail name" style={styles.input} />

          <Text style={styles.label}>Description</Text>
          <TextInput value={String(trail.description || '')} onChangeText={(t) => setTrail((prev: any) => ({ ...prev, description: t }))} placeholder="Trail Description" style={styles.input} />

          <View style={styles.moreCard}>
            <Text style={styles.cardTitle}>Add photos?</Text>
            <Text style={styles.cardSub}>Add highlights from this trail</Text>

            <View style={styles.photoRow}>
              {(trail.photos || []).map((p: any, i: number) => (
                <View key={p?.id || p?.uri || i} style={styles.thumbWrap}>
                  <RNImage source={{ uri: p.uri }} style={[styles.thumb, { zIndex: i }]} />
                  <TouchableOpacity style={styles.deleteImageButton} onPress={() => handleDeleteImage(i)}>
                    <X size={14} color={theme.backgroundPrimary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.addPhotoBox} onPress={pickImages}>
              <Text style={styles.plusSign}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.traitsCard}>
            <TrailTraits trail={trail} setTrail={setTrail} />
          </View>
        </View>
      </ScrollView>


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