import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/constants/theme';

interface ListRowProps {
  /** Leading icon, avatar, or any 24-40px node. flex-shrink: 0 applied */
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  /** Right-aligned secondary text (status, value) */
  trailingValue?: string;
  /** Show chevron-right on right edge */
  showChevron?: boolean;
  /** Replace the chevron with an arbitrary trailing node */
  trailing?: ReactNode;
  /** Omit the bottom hairline border (use on the last row) */
  isLast?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  /** When true, paddingHorizontal is omitted — caller controls */
  inset?: boolean;
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailingValue,
  showChevron = true,
  trailing,
  isLast,
  onPress,
  onLongPress,
  style,
  inset,
}: ListRowProps) {
  const Container: typeof View | typeof Pressable = onPress || onLongPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.base,
        !inset && { paddingHorizontal: theme.layout.screenPaddingX },
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.color.border.light,
        },
        style,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.middle}>
        <Text
          style={{
            fontFamily: theme.font.family.sans,
            fontSize: theme.font.body.md.fontSize,
            lineHeight: theme.font.body.md.lineHeight,
            color: theme.color.ink.primary,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontFamily: theme.font.family.sans,
              fontSize: theme.font.body.sm.fontSize,
              lineHeight: theme.font.body.sm.lineHeight,
              color: theme.color.ink.secondary,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {trailingValue && (
        <Text
          style={{
            fontFamily: theme.font.family.sans,
            fontSize: theme.font.body.sm.fontSize,
            lineHeight: theme.font.body.sm.lineHeight,
            color: theme.color.ink.secondary,
            marginLeft: theme.space[2],
            flexShrink: 0,
          }}
          numberOfLines={1}
        >
          {trailingValue}
        </Text>
      )}
      {trailing ? (
        <View style={styles.trailing}>{trailing}</View>
      ) : showChevron ? (
        <ChevronRight
          size={theme.inlineIcon.size.listTrailing}
          color={theme.color.ink.tertiary}
          strokeWidth={1.75}
          style={{ marginLeft: theme.space[2] }}
        />
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.layout.rowMinHeight,
    paddingVertical: theme.space[2],
    backgroundColor: theme.color.bg.primary,
  },
  leading: {
    marginRight: theme.space[4],
    flexShrink: 0,
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  trailing: {
    marginLeft: theme.space[2],
    flexShrink: 0,
  },
});
