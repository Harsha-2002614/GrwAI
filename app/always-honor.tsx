// Always honor — user-editable identity + non-negotiables that Iris
// respects everywhere. Same chips as the onboarding "Name" screen, same
// underlying store (`usePrefsStore`), so a toggle here shows up on the
// next image generation and the next Iris message.
//
// Layout (design system):
//   • Header: back chevron + display/xs "Always honor" (no italic —
//     utility screen).
//   • HOW YOU PRESENT caps + single-select chip row.
//   • ALWAYS HONOR caps + multi-select chip row (soft-accent selected).
//   • Iris note card: "Set once, honored everywhere. If something
//     changes — even for a season — just update this."
//
// Writes are optimistic (no Save button); the store persists through
// AsyncStorage, so a chip toggle is committed as soon as it happens.

import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapsLabel } from '@/components/CapsLabel';
import { IrisMessageCard } from '@/components/IrisMessageCard';
import { Input } from '@/components/Input';
import { Pill } from '@/components/Pill';
import { theme } from '@/constants/theme';
import {
  type HonorId,
  type IdentityId,
  usePrefsStore,
} from '@/lib/stores/prefsStore';

interface IdentityOption {
  value: IdentityId;
  label: string;
}

const IDENTITY_OPTIONS: IdentityOption[] = [
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

export default function AlwaysHonorScreen() {
  const router = useRouter();

  const identity = usePrefsStore((s) => s.identity);
  const identityLabel = usePrefsStore((s) => s.identityLabel);
  const honorPreferences = usePrefsStore((s) => s.honorPreferences);
  const setIdentity = usePrefsStore((s) => s.setIdentity);
  const toggleHonor = usePrefsStore((s) => s.toggleHonor);

  const honorSet = useMemo(() => new Set(honorPreferences), [honorPreferences]);
  const showSelfInput = identity === 'self-describe';

  const handleSelectIdentity = (value: IdentityId) => {
    const next = identity === value ? null : value;
    setIdentity(next, next === 'self-describe' ? identityLabel : null);
  };

  const handleSelfLabelChange = (text: string) => {
    setIdentity('self-describe', text.trim().length > 0 ? text.trim() : null);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.7 : 1 }]}
        >
          <ChevronLeft
            size={24}
            color={theme.color.ink.primary}
            strokeWidth={1.75}
          />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Always honor
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.group}>
          <CapsLabel size="sm" tone="secondary">
            How you present
          </CapsLabel>
          <View style={styles.chipsRow}>
            {IDENTITY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                active={identity === opt.value}
                onPress={() => handleSelectIdentity(opt.value)}
                accessibilityState={{ selected: identity === opt.value }}
              />
            ))}
          </View>

          {showSelfInput && (
            <View style={styles.selfWrap}>
              <Input
                label="In your words"
                value={identityLabel ?? ''}
                onChangeText={handleSelfLabelChange}
                placeholder="How you'd describe yourself"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={48}
              />
            </View>
          )}
        </View>

        <View style={styles.group}>
          <CapsLabel size="sm" tone="secondary">
            Always honor
          </CapsLabel>
          <Text style={styles.groupHelp}>
            Iris will respect these in every render and every recommendation.
          </Text>
          <View style={styles.chipsRow}>
            {HONOR_OPTIONS.map((opt) => {
              const selected = honorSet.has(opt.value);
              return (
                <Pill
                  key={opt.value}
                  label={opt.label}
                  variant={selected ? 'accent' : 'default'}
                  onPress={() => toggleHonor(opt.value)}
                  accessibilityState={{ selected }}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.noteWrap}>
          <IrisMessageCard
            plain
            lines={[
              'Set once, honored everywhere. If something changes — even for a season — just update this.',
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  header: {
    minHeight: theme.layout.headerHeight,
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingVertical: theme.space[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border.light,
    backgroundColor: theme.color.bg.primary,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -theme.space[2],
  },
  title: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
    color: theme.color.ink.primary,
    flex: 1,
    marginLeft: theme.space[2],
  },
  headerRightSpacer: {
    width: 36,
  },
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[8],
    paddingBottom: theme.space[12],
  },
  group: {
    marginBottom: theme.space[8],
  },
  chipsRow: {
    marginTop: theme.space[3],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  selfWrap: {
    marginTop: theme.space[4],
  },
  groupHelp: {
    marginTop: theme.space[1],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.tertiary,
  },
  noteWrap: {
    marginTop: theme.space[2],
  },
});
