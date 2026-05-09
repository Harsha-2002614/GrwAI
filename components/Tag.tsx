import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';
import { CapsLabel } from './CapsLabel';

interface TagProps {
  children: ReactNode | string;
  style?: StyleProp<ViewStyle>;
  tone?: 'primary' | 'rust';
}

/**
 * Decorative caps badge with backdrop blur for floating on photos.
 * "CASUAL · ERRAND-FRIENDLY", "OFFICE · SYNCED: TEAM STANDUP" — top-left of hero
 * outfit images. iOS gets the blur; Android gracefully falls back to opacity.
 */
export function Tag({ children, style, tone = 'primary' }: TagProps) {
  const content =
    typeof children === 'string' ? (
      <CapsLabel size="sm" tone={tone}>
        {children}
      </CapsLabel>
    ) : (
      children
    );

  return (
    <View style={[styles.wrap, style]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 20 : 0}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.bg]} />
      <View style={styles.content}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  bg: {
    backgroundColor: theme.color.overlay.light,
  },
  content: {
    paddingVertical: theme.space[2],
    paddingHorizontal: 14,
  },
});
