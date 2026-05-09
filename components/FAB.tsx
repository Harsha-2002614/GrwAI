import type { ComponentType } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';

type Size = 'sm' | 'md';
type Variant = 'primary' | 'secondary';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

interface FABProps {
  icon: ComponentType<IconProps>;
  size?: Size;
  variant?: Variant;
  /**
   * Reserved for the floating-on-photo placement (e.g., try-on FAB).
   * Currently a no-op visual-wise — icon contrast carries the lift.
   * If real photoreal scenes ever need extra separation, add elevation/2 here.
   */
  onPhoto?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function FAB({
  icon: Icon,
  size = 'md',
  variant = 'primary',
  onPress,
  accessibilityLabel,
  style,
  disabled,
}: FABProps) {
  const dim = size === 'md' ? theme.layout.fabSize.md : theme.layout.fabSize.sm;
  const iconSize = size === 'md' ? 24 : 20;

  const bg = variant === 'primary' ? theme.color.ink.primary : theme.color.bg.primary;
  const fg = variant === 'primary' ? theme.color.ink.inverse : theme.color.ink.primary;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bg,
          opacity: pressed ? 0.85 : disabled ? 0.4 : 1,
        },
        theme.elevation[2],
        style,
      ]}
    >
      <Icon size={iconSize} color={fg} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
