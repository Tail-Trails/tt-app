import * as React from 'react';
import { Text, View, TextInput, Pressable, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
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

  const _extraFromConstants = (Constants.expoConfig && (Constants.expoConfig.extra as any)) || (Constants.manifest && (Constants.manifest.extra as any)) || {};
  const extra = {
    EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID: _extraFromConstants.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: _extraFromConstants.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: _extraFromConstants.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: _extraFromConstants.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  } as any;

  if (typeof window !== 'undefined' && !extra.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID) {
    // Helpful developer warning when running on web without a webClientId
    // (Expo's Constants.expoConfig.extra isn't always populated on web/dev server).
    // eslint-disable-next-line no-console
    console.warn('Google web client id (EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID) is not defined. Google auth on web requires a webClientId.');
  }

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
          console.error('Google sign-in error', err);
          Alert.alert('Google Sign-In Error', err?.message || String(err));
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [response]);

  const handleSignIn = async () => {
    console.log('handleSignIn invoked', { email, password });
    if (!email || !password) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    if (Platform.OS !== 'web') {
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
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/');
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      console.error('Firebase sign-in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in');
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
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}
            onPress={handleSignIn}
            onKeyDown={(e: any) => {
              // allow Enter key activation on web
              const k = e?.nativeEvent?.key || e?.key;
              if (k === 'Enter') {
                handleSignIn();
              }
            }}
            accessibilityRole="button"
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>

          {/* <Pressable
            style={({ pressed }) => [styles.button, { marginTop: 8, backgroundColor: '#db4437' }, pressed && styles.buttonPressed]}
            onPress={async () => {
              try {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                setIsLoading(true);
                // Use the native flow (no proxy) in development client / standalone builds.
                await promptAsync();
              } catch (err: any) {
                console.error('Prompt Google Auth error', err);
                Alert.alert('Error', err?.message || String(err));
                setIsLoading(false);
              }
            }}
            disabled={!request || isLoading}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </Pressable> */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => {
              if (Platform.OS !== 'web') {
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