import { Text, type TextProps } from 'react-native';

import { theme } from '@/constants/theme';

interface ItalicProps extends TextProps {
  tone?: 'primary' | 'rust';
}

/**
 * Wraps a single word in Playfair italic. Designed to nest inside a Playfair
 * display heading and inherit fontSize/lineHeight from its parent <Text>.
 *
 * Use tone="rust" on hero/conversion display headlines (Today, Events, Closet,
 * Stylist openers, onboarding, conversion moments). Default ink/primary italic
 * is for quieter contexts (lists, secondary screens). Per DESIGN_SYSTEM §3.3,
 * italic emphasis is discretionary — skip on utility/empty/modal headings.
 */
export function Italic({ tone = 'primary', style, children, ...rest }: ItalicProps) {
  const color = tone === 'rust' ? theme.color.accent.rust : theme.color.ink.primary;
  return (
    <Text {...rest} style={[{ fontFamily: theme.font.family.serifItalic, color }, style]}>
      {children}
    </Text>
  );
}
