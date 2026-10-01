// Saved — every look the user hearted, newest first (DS §7.13 save
// persistence, §8.4 empty state). Cards open the outfit detail; the heart on
// each card unsaves in place.
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapsLabel } from '@/components/CapsLabel';
import { EmptyState } from '@/components/EmptyState';
import { SaveButton } from '@/components/SaveButton';
import { SceneView } from '@/components/SceneView';
import { theme } from '@/constants/theme';
import { getOutfit } from '@/lib/mockData';
import { useSavedStore } from '@/lib/stores/savedStore';

export default function SavedScreen() {
  const router = useRouter();
  const savedOutfitIds = useSavedStore((s) => s.savedOutfitIds);
  const toggleOutfit = useSavedStore((s) => s.toggleOutfit);

  const looks = savedOutfitIds
    .map((id) => getOutfit(id))
    .filter((o): o is NonNullable<typeof o> => o != null);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Saved
        </Text>
        {looks.length > 0 && (
          <CapsLabel size="sm" tone="secondary">
            {`${looks.length} ${looks.length === 1 ? 'look' : 'looks'}`}
          </CapsLabel>
        )}
      </View>

      {looks.length === 0 ? (
        <EmptyState
          icon={Heart}
          headline="Nothing saved yet."
          subhead="Tap the heart on any look to save it here."
          ctaLabel="See today's looks"
          onCtaPress={() => router.push('/(tabs)')}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {looks.map((outfit) => (
            <Pressable
              key={outfit.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${outfit.name}`}
              onPress={() => router.push(`/outfit/${outfit.id}`)}
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            >
              <SceneView
                outfitId={outfit.id}
                occasion={outfit.occasion ?? 'casual_errand'}
                aspectRatio="3:4"
                hideModeBadge
                cornerAction={
                  <SaveButton
                    size="sm"
                    saved
                    onChange={(next) => toggleOutfit(outfit.id, next)}
                    onPhoto
                  />
                }
              />
              <View style={styles.tileMeta}>
                <Text style={styles.tileName} numberOfLines={1}>
                  {outfit.name}
                </Text>
                {outfit.contextLabel && (
                  <CapsLabel size="xs" tone="secondary">
                    {outfit.contextLabel}
                  </CapsLabel>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg.primary },
  header: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[4],
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.lg.fontSize,
    lineHeight: theme.font.display.lg.lineHeight,
    letterSpacing: theme.font.display.lg.letterSpacing,
    color: theme.color.ink.primary,
  },
  grid: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingBottom: theme.space[12],
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.space[5],
  },
  tile: {
    width: '48%',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  tilePressed: { transform: [{ scale: 0.98 }] },
  tileMeta: { paddingTop: theme.space[2], gap: theme.space[1] },
  tileName: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
    color: theme.color.ink.primary,
  },
});
