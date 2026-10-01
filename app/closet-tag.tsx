// Review / tag screen — the place where a freshly-captured wardrobe photo
// becomes a Piece, or an existing piece is re-tagged.
//
// Entry points:
//   • new capture, fresh batch:  ?tempUri=…
//   • new capture, in batch loop: ?tempUri=…&batch=1     (inherits batch tags)
//   • re-tagging existing piece:  ?pieceId=…
//
// "Save piece" is the ONLY action — it works with nothing selected (the
// piece lands in Unsorted) so there's no separate Skip button. The header
// X aborts the capture before save, exactly like Cancel.

import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Plus, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Input } from '@/components/Input';
import { Pill } from '@/components/Pill';
import { OCCASIONS } from '@/constants/occasions';
import { theme } from '@/constants/theme';
import {
  detectDominantColor,
  type DetectedColor,
} from '@/lib/colorDetect';
import { deriveColorFamily } from '@/lib/colorFamily';
import {
  type NamedColor,
  type PieceCategory,
  type PieceColor,
  type PieceCoverage,
  type PieceOccasion,
  useWardrobeStore,
} from '@/lib/stores/wardrobeStore';

interface CategoryOption {
  value: PieceCategory;
  label: string;
}
const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'dress', label: 'Dress' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessory', label: 'Accessory' },
];

const CATEGORY_PLURAL: Record<PieceCategory, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessories',
};

interface ColorOption {
  value: NamedColor;
  label: string;
  hex: string;
}
// 8 solid swatches + a Multicolor swatch (4-quadrant of existing tokens)
// + Other affordance below. Existing hexes only — no new tokens.
const COLOR_OPTIONS: ColorOption[] = [
  { value: 'neutral', label: 'Neutral', hex: '#C5B89F' },
  { value: 'black', label: 'Black', hex: '#1A1A1A' },
  { value: 'white', label: 'White', hex: '#FAFAFA' },
  { value: 'blue', label: 'Blue', hex: '#3D5A80' },
  { value: 'earth', label: 'Earth', hex: '#8B6B52' },
  { value: 'green', label: 'Green', hex: '#5A7C4A' },
  { value: 'red', label: 'Red', hex: '#B5413A' },
  { value: 'pink', label: 'Pink', hex: '#C73E73' },
];

/** Four quadrants of the Multicolor swatch — reuses existing color tokens,
 *  no new hex values. Ordered so no two adjacent quadrants share a family. */
const MULTICOLOR_QUADRANTS: readonly string[] = [
  '#B5413A', // red
  '#5A7C4A', // green
  '#C73E73', // pink
  '#3D5A80', // blue
];

/** Cheap luminance heuristic — return a contrast color (white on dark, ink
 *  on light) so the selected check is always readable on the swatch bg. */
function contrastInkFor(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return theme.color.ink.primary;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 0.6 ? theme.color.ink.primary : theme.color.ink.inverse;
}

export default function ClosetTagScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tempUri?: string;
    pieceId?: string;
    batch?: string;
  }>();

  const tempUri = typeof params.tempUri === 'string' ? params.tempUri : null;
  const pieceId = typeof params.pieceId === 'string' ? params.pieceId : null;
  const inBatch = params.batch === '1';

  const pieces = useWardrobeStore((s) => s.pieces);
  const batchTags = useWardrobeStore((s) => s.batchTags);
  const addPiece = useWardrobeStore((s) => s.addPiece);
  const updatePieceTags = useWardrobeStore((s) => s.updatePieceTags);
  const setBatchTags = useWardrobeStore((s) => s.setBatchTags);

  const existing = useMemo(
    () => (pieceId ? (pieces.find((p) => p.id === pieceId) ?? null) : null),
    [pieceId, pieces]
  );

  const inheritedCategory =
    inBatch && batchTags?.category ? batchTags.category : null;
  const inheritedOccasion =
    inBatch && batchTags?.occasion ? batchTags.occasion : null;
  const editingCategoryOccasion = !inBatch;

  const [category, setCategory] = useState<PieceCategory | null>(
    existing?.category ?? inheritedCategory ?? null
  );
  const [color, setColor] = useState<PieceColor | null>(
    existing?.color ?? null
  );
  const [customColorName, setCustomColorName] = useState<string>(
    existing?.customColor?.name ?? ''
  );
  const [occasion, setOccasion] = useState<PieceOccasion[]>(
    existing?.occasion ?? inheritedOccasion ?? []
  );
  const [anyOccasion, setAnyOccasion] = useState<boolean>(
    !!existing?.anyOccasion
  );
  const [coverage, setCoverage] = useState<PieceCoverage | null>(
    existing?.coverage ?? null
  );
  const [otherOccasionOpen, setOtherOccasionOpen] = useState<boolean>(
    !!existing?.customOccasion
  );
  const [customOccasionText, setCustomOccasionText] = useState<string>(
    existing?.customOccasion ?? ''
  );
  const [detected, setDetected] = useState<DetectedColor | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tempUri || existing) return;
    let cancelled = false;
    detectDominantColor(tempUri)
      .then((res) => {
        if (cancelled) return;
        setDetected(res);
        setColor((prev) => prev ?? res?.color ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tempUri, existing]);

  const occasionSet = useMemo(() => new Set(occasion), [occasion]);

  const handleSelectCategory = (value: PieceCategory) => {
    if (!editingCategoryOccasion) return;
    setCategory((prev) => (prev === value ? null : value));
  };

  const handleSelectColor = (value: NamedColor) => {
    setColor((prev) => (prev === value ? null : value));
    // Picking a named swatch clears any in-progress custom entry.
    setCustomColorName('');
  };

  const handleSelectOtherColor = () => {
    setColor((prev) => (prev === 'custom' ? null : 'custom'));
  };

  const handleToggleOccasion = (value: PieceOccasion) => {
    if (!editingCategoryOccasion) return;
    // Picking a specific occasion clears the "any" state so the two
    // don't conflict visually. Users can toggle back to any at will.
    setAnyOccasion(false);
    setOccasion((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleToggleAnyOccasion = () => {
    if (!editingCategoryOccasion) return;
    setAnyOccasion((prev) => {
      const next = !prev;
      if (next) {
        // "Any" replaces specific-occasion selections — a piece is
        // either a workhorse OR curated to specific moments.
        setOccasion([]);
        setOtherOccasionOpen(false);
        setCustomOccasionText('');
      }
      return next;
    });
  };

  const handleToggleOtherOccasion = () => {
    if (!editingCategoryOccasion) return;
    setOtherOccasionOpen((prev) => {
      const next = !prev;
      // Clear the typed text when closing so a stale value can't sneak
      // back into the next save.
      if (!next) setCustomOccasionText('');
      return next;
    });
  };

  const finishWithBatchPrompt = (
    savedCategory: PieceCategory | null,
    savedOccasion: PieceOccasion[]
  ) => {
    const canBatch = savedCategory !== null || savedOccasion.length > 0;
    if (!canBatch) {
      setBatchTags(null);
      router.replace('/(tabs)/closet');
      return;
    }
    setBatchTags({
      ...(savedCategory ? { category: savedCategory } : {}),
      ...(savedOccasion.length > 0 ? { occasion: savedOccasion } : {}),
    });

    const occLabel =
      savedOccasion.length > 0
        ? (OCCASIONS.find((o) => o.key === savedOccasion[0])?.label ?? '')
        : '';
    const catLabel = savedCategory ? CATEGORY_PLURAL[savedCategory] : '';
    const headline = [occLabel, catLabel].filter(Boolean).join(' ');
    const title = headline.length > 0 ? `Have more ${headline}?` : 'Add more?';

    Alert.alert(title, 'Upload them all here.', [
      {
        text: 'Done',
        style: 'cancel',
        onPress: () => {
          setBatchTags(null);
          router.replace('/(tabs)/closet');
        },
      },
      {
        text: 'Add more',
        onPress: () => router.replace('/closet-camera?batch=1'),
      },
    ]);
  };

  const handleSave = () => {
    if (busy) return;
    setBusy(true);
    try {
      const trimmedCustomColor = customColorName.trim();
      const trimmedCustomOccasion = customOccasionText.trim();

      // Build the custom color blob. Family is derived from the typed
      // name so future AI styling has a semantic label, not just the raw
      // string. If detection lands later, the same shape supports hex
      // too via deriveColorFamily.
      const customColor =
        color === 'custom' && trimmedCustomColor.length > 0
          ? {
              name: trimmedCustomColor,
              family:
                deriveColorFamily({ name: trimmedCustomColor }) ?? 'neutral',
            }
          : undefined;

      const customOccasion =
        editingCategoryOccasion &&
        otherOccasionOpen &&
        trimmedCustomOccasion.length > 0
          ? trimmedCustomOccasion
          : undefined;

      const tagsForSave = {
        category: category ?? undefined,
        // If the user picked "custom" but typed nothing, drop the
        // marker — the piece reads better as "no color picked" than
        // as a custom with no contents.
        color:
          color === 'custom'
            ? trimmedCustomColor.length > 0
              ? ('custom' as const)
              : undefined
            : (color ?? undefined),
        customColor,
        occasion: occasion.length > 0 ? occasion : undefined,
        customOccasion,
        anyOccasion,
        coverage: coverage ?? undefined,
      };

      if (existing) {
        updatePieceTags(existing.id, tagsForSave);
        router.back();
        return;
      }

      if (!tempUri) {
        router.replace('/(tabs)/closet');
        return;
      }

      addPiece(tempUri, tagsForSave);
      finishWithBatchPrompt(category, occasion);
    } catch (err) {
      Alert.alert(
        'Could not save piece',
        err instanceof Error ? err.message : 'Try again.'
      );
      setBusy(false);
    }
  };

  const handleClose = () => {
    setBatchTags(null);
    router.replace('/(tabs)/closet');
  };

  const previewUri = existing?.uri ?? tempUri;
  const isCustomColorSelected = color === 'custom';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={handleClose}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { backgroundColor: theme.color.bg.subtle },
          ]}
        >
          <X size={22} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {existing ? 'Edit tags' : 'Tag this piece'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {previewUri && (
          <View style={styles.previewWrap}>
            <ExpoImage
              source={{ uri: previewUri }}
              style={styles.preview}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>
        )}

        {!editingCategoryOccasion &&
          (inheritedCategory || (inheritedOccasion?.length ?? 0) > 0) && (
            <View style={styles.inheritedRow}>
              <CapsLabel size="sm" tone="secondary">
                {[
                  inheritedOccasion?.[0]
                    ? OCCASIONS.find((o) => o.key === inheritedOccasion[0])
                        ?.label
                    : null,
                  inheritedCategory ? CATEGORY_PLURAL[inheritedCategory] : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </CapsLabel>
              <Text style={styles.inheritedHint}>
                Carried over from the last piece.
              </Text>
            </View>
          )}

        {editingCategoryOccasion && (
          <View style={styles.group}>
            <CapsLabel size="sm" tone="secondary">
              Category
            </CapsLabel>
            <View style={styles.chipsRow}>
              {CATEGORY_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  label={opt.label}
                  active={category === opt.value}
                  onPress={() => handleSelectCategory(opt.value)}
                  accessibilityState={{ selected: category === opt.value }}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.group}>
          <CapsLabel size="sm" tone="secondary">
            Color
          </CapsLabel>
          <View style={styles.swatchesRow}>
            {COLOR_OPTIONS.map((c) => {
              const selected = color === c.value;
              const isDetected = detected?.color === c.value;
              const ink = contrastInkFor(c.hex);
              return (
                <Pressable
                  key={c.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={c.label}
                  onPress={() => handleSelectColor(c.value)}
                  style={({ pressed }) => [
                    styles.swatchWrap,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View
                    style={[
                      styles.swatchCircle,
                      { backgroundColor: c.hex },
                      selected && styles.swatchSelectedRing,
                    ]}
                  >
                    {selected && (
                      <View
                        style={[
                          styles.swatchInnerRing,
                          { borderColor: ink },
                        ]}
                      />
                    )}
                    {selected && (
                      <Check size={18} color={ink} strokeWidth={2.25} />
                    )}
                  </View>
                  <Text style={styles.swatchLabel}>{c.label}</Text>
                  {isDetected && (
                    <Text style={styles.swatchDetected}>DETECTED</Text>
                  )}
                </Pressable>
              );
            })}

            {/* Multicolor — 4-quadrant of existing color tokens, no
                new hex. Sits alongside the solid swatches so a piece
                where nothing dominates can still be tagged in one tap. */}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: color === 'multicolor' }}
              accessibilityLabel="Multicolor"
              onPress={() => handleSelectColor('multicolor')}
              style={({ pressed }) => [
                styles.swatchWrap,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View
                style={[
                  styles.swatchCircle,
                  styles.multicolorSwatch,
                  color === 'multicolor' && styles.swatchSelectedRing,
                ]}
              >
                {MULTICOLOR_QUADRANTS.map((hex, i) => (
                  <View
                    key={`${hex}-${i}`}
                    style={[
                      styles.multiQuad,
                      i === 0 && styles.multiQuadTL,
                      i === 1 && styles.multiQuadTR,
                      i === 2 && styles.multiQuadBL,
                      i === 3 && styles.multiQuadBR,
                      { backgroundColor: hex },
                    ]}
                  />
                ))}
                {color === 'multicolor' && (
                  <View
                    style={[
                      styles.swatchInnerRing,
                      { borderColor: theme.color.ink.inverse },
                    ]}
                  />
                )}
                {color === 'multicolor' && (
                  <Check
                    size={18}
                    color={theme.color.ink.inverse}
                    strokeWidth={2.25}
                  />
                )}
              </View>
              <Text style={styles.swatchLabel}>Multi</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isCustomColorSelected }}
              accessibilityLabel="Other color"
              onPress={handleSelectOtherColor}
              style={({ pressed }) => [
                styles.swatchWrap,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View
                style={[
                  styles.swatchCircle,
                  styles.otherSwatch,
                  isCustomColorSelected && styles.swatchSelectedRing,
                ]}
              >
                {isCustomColorSelected ? (
                  <Check
                    size={18}
                    color={theme.color.ink.primary}
                    strokeWidth={2.25}
                  />
                ) : (
                  <Plus
                    size={20}
                    color={theme.color.ink.secondary}
                    strokeWidth={1.75}
                  />
                )}
              </View>
              <Text style={styles.swatchLabel}>Other</Text>
            </Pressable>
          </View>

          {isCustomColorSelected && (
            <View style={styles.customColorWrap}>
              <Input
                label="Name your color"
                value={customColorName}
                onChangeText={setCustomColorName}
                placeholder="e.g. burgundy"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={32}
                returnKeyType="done"
              />
              {/* TODO(color-picker): expose a color wheel via a pure-JS
                  picker like reanimated-color-picker once it's vetted
                  Expo-Go-safe; for now the typed name is the only path
                  and lib/colorFamily.deriveColorFamily handles the
                  hex case the same way. */}
              <Text style={styles.customHint}>
                Iris will use a close swatch family when styling.
              </Text>
            </View>
          )}
        </View>

        {/* Coverage — load-bearing for the modest compose filter. Optional
            for everyone; UNKNOWN tops are excluded under a modest profile
            (fail-closed), so we surface this row for every piece. */}
        <View style={styles.group}>
          <CapsLabel size="sm" tone="secondary">
            Coverage
          </CapsLabel>
          <View style={styles.chipsRow}>
            {(
              [
                { value: 'long_sleeve', label: 'Long sleeve' },
                { value: 'short_sleeve', label: 'Short sleeve' },
                { value: 'sleeveless', label: 'Sleeveless' },
                { value: 'modest_safe', label: 'Modest-safe' },
              ] as { value: PieceCoverage; label: string }[]
            ).map((opt) => {
              const selected = coverage === opt.value;
              return (
                <Pill
                  key={opt.value}
                  label={opt.label}
                  variant={selected ? 'accent' : 'default'}
                  onPress={() =>
                    setCoverage((prev) => (prev === opt.value ? null : opt.value))
                  }
                  accessibilityState={{ selected }}
                />
              );
            })}
          </View>
        </View>

        {editingCategoryOccasion && (
          <View style={styles.group}>
            <CapsLabel size="sm" tone="secondary">
              For occasions
            </CapsLabel>
            <View style={styles.chipsRow}>
              {/* "Any" leads — signals workhorse pieces that shouldn't
                  be gated by occasion at composition time. */}
              <Pill
                label="Any occasion"
                variant={anyOccasion ? 'accent' : 'default'}
                onPress={handleToggleAnyOccasion}
                accessibilityState={{ selected: anyOccasion }}
              />
              {OCCASIONS.map((opt) => {
                const selected = occasionSet.has(opt.key);
                return (
                  <Pill
                    key={opt.key}
                    label={opt.label}
                    emoji={opt.emoji}
                    variant={selected ? 'accent' : 'default'}
                    onPress={() => handleToggleOccasion(opt.key)}
                    accessibilityState={{ selected }}
                  />
                );
              })}
              <Pill
                label="Other"
                variant={otherOccasionOpen ? 'accent' : 'default'}
                onPress={handleToggleOtherOccasion}
                accessibilityState={{ selected: otherOccasionOpen }}
              />
            </View>

            {otherOccasionOpen && (
              <View style={styles.customOccasionWrap}>
                <Input
                  label="Type an occasion"
                  value={customOccasionText}
                  onChangeText={setCustomOccasionText}
                  placeholder="e.g. interview, beach day"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={32}
                  returnKeyType="done"
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Save piece"
          size="lg"
          fullWidth
          onPress={handleSave}
          disabled={busy}
        />
      </View>
    </SafeAreaView>
  );
}

const PREVIEW_W = 180;
const SWATCH_SIZE = 44;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  header: {
    height: theme.layout.headerHeight,
    paddingHorizontal: theme.layout.screenPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border.light,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    color: theme.color.ink.primary,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },

  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[4],
    paddingBottom: theme.space[10],
  },

  // Modest, centered preview — small enough that the category group is
  // fully visible on first paint and color peeks at the fold.
  previewWrap: {
    alignSelf: 'center',
    width: PREVIEW_W,
    aspectRatio: 3 / 4,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.color.bg.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
  },
  preview: {
    width: '100%',
    height: '100%',
  },

  inheritedRow: {
    marginTop: theme.space[4],
    gap: theme.space[1],
  },
  inheritedHint: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.tertiary,
  },

  group: {
    marginTop: theme.space[5],
    gap: theme.space[3],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  swatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  swatchWrap: {
    width: 56,
    alignItems: 'center',
    gap: theme.space[1],
  },
  swatchCircle: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Outer ring — ink primary so it pops on light swatches (white, neutral).
  swatchSelectedRing: {
    borderWidth: 2.5,
    borderColor: theme.color.ink.primary,
  },
  // Inset white/inverse ring inside the selected swatch — pairs with the
  // outer ink ring so the indicator stays visible on dark swatches (black,
  // blue, earth) where the outer ink ring melts into the bg.
  swatchInnerRing: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: (SWATCH_SIZE - 6) / 2,
    borderWidth: 1.5,
    // borderColor set dynamically via contrastInkFor(swatch.hex)
  },
  otherSwatch: {
    backgroundColor: theme.color.bg.subtle,
    borderColor: theme.color.border.mid,
  },
  multicolorSwatch: {
    // The 4 quadrants fill the circle directly — no bg color needed.
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  multiQuad: {
    position: 'absolute',
    width: SWATCH_SIZE / 2,
    height: SWATCH_SIZE / 2,
  },
  multiQuadTL: { top: 0, left: 0 },
  multiQuadTR: { top: 0, right: 0 },
  multiQuadBL: { bottom: 0, left: 0 },
  multiQuadBR: { bottom: 0, right: 0 },
  swatchLabel: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
  },
  swatchDetected: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.caps.xs.fontSize,
    lineHeight: theme.font.caps.xs.lineHeight,
    letterSpacing: theme.font.caps.xs.letterSpacing,
    color: theme.color.ink.tertiary,
    textAlign: 'center',
  },
  customColorWrap: {
    marginTop: theme.space[3],
    gap: theme.space[2],
  },
  customHint: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.tertiary,
  },
  customOccasionWrap: {
    marginTop: theme.space[3],
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
