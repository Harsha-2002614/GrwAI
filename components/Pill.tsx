import type { ComponentType } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/constants/theme';

type Variant = 'default' | 'active' | 'accent' | 'success' | 'warning' | 'outline' | 'ghost';
type Size = 'sm' | 'md';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

interface PillProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  /** Sugar — when true, renders as 'active' regardless of variant */
  active?: boolean;
  /** Lucide icon component (ActionPure / navigation chips per dual-icon rule) */
  leadingIcon?: ComponentType<IconProps>;
  /** Emoji string with \uFE0F variation selector — use only on event/condition chips */
  emoji?: string;
  /** Inline count to the right of label */
  count?: number;
  style?: StyleProp<ViewStyle>;
}

const sizeMap = {
  sm: { height: 28, paddingV: 6, paddingH: 12, fontSize: theme.font.label.sm.fontSize },
  md: { height: 38, paddingV: theme.space[2], paddingH: theme.space[4], fontSize: theme.font.label.md.fontSize },
} as const;

export function Pill({
  label,
  variant = 'default',
  size = 'md',
  active,
  leadingIcon: Leading,
  emoji,
  count,
  style,
  onPress,
  disabled,
  ...rest
}: PillProps) {
  const s = sizeMap[size];
  const v: Variant = active ? 'active' : variant;
  const colors = variantColors(v);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!active, disabled: !!disabled } : undefined}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: s.height,
          paddingVertical: s.paddingV,
          paddingHorizontal: s.paddingH,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: colors.borderWidth,
          opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <View style={styles.row}>
        {Leading && (
          <Leading
            size={theme.inlineIcon.size.chip}
            color={colors.text}
            strokeWidth={1.75}
          />
        )}
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <Text
          style={{
            fontFamily: theme.font.family.sansMedium,
            fontSize: s.fontSize,
            lineHeight: s.fontSize, // anti-overlap: line-height 1
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {count !== undefined && (
          <Text
            style={{
              fontFamily: theme.font.family.sans,
              fontSize: s.fontSize,
              lineHeight: s.fontSize,
              color: theme.color.ink.tertiary,
              marginLeft: -4, // tighten the gap from 8px → 4px after label per spec
            }}
          >
            {count}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function variantColors(variant: Variant): {
  bg: string;
  text: string;
  border: string;
  borderWidth: number;
} {
  switch (variant) {
    case 'default':
      return {
        bg: theme.color.bg.primary,
        text: theme.color.ink.primary,
        border: theme.color.border.light,
        borderWidth: StyleSheet.hairlineWidth,
      };
    case 'active':
      return {
        bg: theme.color.ink.primary,
        text: theme.color.ink.inverse,
        border: 'transparent',
        borderWidth: 0,
      };
    case 'accent':
      return {
        bg: theme.color.accent.rustSoft,
        text: theme.color.accent.rust,
        border: 'transparent',
        borderWidth: 0,
      };
    case 'success':
      return {
        bg: theme.color.success.soft,
        text: theme.color.success.base,
        border: 'transparent',
        borderWidth: 0,
      };
    case 'warning':
      return {
        bg: theme.color.warning.soft,
        text: theme.color.warning.base,
        border: 'transparent',
        borderWidth: 0,
      };
    case 'outline':
      return {
        bg: 'transparent',
        text: theme.color.ink.primary,
        border: theme.color.ink.primary,
        borderWidth: 1,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        text: theme.color.ink.secondary,
        border: 'transparent',
        borderWidth: 0,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.inlineIcon.gap,
  },
  emoji: {
    fontSize: 14,
    // 4px more headroom than the 14px font-size — emoji glyphs render ~2-3px
    // above their text baseline on iOS, so lineHeight: 1 clips the top.
    lineHeight: 18,
    flexShrink: 0,
    // Fixed-width box so all emoji glyphs share the same left-edge spacing
    // regardless of intrinsic glyph width (heart vs ring vs plane vary).
    width: 18,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    // Optical centering: Apple emoji glyphs sit slightly below the text
    // baseline at this size — nudge up 1px so they look co-aligned.
    marginTop: -1,
  },
});
