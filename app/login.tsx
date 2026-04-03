import * as React from 'react';
import { View, TextInput, Pressable, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Text } from '@/components';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '@/context/AuthContext';
import { firebaseAuthExchange } from '@/lib/api';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import theme from '@/constants/colors';
import { getFirebaseAuth, signInWithEmailAndPassword, signInWithGoogle } from '@/lib/firebase';
import styles from './auth.styles';

WebBrowser.maybeCompleteAuthSession();

function normalizeToken(token: any): string | null {
  if (!token) return null;
  if (typeof token === 'string') return token;
  // Expo / native may return ArrayBuffer-like or { data: number[] }
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

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithToken } = useAuth();
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // HARDCODED: No logic, just the exact strings from your Google Cloud Console
  const GOOGLE_IOS_CLIENT_ID = "447944956309-t3me1erabpnf99e12gsc8ogf9mt84dtj.apps.googleusercontent.com";
  const REVERSED_CLIENT_ID = "com.googleusercontent.apps.447944956309-t3me1erabpnf99e12gsc8ogf9mt84dtj";
  const GOOGLE_ANDROID_CLIENT_ID = "447944956309-2nbcukm9lvh5gi6hjaikpjb7khvl12vb.apps.googleusercontent.com";
  
  const redirectUri = AuthSession.makeRedirectUri({
    // This 'scheme' property tells Expo: "Ignore the other 3 schemes, use THIS one."
    scheme: Platform.OS === 'ios' 
      ? REVERSED_CLIENT_ID 
      : 'com.tailtrailsclub.app',
    path: '', 
  });

  console.log("REDIRECT CHECK:", redirectUri);
  // Should look like: com.tailtrailsclub.app://oauth2redirect/google

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: "447944956309-t92ug0tqs40adop6mnvifqbmfsi7dtj6.apps.googleusercontent.com",
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    redirectUri: redirectUri,
  });

  React.useEffect(() => {
    (async () => {
      if (response?.type === 'success') {
        try {
          setIsLoading(true);

          // LOG THIS to see what you're actually getting
          console.log('Full Response:', JSON.stringify(response, null, 2));

          // Priority 1: idToken from the authentication object
          // Priority 2: id_token from the params
          const idToken = response.authentication?.idToken || response.params?.id_token;

          if (!idToken) {
            throw new Error('Google did not return an ID Token. Check your scopes.');
          }

          // Pass ONLY the idToken to your firebase function
          const fb = await signInWithGoogle(getFirebaseAuth(), idToken);

          const session = await firebaseAuthExchange(fb.idToken);
          await signInWithToken(session);

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/');
        } catch (err: any) {
          console.error('Google sign-in error', err);
          Alert.alert('Login Error', err?.message);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [response]);

  const handleSignIn = async () => {
    console.log('handleSignIn invoked', { email, password });
    if (!email || !password) {
      if (true) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    if (true) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim().toLowerCase(),
        password
      );
      const idToken = await credential.user.getIdToken();
      const session = await firebaseAuthExchange(idToken);
      await signInWithToken(session);
      if (true) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/');
    } catch (error: any) {
      if (true) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      console.error('Firebase sign-in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (!request) {
      Alert.alert('Google Sign-In not available');
      return;
    }
    try {
      // THE FIX: Explicitly tell the prompt NOT to use the proxy
      // This bypasses the "Must use http/https" internal validator
      await promptAsync();
    } catch (err: any) {
      console.error('Google prompt error', err);
      Alert.alert('Google Sign-In Error', err?.message || String(err));
    }
  };

  const webKeyProps: any = typeof window !== 'undefined'
    ? {
      onKeyDown: (e: any) => {
        const k = e?.nativeEvent?.key || e?.key;
        if (k === 'Enter') {
          handleSignIn();
        }
      },
    }
    : {};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://api.tailtrails.club/assets/logo' }}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to track your dog walks</Text>
        </View>

        <View style={styles.form}>
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
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}
            onPress={handleSignIn}
            {...webKeyProps}
            accessibilityRole="button"
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.backgroundPrimary} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGooglePress}
            disabled={!request}
          >
            <Text style={styles.secondaryButtonText}>Log in with Google</Text>
          </TouchableOpacity>

          {/* ... */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => {
              if (true) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/signup');
            }}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}