import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/constants/theme';
import { CapsLabel } from './CapsLabel';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Render label as caps eyebrow (default true when label is set) */
  capsLabel?: boolean;
  error?: string;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  capsLabel = true,
  error,
  helper,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.color.error.base
    : focused
      ? theme.color.ink.primary
      : theme.color.border.light;
  const borderWidth = error || focused ? 1.5 : StyleSheet.hairlineWidth;

  return (
    <View style={containerStyle}>
      {label && (
        <View style={{ marginBottom: theme.space[2] }}>
          {capsLabel ? (
            <CapsLabel size="sm" tone="secondary">
              {label}
            </CapsLabel>
          ) : (
            <Text
              style={{
                fontFamily: theme.font.family.sansMedium,
                fontSize: theme.font.label.md.fontSize,
                lineHeight: theme.font.label.md.lineHeight,
                color: theme.color.ink.secondary,
              }}
            >
              {label}
            </Text>
          )}
        </View>
      )}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={theme.color.ink.tertiary}
        style={[
          styles.input,
          {
            borderColor,
            borderWidth,
            color: theme.color.ink.primary,
          },
        ]}
      />
      {(error || helper) && (
        <Text
          style={{
            marginTop: theme.space[2],
            fontFamily: theme.font.family.sans,
            fontSize: theme.font.body.xs.fontSize,
            lineHeight: theme.font.body.xs.lineHeight,
            color: error ? theme.color.error.base : theme.color.ink.tertiary,
          }}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    backgroundColor: theme.color.bg.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
  },
});
