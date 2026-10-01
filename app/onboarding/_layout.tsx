import { Stack, usePathname, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressDots } from '@/components/ProgressDots';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

/** Pathname → progress-dot index. The Name screen now folds in the old
 *  "About you" page (identity + always-honor groups) so the first
 *  chapter-2 step is a single merged screen at index 2. Pronouns are not
 *  collected anywhere. Life-context, fit, and the rest of the flow are
 *  unchanged. first-look-preview is the celebration screen with no
 *  advancing dot, so we hold at the last position there. */
const SCREEN_INDEX: Record<string, number> = {
  '/onboarding/welcome': 0,
  '/onboarding/account': 1,
  '/onboarding/name': 2,
  '/onboarding/face-intro': 3,
  '/onboarding/face-capture': 4,
  '/onboarding/body-intro': 5,
  '/onboarding/body-capture': 6,
  '/onboarding/color-analysis': 7,
  '/onboarding/life-context': 8,
  '/onboarding/figure-baseline': 9,
  '/onboarding/style-swipes-1': 10,
  '/onboarding/style-swipes-2': 11,
  '/onboarding/taste-reveal': 12,
  '/onboarding/first-look-preview': 12, // celebration — dot stays at last position
};

const TOTAL_STEPS = 13;

function OnboardingHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const skipOnboarding = useOnboardingStore((s) => s.skipOnboarding);

  const currentIndex = SCREEN_INDEX[pathname] ?? 0;
  const showBack = currentIndex > 0;
  const showSkip = currentIndex > 0;

  const handleSkip = () => {
    skipOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <ChevronLeft
              size={24}
              color={theme.color.ink.primary}
              strokeWidth={1.75}
            />
          </Pressable>
        )}
      </View>

      <ProgressDots total={TOTAL_STEPS} current={currentIndex} />

      <View style={[styles.headerSide, styles.headerSideRight]}>
        {showSkip && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            hitSlop={8}
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function OnboardingLayout() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <OnboardingHeader />
      </SafeAreaView>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.color.bg.primary },
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="account" />
        <Stack.Screen name="name" />
        <Stack.Screen name="face-intro" />
        <Stack.Screen name="face-capture" />
        <Stack.Screen name="body-intro" />
        <Stack.Screen name="body-capture" />
        <Stack.Screen name="color-analysis" />
        <Stack.Screen name="life-context" />
        <Stack.Screen name="figure-baseline" />
        <Stack.Screen name="style-swipes-1" />
        <Stack.Screen name="style-swipes-2" />
        <Stack.Screen name="taste-reveal" />
        <Stack.Screen
          name="first-look-preview"
          options={{ gestureEnabled: false }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  safeArea: {
    backgroundColor: theme.color.bg.primary,
  },
  header: {
    height: theme.layout.headerHeight,
    paddingHorizontal: theme.layout.screenPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideRight: {
    justifyContent: 'flex-end',
  },
  // DS §12: 44×44pt minimum tap target (was 24×24 — QA GRW-09).
  iconButton: {
    width: 44,
    height: 44,
    marginLeft: -10, // keep the chevron glyph on the 16px grid line
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: theme.space[2],
    marginRight: -theme.space[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary, // was tertiary — the only way to leave the flow deserves AA contrast
  },
});
