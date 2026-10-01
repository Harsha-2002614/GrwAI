import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { SaveButton } from '@/components/SaveButton';
import { theme } from '@/constants/theme';
import { firstLookOutfits } from '@/lib/mockData';
import {
  type TasteArchetype,
  useOnboardingStore,
} from '@/lib/stores/onboardingStore';
import { useSavedStore } from '@/lib/stores/savedStore';

const FIRST_LOOK: Record<TasteArchetype, { name: string; gradient: readonly [string, string] }> = {
  'Modern Editorialist': {
    name: 'Sharp Charcoal + Trench',
    gradient: ['#1A1A1A', '#3D3D3D'],
  },
  'Soft Romantic': {
    name: 'Cashmere + Soft Pleats',
    gradient: ['#E8D9C5', '#C9A78E'],
  },
  'Quiet Luxury': {
    name: 'Cream Knit + Tailored Wool',
    gradient: ['#D8C5A8', '#B89878'],
  },
  'Eclectic Mixer': {
    name: 'Vintage Denim + Statement Boots',
    gradient: ['#C75D3A', '#8B3F22'],
  },
};

const SCREEN = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN.width * 0.8);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 4 / 3); // 3:4 aspect

const SILHOUETTE_W = Math.round(CARD_WIDTH * 0.34);
const SILHOUETTE_H = Math.round(CARD_HEIGHT * 0.6);

export default function FirstLookPreviewScreen() {
  const router = useRouter();
  const tasteArchetype = useOnboardingStore((s) => s.tasteArchetype);
  const firstName = useOnboardingStore((s) => s.firstName);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);

  const archetype: TasteArchetype = tasteArchetype ?? 'Modern Editorialist';
  const look = FIRST_LOOK[archetype];
  const outfit = firstLookOutfits[archetype];

  // Persisted like every other save (DS §7.13) — the first save in the
  // product used to live in local state and vanished on the next screen.
  const saved = useSavedStore((s) => s.savedOutfitIds.includes(outfit.id));
  const toggleOutfit = useSavedStore((s) => s.toggleOutfit);

  const possessive = firstName ? `${firstName}’s` : 'your';

  const handleEnter = () => {
    try {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
    } catch {
      // intentionally empty
    }
    markScreenComplete(13);
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <View style={styles.scroll}>
        <View style={styles.eyebrow}>
          <CapsLabel size="md" tone="secondary">
            Your first look
          </CapsLabel>
        </View>

        <Text style={styles.timeStamp}>Tomorrow, 8 AM</Text>
        <Text style={styles.subline}>
          Iris styled this for {possessive} rainy morning standup.
        </Text>

        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <LinearGradient
              colors={[look.gradient[0], look.gradient[1]]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.silhouette} />

            <View style={styles.saveCorner}>
              <SaveButton
                saved={saved}
                onChange={(next) => toggleOutfit(outfit.id, next)}
                size="md"
                onPhoto
              />
            </View>

            <LinearGradient
              pointerEvents="none"
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']}
              style={styles.captionGradient}
            />
            <View style={styles.captionContent}>
              <Text style={styles.captionCaps}>WORK · RAINY</Text>
              <Text style={styles.captionName}>{look.name}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.outro}>
          This is just the start. Iris will style every moment of your week
          from here.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          label="Enter your closet"
          size="lg"
          fullWidth
          onPress={handleEnter}
        />
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
    flex: 1,
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
  },
  eyebrow: {
    alignItems: 'center',
    marginBottom: theme.space[2],
  },
  timeStamp: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.md.fontSize,
    lineHeight: theme.font.display.md.lineHeight,
    color: theme.color.ink.primary,
    textAlign: 'center',
  },
  subline: {
    marginTop: theme.space[1],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.tertiary,
    textAlign: 'center',
  },
  cardWrap: {
    marginTop: theme.space[6],
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.elevation[3],
  },
  silhouette: {
    position: 'absolute',
    width: SILHOUETTE_W,
    height: SILHOUETTE_H,
    left: '50%',
    top: '14%',
    marginLeft: -SILHOUETTE_W / 2,
    borderRadius: SILHOUETTE_W / 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  saveCorner: {
    position: 'absolute',
    top: theme.space[3],
    right: theme.space[3],
  },
  captionGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
  },
  captionContent: {
    position: 'absolute',
    left: theme.space[5],
    right: theme.space[5],
    bottom: theme.space[5],
    gap: theme.space[1],
  },
  captionCaps: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.caps.sm.fontSize,
    lineHeight: theme.font.caps.sm.lineHeight,
    letterSpacing: theme.font.caps.sm.letterSpacing,
    color: theme.color.ink.inverse,
    opacity: 0.85,
  },
  captionName: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    color: theme.color.ink.inverse,
  },
  outro: {
    marginTop: theme.space[6],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 340,
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
