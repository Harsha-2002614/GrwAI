// Closet — captured wardrobe pieces, organized into editorial category
// rails. The Unsorted rail sits at the bottom and nudges the user to add
// tags. Tagging itself happens on a dedicated route (`/closet-tag`)
// reached two ways:
//   • After a fresh capture: closet-camera → closet-tag?tempUri=…
//   • Re-tagging a piece: tile tap → closet-tag?pieceId=…
//
// Image generation is out of scope here — pieces are user photos only.

import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  Bell,
  Camera,
  Crop,
  Image as ImageIcon,
  Link2,
  Pencil,
  Plus,
  Shirt,
  Trash2,
  X,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CapsLabel } from '@/components/CapsLabel';
import { EmptyState } from '@/components/EmptyState';
import { Sheet } from '@/components/Sheet';
import { WardrobeTile } from '@/components/WardrobeTile';
import { theme } from '@/constants/theme';
import {
  type PieceCategory,
  type WardrobePiece,
  useWardrobeStore,
} from '@/lib/stores/wardrobeStore';
import { clearCacheForGarment } from '@/lib/youcam/cache';

// Display order for the category rails. Anything missing here will fall
// into the Unsorted rail at the bottom.
const CATEGORY_ORDER: PieceCategory[] = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'accessory',
];

const CATEGORY_RAIL_LABEL: Record<PieceCategory, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessories',
};

// Sheet animations take ~280ms — give iOS's native picker room to
// present cleanly after the RN Modal dismisses.
const MODAL_DISMISS_MS = 320;

/**
 * Launches the native camera or library picker with 1:1 crop enabled.
 * Returns the picked local URI, or null on cancel / permission-denied /
 * any error. Callers handle their own downstream navigation.
 */
async function pickPieceImage(source: 'camera' | 'library'): Promise<string | null> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      source === 'camera'
        ? 'Camera permission needed'
        : 'Photo library permission needed',
      'You can enable this in Settings.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ]
    );
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1], // Closet tiles are 1:1 per §8.5.
    quality: 0.9,
  };
  try {
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return null;
    return result.assets?.[0]?.uri ?? null;
  } catch (err) {
    if (__DEV__) console.warn('[closet] pickPieceImage threw', err);
    return null;
  }
}

export default function ClosetScreen() {
  const router = useRouter();
  const pieces = useWardrobeStore((s) => s.pieces);
  const toggleFavorite = useWardrobeStore((s) => s.toggleFavorite);
  const clearAll = useWardrobeStore((s) => s.clearAll);
  const removePiece = useWardrobeStore((s) => s.removePiece);
  const setBatchTags = useWardrobeStore((s) => s.setBatchTags);

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const isEmpty = pieces.length === 0;

  const openAddSheet = () => {
    setAddSheetOpen(true);
  };

  // Tapping a piece opens the detail screen (which hosts "See it on
  // you" + an Edit tags shortcut). Re-tag remains reachable from detail.
  const openTagForPiece = (id: string) => {
    router.push(`/piece/${encodeURIComponent(id)}`);
  };

  const openLongPressSheet = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLongPressedId(id);
  }, []);

  const closeLongPressSheet = useCallback(() => setLongPressedId(null), []);

  // Adjust crop = re-pick from the library with editing on. The new URI
  // replaces the piece's photo in-place (tags are preserved).
  const handleAdjustCrop = useCallback(
    async (pieceId: string) => {
      closeLongPressSheet();
      await new Promise((r) => setTimeout(r, MODAL_DISMISS_MS));
      const uri = await pickPieceImage('library');
      if (!uri) return;
      // Best-effort: purge any renders keyed to the OLD image before we
      // replace it. The store keeps the same file path, so we ask the
      // wardrobe layer to swap-in-place via delete + add.
      const target = useWardrobeStore.getState().pieces.find((p) => p.id === pieceId);
      if (!target) return;
      await clearCacheForGarment(target.uri);
      // Preserve the existing tags on the new piece; add before remove
      // so the on-disk file isn't nuked before its replacement lands.
      const { addPiece, removePiece: rm } = useWardrobeStore.getState();
      addPiece(uri, {
        category: target.category,
        color: target.color,
        customColor: target.customColor,
        occasion: target.occasion,
        customOccasion: target.customOccasion,
        anyOccasion: target.anyOccasion,
      });
      rm(target.id);
    },
    [closeLongPressSheet]
  );

  const askDelete = useCallback(
    (pieceId: string) => {
      closeLongPressSheet();
      setTimeout(() => setPendingDeleteId(pieceId), MODAL_DISMISS_MS);
    },
    [closeLongPressSheet]
  );

  const confirmDelete = useCallback(async () => {
    const id = pendingDeleteId;
    if (!id) return;
    const target = useWardrobeStore.getState().pieces.find((p) => p.id === id);
    if (target) {
      await clearCacheForGarment(target.uri);
    }
    removePiece(id);
    setPendingDeleteId(null);
  }, [pendingDeleteId, removePiece]);

  const cancelDelete = useCallback(() => setPendingDeleteId(null), []);

  const openEditTags = useCallback(
    (pieceId: string) => {
      closeLongPressSheet();
      setTimeout(() => {
        router.push(`/closet-tag?pieceId=${encodeURIComponent(pieceId)}`);
      }, MODAL_DISMISS_MS);
    },
    [closeLongPressSheet, router]
  );

  // Wired here (rather than in AddPieceSheet) so the sheet close +
  // picker present happen in the correct order on iOS.
  const handleTakePhoto = useCallback(async () => {
    setBatchTags(null);
    setAddSheetOpen(false);
    await new Promise((r) => setTimeout(r, MODAL_DISMISS_MS));
    const uri = await pickPieceImage('camera');
    if (!uri) return;
    router.push(`/closet-tag?tempUri=${encodeURIComponent(uri)}`);
  }, [router, setBatchTags]);

  const handlePickLibrary = useCallback(async () => {
    setBatchTags(null);
    setAddSheetOpen(false);
    await new Promise((r) => setTimeout(r, MODAL_DISMISS_MS));
    const uri = await pickPieceImage('library');
    if (!uri) return;
    router.push(`/closet-tag?tempUri=${encodeURIComponent(uri)}`);
  }, [router, setBatchTags]);

  // Retained: link-import stub for the Paste-a-link option.
  const handlePasteLink = useCallback(() => {
    setAddSheetOpen(false);
    setTimeout(() => Alert.alert('Link import', 'Link import coming soon.'), 250);
  }, []);

  // Bucket pieces by category once per change. Untagged pieces collect in
  // the `unsorted` array.
  const byCategory = useMemo(() => {
    const buckets: Record<PieceCategory, WardrobePiece[]> = {
      top: [],
      bottom: [],
      dress: [],
      outerwear: [],
      shoes: [],
      accessory: [],
    };
    const unsorted: WardrobePiece[] = [];
    for (const p of pieces) {
      if (p.category) {
        buckets[p.category].push(p);
      } else {
        unsorted.push(p);
      }
    }
    return { buckets, unsorted };
  }, [pieces]);

  const confirmClear = () => {
    Alert.alert(
      'Clear your closet?',
      'This removes every piece you’ve added. The photos are deleted from your device too.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearAll() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Closet
        </Text>
        <View style={styles.headerRight}>
          {__DEV__ && !isEmpty && (
            <Pressable
              onPress={confirmClear}
              accessibilityLabel="Clear all wardrobe pieces (dev only)"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.devPill,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.devPillText}>Clear</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a piece"
            onPress={() => setAddSheetOpen(true)}
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && { backgroundColor: theme.color.bg.subtle },
            ]}
          >
            <Plus size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            accessibilityHint="1 unread"
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && { backgroundColor: theme.color.bg.subtle },
            ]}
          >
            <Bell size={24} color={theme.color.ink.primary} strokeWidth={1.75} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>
      </View>

      {isEmpty ? (
        <EmptyState
          icon={Shirt}
          headline="Your closet is empty."
          subhead="Snap a photo of anything you own. The more Iris sees, the better it styles you."
          ctaLabel="Add your first piece."
          onCtaPress={openAddSheet}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.motivator}>
            The more Iris sees, the better it styles you.
          </Text>

          {/* Prominent always-visible "Add a piece" CTA — sits between the
              motivating line and the first rail so it's discoverable on
              first paint of the populated state without scrolling. The
              header + remains available for quick access at the top. */}
          <View style={styles.primaryCtaWrap}>
            <Button
              label="Add a piece"
              size="lg"
              fullWidth
              onPress={openAddSheet}
            />
          </View>

          {CATEGORY_ORDER.map((cat) => {
            const rail = byCategory.buckets[cat];
            if (rail.length === 0) return null;
            return (
              <CategoryRail
                key={cat}
                title={CATEGORY_RAIL_LABEL[cat]}
                pieces={rail}
                onTilePress={openTagForPiece}
                onTileLongPress={openLongPressSheet}
                onFavoriteToggle={toggleFavorite}
              />
            );
          })}

          {byCategory.unsorted.length > 0 && (
            <CategoryRail
              title="Unsorted"
              pieces={byCategory.unsorted}
              onTilePress={openTagForPiece}
              onTileLongPress={openLongPressSheet}
              onFavoriteToggle={toggleFavorite}
              showAddTagsNudge
            />
          )}
        </ScrollView>
      )}

      <AddPieceSheet
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onPickCamera={handleTakePhoto}
        onPickLibrary={handlePickLibrary}
        onPickLink={handlePasteLink}
      />

      <LongPressSheet
        visible={longPressedId !== null}
        onClose={closeLongPressSheet}
        onAdjustCrop={() =>
          longPressedId && void handleAdjustCrop(longPressedId)
        }
        onEditTags={() => longPressedId && openEditTags(longPressedId)}
        onRemove={() => longPressedId && askDelete(longPressedId)}
      />

      <DeletePieceSheet
        visible={pendingDeleteId !== null}
        onCancel={cancelDelete}
        onConfirm={() => void confirmDelete()}
      />
    </SafeAreaView>
  );
}

// ─── Category rail ──────────────────────────────────────────────────────

interface CategoryRailProps {
  title: string;
  pieces: WardrobePiece[];
  onTilePress: (id: string) => void;
  onTileLongPress: (id: string) => void;
  onFavoriteToggle: (id: string, next: boolean) => void;
  showAddTagsNudge?: boolean;
}

function CategoryRail({
  title,
  pieces,
  onTilePress,
  onTileLongPress,
  onFavoriteToggle,
  showAddTagsNudge,
}: CategoryRailProps) {
  return (
    <View style={railStyles.wrap}>
      <View style={railStyles.headerRow}>
        <CapsLabel size="md" tone="secondary">
          {`${title} · ${pieces.length}`}
        </CapsLabel>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={railStyles.row}
      >
        {pieces.map((p) => (
          <View key={p.id} style={railStyles.cell}>
            <WardrobeTile
              piece={p}
              onPress={() => onTilePress(p.id)}
              onLongPress={() => onTileLongPress(p.id)}
              onFavoriteToggle={(next) => onFavoriteToggle(p.id, next)}
              showAddTagsNudge={showAddTagsNudge}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Add-a-piece sheet ───────────────────────────────────────────────────

interface AddPieceSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickLibrary: () => void;
  onPickLink: () => void;
}

function AddPieceSheet({
  visible,
  onClose,
  onPickCamera,
  onPickLibrary,
  onPickLink,
}: AddPieceSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={sheetStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={sheetStyles.title}>Add a piece</Text>
          <Text style={sheetStyles.subhead}>How are you adding this?</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [
            sheetStyles.closeBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <X size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>
      </View>

      <View style={sheetStyles.cardsStack}>
        <OptionCard
          icon={Camera}
          title="Take a photo"
          subtitle="Snap your piece — crop 1:1 next"
          onPress={onPickCamera}
        />
        <OptionCard
          icon={ImageIcon}
          title="Choose from library"
          subtitle="Pick a photo — crop 1:1 next"
          onPress={onPickLibrary}
        />
        <OptionCard
          icon={Link2}
          title="Paste a link"
          subtitle="From any shopping site"
          onPress={onPickLink}
        />
      </View>
    </Sheet>
  );
}

// ─── Long-press action sheet ────────────────────────────────────────

interface LongPressSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdjustCrop: () => void;
  onEditTags: () => void;
  onRemove: () => void;
}

function LongPressSheet({
  visible,
  onClose,
  onAdjustCrop,
  onEditTags,
  onRemove,
}: LongPressSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close sheet"
        hitSlop={8}
        style={({ pressed }) => [
          sheetStyles.floatingClose,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <X size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
      </Pressable>

      <View style={sheetStyles.headerRow}>
        <Text style={sheetStyles.title}>Piece</Text>
      </View>

      <View style={sheetStyles.actionsStack}>
        <Button
          label="Adjust crop"
          size="lg"
          variant="secondary"
          fullWidth
          leadingIcon={Crop}
          onPress={onAdjustCrop}
        />
        <Button
          label="Edit tags"
          size="lg"
          variant="secondary"
          fullWidth
          leadingIcon={Pencil}
          onPress={onEditTags}
        />
        <Button
          label="Remove"
          size="lg"
          variant="destructive"
          fullWidth
          leadingIcon={Trash2}
          onPress={onRemove}
        />
      </View>
    </Sheet>
  );
}

// ─── Delete confirm sheet ────────────────────────────────────────────

interface DeletePieceSheetProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeletePieceSheet({
  visible,
  onCancel,
  onConfirm,
}: DeletePieceSheetProps) {
  return (
    <Sheet visible={visible} onClose={onCancel}>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Close sheet"
        hitSlop={8}
        style={({ pressed }) => [
          sheetStyles.floatingClose,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <X size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
      </Pressable>
      <View style={sheetStyles.headerRow}>
        <Text style={sheetStyles.title}>Remove this piece?</Text>
      </View>
      <Text style={sheetStyles.body}>
        It leaves your closet and future looks.
      </Text>
      <View style={sheetStyles.actionsStack}>
        <Button
          label="Remove"
          variant="destructive"
          size="lg"
          fullWidth
          onPress={onConfirm}
        />
      </View>
    </Sheet>
  );
}

interface OptionCardProps {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function OptionCard({ icon: Icon, title, subtitle, onPress }: OptionCardProps) {
  return (
    <Card onPress={onPress}>
      <View style={sheetStyles.optionRow}>
        <View style={sheetStyles.optionIcon}>
          <Icon size={24} color={theme.color.ink.primary} strokeWidth={1.75} />
        </View>
        <View style={sheetStyles.optionText}>
          <Text style={sheetStyles.optionTitle}>{title}</Text>
          <Text style={sheetStyles.optionSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </Card>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const RAIL_TILE_WIDTH = 144;

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
    backgroundColor: theme.color.bg.primary,
  },
  headerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    color: theme.color.ink.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.color.accent.rust,
  },
  devPill: {
    paddingVertical: 4,
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.mid,
    backgroundColor: theme.color.bg.subtle,
  },
  devPillText: {
    fontFamily: theme.font.family.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    color: theme.color.ink.secondary,
  },

  scrollContent: {
    paddingTop: theme.space[6],
    paddingBottom: 160, // clear the IrisFAB + tab bar
  },
  motivator: {
    paddingHorizontal: theme.layout.screenPaddingX,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  primaryCtaWrap: {
    paddingHorizontal: theme.layout.screenPaddingX,
    marginTop: theme.space[4],
  },
});

const railStyles = StyleSheet.create({
  wrap: {
    marginTop: theme.space[8],
  },
  headerRow: {
    paddingHorizontal: theme.layout.screenPaddingX,
    marginBottom: theme.space[3],
  },
  row: {
    paddingLeft: theme.layout.screenPaddingX,
    paddingRight: theme.space[4],
    gap: theme.space[3],
  },
  cell: {
    width: RAIL_TILE_WIDTH,
  },
});

const sheetStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space[3],
    marginBottom: theme.space[6],
  },
  title: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.md.fontSize,
    lineHeight: theme.font.display.md.lineHeight,
    color: theme.color.ink.primary,
  },
  subhead: {
    marginTop: theme.space[1],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -theme.space[1],
  },
  cardsStack: {
    gap: theme.space[3],
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[4],
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.color.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  optionTitle: {
    fontFamily: theme.font.family.sansMedium,
    fontSize: theme.font.label.lg.fontSize,
    lineHeight: theme.font.label.lg.lineHeight,
    color: theme.color.ink.primary,
  },
  optionSubtitle: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  floatingClose: {
    position: 'absolute',
    top: theme.space[3],
    right: theme.space[3],
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  actionsStack: {
    gap: theme.space[3],
  },
  body: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    marginBottom: theme.space[6],
    marginTop: -theme.space[4],
  },
});
