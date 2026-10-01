// Outfit detail — BUILD_SPEC §4.6.
//   full-bleed scene (SaveButton top-right) → name + price → italic blurb →
//   component pills (caps/sm on bg/subtle) → action chip row.
// Reached from the Today hero carousel and the Saved tab.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Ruler, Search, Shuffle } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CapsLabel } from '@/components/CapsLabel';
import { EmptyState } from '@/components/EmptyState';
import { Pill } from '@/components/Pill';
import { SaveButton } from '@/components/SaveButton';
import { SceneView } from '@/components/SceneView';
import { Tag } from '@/components/Tag';
import { theme } from '@/constants/theme';
import { getOutfit } from '@/lib/mockData';
import { useSavedStore } from '@/lib/stores/savedStore';

export default function OutfitDetailScreen() {
  const router = useRouter();
  const { outfitId } = useLocalSearchParams<{ outfitId: string }>();
  const outfit = getOutfit(String(outfitId ?? ''));
  const isSaved = useSavedStore((s) => s.savedOutfitIds.includes(String(outfitId)));
  const toggleOutfit = useSavedStore((s) => s.toggleOutfit);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  if (!outfit) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header onBack={goBack} title="Outfit" />
        <EmptyState
          icon={Search}
          headline="This look is gone."
          subhead="It may have been styled for a moment that has passed."
          ctaLabel="Back to today"
          onCtaPress={goBack}
        />
      </SafeAreaView>
    );
  }

  const comingSoon = (what: string) => Alert.alert(`${what} is coming soon`, 'Iris will do this once the photoreal pipeline lands.');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header onBack={goBack} title={outfit.name} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <SceneView
          outfitId={outfit.id}
          occasion={outfit.occasion ?? 'casual_errand'}
          aspectRatio="3:4"
          hideModeBadge
          captionLocation={outfit.captionLocation}
          tag={outfit.contextLabel ? <Tag>{outfit.contextLabel}</Tag> : undefined}
          cornerAction={
            <SaveButton
              size="lg"
              saved={isSaved}
              onChange={(next) => toggleOutfit(outfit.id, next)}
              onPhoto
            />
          }
          style={styles.scene}
        />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} accessibilityRole="header">
              {outfit.name}
            </Text>
            {outfit.price != null && <Text style={styles.price}>${outfit.price}</Text>}
          </View>
          {outfit.blurb && <Text style={styles.blurb}>{outfit.blurb}</Text>}

          {outfit.components && (
            <View style={styles.section}>
              <CapsLabel size="sm" tone="secondary">
                The pieces
              </CapsLabel>
              <View style={styles.pillRow}>
                {outfit.components.map((c) => (
                  <View key={c} style={styles.componentPill}>
                    <CapsLabel size="sm" tone="primary">
                      {c}
                    </CapsLabel>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <CapsLabel size="sm" tone="secondary">
              What next
            </CapsLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
              <SaveButton variant="chip" saved={isSaved} onChange={(next) => toggleOutfit(outfit.id, next)} accessibilityLabel={isSaved ? 'Saved' : 'Save look'} />
              <Pill label="Try a variation" leadingIcon={Shuffle} onPress={() => comingSoon('Variations')} />
              <Pill label="Find missing pieces" leadingIcon={Search} onPress={() => comingSoon('Sourcing')} />
              <Pill label="Will it fit?" leadingIcon={Ruler} onPress={() => comingSoon('Fit check')} />
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: theme.color.bg.subtle }]}
      >
        <ChevronLeft size={24} color={theme.color.ink.primary} strokeWidth={1.75} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.iconButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg.primary },
  header: {
    height: theme.layout.headerHeight,
    paddingHorizontal: theme.space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
    color: theme.color.ink.primary,
  },
  scroll: { paddingBottom: theme.space[12] },
  scene: { borderRadius: 0 },
  body: { paddingHorizontal: theme.layout.screenPaddingX, paddingTop: theme.space[5] },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: theme.space[4] },
  name: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    letterSpacing: theme.font.display.sm.letterSpacing,
    color: theme.color.ink.primary,
  },
  price: {
    fontFamily: theme.font.family.sansMedium,
    fontSize: theme.font.label.lg.fontSize,
    lineHeight: theme.font.label.lg.lineHeight,
    color: theme.color.ink.primary,
    flexShrink: 0,
  },
  blurb: {
    marginTop: theme.space[3],
    fontFamily: theme.font.family.serifItalic,
    fontSize: theme.font.body.lg.fontSize,
    lineHeight: theme.font.body.lg.lineHeight,
    color: theme.color.ink.secondary,
  },
  section: { marginTop: theme.space[8], gap: theme.space[3] },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] },
  componentPill: {
    backgroundColor: theme.color.bg.subtle,
    borderRadius: theme.radius.full,
    paddingVertical: theme.space[2],
    paddingHorizontal: theme.space[3],
  },
  actionsRow: { flexDirection: 'row', gap: theme.space[2], paddingRight: theme.space[6] },
});
