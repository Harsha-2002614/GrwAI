// Piece detail — minimal for now. The only reason this screen exists at
// this point is to host the "See it on you" primary action; when a
// user's fullBody profile photo is missing we surface an Iris nudge
// pointing at /profile-photos instead of firing a doomed API call.
//
// A secondary "Edit tags" pill preserves the old direct-tap-to-retag
// path (closet now taps into this screen; tag editing lives here).

import { Image as ExpoImage } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Pencil, Sparkles, Trash2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { IrisMessageCard } from '@/components/IrisMessageCard';
import { Pill } from '@/components/Pill';
import { Sheet } from '@/components/Sheet';
import { theme } from '@/constants/theme';
import { useProfilePhotosStore } from '@/lib/stores/profilePhotosStore';
import {
  useWardrobeStore,
  type PieceCategory,
} from '@/lib/stores/wardrobeStore';
import { clearCacheForGarment } from '@/lib/youcam/cache';

const CATEGORY_LABEL: Record<PieceCategory, string> = {
  top: 'Top',
  bottom: 'Bottom',
  dress: 'Dress',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessory',
};

function pieceTitleFor(category: PieceCategory | undefined): string {
  return category ? CATEGORY_LABEL[category] : 'Piece';
}

export default function PieceDetailScreen() {
  const router = useRouter();
  const { pieceId } = useLocalSearchParams<{ pieceId: string }>();

  const pieces = useWardrobeStore((s) => s.pieces);
  const removePiece = useWardrobeStore((s) => s.removePiece);
  const fullBodyUri = useProfilePhotosStore((s) => s.fullBodyUri);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const piece = useMemo(
    () => pieces.find((p) => p.id === pieceId) ?? null,
    [pieces, pieceId]
  );

  const handleConfirmDelete = async () => {
    if (!piece) return;
    await clearCacheForGarment(piece.uri);
    removePiece(piece.id);
    setDeleteOpen(false);
    router.back();
  };

  if (!piece) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title="Piece" onBack={() => router.back()} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This piece is no longer here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const title = pieceTitleFor(piece.category);
  const hasFullBody = !!fullBodyUri;

  const handleTryOn = () => {
    router.push(`/try-on/${piece.id}`);
  };

  const handleEditTags = () => {
    router.push(`/closet-tag?pieceId=${encodeURIComponent(piece.id)}`);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title={title} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageFrame}>
          <ExpoImage
            source={{ uri: piece.uri }}
            style={styles.image}
            contentFit="cover"
            transition={0}
            cachePolicy="memory-disk"
          />
        </View>

        <View style={styles.meta}>
          {piece.category && (
            <CapsLabel size="sm" tone="secondary">
              {CATEGORY_LABEL[piece.category]}
            </CapsLabel>
          )}
          {piece.occasion && piece.occasion.length > 0 && (
            <View style={styles.chipsRow}>
              {piece.occasion.map((o) => (
                <Pill key={o} label={o} variant="default" size="sm" />
              ))}
            </View>
          )}
        </View>

        {hasFullBody ? (
          <Button
            label="See it on you"
            variant="primary"
            size="md"
            fullWidth
            leadingIcon={Sparkles}
            iconStrokeWidth={2}
            onPress={handleTryOn}
          />
        ) : (
          <View style={styles.gate}>
            <IrisMessageCard
              plain
              lines={[
                "Add a full-body photo first and I'll show you in this.",
              ]}
            />
            <View style={styles.gateAction}>
              <Button
                label="Add photo"
                variant="secondary"
                size="md"
                fullWidth
                onPress={() => router.push('/profile-photos')}
              />
            </View>
          </View>
        )}

        <View style={styles.editRow}>
          <Pill
            label="Edit tags"
            variant="outline"
            size="sm"
            leadingIcon={Pencil}
            onPress={handleEditTags}
          />
        </View>

        <View style={styles.destructiveWrap}>
          <Button
            label="Remove from closet"
            variant="destructive"
            size="md"
            fullWidth
            leadingIcon={Trash2}
            onPress={() => setDeleteOpen(true)}
          />
        </View>
      </ScrollView>

      <Sheet visible={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <Pressable
          onPress={() => setDeleteOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          hitSlop={8}
          style={({ pressed }) => [
            styles.sheetClose,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <X size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>
        <View style={styles.sheetTitleRow}>
          <Text style={styles.sheetTitle}>Remove this piece?</Text>
        </View>
        <Text style={styles.sheetBody}>
          It leaves your closet and future looks.
        </Text>
        <Button
          label="Remove"
          variant="destructive"
          size="lg"
          fullWidth
          onPress={() => void handleConfirmDelete()}
        />
      </Sheet>
    </SafeAreaView>
  );
}

// ─── Header ────────────────────────────────────────────────────────────

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
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
      <Text style={styles.headerTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.headerRightSpacer} />
    </View>
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
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -theme.space[2],
  },
  headerTitle: {
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
    paddingTop: theme.space[6],
    paddingBottom: theme.space[12],
    gap: theme.space[6],
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.color.bg.subtle,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  meta: {
    gap: theme.space[2],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  gate: {
    gap: theme.space[3],
  },
  gateAction: {
    // Card + button pair; no additional wrapper padding needed.
  },
  editRow: {
    alignItems: 'flex-start',
  },
  destructiveWrap: {
    marginTop: theme.space[6],
  },
  sheetClose: {
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
  sheetTitleRow: {
    marginBottom: theme.space[3],
  },
  sheetTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.md.fontSize,
    lineHeight: theme.font.display.md.lineHeight,
    color: theme.color.ink.primary,
  },
  sheetBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    marginBottom: theme.space[6],
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space[8],
  },
  missingText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
  },
});
