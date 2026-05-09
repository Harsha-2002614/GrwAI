import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Disable backdrop tap-to-close (e.g., for forms with dirty state) */
  dismissable?: boolean;
}

export function Sheet({ visible, onClose, children, dismissable = true }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={styles.backdrop}
        entering={FadeIn.duration(theme.motion.duration.base)}
        exiting={FadeOut.duration(theme.motion.duration.base)}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissable ? onClose : undefined}
          accessibilityLabel="Close sheet"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + theme.space[8],
            },
          ]}
          entering={SlideInDown.duration(theme.motion.duration.slow).easing(
            Easing.out(Easing.cubic)
          )}
          exiting={SlideOutDown.duration(280).easing(Easing.in(Easing.cubic))}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,15,15,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.color.bg.warm,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingTop: theme.space[2],
    paddingHorizontal: theme.space[6],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border.light,
  },
  handleWrap: {
    alignItems: 'center',
    marginBottom: theme.space[6],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.color.border.mid,
  },
});
