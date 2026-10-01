// Moment look — the composed try-on for an Iris-authored moment.
//
// Given a moment id, we:
//   1. Read the persisted moment from `useMomentsStore`.
//   2. Pull the fullBody photo + honor prefs + wardrobe pieces.
//   3. Compose a look via `composeLook()` (deterministic, no LLM).
//   4. Chain YouCam calls sequentially: person → +upper → +lower.
//      (For a single full_body pick, one call.)
//   5. Render the final image with the same shimmer/reveal patterns
//      as the piece try-on screen.
//
// The owned/to-source strip below tells the honest story: N pieces
// from your closet, K to source, with a dashed placeholder + a Iris
// descriptor for each gap.

import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { IrisMessageCard } from '@/components/IrisMessageCard';
import { SaveButton } from '@/components/SaveButton';
import { Tag } from '@/components/Tag';
import { theme } from '@/constants/theme';
import type { EventCategory } from '@/lib/mockData';
import {
  composeLook,
  type ComposedLook,
  type ComposedSlot,
  type LookZone,
} from '@/lib/moments/composeLook';
import { getForecast, type WeatherForecast } from '@/lib/weather/forecast';
import { useMomentsStore } from '@/lib/stores/momentsStore';
import { usePrefsStore } from '@/lib/stores/prefsStore';
import { useProfilePhotosStore } from '@/lib/stores/profilePhotosStore';
import { useWardrobeStore } from '@/lib/stores/wardrobeStore';
import { messageForCode, type YouCamErrorCode } from '@/lib/youcam/errorMessages';
import { generateTryOn } from '@/lib/youcam/provider';
import type { GarmentCategory } from '@/lib/youcam/types';

const SHIMMER_DURATION = 1400;
const CROSSFADE_DURATION = 480;
const DECELERATE = Easing.bezier(0, 0, 0, 1);
const INSTANT_MS = 300;

type GenState =
  | { kind: 'idle' }
  | { kind: 'running'; startedAt: number }
  | { kind: 'done'; uri: string; instant: boolean }
  | { kind: 'failed'; errorCode: YouCamErrorCode }
  | { kind: 'gap_only' };

function zoneToCategory(zone: LookZone): GarmentCategory {
  switch (zone) {
    case 'upper_body':
      return 'upper_body';
    case 'lower_body':
      return 'lower_body';
    case 'full_body':
      return 'full_body';
    case 'outerwear':
      return 'outerwear';
  }
}

function daysUntil(iso: string): number {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function occasionCaps(occasion: EventCategory): string {
  return occasion.toUpperCase();
}

export default function MomentLookScreen() {
  const router = useRouter();
  const { momentId } = useLocalSearchParams<{ momentId: string }>();

  const moment = useMomentsStore((s) =>
    s.moments.find((m) => m.id === momentId)
  );
  const setRenderUri = useMomentsStore((s) => s.setRenderUri);
  const fullBodyUri = useProfilePhotosStore((s) => s.fullBodyUri);
  const pieces = useWardrobeStore((s) => s.pieces);
  const honorPreferences = usePrefsStore((s) => s.honorPreferences);

  const [weather, setWeather] = useState<WeatherForecast | null | undefined>(
    undefined
  );
  const [state, setState] = useState<GenState>({ kind: 'idle' });
  const [saved, setSaved] = useState(false);
  const runIdRef = useRef(0);
  // "Show another option" walks down the ranked candidate list by
  // adding currently-selected piece IDs to a skip set and recomposing.
  const [skipPieceIds, setSkipPieceIds] = useState<Set<string>>(new Set());
  const [noMoreAlts, setNoMoreAlts] = useState(false);

  // Weather warm-fetch — cached from composer, so usually instant.
  useEffect(() => {
    if (!moment) return;
    void getForecast(moment.city, new Date(moment.dateIso)).then((f) =>
      setWeather(f ?? null)
    );
  }, [moment]);

  const look = useMemo<ComposedLook | null>(() => {
    if (!moment || weather === undefined) return null;
    return composeLook({
      pieces,
      occasion: moment.occasion,
      dressCode: moment.dressCode,
      honorPreferences,
      weather,
      skipPieceIds,
    });
  }, [moment, pieces, weather, honorPreferences, skipPieceIds]);

  const isModest = honorPreferences.includes('hijab_modest');

  // Kick off the (chained) render as soon as the look is ready.
  useEffect(() => {
    if (!look || !fullBodyUri) return;

    // Modest hard-block: composition returned all-gaps because coverage
    // rules failed closed. Show gaps + honest Iris message; NEVER call
    // the provider. Also short-circuits `gap_only` below.
    if (look.blockedByCoverage) {
      setState({ kind: 'gap_only' });
      return;
    }

    // Cheap short-circuit: the moment already has a persisted render
    // AND we haven't started walking the alternatives chain (skip set
    // empty). Skip the chain entirely so re-entry from Events is instant.
    if (moment?.renderUri && skipPieceIds.size === 0) {
      setState({ kind: 'done', uri: moment.renderUri, instant: true });
      return;
    }

    const owned = look.slots.filter(
      (s): s is ComposedSlot & { piece: NonNullable<ComposedSlot['piece']> } =>
        !!s.piece
    );
    if (owned.length === 0) {
      setState({ kind: 'gap_only' });
      return;
    }

    // Render guard: never send `full_body` to the provider when modest
    // is on. composeLook already avoids picking full_body under modest
    // — this is belt-and-braces so a future edit can't regress the
    // safety invariant.
    for (const slot of owned) {
      if (isModest && slot.zone === 'full_body') {
        console.warn(
          '[moment-look] refusing full_body render under hijab_modest — check composeLook invariant'
        );
        setState({ kind: 'gap_only' });
        return;
      }
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const startedAt = Date.now();
    setState({ kind: 'running', startedAt });

    void chainRenders(fullBodyUri, owned).then((res) => {
      if (runIdRef.current !== runId) return;
      if (res.kind === 'ok') {
        const elapsed = Date.now() - startedAt;
        setState({ kind: 'done', uri: res.uri, instant: elapsed < INSTANT_MS });
        // Persist the local URI onto the moment ONLY when this is the
        // original composition (no alternatives walked); otherwise the
        // Events hero would drift out of sync with the primary look.
        if (moment && skipPieceIds.size === 0) setRenderUri(moment.id, res.uri);
      } else {
        setState({ kind: 'failed', errorCode: res.errorCode });
      }
    });
  }, [look, fullBodyUri, moment, setRenderUri, skipPieceIds, isModest]);

  const handleShowAnother = () => {
    if (!look) return;
    if (!look.hasAlternatives) {
      setNoMoreAlts(true);
      return;
    }
    // Add currently-picked pieces to the skip set so composeLook
    // walks to the next-best per zone on the next render.
    const nextSkip = new Set(skipPieceIds);
    for (const slot of look.slots) {
      if (slot.piece) nextSkip.add(slot.piece.id);
    }
    setSkipPieceIds(nextSkip);
    setNoMoreAlts(false);
  };

  const topPieceName = useMemo(() => {
    if (!look) return null;
    const first = look.slots.find((s) => s.piece)?.piece;
    if (!first) return null;
    return first.customOccasion?.trim() || first.category || 'this piece';
  }, [look]);

  if (!moment) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title="Look" onBack={() => router.back()} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This moment is gone.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!fullBodyUri) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title={occasionCaps(moment.occasion)} onBack={() => router.back()} />
        <View style={styles.body}>
          <IrisMessageCard
            plain
            lines={[
              "Add a full-body photo first and I'll show you in this look.",
            ]}
          />
          <Button
            label="Add photo"
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => router.push('/profile-photos')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const dLabel = `T-${Math.max(0, daysUntil(moment.dateIso))}D`;
  const eyebrow = `${occasionCaps(moment.occasion)} · ${dLabel} · ${formatDateShort(moment.dateIso).toUpperCase()}`;

  const ownedCount = look?.ownedCount ?? 0;
  const toSourceCount = look?.toSourceCount ?? 0;
  const totalCount = ownedCount + toSourceCount;
  const stripCaps =
    totalCount === 0
      ? 'PICKS'
      : toSourceCount === 0
        ? `${ownedCount} OF ${totalCount} OWNED`
        : `${ownedCount} OF ${totalCount} OWNED · ${toSourceCount} TO SOURCE`;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title={occasionCaps(moment.occasion)} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <CapsLabel size="md" tone="rust">
          {eyebrow}
        </CapsLabel>

        <View style={styles.frame}>
          {state.kind === 'done' && <ResultLayer uri={state.uri} />}
          {state.kind === 'running' && <ShimmerLayer />}
          {state.kind === 'gap_only' && (
            <ExpoImage
              source={{ uri: fullBodyUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={0}
              cachePolicy="memory-disk"
            />
          )}

          {state.kind === 'done' && (
            <>
              <View style={styles.topLeft}>
                <Tag>{occasionCaps(moment.occasion)}</Tag>
              </View>
              <View style={styles.topRight}>
                <SaveButton saved={saved} onChange={setSaved} size="md" onPhoto />
              </View>
            </>
          )}
        </View>

        {look && (
          <View style={styles.stripBlock}>
            <CapsLabel size="sm" tone="secondary">
              {stripCaps}
            </CapsLabel>
            <View style={styles.stripRow}>
              {look.slots.map((slot, i) => (
                <StripTile key={`${slot.zone}-${i}`} slot={slot} />
              ))}
            </View>
          </View>
        )}

        {look && (
          <IrisMessageCard
            plain
            lines={
              look.blockedByCoverage
                ? [look.why]
                : [look.why, look.accessoryLine]
            }
          />
        )}

        {noMoreAlts && look && !look.hasAlternatives && (
          <IrisMessageCard
            plain
            lines={[
              `This is the piece in your closet that fits ${occasionCaps(
                moment.occasion
              ).toLowerCase()} best${topPieceName ? ` — ${topPieceName}` : ''}.`,
            ]}
          />
        )}

        {state.kind === 'failed' && (
          <IrisMessageCard
            suffix="Let's retake"
            tone="error"
            plain
            lines={[messageForCode(state.errorCode)]}
          />
        )}

        <View style={styles.refineRow}>
          <Button
            label="Swap a piece"
            variant="secondary"
            size="md"
            onPress={() => router.back()}
          />
          <Button
            label="Show another option"
            variant="tertiary"
            size="md"
            disabled={!look || !look.hasAlternatives}
            onPress={handleShowAnother}
          />
          <Button
            label="Looks right"
            variant="primary"
            size="md"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Chain renders ────────────────────────────────────────────────────
//
// Sequential try-on: start from the person photo, layer each owned
// piece on top by feeding the previous result as the new `person`
// image. Yields the final URI or a bubble-up error code.

async function chainRenders(
  personUri: string,
  owned: (ComposedSlot & { piece: NonNullable<ComposedSlot['piece']> })[]
): Promise<{ kind: 'ok'; uri: string } | { kind: 'err'; errorCode: YouCamErrorCode }> {
  let currentPerson = personUri;
  for (const slot of owned) {
    const result = await generateTryOn({
      personPhotoUri: currentPerson,
      garmentPhotoUri: slot.piece.uri,
      garmentCategory: zoneToCategory(slot.zone),
    });
    if ('failed' in result) {
      return { kind: 'err', errorCode: result.errorCode ?? 'default' };
    }
    currentPerson = result.uri;
  }
  return { kind: 'ok', uri: currentPerson };
}

// ─── Blocks ────────────────────────────────────────────────────────

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={({ pressed }) => [styles.back, { opacity: pressed ? 0.7 : 1 }]}
      >
        <ChevronLeft size={24} color={theme.color.ink.primary} strokeWidth={1.75} />
      </Pressable>
      <Text style={styles.headerTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.headerRightSpacer} />
    </View>
  );
}

function StripTile({ slot }: { slot: ComposedSlot }) {
  if (slot.piece) {
    return (
      <View style={styles.tile}>
        <ExpoImage
          source={{ uri: slot.piece.uri }}
          style={styles.tileImage}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
        />
      </View>
    );
  }
  return (
    <View style={styles.tileGap}>
      <Text style={styles.tileGapText}>{slot.gap?.descriptor ?? 'To source'}</Text>
    </View>
  );
}

function ResultLayer({ uri }: { uri: string }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: CROSSFADE_DURATION,
      easing: DECELERATE,
    });
    return () => cancelAnimation(opacity);
  }, [uri, opacity]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, fadeStyle]}
    >
      <ExpoImage
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={0}
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}

function ShimmerLayer() {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const stripeWidth = Math.max(1, Math.round(width * 0.6));
  const startX = -stripeWidth;
  const endX = width;
  const stripeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: startX + (endX - startX) * progress.value }],
  }));
  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };
  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, styles.shimmerMask]}
    >
      {width > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: stripeWidth,
            },
            stripeStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.42)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
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
  header: {
    minHeight: theme.layout.headerHeight,
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingVertical: theme.space[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border.light,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -theme.space[2],
  },
  headerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
    color: theme.color.ink.primary,
    flex: 1,
    marginLeft: theme.space[2],
  },
  headerRightSpacer: {
    width: 36,
  },
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[12],
    gap: theme.space[5],
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[8],
    gap: theme.space[4],
  },
  frame: {
    width: '100%',
    aspectRatio: theme.aspect.scene,
    backgroundColor: theme.color.bg.subtle,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  topLeft: {
    position: 'absolute',
    top: theme.space[4],
    left: theme.space[4],
  },
  topRight: {
    position: 'absolute',
    top: theme.space[4],
    right: theme.space[4],
  },
  stripBlock: {
    gap: theme.space[3],
  },
  stripRow: {
    flexDirection: 'row',
    gap: theme.space[3],
  },
  tile: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.color.bg.subtle,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileGap: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.color.border.mid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space[2],
  },
  tileGapText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.tertiary,
    textAlign: 'center',
  },
  refineRow: {
    flexDirection: 'row',
    gap: theme.space[3],
  },
  shimmerMask: {
    overflow: 'hidden',
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space[8],
  },
  missingText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
  },
});
