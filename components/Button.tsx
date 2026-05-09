import type { ComponentType } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  leadingIcon?: ComponentType<IconProps>;
  trailingIcon?: ComponentType<IconProps>;
  fullWidth?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: (e: GestureResponderEvent) => void;
}

const sizeMap = {
  sm: { height: 40, paddingV: theme.space[3], paddingH: theme.space[4], iconSize: theme.inlineIcon.size.buttonSm, radius: theme.radius.md, fontSize: theme.font.label.md.fontSize },
  md: { height: 48, paddingV: 14, paddingH: theme.space[5], iconSize: theme.inlineIcon.size.buttonMd, radius: theme.radius.md, fontSize: theme.font.label.lg.fontSize },
  lg: { height: 56, paddingV: theme.space[4], paddingH: theme.space[6], iconSize: theme.inlineIcon.size.buttonLg, radius: theme.radius.lg, fontSize: theme.font.label.lg.fontSize },
} as const;

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  leadingIcon: Leading,
  trailingIcon: Trailing,
  fullWidth,
  disabled,
  loading,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const s = sizeMap[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: s.height,
          paddingVertical: s.paddingV,
          paddingHorizontal: variant === 'tertiary' ? 0 : s.paddingH,
          borderRadius: s.radius,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        variantContainerStyle(variant, pressed, isDisabled),
        style,
      ]}
      {...rest}
    >
      {({ pressed }) => (
        <View style={styles.row}>
          {Leading && (
            <Leading
              size={s.iconSize}
              color={textColor(variant, isDisabled)}
              strokeWidth={1.75}
            />
          )}
          <Text
            style={{
              fontFamily: theme.font.family.sansMedium,
              fontSize:
                variant === 'tertiary' || variant === 'destructive'
                  ? theme.font.label.md.fontSize
                  : s.fontSize,
              lineHeight: s.fontSize + 2,
              color: textColor(variant, isDisabled),
              textDecorationLine:
                variant === 'tertiary' && pressed && !isDisabled ? 'underline' : 'none',
            }}
          >
            {label}
          </Text>
          {Trailing && (
            <Trailing
              size={s.iconSize}
              color={textColor(variant, isDisabled)}
              strokeWidth={1.75}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

function variantContainerStyle(variant: Variant, pressed: boolean, disabled?: boolean): ViewStyle {
  if (disabled) {
    if (variant === 'tertiary') return { backgroundColor: 'transparent' };
    return { backgroundColor: theme.color.bg.subtle, borderWidth: 0 };
  }
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: theme.color.ink.primary,
        opacity: pressed ? 0.85 : 1,
      };
    case 'secondary':
      return {
        backgroundColor: pressed ? theme.color.bg.warm : theme.color.bg.primary,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.border.light,
      };
    case 'tertiary':
      return { backgroundColor: 'transparent' };
    case 'destructive':
      return {
        backgroundColor: pressed ? theme.color.error.soft : theme.color.bg.primary,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.error.soft,
      };
  }
}

function textColor(variant: Variant, disabled?: boolean): string {
  if (disabled) return theme.color.ink.tertiary;
  switch (variant) {
    case 'primary':
      return theme.color.ink.inverse;
    case 'secondary':
    case 'tertiary':
      return theme.color.ink.primary;
    case 'destructive':
      return theme.color.error.base;
  }
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.inlineIcon.gap,
  },
});
