// Try-on for a single closet piece.
//
// Flow: on mount we compose the request (person = profile fullBody,
// garment = piece.uri, category = categoryForPiece(piece)) and hand it
// to `generateTryOn`. The provider handles caching + fallback; here we
// just render the three states cleanly.
//
// UX:
//   • While generating: §9.2 shimmer sweep + rotating caps status ("READING
//     THE PIECE" → "FITTING IT TO YOU" → "ALMOST THERE") over the 3:4 frame.
//   • On success: 480ms decelerate crossfade reveal. Floating piece-name
//     Tag top-left (§7.14), SaveButton md top-right (§7.13).
//   • On failure with a mapped code: Iris "LET'S RETAKE" card with the
//     mapped copy + "Try again" secondary. No raw errors ever.
//   • Cache-hit path (<300ms): skip the shimmer so the reveal doesn't
//     feel like fake work.

import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
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
import { useProfilePhotosStore } from '@/lib/stores/profilePhotosStore';
import {
  useWardrobeStore,
  type WardrobePiece,
} from '@/lib/stores/wardrobeStore';
import { categoryForPiece } from '@/lib/youcam/categoryMap';
import { messageForCode, type YouCamErrorCode } from '@/lib/youcam/errorMessages';
import { generateTryOn } from '@/lib/youcam/provider';

// §9.2 motion.
const SHIMMER_DURATION = 1400;
const CROSSFADE_DURATION = 480;
const DECELERATE = Easing.bezier(0, 0, 0, 1);

// Rotating status labels shown under the shimmer.
const STATUS_LABELS = [
  'READING THE PIECE',
  'FITTING IT TO YOU',
  'ALMOST THERE',
] as const;
const STATUS_ROTATE_MS = 8_000;

// If the provider comes back in under this many ms, treat it as a cache
// hit and skip the shimmer — no fake latency for instant results.
const INSTANT_MS = 300;

type GenState =
  | { kind: 'idle' }
  | { kind: 'running'; startedAt: number }
  | { kind: 'done'; uri: string; instant: boolean }
  | { kind: 'failed'; errorCode: YouCamErrorCode };

export default function TryOnScreen() {
  const router = useRouter();
  const { pieceId } = useLocalSearchParams<{ pieceId: string }>();

  const pieces = useWardrobeStore((s) => s.pieces);
  const fullBodyUri = useProfilePhotosStore((s) => s.fullBodyUri);

  const piece = useMemo<WardrobePiece | null>(
    () => pieces.find((p) => p.id === pieceId) ?? null,
    [pieces, pieceId]
  );

  const [state, setState] = useState<GenState>({ kind: 'idle' });
  const [saved, setSaved] = useState(false);
  const runIdRef = useRef(0);

  const run = () => {
    if (!piece || !fullBodyUri) return;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const startedAt = Date.now();
    setState({ kind: 'running', startedAt });
    void generateTryOn({
      personPhotoUri: fullBodyUri,
      garmentPhotoUri: piece.uri,
      garmentCategory: categoryForPiece(piece),
    }).then((res) => {
      if (runIdRef.current !== runId) return; // stale — user re-triggered
      if ('failed' in res) {
        setState({
          kind: 'failed',
          errorCode: res.errorCode ?? 'default',
        });
      } else {
        const elapsed = Date.now() - startedAt;
        setState({ kind: 'done', uri: res.uri, instant: elapsed < INSTANT_MS });
      }
    });
  };

  // Kick off exactly once per mount (and once per Try-again press).
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece?.id, fullBodyUri]);

  if (!piece) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title="Try-on" onBack={() => router.back()} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>This piece is no longer here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pieceLabel = piece.category ? piece.category.toUpperCase() : 'PIECE';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title={pieceLabel} onBack={() => router.back()} />

      <View style={styles.body}>
        <View style={styles.frame}>
          {state.kind === 'done' && <ResultLayer uri={state.uri} />}
          {state.kind === 'running' && <ShimmerLayer />}

          {state.kind === 'done' && (
            <>
              <View style={styles.topLeft}>
                <Tag>{pieceLabel}</Tag>
              </View>
              <View style={styles.topRight}>
                <SaveButton
                  saved={saved}
                  onChange={setSaved}
                  size="md"
                  onPhoto
                />
              </View>
            </>
          )}
        </View>

        {state.kind === 'running' && (
          <View style={styles.statusBlock}>
            <RotatingStatus startedAt={state.startedAt} />
            <Text style={styles.statusHint}>Usually 10–20 seconds.</Text>
          </View>
        )}

        {state.kind === 'failed' && (
          <View style={styles.errorBlock}>
            <IrisMessageCard
              suffix="Let's retake"
              tone="error"
              plain
              lines={[messageForCode(state.errorCode)]}
            />
            <View style={styles.errorAction}>
              <Button
                label="Try again"
                variant="secondary"
                size="md"
                fullWidth
                onPress={run}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Header ────────────────────────────────────────────────────────────

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
        <ChevronLeft
          size={24}
          color={theme.color.ink.primary}
          strokeWidth={1.75}
        />
      </Pressable>
      <Text style={styles.headerTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.headerRightSpacer} />
    </View>
  );
}

// ─── Rotating status caps line ─────────────────────────────────────────

function RotatingStatus({ startedAt }: { startedAt: number }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    // Anchor the rotation to `startedAt` so remounts don't reset the
    // sequence — feels continuous even if the user backgrounds the app.
    const initial = Math.floor(
      (Date.now() - startedAt) / STATUS_ROTATE_MS
    ) % STATUS_LABELS.length;
    setIdx(initial);
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % STATUS_LABELS.length);
    }, STATUS_ROTATE_MS);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <CapsLabel size="sm" tone="secondary">
      {STATUS_LABELS[idx]}
    </CapsLabel>
  );
}

// ─── Reveal + shimmer layers ───────────────────────────────────────────

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
  body: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[12],
    gap: theme.space[6],
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
  statusBlock: {
    alignItems: 'center',
    gap: theme.space[2],
  },
  statusHint: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  errorBlock: {
    gap: theme.space[3],
  },
  errorAction: {
    // Match spacing rhythm; nothing else needed.
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
