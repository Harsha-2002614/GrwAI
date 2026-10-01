import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Italic } from '@/components/Italic';
import { theme } from '@/constants/theme';
import {
  type BodyShape,
  type FitPreference,
  useOnboardingStore,
} from '@/lib/stores/onboardingStore';

interface FitOption {
  value: FitPreference;
  title: string;
  body: string;
}

const FIT_OPTIONS: FitOption[] = [
  {
    value: 'oversized',
    title: 'Oversized',
    body: 'Roomy and relaxed. Borrowed-from-bigger energy.',
  },
  {
    value: 'fitted',
    title: 'Fitted',
    body: 'Tailored to your shape. Sharp lines, clear silhouette.',
  },
  {
    value: 'structured',
    title: 'Structured',
    body: 'Architectural and considered. Holds its own shape.',
  },
  {
    value: 'flowy',
    title: 'Flowy',
    body: 'Soft, draping, organic movement.',
  },
];

interface ShapeOption {
  value: BodyShape;
  title: string;
  body: string;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  {
    value: 'pear',
    title: 'Pear',
    body: 'Wider through the hips and thighs.',
  },
  {
    value: 'apple',
    title: 'Apple',
    body: 'Fuller through the midsection.',
  },
  {
    value: 'hourglass',
    title: 'Hourglass',
    body: 'Defined waist with balanced shoulders and hips.',
  },
  {
    value: 'rectangle',
    title: 'Rectangle',
    body: 'Straight up and down, balanced proportions.',
  },
];

const ENCOURAGEMENTS = ['Got it', 'Great choice', 'Iris is listening', 'Noted'];

export default function FigureBaselineScreen() {
  const router = useRouter();
  const setFitPreference = useOnboardingStore((s) => s.setFitPreference);
  const setBodyShape = useOnboardingStore((s) => s.setBodyShape);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);
  const storedFit = useOnboardingStore((s) => s.fitPreference);
  const storedShape = useOnboardingStore((s) => s.bodyShape);

  const [fit, setFit] = useState<FitPreference | null>(storedFit);
  const [shape, setShape] = useState<BodyShape | null>(storedShape);
  const [shapeOpen, setShapeOpen] = useState<boolean>(storedShape !== null);
  const [encouragement, setEncouragement] = useState<string | null>(null);

  // Rotate a quiet "got it" line whenever the fit picks change, so the screen
  // feels responsive without being chatty.
  useEffect(() => {
    if (!fit) return;
    const pick = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    setEncouragement(pick);
  }, [fit]);

  const handleSelectFit = (value: FitPreference) => {
    setFit(value);
  };

  const handleToggleShape = (value: BodyShape) => {
    setShape((prev) => (prev === value ? null : value));
  };

  const handleContinue = () => {
    if (!fit) return;
    setFitPreference(fit);
    setBodyShape(shape);
    markScreenComplete(9);
    router.push('/onboarding/style-swipes-1');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.eyebrow}>
          <CapsLabel size="md" tone="secondary">
            Building your fit profile
          </CapsLabel>
        </View>

        <Text style={styles.headline}>
          How do you like clothes to <Italic tone="rust">fit</Italic>?
        </Text>

        <Text style={styles.subhead}>
          This helps Iris pick what to suggest — not how to describe you.
        </Text>

        <View style={styles.fitGrid}>
          {FIT_OPTIONS.map((opt) => {
            const selected = fit === opt.value;
            return (
              <OptionCard
                key={opt.value}
                title={opt.title}
                body={opt.body}
                selected={selected}
                onPress={() => handleSelectFit(opt.value)}
              />
            );
          })}
        </View>

        <View style={styles.encouragementSlot}>
          {encouragement && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              key={encouragement}
            >
              <CapsLabel size="xs" tone="secondary">
                {encouragement}
              </CapsLabel>
            </Animated.View>
          )}
        </View>

        <Animated.View layout={LinearTransition.duration(200)} style={styles.shapeBlock}>
          <Pressable
            onPress={() => setShapeOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              shapeOpen ? 'Hide optional body shape question' : 'Show optional body shape question'
            }
            accessibilityState={{ expanded: shapeOpen }}
            style={({ pressed }) => [
              styles.shapeHeader,
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={styles.shapeHeaderText}>
              <View style={styles.shapeHeaderRow}>
                {shapeOpen ? (
                  <ChevronUp
                    size={18}
                    color={theme.color.ink.secondary}
                    strokeWidth={1.75}
                  />
                ) : (
                  <ChevronDown
                    size={18}
                    color={theme.color.ink.secondary}
                    strokeWidth={1.75}
                  />
                )}
                <CapsLabel size="sm" tone="secondary">
                  Want to tell Iris more?
                </CapsLabel>
              </View>
              <Text style={styles.shapeSub}>
                Optional. Iris already has your body photo.
              </Text>
            </View>
          </Pressable>

          {shapeOpen && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.shapeBody}
            >
              <Text style={styles.shapeHeadline}>
                How would you describe your shape?
              </Text>
              <Text style={styles.shapeMicro}>
                Skip this if you’d rather not.
              </Text>
              <View style={styles.shapeGrid}>
                {SHAPE_OPTIONS.map((opt) => {
                  const selected = shape === opt.value;
                  return (
                    <OptionCard
                      key={opt.value}
                      title={opt.title}
                      body={opt.body}
                      selected={selected}
                      onPress={() => handleToggleShape(opt.value)}
                      compact
                    />
                  );
                })}
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue"
          size="lg"
          fullWidth
          disabled={!fit}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

interface OptionCardProps {
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}

function OptionCard({ title, body, selected, onPress, compact }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.optionCard,
        compact && styles.optionCardCompact,
        selected && styles.optionCardSelected,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={[styles.optionTitle, compact && styles.optionTitleCompact]}>
        {title}
      </Text>
      <Text style={styles.optionBody}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[12],
  },
  eyebrow: {
    alignItems: 'center',
    marginBottom: theme.space[2],
  },
  headline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.lg.fontSize,
    lineHeight: theme.font.display.lg.lineHeight,
    letterSpacing: theme.font.display.lg.letterSpacing,
    color: theme.color.ink.primary,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 320,
  },
  subhead: {
    marginTop: theme.space[4],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 320,
  },
  fitGrid: {
    marginTop: theme.space[8],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[3],
  },
  optionCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 110,
    padding: theme.space[4],
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.color.border.light,
    backgroundColor: theme.color.bg.warm,
    gap: theme.space[2],
  },
  optionCardCompact: {
    minHeight: 96,
  },
  optionCardSelected: {
    borderColor: theme.color.ink.primary,
    backgroundColor: theme.color.bg.primary,
    borderWidth: 2,
  },
  optionTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    color: theme.color.ink.primary,
  },
  optionTitleCompact: {
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
  },
  optionBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  encouragementSlot: {
    minHeight: 20,
    marginTop: theme.space[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeBlock: {
    marginTop: theme.space[8],
  },
  shapeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  shapeHeaderText: {
    flex: 1,
    gap: theme.space[2],
  },
  shapeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  shapeSub: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.tertiary,
  },
  shapeBody: {
    marginTop: theme.space[4],
  },
  shapeHeadline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    color: theme.color.ink.primary,
  },
  shapeMicro: {
    marginTop: theme.space[2],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.tertiary,
  },
  shapeGrid: {
    marginTop: theme.space[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[3],
  },
  footer: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[3],
    paddingBottom: theme.space[6],
    backgroundColor: theme.color.bg.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border.light,
  },
});
