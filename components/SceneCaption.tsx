import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/constants/theme';
import { CapsLabel } from './CapsLabel';
import { Pill } from './Pill';

interface SceneCaptionProps {
  /** "SOHO · SOFT AFTERNOON" — the caps location label, bottom-left */
  location: string;
  /** Optional weather chip on the right (emoji per dual-icon rule) */
  weather?: string;
  weatherEmoji?: string;
}

/**
 * The caption strip overlaid at the bottom of every photoreal scene.
 * Spec mandates a gradient overlay (transparent → overlay/dark) covering
 * the bottom ~30% — never a flat overlay (it would dull the photo).
 */
export function SceneCaption({ location, weather, weatherEmoji }: SceneCaptionProps) {
  return (
    <View pointerEvents="box-none" style={styles.container}>
      <LinearGradient
        colors={['rgba(15,15,15,0)', theme.color.overlay.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.row}>
        <CapsLabel size="sm" tone="inverse" style={styles.location}>
          {location}
        </CapsLabel>
        {weather && (
          <Pill
            label={weather}
            emoji={weatherEmoji}
            size="sm"
            variant="default"
            style={styles.weather}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  location: {
    flex: 1,
    flexShrink: 1,
  },
  weather: {
    backgroundColor: theme.color.overlay.light,
    borderWidth: 0,
  },
});
