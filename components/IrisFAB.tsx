import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '@/constants/theme';

const SIZE = theme.layout.fabSize.md;
const BOTTOM_OFFSET = theme.layout.tabBarHeight + theme.space[6]; // 64 + 24 = 88
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
        <MessageCircle
          size={24}
          color={theme.color.ink.inverse}
          strokeWidth={1.75}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    zIndex: 50,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.ink.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation[2],
  },
});
