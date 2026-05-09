import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';
import { Badge } from './Badge';
import { CapsLabel } from './CapsLabel';
import { SceneCaption } from './SceneCaption';

type AspectRatio = '3:4' | '4:5';

interface SceneViewProps {
  /** Stable identifier for the outfit (used to key future scene cache lookups) */
  outfitId: string;
  /** Occasion key (work_review, casual_errand, dinner, etc) */
  occasion: string;
  aspectRatio?: AspectRatio;
  /** Caption strip location label, e.g., "SOHO · SOFT AFTERNOON" */
  captionLocation?: string;
  /** Optional weather chip on caption strip (emoji per dual-icon rule) */
  weather?: { label: string; emoji?: string };
  /** Top-left floating tag (e.g., "OFFICE · SYNCED: TEAM STANDUP") */
  tag?: ReactNode;
  /** Top-right corner content (typically <SaveButton onPhoto />) */
  cornerAction?: ReactNode;
  /** Hide the ILLUSTRATION badge (e.g., when used as a pure decorative tile) */
  hideModeBadge?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Smart wrapper for the figure visual. Chunk 2: renders the illustration
 * placeholder only (no scene library yet). When the photoreal pipeline lands,
 * this component will key off the userFigure store to switch into "ON YOU" mode
 * and render real photoreal scenes.
 */
export function SceneView({
  occasion,
  aspectRatio = '3:4',
  captionLocation,
  weather,
  tag,
  cornerAction,
  hideModeBadge,
  style,
}: SceneViewProps) {
  const aspect =
    aspectRatio === '4:5' ? theme.aspect.sceneFullscreen : theme.aspect.scene;
  const occasionLabel = occasion.replaceAll('_', ' ');

  return (
    <View style={[styles.frame, { aspectRatio: aspect }, style]}>
      <View style={styles.illustration}>
        <CapsLabel size="md" tone="tertiary" style={styles.placeholderLabel}>
          {occasionLabel}
        </CapsLabel>
        <Text style={styles.placeholderHint}>illustration placeholder</Text>
      </View>

      {tag && <View style={styles.topLeft}>{tag}</View>}
      {cornerAction && <View style={styles.topRight}>{cornerAction}</View>}
      {!hideModeBadge && !cornerAction && (
        <View style={styles.topRight}>
          <Badge variant="illustration" size="sm" />
        </View>
      )}

      {captionLocation && (
        <SceneCaption
          location={captionLocation}
          weather={weather?.label}
          weatherEmoji={weather?.emoji}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: theme.color.bg.subtle,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
  },
  placeholderLabel: {
    textAlign: 'center',
  },
  placeholderHint: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    color: theme.color.ink.tertiary,
    fontStyle: 'italic',
  },
  topLeft: {
    position: 'absolute',
    top: theme.space[4],
    left: theme.space[4],
  },
  topRight: {
    position: 'absolute',
    top: theme.space[4],
    right: theme.space[4],
  },
});
