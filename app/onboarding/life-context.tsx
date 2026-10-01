// Onboarding Screen 5 — "Life context" (Act 2: comfort + accuracy).
//
// One gentle question about transient life signals so Iris can keep the
// rendering comfortable and accurate. NEVER a body score, never required,
// no measurements, no judgment. The Iris note card reinforces "you can
// always update later" — the answer is a snapshot, not a label.
//
// Single-select per §7.2 chip conventions (the options are mutually
// exclusive in practice — selecting "Nothing right now" implies the
// others don't apply). The store preserves any prior pick on remount.

import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Italic } from '@/components/Italic';
import { Pill } from '@/components/Pill';
import { theme } from '@/constants/theme';
import {
  type LifeContext,
  useOnboardingStore,
} from '@/lib/stores/onboardingStore';

interface ContextOption {
  value: LifeContext;
  label: string;
  /** Emoji only where natural per §14 dual-icon rule (condition chips). */
  emoji?: string;
}

const CONTEXT_OPTIONS: ContextOption[] = [
  { value: 'pregnant', label: 'Pregnant', emoji: '\u{1F930}️' },
  { value: 'postpartum', label: 'Postpartum' },
  { value: 'body-changing', label: 'Body’s changing' },
  { value: 'recovering-surgery', label: 'Recovering from surgery' },
  { value: 'nothing-right-now', label: 'Nothing right now' },
];

export default function LifeContextScreen() {
  const router = useRouter();
  const storedContext = useOnboardingStore((s) => s.lifeContext);
  const setLifeContext = useOnboardingStore((s) => s.setLifeContext);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);

  const [selected, setSelected] = useState<LifeContext | null>(storedContext);

  const handleSelect = (value: LifeContext) => {
    // Toggle off if re-tapped, so "no answer" is a first-class outcome.
    setSelected((prev) => (prev === value ? null : value));
  };

  const handleContinue = () => {
    setLifeContext(selected);
    markScreenComplete(8);
    router.push('/onboarding/figure-baseline');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.headline}>
          Anything changing right <Italic tone="rust">now</Italic>?
        </Text>

        <Text style={styles.subhead}>
          So I keep you comfortable and the picture accurate. Not a body
          question — just life.
        </Text>

        <View style={styles.chipsRow}>
          {CONTEXT_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <Pill
                key={opt.value}
                label={opt.label}
                emoji={opt.emoji}
                active={isSelected}
                onPress={() => handleSelect(opt.value)}
                accessibilityState={{ selected: isSelected }}
              />
            );
          })}
        </View>

        <View style={styles.note}>
          <View style={styles.noteIcon}>
            <Sparkles
              size={18}
              color={theme.color.accent.rust}
              strokeWidth={2}
            />
          </View>
          <Text style={styles.noteText}>
            If things shift, just tell me — I’ll re-style and you can update
            your photo anytime so you always look like you.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Continue" size="lg" fullWidth onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    // 48px breathing room from the progress dots — eyebrow removed per
    // the chunk-6b refactor, so the headline carries the page directly.
    paddingTop: theme.space[12],
    paddingBottom: theme.space[12],
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
    maxWidth: 340,
  },
  // §7.2 chip anti-overlap: wrap + theme gap; Pill internally enforces
  // line-height: 1 + minHeight 38 so the wrap never collides vertically.
  chipsRow: {
    marginTop: theme.space[8],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
    justifyContent: 'center',
  },
  // Iris note card — soft warm bg, no rust except on the Sparkles glyph;
  // copy stays roman (rust italic is reserved for the headline only).
  note: {
    marginTop: theme.space[8],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space[3],
    backgroundColor: theme.color.bg.warm,
    borderRadius: theme.radius.lg,
    padding: theme.space[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
  },
  noteIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
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
