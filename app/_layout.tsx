import { Stack } from 'expo-router';
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

  useEffect(() => {
    if (ready || failed) SplashScreen.hideAsync().catch(() => {});
  }, [ready, failed]);

  if (!ready && !failed) return null;

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
            name="try-on/[outfitId]"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="outfit/[outfitId]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="piece/[pieceId]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="design-test" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
