import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CapsLabel } from '@/components/CapsLabel';
import { Italic } from '@/components/Italic';
import { SwipeDeck } from '@/components/SwipeDeck';
import { theme } from '@/constants/theme';
import { STYLE_CARDS_SET_2, inferArchetype } from '@/lib/styleCards';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

export default function StyleSwipes2Screen() {
  const router = useRouter();
  const addSwipeChoice = useOnboardingStore((s) => s.addSwipeChoice);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);
  const setTasteArchetype = useOnboardingStore((s) => s.setTasteArchetype);

  const handleChoice = useCallback(
    (cardId: string, choice: 'love' | 'pass') => {
      addSwipeChoice({ cardId, choice });
    },
    [addSwipeChoice]
  );

  const handleComplete = useCallback(() => {
    // Pull the final, fully-recorded choices from the store before inferring.
    const choices = useOnboardingStore.getState().styleSwipeChoices;
    const archetype = inferArchetype(choices);
    setTasteArchetype(archetype);
    markScreenComplete(11);
    router.push('/onboarding/taste-reveal');
  }, [markScreenComplete, router, setTasteArchetype]);

  return (
    <View style={styles.root}>
      <View style={styles.swipeBlock}>
        <View style={styles.eyebrow}>
          <CapsLabel size="md" tone="secondary">
            Learning your taste
          </CapsLabel>
        </View>

        <Text style={styles.headline}>
          A few more — Iris is <Italic tone="rust">getting</Italic> it
        </Text>

        <Text style={styles.subhead}>
          Swipe right if you love it, left if it’s not for you.
        </Text>

        <View style={styles.deckWrap}>
          <SwipeDeck
            cards={STYLE_CARDS_SET_2}
            onChoice={handleChoice}
            onComplete={handleComplete}
          />
        </View>
      </View>
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
});
