import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts as useInter,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  useFonts as usePlayfair,
} from '@expo-google-fonts/playfair-display';

import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 200, fade: true });

export default function RootLayout() {
  const [interLoaded, interError] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [playfairLoaded, playfairError] = usePlayfair({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
  });

  const ready = interLoaded && playfairLoaded;
  const failed = interError || playfairError;

  const isHydrated = useOnboardingStore((s) => s.isHydrated);
  const hasCompletedOnboarding = useOnboardingStore(
    (s) => s.hasCompletedOnboarding
  );
  const hasSkippedOnboarding = useOnboardingStore(
    (s) => s.hasSkippedOnboarding
  );

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (ready || failed) SplashScreen.hideAsync().catch(() => {});
  }, [ready, failed]);

  // Soft-gate: first-time users land on /onboarding/welcome. Once the
  // user either completes or skips onboarding, we leave them wherever
  // they navigate. The banner on Today (visible only when skipped, not
  // completed) is the resumption affordance.
  useEffect(() => {
    if (!ready || !isHydrated) return;
    const firstSegment = segments[0];
    const inOnboarding = firstSegment === 'onboarding';
    const firstTimeUser = !hasCompletedOnboarding && !hasSkippedOnboarding;
    if (firstTimeUser && !inOnboarding) {
      router.replace('/onboarding/welcome');
    }
  }, [
    ready,
    isHydrated,
    hasCompletedOnboarding,
    hasSkippedOnboarding,
    segments,
    router,
  ]);

  if (!ready && !failed) return null;
  // Keep the splash up until the persisted store has hydrated, so we
  // don't briefly flash /(tabs) before redirecting first-time users.
  if (!isHydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.color.bg.primary }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.color.bg.primary },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="stylist" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="try-on/[pieceId]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen name="outfit/[outfitId]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="piece/[pieceId]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="design-test" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="welcome-preview"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="youcam-test"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="profile-photos"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="always-honor"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="moment-composer"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="moment-look/[momentId]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="closet-camera"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="closet-tag"
            options={{
              presentation: 'fullScreenModal',
              // No slide so the camera→review transition feels like a
              // continuation rather than a fresh modal pop.
              animation: 'fade',
              // The X close handles dismissal — block the iOS swipe-back
              // gesture so a half-tagged piece doesn't vanish mid-edit.
              gestureEnabled: false,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
