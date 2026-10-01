import { Check, Star } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';

type Variant =
  | 'styled'
  | 'needs-prep'
  | 'most-important'
  | 'fastest'
  | 'on-you'
  | 'illustration'
  | 'fit-score';
type Size = 'sm' | 'md';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

interface BadgeProps {
  variant: Variant;
  size?: Size;
  /** Override default label */
  label?: string;
  /** Used by fit-score: the numeric score */
  score?: number;
  style?: StyleProp<ViewStyle>;
}

interface VariantSpec {
  bg: string;
  fg: string;
  defaultLabel: string;
  icon?: ComponentType<IconProps>;
}

const variantSpec: Record<Variant, VariantSpec> = {
  styled: {
    bg: theme.color.success.soft,
    fg: theme.color.success.base,
    defaultLabel: 'Styled',
    icon: Check,
  },
  'needs-prep': {
    bg: theme.color.warning.soft,
    fg: theme.color.warning.base,
    defaultLabel: 'Needs prep',
  },
  'most-important': {
    bg: theme.color.ink.primary,
    fg: theme.color.ink.inverse,
    defaultLabel: 'Most important',
    icon: Star,
  },
  fastest: {
    // DS §2.2: rust never appears on "FASTEST" badges — ink/primary instead (v1.8 reconciles §7.9).
    bg: theme.color.ink.primary,
    fg: theme.color.ink.inverse,
    defaultLabel: 'Fastest',
  },
  'on-you': {
    bg: theme.color.accent.rust,
    fg: theme.color.ink.inverse,
    defaultLabel: 'On you',
  },
  illustration: {
    bg: theme.color.bg.subtle,
    fg: theme.color.ink.secondary,
    defaultLabel: 'Illustration',
  },
  'fit-score': {
    bg: theme.color.overlay.light,
    fg: theme.color.ink.primary,
    defaultLabel: 'fit',
  },
};

const sizeMap = {
  sm: { height: 18, paddingV: 4, paddingH: theme.space[2], fontSize: theme.font.caps.xs.fontSize, lineHeight: theme.font.caps.xs.lineHeight, letterSpacing: theme.font.caps.xs.letterSpacing, iconSize: 10 },
  md: { height: 22, paddingV: 6, paddingH: 10, fontSize: theme.font.caps.sm.fontSize, lineHeight: theme.font.caps.sm.lineHeight, letterSpacing: theme.font.caps.sm.letterSpacing, iconSize: 12 },
} as const;

export function Badge({ variant, size = 'md', label, score, style }: BadgeProps) {
  const spec = variantSpec[variant];
  const s = sizeMap[size];
  const Icon = spec.icon;

  const text =
    variant === 'fit-score' && score !== undefined
      ? `${score} ${label ?? spec.defaultLabel}`
      : label ?? spec.defaultLabel;

  return (
    <View
      style={[
        styles.base,
        {
          minHeight: s.height,
          paddingVertical: s.paddingV,
          paddingHorizontal: s.paddingH,
          backgroundColor: spec.bg,
        },
        style,
      ]}
    >
      {Icon && <Icon size={s.iconSize} color={spec.fg} strokeWidth={2} />}
      <Text
        style={{
          fontFamily: theme.font.family.sansSemibold,
          fontSize: s.fontSize,
          lineHeight: s.fontSize,
          letterSpacing: s.letterSpacing,
          color: spec.fg,
          textTransform: 'uppercase',
        }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
});
