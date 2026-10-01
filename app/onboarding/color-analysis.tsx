import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
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
  analyzeFromUri,
  getDefaultAnalysis,
  getReasoningLine,
  seasonDisplayName,
} from '@/lib/colorAnalysisMock';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

const LOADING_DURATION = 2500;
const FADE_DURATION = 480;
const PULSE_DURATION = 1500; // each direction; full cycle 3s
const PULSE_TARGET = 1.05;

const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.6, 1);
const DECELERATE = Easing.bezier(0, 0, 0, 1);

export default function ColorAnalysisScreen() {
  const router = useRouter();
  const facePhotoUri = useOnboardingStore((s) => s.facePhotoUri);
  const colorSeason = useOnboardingStore((s) => s.colorSeason);
  const colorPalette = useOnboardingStore((s) => s.colorPalette);
  const setColorAnalysis = useOnboardingStore((s) => s.setColorAnalysis);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);

  // Resolve the result once on mount. Prefer the analysis already stored
  // from face-capture; fall back to analyzing the current URI; final fallback
  // is the conservative default (used only on production skip paths).
  const analysis = useMemo(() => {
    if (colorSeason && colorPalette) {
      return {
        season: colorSeason,
        palette: colorPalette,
        // Description is recovered by running the analyzer on the URI we have
        // (or default). Description text isn't persisted in the store.
        description: facePhotoUri
          ? analyzeFromUri(facePhotoUri).description
          : getDefaultAnalysis().description,
      };
    }
    if (facePhotoUri) return analyzeFromUri(facePhotoUri);
    return getDefaultAnalysis();
  }, [colorSeason, colorPalette, facePhotoUri]);

  // Persist the analysis so re-entering the screen short-circuits the loader.
  useEffect(() => {
    if (!colorSeason) {
      setColorAnalysis(analysis.season, analysis.palette);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Loading ↔ Reveal cross-fade ────────────────────────────────────
  const [phase, setPhase] = useState<'loading' | 'reveal'>('loading');
  const loadingOpacity = useSharedValue(1);
  const revealOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Pulse the Sparkles glyph while we're "analyzing."
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

  // ─── CTA handlers ───────────────────────────────────────────────────
  const handleLooksRight = () => {
    markScreenComplete(7);
    // Identity + always-honor are captured on the merged Name screen up
    // front; from color-analysis we go straight to the life-context step.
    router.push('/onboarding/life-context');
  };

  const handleAdjust = () => {
    // TODO: real color adjustment screen lands in chunk 9
    Alert.alert('Color adjustment coming in chunk 9');
  };

  const displaySeason = seasonDisplayName(analysis.season);
  const reasoning = getReasoningLine(analysis.season);

  return (
    <View style={styles.root}>
      {/* LOADING state — visible until reveal */}
      {phase === 'loading' && (
        <Animated.View style={[styles.loadingBlock, loadingStyle]}>
          <Animated.View style={pulseStyle}>
            <Sparkles
              size={32}
              color={theme.color.ink.primary}
              strokeWidth={2}
            />
          </Animated.View>
          <Text style={styles.loadingHeadline}>Iris is analyzing…</Text>
          <Text style={styles.loadingBody}>
            Reading your colors, undertone, and palette
          </Text>
        </Animated.View>
      )}

      {/* REVEAL state — fades in after loader */}
      {phase === 'reveal' && (
        <Animated.View style={[styles.revealRoot, revealStyle]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.revealScroll}
          >
            <View style={styles.eyebrow}>
              <CapsLabel size="md" tone="secondary">
                Your color
              </CapsLabel>
            </View>

            <Text style={styles.revealHeadline}>
              You’re a <Italic tone="rust">{displaySeason}</Italic>
            </Text>

            <View style={styles.reasoningBlock}>
              <CapsLabel size="sm" tone="secondary">
                How Iris decided
              </CapsLabel>
              <Text style={styles.reasoningBody}>{reasoning}</Text>
            </View>

            <Text style={styles.revealDescription}>{analysis.description}</Text>

            <View style={styles.swatchWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.swatchRow}
              >
                {analysis.palette.map((hex, i) => (
                  <View
                    key={`${hex}-${i}`}
                    accessibilityRole="image"
                    accessibilityLabel={`Palette color ${i + 1} of ${analysis.palette.length}, ${hex}`}
                    style={[
                      styles.swatch,
                      { backgroundColor: hex },
                    ]}
                  />
                ))}
              </ScrollView>
              {/* Right-edge fade hints that the palette continues offscreen. */}
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.swatchFade}
              />
            </View>

            <View style={styles.meaningBlock}>
              <CapsLabel size="sm" tone="secondary">
                What this means
              </CapsLabel>
              <Text style={styles.meaningBody}>
                These are the colors Iris will lean into when styling you.
                You can refine this later in your profile.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label="Looks right"
              size="lg"
              fullWidth
              onPress={handleLooksRight}
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

const SWATCH = 56;

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
  revealDescription: {
    marginTop: theme.space[4],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
    maxWidth: 340,
    alignSelf: 'center',
  },
  swatchWrap: {
    position: 'relative',
  },
  swatchRow: {
    paddingVertical: theme.space[8],
    paddingLeft: 0,
    paddingRight: theme.space[4],
    gap: theme.space[3],
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
    flexShrink: 0,
  },
  swatchFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 32,
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
  },
  meaningBlock: {
    gap: theme.space[2],
  },
  meaningBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
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
