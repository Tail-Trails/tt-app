import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Text } from '@/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useDogs } from '@/context/DogsContext';
import styles from './settings.styles';
import theme from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import LottieLoader from '@/components/LottieLoader';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useAuth();
  const { dogProfile } = useDogs();
  const [showLoader, setShowLoader] = useState(false);

  const handleRow = (label: string, path?: string) => {
    if (path) {
      router.push(path as any);
      return;
    }
    Alert.alert(label);
  };

  const handleLogout = async () => {
    try {
      if (auth?.signOut) {
        await auth.signOut();
      }
    } catch (err) {
      console.error('Logout failed', err);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setShowLoader(true);
              const token = auth?.session?.accessToken;
              const tokenType = auth?.session?.tokenType || 'Bearer';
              if (!token) throw new Error('Not authenticated');

              const res = await fetch(`${API_URL}/account/authenticated/me`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `${tokenType} ${token}`,
                },
              });

              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to delete account');
              }

              // Successful deletion — clear local session and navigate home
              if (auth?.signOut) await auth.signOut();
              Alert.alert('Account deleted', 'Your account has been deleted.');
              router.replace('/');
            } catch (err: any) {
              console.error('Delete account failed', err);
              Alert.alert('Error', err?.message || 'Failed to delete account');
            } finally {
              setShowLoader(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/profile')}>
          <ArrowLeft size={20} color={theme.accentPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your Account</Text>
          <TouchableOpacity style={styles.row} onPress={() => handleRow('Account Information', '/settings/account')}>
            <Text style={styles.rowText}>Account Information</Text>
            <ChevronRight size={18} color={theme.accentPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => handleRow('Privacy and Safety', '/settings/privacy')}>
            <Text style={styles.rowText}>Privacy and Safety</Text>
            <ChevronRight size={18} color={theme.accentPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Dog Account</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push({ pathname: '/onboarding/dog-profile', params: { from: 'settings' } } as any)}>
            <Text style={styles.rowText}>Dog Profile</Text>
            <ChevronRight size={18} color={theme.accentPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              if (dogProfile) {
                router.push({
                  pathname: '/onboarding/dog-traits',
                  params: {
                    from: 'settings',
                    name: dogProfile.name,
                    nickname: dogProfile.nickname || '',
                    age: dogProfile.age?.toString() || '',
                    dob: dogProfile.dob || '',
                    size: dogProfile.size || '',
                    image: dogProfile.image || '',
                    isEditing: 'true',
                  },
                } as any);
              } else {
                router.push('/onboarding/dog-traits');
              }
            }}
          >
            <Text style={styles.rowText}>Dog Traits</Text>
            <ChevronRight size={18} color={theme.accentPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
          <ChevronRight size={18} color={theme.accentPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>

      {showLoader && (
        <View style={overlayStyles.overlay}>
          <View style={overlayStyles.container}>
            <LottieLoader size={220} />
            <TouchableOpacity style={overlayStyles.close} onPress={() => setShowLoader(false)}>
              <Text style={overlayStyles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  close: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  closeText: {
    color: '#111827',
    fontWeight: '600',
  },
});
