import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useRouter, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthContext, useAuth } from '@/context/AuthContext';
import { AccountContext } from '@/context/AccountContext';
import { TrailsContext } from '@/context/TrailsContext';

import { DogsContext, useDogs } from '@/context/DogsContext';
import { ThemeProvider } from '@/context/ThemeContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasDogProfile, isDogProfileLoading } = useDogs();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth and dog profile loading are settled before making navigation decisions.
    if (isLoading) return;

    // If dog profiles are still loading, don't redirect yet. We only redirect when loading is finished
    // to avoid jumping to onboarding before data arrives.
    if (isDogProfileLoading) {
      console.log('Navigation: waiting for dog profiles to finish loading');
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)';
    const inLoginOrSignup = segments[0] === 'login' || segments[0] === 'signup';
    const inOnboarding = segments[0] === 'onboarding';
    
    console.log('Navigation check:', { isAuthenticated, hasDogProfile, segments: segments[0] });

    if (!isAuthenticated && (inAuthGroup || inOnboarding)) {
      console.log('Redirecting to login: user not authenticated');
      router.replace('/login');
    } else if (isAuthenticated && !hasDogProfile && !inOnboarding) {
      // Only redirect to onboarding after we've confirmed there are no dog profiles.
      console.log('Redirecting to onboarding: no dog profile');
      router.replace('/onboarding/dog-basics');
    } else if (isAuthenticated && hasDogProfile && inLoginOrSignup) {
      console.log('Redirecting to explore: user authenticated with dog profile');
      router.replace('/(tabs)/explore');
    }
  }, [isAuthenticated, hasDogProfile, segments, isLoading, isDogProfileLoading, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
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
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext>
        <AccountContext>
          <ThemeProvider>
            <DogsContext>
              <TrailsContext>
                <GestureHandlerRootView style={styles.container}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </TrailsContext>
            </DogsContext>
          </ThemeProvider>
        </AccountContext>
      </AuthContext>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
