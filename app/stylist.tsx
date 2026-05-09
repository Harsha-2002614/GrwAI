import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';

export default function StylistScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.title}>Iris</Text>
          <View style={styles.subtitleRow}>
            <View style={styles.dot} />
            <Text style={styles.subtitle}>STYLIST · LIVE</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          accessibilityHint="Closes the chat with Iris"
          hitSlop={8}
          style={({ pressed }) => [
            styles.closeButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <X size={24} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>
      </View>
      <View style={styles.body} />
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = theme.layout.headerHeight;
const CLOSE_BUTTON_SIZE = 36;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg.primary },
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: theme.layout.screenPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
    letterSpacing: theme.font.display.xs.letterSpacing,
    color: theme.color.ink.primary,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    marginTop: theme.space[1],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.color.success.base,
  },
  subtitle: {
    fontFamily: theme.font.family.sansSemibold,
    fontSize: theme.font.caps.sm.fontSize,
    lineHeight: theme.font.caps.sm.lineHeight,
    letterSpacing: theme.font.caps.sm.letterSpacing,
    color: theme.color.ink.secondary,
  },
  closeButton: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: CLOSE_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
});
