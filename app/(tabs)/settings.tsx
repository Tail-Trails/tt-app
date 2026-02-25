import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Text } from '@/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import styles from './settings.styles';
import theme from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import LottieLoader from '@/components/LottieLoader';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useAuth();
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
          <TouchableOpacity style={styles.row} onPress={() => handleRow('Change your password', '/settings/password')}>
            <Text style={styles.rowText}>Change your password</Text>
            <ChevronRight size={18} color={theme.accentPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Dog Profile</Text>
          <TouchableOpacity style={styles.row} onPress={() => handleRow('Dog Information', '/settings/dog-info')}>
            <Text style={styles.rowText}>Dog Information</Text>
            <ChevronRight size={18} color={theme.accentPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => handleRow('Edit Tags', '/settings/dog-tags')}>
            <Text style={styles.rowText}>Edit Tags</Text>
            <ChevronRight size={18} color={theme.accentPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Debug</Text>
          <TouchableOpacity style={styles.row} onPress={() => setShowLoader(true)}>
            <Text style={styles.rowText}>Show Lottie Loader</Text>
            <ChevronRight size={18} color={theme.accentPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
          <ChevronRight size={18} color={theme.accentPrimary} />
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
