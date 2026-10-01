// Onboarding "Name" — single first-chapter-2 step that folds in what used
// to be a separate "About you" page.
//
// Structure (top to bottom):
//   • headline (no caps eyebrow) — "What should Iris call you?" with rust
//     italic on "you" per §3.3
//   • NAME input (uses the shared Input component → caps label + box)
//   • hairline divider in border/light
//   • HOW YOU IDENTIFY caps + single-select chip row (Prefer not to say is
//     a first-class option)
//   • ALWAYS HONOR caps + helper + multi-select chip row (soft-accent
//     selected state per §7.2)
//   • sticky Continue, enabled the moment a name is entered (everything
//     else is optional)
//
// Identity + honorPreferences live in the canonical `prefsStore` — this
// screen reads via selectors and writes via actions, so chips reflect
// whatever the user has already set (from a prior onboarding pass or
// from You › Styling preferences).

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Input } from '@/components/Input';
import { Italic } from '@/components/Italic';
import { Pill } from '@/components/Pill';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import {
  type HonorId,
  type IdentityId,
  usePrefsStore,
} from '@/lib/stores/prefsStore';

interface PresentOption {
  value: IdentityId;
  label: string;
}

const PRESENT_OPTIONS: PresentOption[] = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'self-describe', label: 'Self-describe' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

interface HonorOption {
  value: HonorId;
  label: string;
}

const HONOR_OPTIONS: HonorOption[] = [
  { value: 'hijab_modest', label: 'Hijab / modest' },
  { value: 'saree', label: 'Saree' },
  { value: 'seated_fit', label: 'Seated / wheelchair fit' },
  { value: 'one_handed', label: 'One-handed dressing' },
  { value: 'sensory_friendly', label: 'Sensory-friendly' },
];

export default function NameScreen() {
  const router = useRouter();
  const setFirstName = useOnboardingStore((s) => s.setFirstName);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);
  const storedFirstName = useOnboardingStore((s) => s.firstName);

  // Chips read + write the canonical prefsStore directly — no useState
  // copies of identity / honorPreferences anywhere. Toggling a chip is
  // reflected instantly in You settings, buildScenePrompt, and Iris.
  const identity = usePrefsStore((s) => s.identity);
  const identityLabel = usePrefsStore((s) => s.identityLabel);
  const honorPreferences = usePrefsStore((s) => s.honorPreferences);
  const setIdentity = usePrefsStore((s) => s.setIdentity);
  const toggleHonor = usePrefsStore((s) => s.toggleHonor);

  const [name, setName] = useState<string>(storedFirstName ?? '');
  // Local editable buffer for the self-describe input only — mirrors the
  // canonical `identityLabel`, flushed on each keystroke so the store
  // stays the source of truth even mid-typing.
  const [selfLabelBuffer, setSelfLabelBuffer] = useState<string>(
    identityLabel ?? ''
  );

  const honorSet = useMemo(() => new Set(honorPreferences), [honorPreferences]);
  const showSelfInput = identity === 'self-describe';
  const canSubmit = name.trim().length > 0;

  const handleSelectPresent = (value: IdentityId) => {
    // Tap-again toggles off, so "no answer" is a first-class outcome.
    const next = identity === value ? null : value;
    setIdentity(next, next === 'self-describe' ? selfLabelBuffer.trim() : null);
    if (next !== 'self-describe') setSelfLabelBuffer('');
  };

  const handleSelfLabelChange = (text: string) => {
    setSelfLabelBuffer(text);
    // Persist as the user types so the store is always current.
    setIdentity('self-describe', text.trim().length > 0 ? text.trim() : null);
  };

  const handleContinue = () => {
    if (!canSubmit) return;
    const trimmedName = name.trim();
    setFirstName(trimmedName);
    markScreenComplete(2);
    router.push('/onboarding/face-intro');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.headline}>
          What should Iris call <Italic tone="rust">you</Italic>?
        </Text>

        <View style={styles.afterHeadline} />

        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />

        <View style={styles.dividerWrap}>
          <View style={styles.divider} />
        </View>

        <CapsLabel size="sm" tone="secondary">
          How you identify
        </CapsLabel>
        <View style={styles.chipsRow}>
          {PRESENT_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              label={opt.label}
              active={identity === opt.value}
              onPress={() => handleSelectPresent(opt.value)}
              accessibilityState={{ selected: identity === opt.value }}
            />
          ))}
        </View>

        {showSelfInput && (
          <View style={styles.selfWrap}>
            <Input
              label="In your words"
              value={selfLabelBuffer}
              onChangeText={handleSelfLabelChange}
              placeholder="How you'd describe yourself"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={48}
            />
          </View>
        )}

        <View style={styles.groupGap} />

        <CapsLabel size="sm" tone="secondary">
          Always honor
        </CapsLabel>
        <Text style={styles.groupHelp}>
          Iris will respect these in every render.
        </Text>
        <View style={styles.chipsRow}>
          {HONOR_OPTIONS.map((opt) => {
            const selected = honorSet.has(opt.value);
            return (
              <Pill
                key={opt.value}
                label={opt.label}
                // Soft-accent (rustSoft bg + rust text) selected state per
                // §7.2 — signals "honored", not a hard label.
                variant={selected ? 'accent' : 'default'}
                onPress={() => toggleHonor(opt.value)}
                accessibilityState={{ selected }}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          onPress={handleContinue}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    // 48px below the progress dots before the headline — eyebrow removed
    // per spec, so the headline carries the visual weight directly.
    paddingTop: theme.space[12],
    paddingBottom: theme.space[12],
  },
  headline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.lg.fontSize,
    lineHeight: theme.font.display.lg.lineHeight,
    letterSpacing: theme.font.display.lg.letterSpacing,
    color: theme.color.ink.primary,
  },
  afterHeadline: {
    height: theme.space[6], // 24px gap before Name input
  },
  dividerWrap: {
    paddingVertical: theme.space[6], // 24px on each side of the hairline
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.border.light,
  },
  // §7.2 chip anti-overlap: wrap + theme gap; Pill enforces lineHeight:1 +
  // minHeight:38 + align-self: flex-start internally so wrapping rows
  // never collide vertically.
  chipsRow: {
    marginTop: theme.space[3],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  selfWrap: {
    marginTop: theme.space[4],
  },
  groupGap: {
    height: theme.space[6], // 24px between identity + always-honor groups
  },
  groupHelp: {
    marginTop: theme.space[1],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.tertiary,
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
