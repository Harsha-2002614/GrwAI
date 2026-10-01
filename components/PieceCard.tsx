import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CapsLabel } from '@/components/CapsLabel';
import { SaveButton } from '@/components/SaveButton';
import { theme } from '@/constants/theme';
import type { ClosetPiece } from '@/lib/mockData';

interface PieceCardProps {
  piece: ClosetPiece;
  size?: 'sm' | 'md';
  onPress?: () => void;
  onFavoriteToggle?: (next: boolean) => void;
}

const EMOJI_SIZE = { sm: 36, md: 48 } as const;

/**
 * Square closet tile. Per DESIGN_SYSTEM §7.16: gradient placeholder bg keyed
 * to the piece's accent palette, centered emoji standing in until chunk 7's
 * photoreal pipeline lands, SaveButton top-right, optional "ON YOU · N" rust
 * badge top-left when the piece appears in 2+ past outfits, and an
 * overlay/dark caption strip pinning the piece name to the bottom edge.
 */
export function PieceCard({
  piece,
  size = 'md',
  onPress,
  onFavoriteToggle,
}: PieceCardProps) {
  const showOnYou = (piece.onYouCount ?? 0) >= 2;
  const emojiSize = EMOJI_SIZE[size];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={piece.name}
      style={({ pressed }) => [
        styles.outer,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <LinearGradient
        colors={[piece.imageColor, piece.imageAccent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.emojiWrap} pointerEvents="none">
          <Text
            style={[
              styles.emoji,
              { fontSize: emojiSize, lineHeight: emojiSize },
            ]}
          >
            {piece.emoji}
          </Text>
        </View>

        {showOnYou && (
          <View style={styles.onYouBadge} pointerEvents="none">
            <CapsLabel size="xs" tone="inverse">
              On you · {piece.onYouCount}
            </CapsLabel>
          </View>
        )}

        <View style={styles.saveWrap}>
          <SaveButton
            size="sm"
            saved={piece.isFavorite}
            onChange={(next) => onFavoriteToggle?.(next)}
            onPhoto
            accessibilityLabel={
              piece.isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
          />
        </View>

        {/* Bottom caption — gradient ramp + name */}
        <LinearGradient
          colors={['rgba(15,15,15,0)', 'rgba(15,15,15,0.55)']}
          locations={[0.6, 1]}
          style={styles.captionGradient}
          pointerEvents="none"
        >
          <Text style={styles.nameText} numberOfLines={1}>
            {piece.name}
          </Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  emojiWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    // Per DESIGN_SYSTEM v1.4 emoji rendering rules — disable Android padding
    // and nudge up 1px for optical centering of Apple emoji glyphs.
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: -1,
  },
  onYouBadge: {
    position: 'absolute',
    top: theme.space[3],
    left: theme.space[3],
    paddingVertical: theme.space[1],
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.accent.rust,
  },
  saveWrap: {
    position: 'absolute',
    top: theme.space[3],
    right: theme.space[3],
  },
  captionGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.space[3],
    paddingBottom: theme.space[3],
  },
  nameText: {
    fontFamily: theme.font.family.sansMedium,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.inverse,
  },
});
