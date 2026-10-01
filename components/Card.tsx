import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/constants/theme';

type Variant = 'default' | 'warm' | 'featured' | 'dashed';

interface CardProps {
  variant?: Variant;
  children: ReactNode;
  /** Override the default padding (e.g., 0 if image bleeds to edge) */
  padding?: number;
  onPress?: (e: GestureResponderEvent) => void;
  /** Accessible name for a pressable card (announced instead of its contents). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({ variant = 'default', children, padding, onPress, accessibilityLabel, style }: CardProps) {
  const containerStyle = [
    styles.base,
    variantStyle(variant),
    padding !== undefined && { padding },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

function variantStyle(variant: Variant): ViewStyle {
  switch (variant) {
    case 'default':
      return {
        backgroundColor: theme.color.bg.primary,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.border.light,
        padding: theme.space[5],
      };
    case 'warm':
      return {
        backgroundColor: theme.color.bg.warm,
        padding: theme.space[5],
      };
    case 'featured':
      return {
        backgroundColor: theme.color.bg.primary,
        padding: 0,
        ...theme.elevation[1],
      };
    case 'dashed':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: theme.color.border.mid,
        padding: theme.space[8],
      };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
