// 1:1 photoreal tile for a captured wardrobe piece.
//
// Stripped-down sibling of PieceCard (which still drives the mock closet):
// a real photo via expo-image, radius/lg, hairline border for legibility
// against light backgrounds, and the §7.13 save heart in the small variant
// floating top-right. When `showAddTagsNudge` is set, a small caps overlay
// at the bottom invites the user to tap and tag — used for pieces sitting
// in the "Unsorted" rail.

import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SaveButton } from '@/components/SaveButton';
import { theme } from '@/constants/theme';
import type { WardrobePiece } from '@/lib/stores/wardrobeStore';

interface WardrobeTileProps {
  piece: WardrobePiece;
  onPress?: () => void;
  onLongPress?: () => void;
  onFavoriteToggle: (next: boolean) => void;
  /** Renders a gentle "Add tags" caps overlay at the bottom of the tile.
   *  Used on untagged pieces in the Unsorted rail. */
  showAddTagsNudge?: boolean;
}

export function WardrobeTile({
  piece,
  onPress,
  onLongPress,
  onFavoriteToggle,
  showAddTagsNudge,
}: WardrobeTileProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={
        showAddTagsNudge ? 'Wardrobe piece — tap to add tags' : 'Wardrobe piece'
      }
      accessibilityHint={onLongPress ? 'Long-press for more actions' : undefined}
      style={({ pressed }) => [
        styles.outer,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <ExpoImage
        source={{ uri: piece.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      <View style={styles.saveWrap}>
        <SaveButton
          size="sm"
          saved={piece.isFavorite}
          onChange={onFavoriteToggle}
          onPhoto
          accessibilityLabel={
            piece.isFavorite ? 'Remove from favorites' : 'Add to favorites'
          }
        />
      </View>

      {showAddTagsNudge && (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(15,15,15,0)', 'rgba(15,15,15,0.55)']}
          locations={[0.55, 1]}
          style={styles.nudgeGradient}
        >
          <Text style={styles.nudgeText}>ADD TAGS</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.color.bg.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
  },
  saveWrap: {
    position: 'absolute',
    top: theme.space[3],
    right: theme.space[3],
  },
  nudgeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.space[3],
    paddingBottom: theme.space[3],
  },
  nudgeText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.caps.xs.fontSize,
    lineHeight: theme.font.caps.xs.lineHeight,
    letterSpacing: theme.font.caps.xs.letterSpacing,
    color: theme.color.ink.inverse,
    opacity: 0.9,
  },
});
