import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { theme } from '@/constants/theme';

type CapsSize = 'md' | 'sm' | 'xs';
type CapsTone = 'secondary' | 'primary' | 'rust' | 'inverse' | 'tertiary';

interface CapsLabelProps {
  size?: CapsSize;
  tone?: CapsTone;
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const toneColor: Record<CapsTone, string> = {
  secondary: theme.color.ink.secondary,
  primary: theme.color.ink.primary,
  rust: theme.color.accent.rust,
  inverse: theme.color.ink.inverse,
  tertiary: theme.color.ink.tertiary,
};

export function CapsLabel({
  size = 'md',
  tone = 'secondary',
  children,
  style,
  numberOfLines,
}: CapsLabelProps) {
  const f = theme.font.caps[size];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: theme.font.family.sansSemibold,
          fontSize: f.fontSize,
          lineHeight: f.lineHeight,
          letterSpacing: f.letterSpacing,
          textTransform: 'uppercase',
          color: toneColor[tone],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
