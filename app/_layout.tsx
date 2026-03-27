import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from "react";
import { StyleSheet, View, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import colors from "@/constants/colors";

// Context Imports
import { AuthContext, useAuth } from '@/context/AuthContext';
import { AccountContext } from '@/context/AccountContext';
import { TrailsContext } from '@/context/TrailsContext';
import { DogsContext, useDogs } from '@/context/DogsContext';
import LottieLoader from '@/components/LottieLoader';
import { Text } from '@/components';
import { MessageSquareQuote } from 'lucide-react-native';
import { API_URL } from '@/lib/api';

// 1. Prevent the splash screen from auto-hiding immediately.
// This must be called at the top level, outside any component.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Reloading in development sometimes triggers a rejection here; we safely ignore it */
});

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading, session } = useAuth();
  const { hasDogProfile, isDogProfileLoading } = useDogs();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  async function submitFeedback(message: string) {
    setIsSubmittingFeedback(true);
    try {
      const headers: Record<string, string> = {};
      if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

      const res = await fetch(`${API_URL}/feedback?message=${encodeURIComponent(message)}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Failed to send feedback');
      setFeedbackText('');
      setIsFeedbackOpen(false);
    } catch (err) {
      console.error('Feedback error', err);
      Alert.alert('Error', 'Failed to send feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  // 2. SYNC SPLASH SCREEN HIDING
  // We only hide the splash once the AUTH and DOG data are settled.
  useEffect(() => {
    if (!isLoading && !isDogProfileLoading) {
      // Small delay ensures the first frame of the app is rendered 
      // before the splash screen is pulled away on Android.
      const timer = setTimeout(async () => {
        await SplashScreen.hideAsync().catch(() => { });
        setIsReady(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isDogProfileLoading]);

  // 3. NAVIGATION LOGIC
  useEffect(() => {
    // Only run navigation logic once we aren't loading and the UI is ready
    if (isLoading || isDogProfileLoading || !isReady) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLoginOrSignup = segments[0] === 'login' || segments[0] === 'signup';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && (inAuthGroup || inOnboarding)) {
      router.replace('/login');
    } else if (isAuthenticated && !hasDogProfile && !inOnboarding) {
      router.replace('/onboarding/dog-profile');
    } else if (isAuthenticated && hasDogProfile && inLoginOrSignup) {
      router.replace('/(tabs)/explore');
    }
  }, [isAuthenticated, hasDogProfile, segments, isLoading, isDogProfileLoading, isReady]);

  // 1. If we are still determining auth or dog status, show loader
  if (isLoading || isDogProfileLoading) {
    return <LottieLoader />;
  }

  // 2. If the splash screen hasn't finished hiding, don't mount the Stack yet
  // This prevents the "stale" error during the quick transition from 
  // "Logged Out" -> "Logged In"
  if (!isReady) {
    return <LottieLoader />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trail/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="trail/[id]/edit" options={{ headerShown: false }} />
      </Stack>

      {/* Feedback Modal */}
      <Modal visible={isFeedbackOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ marginBottom: 20 }}>Send Feedback</Text>
            <TextInput
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Tell us what's on your mind..."
              multiline
              style={styles.feedbackInput}
              editable={!isSubmittingFeedback}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ddd' }]} onPress={() => setIsFeedbackOpen(false)} disabled={isSubmittingFeedback}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.backgroundPrimary }]} onPress={() => submitFeedback(feedbackText)} disabled={isSubmittingFeedback || !feedbackText.trim()}>
                {isSubmittingFeedback ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Floating feedback button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsFeedbackOpen(true)}
        accessibilityLabel="Send feedback"
      >
        <MessageSquareQuote size={22} color={colors.backgroundPrimary} />
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <AuthContext>
          <AccountContext>
            <DogsContext>
              <TrailsContext>
                <RootLayoutNav />
              </TrailsContext>
            </DogsContext>
          </AccountContext>
        </AuthContext>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 30,
    bottom: 120,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  feedbackInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top'
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  }
});