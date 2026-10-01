import { StyleSheet, View } from 'react-native';

import { theme } from '@/constants/theme';

interface ProgressDotsProps {
  total: number;
  /** 0-based index of the current step. Dots before it render as completed,
   *  the dot at this index renders as active, dots after as upcoming. */
  current: number;
}

const DOT_SIZE = 6;

/**
 * Tiny horizontal-row indicator for the onboarding header. Twelve dots fit
 * comfortably in the header center with 6px gaps. Active = full ink/primary,
 * completed = ink/primary at 40% opacity, upcoming = border/light.
 */
export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        let style;
        if (i === current) style = styles.active;
        else if (i < current) style = styles.completed;
        else style = styles.upcoming;
        return <View key={i} style={[styles.dot, style]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DOT_SIZE,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  active: {
    backgroundColor: theme.color.ink.primary,
  },
  completed: {
    backgroundColor: theme.color.ink.primary,
    opacity: 0.4,
  },
  upcoming: {
    backgroundColor: theme.color.border.light,
  },
});
