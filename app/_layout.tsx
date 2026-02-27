import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Context Imports
import { AuthContext, useAuth } from '@/context/AuthContext';
import { AccountContext } from '@/context/AccountContext';
import { TrailsContext } from '@/context/TrailsContext';
import { DogsContext, useDogs } from '@/context/DogsContext';
import LottieLoader from '@/components/LottieLoader';

// 1. Prevent the splash screen from auto-hiding immediately.
// This must be called at the top level, outside any component.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Reloading in development sometimes triggers a rejection here; we safely ignore it */
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasDogProfile, isDogProfileLoading } = useDogs();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // 2. SYNC SPLASH SCREEN HIDING
  // We only hide the splash once the AUTH and DOG data are settled.
  useEffect(() => {
    if (!isLoading && !isDogProfileLoading) {
      // Small delay ensures the first frame of the app is rendered 
      // before the splash screen is pulled away on Android.
      const timer = setTimeout(async () => {
        await SplashScreen.hideAsync().catch(() => {});
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
      router.replace('/onboarding/dog-basics');
    } else if (isAuthenticated && hasDogProfile && inLoginOrSignup) {
      router.replace('/(tabs)/explore');
    }
  }, [isAuthenticated, hasDogProfile, segments, isLoading, isDogProfileLoading, isReady]);

  // While data is fetching, we show the Loader (which will be behind the splash screen initially)
  if (isLoading || isDogProfileLoading) {
    return <LottieLoader />;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="trail/[id]" options={{ headerShown: false }} />
    </Stack>
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
});