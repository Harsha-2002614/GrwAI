import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { CapsLabel } from '@/components/CapsLabel';
import { Italic } from '@/components/Italic';
import { SwipeDeck } from '@/components/SwipeDeck';
import { theme } from '@/constants/theme';
import { STYLE_CARDS_SET_1 } from '@/lib/styleCards';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

const TRANSITION_HOLD = 800;

export default function StyleSwipes1Screen() {
  const router = useRouter();
  const addSwipeChoice = useOnboardingStore((s) => s.addSwipeChoice);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);

  const [phase, setPhase] = useState<'swiping' | 'transitioning'>('swiping');

  const handleChoice = useCallback(
    (cardId: string, choice: 'love' | 'pass') => {
      addSwipeChoice({ cardId, choice });
    },
    [addSwipeChoice]
  );

  const handleComplete = useCallback(() => {
    markScreenComplete(10);
    setPhase('transitioning');
    setTimeout(() => {
      router.push('/onboarding/style-swipes-2');
    }, TRANSITION_HOLD);
  }, [markScreenComplete, router]);

  return (
    <View style={styles.root}>
      {phase === 'swiping' && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(180)}
          style={styles.swipeBlock}
        >
          <View style={styles.eyebrow}>
            <CapsLabel size="md" tone="secondary">
              Learning your taste
            </CapsLabel>
          </View>

          <Text style={styles.headline}>
            Show Iris what feels like <Italic tone="rust">you</Italic>
          </Text>

          <Text style={styles.subhead}>
            Swipe right if you love it, left if it’s not for you.
          </Text>

          <View style={styles.deckWrap}>
            <SwipeDeck
              cards={STYLE_CARDS_SET_1}
              onChoice={handleChoice}
              onComplete={handleComplete}
            />
          </View>
        </Animated.View>
      )}

      {phase === 'transitioning' && (
        <Animated.View
          entering={FadeIn.duration(220)}
          style={styles.transition}
        >
          <Sparkles
            size={28}
            color={theme.color.ink.primary}
            strokeWidth={2}
          />
          <Text style={styles.transitionCaps}>GOT IT — A FEW MORE TO REFINE</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  swipeBlock: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[6],
  },
  eyebrow: {
    alignItems: 'center',
    marginBottom: theme.space[2],
  },
  headline: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.lg.fontSize,
    lineHeight: theme.font.display.lg.lineHeight,
    letterSpacing: theme.font.display.lg.letterSpacing,
    color: theme.color.ink.primary,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 320,
  },
  subhead: {
    marginTop: theme.space[4],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 340,
  },
  deckWrap: {
    flex: 1,
    marginTop: theme.space[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  transition: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[4],
  },
  transitionCaps: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.caps.md.fontSize,
    lineHeight: theme.font.caps.md.lineHeight,
    letterSpacing: theme.font.caps.md.letterSpacing,
    color: theme.color.ink.secondary,
    textAlign: 'center',
  },
});
