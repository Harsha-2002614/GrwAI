import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { Button } from './Button';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

interface EmptyStateProps {
  icon: ComponentType<IconProps>;
  /** Display headline. No italic emphasis on empty states (utility moment) */
  headline: string;
  subhead?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function EmptyState({ icon: Icon, headline, subhead, ctaLabel, onCtaPress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon size={28} color={theme.color.ink.secondary} strokeWidth={1.75} />
      </View>
      <Text style={styles.headline}>{headline}</Text>
      {subhead && <Text style={styles.subhead}>{subhead}</Text>}
      {ctaLabel && onCtaPress && (
        <View style={{ marginTop: theme.space[6] }}>
          <Button label={ctaLabel} onPress={onCtaPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingVertical: theme.space[12],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.color.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space[5],
  },
  headline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    letterSpacing: theme.font.display.sm.letterSpacing,
    color: theme.color.ink.primary,
    textAlign: 'center',
  },
  subhead: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
    marginTop: theme.space[2],
    maxWidth: 320,
  },
});
