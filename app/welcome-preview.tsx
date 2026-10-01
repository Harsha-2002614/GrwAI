// DEV PREVIEW SCREEN
// Standalone sandbox for testing experimental welcome copy.
// If the experiment lands → promote logic into /app/onboarding/welcome.tsx and delete this file.
// If the experiment doesn't land → delete this file and remove the dev pill from /app/(tabs)/you.tsx.
// This file is intentionally self-contained — no imports from /app/onboarding/welcome.tsx
// so deletion is clean (one file removal).

import { useRouter } from 'expo-router';
import { Sparkles, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// ─── Animation tokens (copied from welcome.tsx) ──────────────────────────

const ENTRANCE_DURATION = 500;
const CTA_ENABLE_DELAY = 1800;
const DELAY_BACK = 400;
const DELAY_MIDDLE = 700;
const DELAY_FRONT = 1000;

const DECELERATE = Easing.bezier(0, 0, 0, 1);

// ─── Screen ──────────────────────────────────────────────────────────────

export default function WelcomePreviewScreen() {
  const router = useRouter();

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
      card1Opacity.value = 1;
      card1Scale.value = 1;
      card2Opacity.value = 1;
      card2Scale.value = 1;
      card3Opacity.value = 1;
      card3Scale.value = 1;
      const timer = setTimeout(() => setCtaEnabled(true), CTA_ENABLE_DELAY);
      return () => clearTimeout(timer);
    }

    card3Opacity.value = withDelay(
      DELAY_BACK,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );
    card3Scale.value = withDelay(
      DELAY_BACK,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );

    card2Opacity.value = withDelay(
      DELAY_MIDDLE,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );
    card2Scale.value = withDelay(
      DELAY_MIDDLE,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: DECELERATE })
    );

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

  const handleStyleMyWeek = () => {
    if (!ctaEnabled) return;
    Alert.alert(
      'Preview only',
      'This is a sandbox preview of new welcome copy. The real CTA would navigate to account creation. Tap OK to close.'
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Preview header — just an X close, top-right */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close preview"
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { backgroundColor: theme.color.bg.subtle },
          ]}
        >
          <X size={24} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>
      </View>

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
            Iris reads your week before you wake up. Tomorrow’s look is
            already chosen.
          </Text>
        </View>

        {/* Tilted card stack */}
        <View style={styles.stack} pointerEvents="none">
          {/* Card 3 — BACK */}
          <View style={[styles.stackRow, { top: 0, zIndex: 1 }]}>
            <Animated.View
              style={[styles.card, card3Style]}
              accessibilityRole="text"
              accessibilityLabel="Friday, 7:30 PM. Dinner at Liholiho. Iris already picked your look."
            >
              <Text style={styles.emoji}>✨️</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardHeadline} numberOfLines={1}>
                  Friday, 7:30 PM
                </Text>
                <Text style={styles.cardBody} numberOfLines={2}>
                  Dinner at Liholiho. Iris already picked your look.
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Card 2 — MIDDLE */}
          <View style={[styles.stackRow, { top: 40, zIndex: 2 }]}>
            <Animated.View
              style={[styles.card, card2Style]}
              accessibilityRole="text"
              accessibilityLabel="Sunday morning. Coffee with Mira. Outfit waiting. Backup jacket too."
            >
              <Text style={styles.emoji}>{'\u{1F457}️'}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardHeadline} numberOfLines={1}>
                  Sunday morning
                </Text>
                <Text style={styles.cardBody} numberOfLines={2}>
                  Coffee with Mira. Outfit waiting. Backup jacket too.
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Card 1 — FRONT */}
          <View style={[styles.stackRow, { top: 80, zIndex: 3 }]}>
            <Animated.View
              style={[styles.card, card1Style]}
              accessibilityRole="text"
              accessibilityLabel="Tomorrow, 8 AM. Rainy team standup. Iris styled the look at 6."
            >
              <Text style={styles.emoji}>{'\u{1F4C5}️'}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardHeadline} numberOfLines={1}>
                  Tomorrow, 8 AM
                </Text>
                <Text style={styles.cardBody} numberOfLines={2}>
                  Rainy team standup. Iris styled the look at 6.
                </Text>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* CTA — single primary, no tertiary in the preview */}
        <View style={styles.footer}>
          <Button
            label="Style my week"
            size="lg"
            fullWidth
            disabled={!ctaEnabled}
            onPress={handleStyleMyWeek}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles (copied + tweaked from welcome.tsx) ──────────────────────────

const STACK_HEIGHT = 260;
const CARD_WIDTH_PCT = '76%' as const;
const CARD_HEIGHT = 150;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[4],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPaddingX,
    backgroundColor: theme.color.bg.primary,
  },

  welcomeBlock: {
    alignItems: 'center',
    paddingTop: theme.space[8], // a touch tighter than real onboarding (no full header)
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
    // Playfair Medium isn't loaded — keep weight 400 and tighten letter-
    // spacing for a more confident, time-stamp feel.
    fontFamily: theme.font.family.serif,
    fontWeight: '400',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.18, // ≈ -0.01em at 18px
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
  },
});
