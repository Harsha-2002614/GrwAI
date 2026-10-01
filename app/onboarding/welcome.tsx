import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Italic } from '@/components/Italic';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

// ─── Animation tokens ────────────────────────────────────────────────────

const ENTRANCE_DURATION = 500;
const CTA_ENABLE_DELAY = 1800;
const DELAY_BACK = 400;
const DELAY_MIDDLE = 700;
const DELAY_FRONT = 1000;

// DESIGN_SYSTEM §9.1 easing/decelerate
const DECELERATE = Easing.bezier(0, 0, 0, 1);

// ─── Screen ──────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const router = useRouter();
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);

  // Per the diagnostic: keep the animation logic dead simple. One pair of
  // sharedValues per card, no Promise indirection, no withSequence/withRepeat,
  // no array iteration. If we need to debug further, every value is right
  // here in plain sight.
  const card1Opacity = useSharedValue(0);
  const card1Scale = useSharedValue(0.85);
  const card2Opacity = useSharedValue(0);
  const card2Scale = useSharedValue(0.85);
  const card3Opacity = useSharedValue(0);
  const card3Scale = useSharedValue(0.85);

  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [
      { translateX: 0 },
      { rotate: '0deg' },
      { scale: card1Scale.value },
    ],
  }));
  const card2Style = useAnimatedStyle(() => ({
    opacity: card2Opacity.value,
    transform: [
      { translateX: -16 },
      { rotate: '-4deg' },
      { scale: card2Scale.value },
    ],
  }));
  const card3Style = useAnimatedStyle(() => ({
    opacity: card3Opacity.value,
    transform: [
      { translateX: 20 },
      { rotate: '6deg' },
      { scale: card3Scale.value },
    ],
  }));

  // Reduce-motion detection lives in a tiny dedicated effect so the
  // animation effect below is a pure function of state.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((rm) => {
        if (!cancelled) setReduceMotion(rm);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [ctaEnabled, setCtaEnabled] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      // Skip the staggered entrance — settle all three cards immediately.
      card1Opacity.value = 1;
      card1Scale.value = 1;
      card2Opacity.value = 1;
      card2Scale.value = 1;
      card3Opacity.value = 1;
      card3Scale.value = 1;
      const timer = setTimeout(() => setCtaEnabled(true), CTA_ENABLE_DELAY);
      return () => clearTimeout(timer);
    }

    // Card 3 (back, tilted right) starts at T+400ms
    card3Opacity.value = withDelay(
      DELAY_BACK,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );
    card3Scale.value = withDelay(
      DELAY_BACK,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );

    // Card 2 (middle, tilted left) starts at T+700ms
    card2Opacity.value = withDelay(
      DELAY_MIDDLE,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );
    card2Scale.value = withDelay(
      DELAY_MIDDLE,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );

    // Card 1 (front, straight) starts at T+1000ms
    card1Opacity.value = withDelay(
      DELAY_FRONT,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );
    card1Scale.value = withDelay(
      DELAY_FRONT,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );

    const timer = setTimeout(() => setCtaEnabled(true), CTA_ENABLE_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const handleGetStarted = () => {
    if (!ctaEnabled) return;
    markScreenComplete(0);
    router.push('/onboarding/account');
  };

  const handleAlreadyHaveAccount = () => {
    // TODO: sign-in flow in chunk 9
    Alert.alert('Sign in flow coming in chunk 9');
  };

  return (
    <View style={styles.root}>
      {/* Welcome content */}
      <View style={styles.welcomeBlock}>
        <Sparkles size={28} color={theme.color.ink.primary} strokeWidth={2} />
        <View style={{ height: theme.space[3] }} />
        <CapsLabel size="md" tone="secondary">
          Welcome
        </CapsLabel>
        <View style={{ height: theme.space[4] }} />
        <Text style={styles.headline}>
          Get ready with <Italic tone="rust">Iris</Italic>
        </Text>
        <View style={{ height: theme.space[3] }} />
        <Text style={styles.subtitle}>
          Your AI stylist reads your calendar, weather, and closet — then
          styles you ahead of every moment.
        </Text>
      </View>

      {/* Tilted card stack. Cards are positioned absolutely back→front; the
          z-index handles overlap so DOM render order doesn't matter. */}
      <View style={styles.stack} pointerEvents="none">
        {/* Card 3 — BACK */}
        <View style={[styles.stackRow, { top: 0, zIndex: 1 }]}>
          <Animated.View
            style={[styles.card, card3Style]}
            accessibilityRole="text"
            accessibilityLabel="Open. Get dressed. Today's looks are waiting."
          >
            <Text style={styles.emoji}>✨️</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardHeadline} numberOfLines={1}>
                Open. Get dressed.
              </Text>
              <Text style={styles.cardBody} numberOfLines={2}>
                Today’s looks are waiting.
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Card 2 — MIDDLE */}
        <View style={[styles.stackRow, { top: 40, zIndex: 2 }]}>
          <Animated.View
            style={[styles.card, card2Style]}
            accessibilityRole="text"
            accessibilityLabel="Styles you ahead. From your closet, in real scenes."
          >
            <Text style={styles.emoji}>{'\u{1F457}️'}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardHeadline} numberOfLines={1}>
                Styles you ahead
              </Text>
              <Text style={styles.cardBody} numberOfLines={2}>
                From your closet, in real scenes.
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Card 1 — FRONT */}
        <View style={[styles.stackRow, { top: 80, zIndex: 3 }]}>
          <Animated.View
            style={[styles.card, card1Style]}
            accessibilityRole="text"
            accessibilityLabel="Iris reads your week. Calendar, weather, occasions."
          >
            <Text style={styles.emoji}>{'\u{1F4C5}️'}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardHeadline} numberOfLines={1}>
                Iris reads your week
              </Text>
              <Text style={styles.cardBody} numberOfLines={2}>
                Calendar, weather, occasions.
              </Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* CTAs */}
      <View style={styles.footer}>
        <Button
          label="Get started"
          size="lg"
          fullWidth
          disabled={!ctaEnabled}
          onPress={handleGetStarted}
        />
        <View style={styles.tertiaryWrap}>
          <Button
            label="I already have an account"
            variant="tertiary"
            onPress={handleAlreadyHaveAccount}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const STACK_HEIGHT = 260;
const CARD_WIDTH_PCT = '76%' as const;
const CARD_HEIGHT = 150;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPaddingX,
    backgroundColor: theme.color.bg.primary,
  },

  welcomeBlock: {
    alignItems: 'center',
    paddingTop: theme.space[12], // 48px below header
  },
  headline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.lg.fontSize,
    lineHeight: theme.font.display.lg.lineHeight,
    letterSpacing: theme.font.display.lg.letterSpacing,
    color: theme.color.ink.primary,
    textAlign: 'center',
    maxWidth: 320,
  },
  subtitle: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
    maxWidth: 300,
  },

  stack: {
    marginTop: theme.space[8],
    height: STACK_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  stackRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH_PCT,
    height: CARD_HEIGHT,
    backgroundColor: theme.color.bg.warm,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
    padding: theme.space[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    ...theme.elevation[2],
  },
  emoji: {
    fontSize: 28,
    lineHeight: 28,
    width: 32,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: -1,
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardHeadline: {
    fontFamily: theme.font.family.serif,
    fontSize: 18,
    lineHeight: 22,
    color: theme.color.ink.primary,
  },
  cardBody: {
    marginTop: theme.space[1],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.secondary,
  },

  footer: {
    marginTop: 'auto',
    paddingBottom: theme.space[6],
    alignItems: 'center',
    gap: theme.space[3],
  },
  tertiaryWrap: {
    alignItems: 'center',
  },
});
