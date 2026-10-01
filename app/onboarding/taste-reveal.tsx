import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Italic } from '@/components/Italic';
import { theme } from '@/constants/theme';
import {
  type TasteArchetype,
  useOnboardingStore,
} from '@/lib/stores/onboardingStore';

const LOADING_DURATION = 2500;
const FADE_DURATION = 480;
const PULSE_DURATION = 1500;
const PULSE_TARGET = 1.05;

const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.6, 1);
const DECELERATE = Easing.bezier(0, 0, 0, 1);

const REASONING: Record<TasteArchetype, string> = {
  'Modern Editorialist':
    'You love clean lines, sharp tailoring, and confident neutrals.',
  'Soft Romantic':
    'You’re drawn to flowy fabrics, layered textures, and organic details.',
  'Quiet Luxury':
    'You gravitate toward considered neutrals, quality basics, and timeless cuts.',
  'Eclectic Mixer':
    'You love mixing eras, prints, and color — never afraid to combine.',
};

const DESCRIPTION: Record<TasteArchetype, string> = {
  'Modern Editorialist':
    'Your style is editorial. Magazine cover meets Monday morning. Iris will lean into sharp silhouettes and confident contrast.',
  'Soft Romantic':
    'Your style is poetic. Soft fabrics, layered details, warm light. Iris will lean into flow, texture, and organic palettes.',
  'Quiet Luxury':
    'Your style is considered. Quality over noise, neutrals over trends. Iris will lean into timeless cuts and tonal layering.',
  'Eclectic Mixer':
    'Your style is alive. Vintage with new, prints on prints, unexpected colors. Iris will lean into bold combinations.',
};

export default function TasteRevealScreen() {
  const router = useRouter();
  const tasteArchetype = useOnboardingStore((s) => s.tasteArchetype);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);

  // Fallback: if the user reaches this screen without an inferred archetype
  // (shouldn't happen via normal flow, but guards against a deep link), fall
  // back to a safe default rather than crashing.
  const archetype: TasteArchetype = tasteArchetype ?? 'Modern Editorialist';

  const [phase, setPhase] = useState<'loading' | 'reveal'>('loading');
  const loadingOpacity = useSharedValue(1);
  const revealOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(PULSE_TARGET, {
        duration: PULSE_DURATION,
        easing: EASE_IN_OUT,
      }),
      -1,
      true
    );

    const timer = setTimeout(() => {
      loadingOpacity.value = withTiming(0, {
        duration: FADE_DURATION,
        easing: DECELERATE,
      });
      revealOpacity.value = withTiming(1, {
        duration: FADE_DURATION,
        easing: DECELERATE,
      });
      setPhase('reveal');
    }, LOADING_DURATION);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadingStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));
  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleSeeFirstLook = () => {
    markScreenComplete(12);
    router.push('/onboarding/first-look-preview');
  };

  const handleAdjust = () => {
    Alert.alert(
      'Style adjustment coming soon',
      'For now, your archetype helps Iris learn — you can refine in your profile later.'
    );
  };

  return (
    <View style={styles.root}>
      {phase === 'loading' && (
        <Animated.View style={[styles.loadingBlock, loadingStyle]}>
          <Animated.View style={pulseStyle}>
            <Sparkles
              size={32}
              color={theme.color.ink.primary}
              strokeWidth={2}
            />
          </Animated.View>
          <Text style={styles.loadingHeadline}>Iris is reading your taste…</Text>
          <Text style={styles.loadingBody}>Finding your style language</Text>
        </Animated.View>
      )}

      {phase === 'reveal' && (
        <Animated.View style={[styles.revealRoot, revealStyle]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.revealScroll}
          >
            <View style={styles.eyebrow}>
              <CapsLabel size="md" tone="secondary">
                Your style
              </CapsLabel>
            </View>

            <Text style={styles.revealHeadline}>
              You’re a <Italic tone="rust">{archetype}</Italic>
            </Text>

            <View style={styles.reasoningBlock}>
              <CapsLabel size="sm" tone="secondary">
                How Iris decided
              </CapsLabel>
              <Text style={styles.reasoningBody}>{REASONING[archetype]}</Text>
            </View>

            <Text style={styles.revealDescription}>
              {DESCRIPTION[archetype]}
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label="See your first look"
              size="lg"
              fullWidth
              onPress={handleSeeFirstLook}
            />
            <View style={styles.tertiaryWrap}>
              <Button
                label="Let me adjust"
                variant="tertiary"
                onPress={handleAdjust}
              />
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },

  loadingBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.layout.screenPaddingX,
    gap: theme.space[4],
  },
  loadingHeadline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.md.fontSize,
    lineHeight: theme.font.display.md.lineHeight,
    color: theme.color.ink.primary,
    textAlign: 'center',
  },
  loadingBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.tertiary,
    textAlign: 'center',
  },

  revealRoot: {
    flex: 1,
  },
  revealScroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[8],
    paddingBottom: theme.space[12],
  },
  eyebrow: {
    alignItems: 'center',
    marginBottom: theme.space[2],
  },
  revealHeadline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.lg.fontSize,
    lineHeight: theme.font.display.lg.lineHeight,
    letterSpacing: theme.font.display.lg.letterSpacing,
    color: theme.color.ink.primary,
    textAlign: 'center',
  },
  reasoningBlock: {
    marginTop: theme.space[4],
    alignItems: 'center',
    gap: theme.space[1],
  },
  reasoningBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    fontStyle: 'italic',
    color: theme.color.ink.secondary,
    textAlign: 'center',
    maxWidth: 340,
  },
  revealDescription: {
    marginTop: theme.space[6],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.primary,
    textAlign: 'center',
    maxWidth: 340,
    alignSelf: 'center',
  },

  footer: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[3],
    paddingBottom: theme.space[6],
    backgroundColor: theme.color.bg.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border.light,
    alignItems: 'center',
    gap: theme.space[2],
  },
  tertiaryWrap: {
    alignItems: 'center',
  },
});
