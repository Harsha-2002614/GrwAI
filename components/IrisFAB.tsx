// Iris-branded floating action button — the Ask Iris entry point.
//
// Anatomy (per §7.7):
//   • Iris avatar (black circle, italic Playfair "I", green live dot).
//   • Caps/xs "ASK IRIS" label beneath the avatar so the affordance
//     reads as a named CTA rather than a mystery-meat black dot.
//   • Same absolute position + elevation/2 as the previous FAB so the
//     spatial expectation carries over.

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { CapsLabel } from '@/components/CapsLabel';
import { theme } from '@/constants/theme';

const AVATAR_SIZE = theme.avatar.size.lg;
const BOTTOM_OFFSET = theme.layout.tabBarHeight + theme.space[6]; // 88
const RIGHT_OFFSET = theme.space[4]; // 16

const STANDARD_EASING = Easing.bezier(
  theme.motion.easing.standard[0],
  theme.motion.easing.standard[1],
  theme.motion.easing.standard[2],
  theme.motion.easing.standard[3]
);

export function IrisFAB() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(0.9);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    enterOpacity.value = withDelay(
      50,
      withTiming(1, { duration: theme.motion.duration.base, easing: STANDARD_EASING })
    );
    enterScale.value = withDelay(
      50,
      withTiming(1, { duration: theme.motion.duration.base, easing: STANDARD_EASING })
    );
  }, [enterOpacity, enterScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ scale: enterScale.value * pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.95, { duration: 100, easing: STANDARD_EASING });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 100, easing: STANDARD_EASING });
  };

  const handlePress = () => {
    router.push('/stylist');
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: BOTTOM_OFFSET + insets.bottom,
          right: RIGHT_OFFSET,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Ask Iris"
        accessibilityHint="Opens chat with your AI stylist"
        style={styles.button}
      >
        {/* Avatar carries its own elevation-2 wrapper below via `styles.avatarShadow`
            so the ring reads even against a busy list background. */}
        <View style={styles.avatarShadow}>
          <Avatar size="lg" iris />
        </View>
        <View style={styles.labelWrap}>
          <CapsLabel size="xs" tone="primary">
            Ask Iris
          </CapsLabel>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // width auto-sized around the Avatar (56) so it doesn't clip; label
    // sits beneath at the same visual gutter as the tab-bar labels.
    zIndex: 50,
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarShadow: {
    // Elevation/2 tokens per DESIGN_SYSTEM.md.
    ...theme.elevation[2],
    borderRadius: AVATAR_SIZE / 2,
    // Wrap explicitly sized so the shadow paints against a defined bounding box.
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  labelWrap: {
    marginTop: theme.space[1],
    // Small pill-shaped chip so the caps label reads legibly against
    // scrolling content behind it.
    backgroundColor: theme.color.bg.primary,
    paddingHorizontal: theme.space[2],
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    // Subtle hairline so the pill has an edge even on white.
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border.light,
  },
});
