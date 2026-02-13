import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { firebaseAuthExchange } from '@/lib/api';
import { UserPlus } from 'lucide-react-native';
import { getFirebaseAuth, createUserWithEmailAndPassword, updateProfile, signInWithGoogle } from '@/lib/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import styles from './auth.styles';

WebBrowser.maybeCompleteAuthSession();

function normalizeToken(token: any): string | null {
  if (!token) return null;
  if (typeof token === 'string') return token;
  try {
    if (token instanceof ArrayBuffer) {
      const view = new Uint8Array(token);
      let s = '';
      for (let i = 0; i < view.length; i++) s += String.fromCharCode(view[i]);
      return decodeURIComponent(escape(s));
    }
    if (token && typeof token === 'object' && Array.isArray((token as any).data)) {
      const arr = (token as any).data as number[];
      let s = '';
      for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
      return decodeURIComponent(escape(s));
    }
    return String(token);
  } catch (err) {
    return String(token);
  }
}

export default function SignupScreen() {
  const router = useRouter();
  const { signInWithToken } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const extra = (Constants.expoConfig && (Constants.expoConfig.extra as any)) || {};
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   webClientId: extra.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  //   clientId: extra.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  //   iosClientId: extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  //   androidClientId: extra.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  //   scopes: ['profile', 'email'],
  //   // request an access token so we can sign into Firebase client-side
  //   responseType: 'token',
  // });

    const [request, response, promptAsync] = Google.useAuthRequest({
      // Use the env variables directly with fallback to your 'extra' logic
      webClientId: '447944956309-t92ug0tqs40adop6mnvifqbmfsi7dtj6.apps.googleusercontent.com',
      // webClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || extra.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      // Note: 'clientId' is usually the proxy/default ID
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || extra.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      scopes: ['profile', 'email'],
      responseType: 'token',
    });

  React.useEffect(() => {
    (async () => {
      if (response?.type === 'success') {
        try {
          setIsLoading(true);
          // normalize potential ArrayBuffer/bytes to string
          const rawToken = response.authentication?.accessToken || response.authentication?.idToken;
          const tokenStr = normalizeToken(rawToken);
          if (!tokenStr) throw new Error('No access token from Google');
          // Sign into Firebase with the Google token to obtain a Firebase ID token (JWT)
          const fb = await signInWithGoogle(getFirebaseAuth(), tokenStr);
          const session = await firebaseAuthExchange(fb.idToken);
          await signInWithToken(session);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          router.replace('/');
        } catch (err: any) {
          console.error('Google sign-up error', err);
          Alert.alert('Google Sign-Up Error', err?.message || String(err));
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [response]);

  const handleSignUp = async () => {
    if (!email || !name || !password) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim().toLowerCase(),
        password
      );
      if (name.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }
      const idToken = await credential.user.getIdToken(true);
      const session = await firebaseAuthExchange(idToken);
      await signInWithToken(session);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/');
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      console.error('Firebase sign-up error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <UserPlus size={64} color="#5d6b4a" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start tracking your dog walks</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.button, { marginTop: 8, backgroundColor: '#db4437' }]}
            onPress={async () => {
              try {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                setIsLoading(true);
                // Use native flow (no proxy) for dev-client / standalone.
                await promptAsync();
              } catch (err: any) {
                console.error('Prompt Google Auth error', err);
                Alert.alert('Error', err?.message || String(err));
                setIsLoading(false);
              }
            }}
            disabled={!request || isLoading}
          >
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity> */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/login');
            }}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}