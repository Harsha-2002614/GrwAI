import * as Haptics from 'expo-haptics';
import { Heart } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '@/constants/theme';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'circle' | 'chip' | 'bare';

interface SaveButtonProps {
  saved: boolean;
  onChange: (next: boolean) => void;
  size?: Size;
  variant?: Variant;
  /** When floating on a photo: adds overlay/light backdrop circle for legibility */
  onPhoto?: boolean;
  disabled?: boolean;
  /** Override default a11y label */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const sizeMap = {
  sm: { tap: 32, icon: 18 },
  md: { tap: 40, icon: 22 },
  lg: { tap: 48, icon: 26 },
} as const;

/**
 * Module-level first-save-per-session flag. Reset on app launch (module reload).
 * Will move into the `saved` Zustand store at chunk 8 polish — for now this
 * gives the same behavior with no store dependency.
 */
let hasShownFirstSaveOfSession = false;

function fireFirstSaveHaptic() {
  // Defensive: expo-haptics no-ops on iOS simulator and on devices that don't
  // support it. Wrapped in try/catch so any unexpected throw is silent.
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    // intentionally empty
  }
}

export function SaveButton({
  saved,
  onChange,
  size = 'md',
  variant = 'circle',
  onPhoto,
  disabled,
  accessibilityLabel,
  style,
}: SaveButtonProps) {
  const s = sizeMap[size];
  const scale = useSharedValue(1);
  const filledOpacity = useSharedValue(saved ? 1 : 0);
  const outlinedOpacity = useSharedValue(saved ? 0 : 1);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saved) {
      // Instant fill on save (spec: 0ms heart fills with accent/rust)
      filledOpacity.value = withTiming(1, { duration: 0 });
      outlinedOpacity.value = withTiming(0, { duration: 0 });
    } else {
      // 200ms fade on unsave (spec: quiet undo, no celebration)
      filledOpacity.value = withTiming(0, { duration: theme.motion.duration.base });
      outlinedOpacity.value = withTiming(1, { duration: theme.motion.duration.base });
    }
  }, [saved, filledOpacity, outlinedOpacity]);

  const handlePress = () => {
    if (disabled) return;
    const next = !saved;
    if (next) {
      scale.value = withSequence(
        withSpring(1.15, { duration: 120, dampingRatio: 0.85 }),
        withSpring(1, { duration: 160, dampingRatio: 0.9 })
      );
      if (!hasShownFirstSaveOfSession) {
        hasShownFirstSaveOfSession = true;
        setTimeout(fireFirstSaveHaptic, 260);
      }
    }
    onChange(next);
  };

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const filledStyle = useAnimatedStyle(() => ({ opacity: filledOpacity.value }));
  const outlinedStyle = useAnimatedStyle(() => ({ opacity: outlinedOpacity.value }));

  const stroke = onPhoto && variant === 'bare' ? theme.color.ink.inverse : theme.color.ink.primary;

  const iconStack = (
    <Animated.View style={[{ width: s.icon, height: s.icon }, iconWrapStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, outlinedStyle]}>
        <Heart
          size={s.icon}
          color={stroke}
          strokeWidth={1.75}
          fill="none"
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, filledStyle]}>
        <Heart
          size={s.icon}
          color={theme.color.accent.rust}
          strokeWidth={0}
          fill={theme.color.accent.rust}
        />
      </Animated.View>
    </Animated.View>
  );

  const a11yLabel =
    accessibilityLabel ?? (saved ? 'Saved' : 'Save outfit');
  const a11yHint = !saved ? 'Double tap to save this look to your favorites' : undefined;

  if (variant === 'bare') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={a11yHint}
        accessibilityState={{ selected: saved, disabled: !!disabled }}
        hitSlop={8}
        style={[
          { width: s.tap, height: s.tap, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 },
          style,
        ]}
      >
        {iconStack}
      </Pressable>
    );
  }

  if (variant === 'chip') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={a11yHint}
        accessibilityState={{ selected: saved, disabled: !!disabled }}
        style={({ pressed }) => [
          chipStyles.base,
          { opacity: pressed ? 0.85 : disabled ? 0.4 : 1 },
          style,
        ]}
      >
        {iconStack}
        <Text style={chipStyles.label}>{saved ? 'Saved' : 'Save look'}</Text>
      </Pressable>
    );
  }

  // circle (default)
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={a11yHint}
      accessibilityState={{ selected: saved, disabled: !!disabled }}
      style={({ pressed }) => [
        circleStyles.base,
        {
          width: s.tap,
          height: s.tap,
          borderRadius: s.tap / 2,
          backgroundColor: onPhoto ? theme.color.overlay.light : theme.color.bg.primary,
          borderColor: onPhoto ? 'transparent' : theme.color.border.light,
          borderWidth: onPhoto ? 0 : StyleSheet.hairlineWidth,
          opacity: disabled ? 0.4 : 1,
          transform: pressed ? [{ scale: 0.96 }] : [{ scale: 1 }],
        },
        style,
      ]}
    >
      {iconStack}
    </Pressable>
  );
}

const circleStyles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const chipStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.inlineIcon.gap,
    backgroundColor: theme.color.bg.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
    borderRadius: theme.radius.full,
    paddingVertical: theme.space[2],
    paddingHorizontal: theme.space[4],
    minHeight: 36,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: theme.font.family.sansMedium,
    fontSize: theme.font.label.md.fontSize,
    lineHeight: theme.font.label.md.fontSize, // line-height: 1
    color: theme.color.ink.primary,
  },
});
