import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CapsLabel } from '@/components/CapsLabel';
import { theme } from '@/constants/theme';
import type { StyleCard } from '@/lib/styleCards';

const SWIPE_THRESHOLD = 100;
const EXIT_DURATION = 240;
const ENCOURAGEMENT_FADE_IN = 150;
const ENCOURAGEMENT_HOLD = 400;
const ENCOURAGEMENT_FADE_OUT = 200;

const LOVE_PHRASES = [
  'Got it ✨',
  'Iris is taking notes',
  'Saved that one',
  'Iris remembers',
];
const PASS_PHRASES = [
  'Noted.',
  'Iris hears you',
  'Got it.',
  'Moving on',
];

const SCREEN = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN.width * 0.75);
// 4:5 means the card is taller than wide — width/height = 4/5, so
// height = width × 5/4 = width × 1.25.
const CARD_HEIGHT_4_5 = Math.round(CARD_WIDTH * 1.25);

const EXIT_X = SCREEN.width * 1.4;
const EXIT_ROT = 22; // degrees

const STANDARD_EASING = Easing.bezier(
  theme.motion.easing.standard[0],
  theme.motion.easing.standard[1],
  theme.motion.easing.standard[2],
  theme.motion.easing.standard[3]
);

export interface SwipeDeckProps {
  cards: readonly StyleCard[];
  onChoice: (cardId: string, choice: 'love' | 'pass') => void;
  onComplete: () => void;
}

export function SwipeDeck({ cards, onChoice, onComplete }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [encouragement, setEncouragement] = useState<string | null>(null);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  const current = cards[currentIndex] ?? null;
  const next = cards[currentIndex + 1] ?? null;

  const completedRef = useRef(false);
  useEffect(() => {
    if (!completedRef.current && currentIndex >= cards.length) {
      completedRef.current = true;
      onComplete();
    }
  }, [currentIndex, cards.length, onComplete]);

  const showEncouragement = useCallback((choice: 'love' | 'pass') => {
    const pool = choice === 'love' ? LOVE_PHRASES : PASS_PHRASES;
    setEncouragement(pool[Math.floor(Math.random() * pool.length)]);
    setTimeout(
      () => setEncouragement(null),
      ENCOURAGEMENT_FADE_IN + ENCOURAGEMENT_HOLD + ENCOURAGEMENT_FADE_OUT
    );
  }, []);

  const commit = useCallback(
    (cardId: string, choice: 'love' | 'pass') => {
      onChoice(cardId, choice);
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        // intentionally empty
      }
      showEncouragement(choice);
      setCurrentIndex((i) => i + 1);
      translateX.value = 0;
      translateY.value = 0;
      rotate.value = 0;
    },
    [onChoice, showEncouragement, translateX, translateY, rotate]
  );

  const buttonAction = useCallback(
    (choice: 'love' | 'pass') => {
      if (!current) return;
      const targetX = choice === 'love' ? EXIT_X : -EXIT_X;
      const targetRot = choice === 'love' ? EXIT_ROT : -EXIT_ROT;
      const card = current;
      translateX.value = withTiming(
        targetX,
        { duration: EXIT_DURATION, easing: STANDARD_EASING },
        (finished) => {
          if (finished) runOnJS(commit)(card.id, choice);
        }
      );
      rotate.value = withTiming(targetRot, {
        duration: EXIT_DURATION,
        easing: STANDARD_EASING,
      });
    },
    [current, translateX, rotate, commit]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY * 0.4;
          rotate.value = (e.translationX / SCREEN.width) * 18;
        })
        .onEnd((e) => {
          if (!current) {
            translateX.value = withTiming(0, { duration: 200, easing: STANDARD_EASING });
            translateY.value = withTiming(0, { duration: 200, easing: STANDARD_EASING });
            rotate.value = withTiming(0, { duration: 200, easing: STANDARD_EASING });
            return;
          }
          if (e.translationX > SWIPE_THRESHOLD) {
            const card = current;
            translateX.value = withTiming(
              EXIT_X,
              { duration: EXIT_DURATION, easing: STANDARD_EASING },
              (finished) => {
                if (finished) runOnJS(commit)(card.id, 'love');
              }
            );
            rotate.value = withTiming(EXIT_ROT, {
              duration: EXIT_DURATION,
              easing: STANDARD_EASING,
            });
          } else if (e.translationX < -SWIPE_THRESHOLD) {
            const card = current;
            translateX.value = withTiming(
              -EXIT_X,
              { duration: EXIT_DURATION, easing: STANDARD_EASING },
              (finished) => {
                if (finished) runOnJS(commit)(card.id, 'pass');
              }
            );
            rotate.value = withTiming(-EXIT_ROT, {
              duration: EXIT_DURATION,
              easing: STANDARD_EASING,
            });
          } else {
            translateX.value = withTiming(0, { duration: 200, easing: STANDARD_EASING });
            translateY.value = withTiming(0, { duration: 200, easing: STANDARD_EASING });
            rotate.value = withTiming(0, { duration: 200, easing: STANDARD_EASING });
          }
        }),
    [current, translateX, translateY, rotate, commit]
  );

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const overlayLoveStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, translateX.value / SWIPE_THRESHOLD)),
  }));
  const overlayPassStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, -translateX.value / SWIPE_THRESHOLD)),
  }));

  if (!current) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.position}>
        <CapsLabel size="sm" tone="secondary">
          {currentIndex + 1} of {cards.length}
        </CapsLabel>
      </View>

      <View style={styles.deck}>
        {next && (
          <View style={[styles.cardShell, styles.nextCard]}>
            <CardArt card={next} />
          </View>
        )}

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardShell, topCardStyle]}>
            <CardArt card={current} />
            <Animated.View
              pointerEvents="none"
              style={[styles.directionBadge, styles.directionLove, overlayLoveStyle]}
            >
              <Text style={styles.directionText}>LOVE</Text>
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[styles.directionBadge, styles.directionPass, overlayPassStyle]}
            >
              <Text style={styles.directionText}>PASS</Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.encouragementSlot}>
        {encouragement && (
          <Animated.Text
            key={encouragement}
            entering={FadeIn.duration(ENCOURAGEMENT_FADE_IN)}
            exiting={FadeOut.duration(ENCOURAGEMENT_FADE_OUT)}
            style={styles.encouragementText}
          >
            {encouragement}
          </Animated.Text>
        )}
      </View>

      <View style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pass on this look"
          onPress={() => buttonAction('pass')}
          style={({ pressed }) => [
            styles.button,
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
        >
          <X size={24} color={theme.color.ink.secondary} strokeWidth={1.75} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Love this look"
          onPress={() => buttonAction('love')}
          style={({ pressed }) => [
            styles.button,
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
        >
          <Heart size={24} color={theme.color.accent.rust} strokeWidth={1.75} />
        </Pressable>
      </View>
    </View>
  );
}

interface CardArtProps {
  card: StyleCard;
}

function CardArt({ card }: CardArtProps) {
  return (
    <View style={styles.cardClip}>
      <LinearGradient
        colors={[card.gradient[0], card.gradient[1]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Subtle figure silhouette — vertical capsule, low-opacity white */}
      <View style={styles.silhouette} />

      {/* Bottom caption strip with dark legibility gradient */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']}
        style={styles.captionGradient}
      />
      <View style={styles.captionContent}>
        <Text style={styles.captionCaps}>{card.caption.toUpperCase()}</Text>
        <Text style={styles.captionName}>{card.name}</Text>
      </View>
    </View>
  );
}

const SILHOUETTE_W = Math.round(CARD_WIDTH * 0.32);
const SILHOUETTE_H = Math.round(CARD_HEIGHT_4_5 * 0.62);

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
  },
  position: {
    marginBottom: theme.space[3],
  },
  deck: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT_4_5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardShell: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT_4_5,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.elevation[3],
  },
  nextCard: {
    transform: [{ scale: 0.94 }],
    opacity: 0.55,
  },
  cardClip: {
    flex: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  silhouette: {
    position: 'absolute',
    width: SILHOUETTE_W,
    height: SILHOUETTE_H,
    left: '50%',
    top: '14%',
    marginLeft: -SILHOUETTE_W / 2,
    borderRadius: SILHOUETTE_W / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  captionGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  captionContent: {
    position: 'absolute',
    left: theme.space[5],
    right: theme.space[5],
    bottom: theme.space[5],
    gap: theme.space[1],
  },
  captionCaps: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.caps.sm.fontSize,
    lineHeight: theme.font.caps.sm.lineHeight,
    letterSpacing: theme.font.caps.sm.letterSpacing,
    color: theme.color.ink.inverse,
    opacity: 0.85,
  },
  captionName: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.sm.fontSize,
    lineHeight: theme.font.display.sm.lineHeight,
    color: theme.color.ink.inverse,
  },
  directionBadge: {
    position: 'absolute',
    top: theme.space[6],
    paddingHorizontal: theme.space[3],
    paddingVertical: theme.space[1],
    borderRadius: theme.radius.sm,
    borderWidth: 2,
  },
  directionLove: {
    right: theme.space[6],
    borderColor: theme.color.accent.rust,
    backgroundColor: 'rgba(199,93,58,0.18)',
  },
  directionPass: {
    left: theme.space[6],
    borderColor: theme.color.ink.inverse,
    backgroundColor: 'rgba(15,15,15,0.18)',
  },
  directionText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.caps.md.fontSize,
    lineHeight: theme.font.caps.md.lineHeight,
    letterSpacing: theme.font.caps.md.letterSpacing,
    color: theme.color.ink.inverse,
  },
  encouragementSlot: {
    height: 20,
    marginTop: theme.space[4],
    marginBottom: theme.space[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  encouragementText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.caps.xs.fontSize,
    lineHeight: theme.font.caps.xs.lineHeight,
    letterSpacing: theme.font.caps.xs.letterSpacing,
    color: theme.color.ink.secondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: 64,
    marginTop: theme.space[2],
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: theme.color.border.light,
    backgroundColor: theme.color.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation[1],
  },
});
