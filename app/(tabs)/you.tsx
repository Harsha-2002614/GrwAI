import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Eye,
  Image as ImageIcon,
  RefreshCcw,
  Shirt,
  Sparkles,
} from 'lucide-react-native';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ListRow } from '@/components/ListRow';
import { Pill } from '@/components/Pill';
import { theme } from '@/constants/theme';
import { user } from '@/lib/mockData';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';
import {
  type HonorId,
  type IdentityId,
  usePrefsStore,
} from '@/lib/stores/prefsStore';

// Label maps kept co-located with You so a rename here doesn't cascade
// into a nested-screen refactor.
const IDENTITY_LABEL: Record<IdentityId, string> = {
  woman: 'Woman',
  man: 'Man',
  'non-binary': 'Non-binary',
  'self-describe': 'Self-described',
  'prefer-not-to-say': 'Prefer not to say',
};

const HONOR_LABEL: Record<HonorId, string> = {
  hijab_modest: 'Hijab / modest',
  saree: 'Saree',
  seated_fit: 'Seated fit',
  one_handed: 'One-handed',
  sensory_friendly: 'Sensory-friendly',
};

/**
 * Build the live summary shown under the Always honor list row.
 * Format examples:
 *   • "Woman · Hijab / modest, Sensory-friendly"
 *   • "Self-described · No always-honor set"
 *   • "Not set yet"
 */
function buildHonorSummary(
  identity: string | null,
  identityLabel: string | null,
  honor: HonorId[]
): string {
  const identityPart = identity
    ? identity === 'self-describe' && identityLabel
      ? identityLabel
      : IDENTITY_LABEL[identity as IdentityId] ?? identity
    : null;
  const honorPart =
    honor.length > 0
      ? honor.map((id) => HONOR_LABEL[id]).join(', ')
      : null;

  if (identityPart && honorPart) return `${identityPart} · ${honorPart}`;
  if (identityPart) return `${identityPart} · No always-honor set`;
  if (honorPart) return honorPart;
  return 'Not set yet';
}

export default function YouScreen() {
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  // Reading from the same prefsStore that buildScenePrompt() and
  // buildIrisContext() read from — so the subtitle here is always the
  // ground truth for "what Iris knows about you."
  const identity = usePrefsStore((s) => s.identity);
  const identityLabel = usePrefsStore((s) => s.identityLabel);
  const honorPreferences = usePrefsStore((s) => s.honorPreferences);

  const honorSummary = buildHonorSummary(
    identity,
    identityLabel,
    honorPreferences
  );

  const handleCompleteProfile = () => {
    // Photos are the one thing Iris cannot style without — go straight there.
    router.push('/profile-photos');
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset onboarding?',
      'This will clear all onboarding data and route you back to the welcome screen on next reload. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetOnboarding();
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            ).catch(() => {});
            Alert.alert(
              'Onboarding reset',
              'Reload the app in Expo Go (shake device → Reload, or press R in terminal) to see the welcome screen.'
            );
          },
        },
      ]
    );
  };

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Sticky header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          You
        </Text>
        {/* DEV-ONLY pills — stripped from production builds via __DEV__. */}
        {__DEV__ && (
          <View style={styles.devPills}>
            <Pill
              label="Design test →"
              variant="outline"
              size="sm"
              onPress={() => router.push('/design-test')}
            />
            <Pill
              label="Reset onboarding"
              variant="outline"
              size="sm"
              leadingIcon={RefreshCcw}
              onPress={handleResetOnboarding}
            />
            <Pill
              label="Preview new welcome"
              variant="outline"
              size="sm"
              leadingIcon={Eye}
              onPress={() => router.push('/welcome-preview')}
            />
            <Pill
              label="YouCam try-on"
              variant="outline"
              size="sm"
              leadingIcon={Shirt}
              onPress={() => router.push('/youcam-test')}
            />
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileBlock}>
          <Avatar size="xl" initials={initial} upright />

          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.subline}>{user.location}</Text>

          <View style={styles.ctaBlock}>
            <Button
              label="Complete your profile"
              fullWidth
              onPress={handleCompleteProfile}
            />
            <Text style={styles.helperText}>
              Add photos and preferences so Iris can style you ahead.
            </Text>
          </View>
        </View>

        <View style={styles.listSection}>
          <ListRow
            title="Profile photos"
            leading={
              <ImageIcon
                size={20}
                color={theme.color.ink.primary}
                strokeWidth={1.75}
              />
            }
            inset
            onPress={() => router.push('/profile-photos')}
          />
          <ListRow
            title="Always honor"
            subtitle={honorSummary}
            leading={
              <Sparkles
                size={20}
                color={theme.color.ink.primary}
                strokeWidth={1.75}
              />
            }
            isLast
            inset
            onPress={() => router.push('/always-honor')}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border.light,
    backgroundColor: theme.color.bg.primary,
  },
  headerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    color: theme.color.ink.primary,
  },
  devPills: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: theme.space[2],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[8],
    paddingBottom: theme.space[12],
  },
  profileBlock: {
    alignItems: 'center',
  },
  name: {
    marginTop: theme.space[4],
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    letterSpacing: theme.font.display.sm.letterSpacing,
    color: theme.color.ink.primary,
    textAlign: 'center',
  },
  subline: {
    marginTop: theme.space[1],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
  },
  ctaBlock: {
    marginTop: theme.space[8],
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  helperText: {
    marginTop: theme.space[3],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 280,
  },
  listSection: {
    marginTop: theme.space[8],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
  },
});
