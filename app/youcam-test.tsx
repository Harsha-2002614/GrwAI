// DEV-ONLY screen: exercise the YouCam try-on provider end-to-end.
//
// Layout follows the design system:
//   • Sticky header with a close X.
//   • Two picker rows (person / garment) — horizontally scrollable thumbnails.
//   • Category selector (upper / lower / full / outerwear).
//   • Primary "Generate try-on" button.
//   • 3:4 result frame with §9.2 shimmer while running, 480ms crossfade
//     on reveal, curated-render fallback text if the provider returns
//     `{ failed: true }`.
//   • Caps label under the frame showing elapsed ms + cache HIT / MISS.
//
// Not in the tab bar — reachable from the You tab dev pill only.

import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Scan, Trash2, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { Card } from '@/components/Card';
import { IrisMessageCard } from '@/components/IrisMessageCard';
import { Pill } from '@/components/Pill';
import { theme } from '@/constants/theme';
import { useProfilePhotosStore } from '@/lib/stores/profilePhotosStore';
import { useWardrobeStore, type WardrobePiece } from '@/lib/stores/wardrobeStore';
import { clearCache } from '@/lib/youcam/cache';
import { messageForCode, type YouCamErrorCode } from '@/lib/youcam/errorMessages';
import { generateTryOn } from '@/lib/youcam/provider';
import type { GarmentCategory } from '@/lib/youcam/types';

// §9.2 motion.
const SHIMMER_DURATION = 1400;
const CROSSFADE_DURATION = 480;
const DECELERATE = Easing.bezier(0, 0, 0, 1);

const CATEGORY_OPTIONS: { value: GarmentCategory; label: string }[] = [
  { value: 'upper_body', label: 'Upper body' },
  { value: 'lower_body', label: 'Lower body' },
  { value: 'full_body', label: 'Full body' },
  { value: 'outerwear', label: 'Outerwear' },
];

type GenState =
  | { kind: 'idle' }
  | { kind: 'running'; startedAt: number }
  | { kind: 'done'; uri: string; cache: 'hit' | 'miss'; elapsedMs: number }
  | { kind: 'failed'; elapsedMs: number; errorCode?: YouCamErrorCode };

export default function YouCamTestScreen() {
  const router = useRouter();
  const pieces = useWardrobeStore((s) => s.pieces);

  // The cloth VTO API requires a half/full-body reference — hitting it
  // with a headshot returns empty results. Source the person image
  // strictly from the fullBody profile slot; if it's empty, we route
  // the user to /profile-photos to add one.
  const fullBodyUri = useProfilePhotosStore((s) => s.fullBodyUri);

  const [garmentId, setGarmentId] = useState<string | null>(null);
  const [category, setCategory] = useState<GarmentCategory>('upper_body');
  const [state, setState] = useState<GenState>({ kind: 'idle' });

  const garment = useMemo<WardrobePiece | null>(
    () => pieces.find((p) => p.id === garmentId) ?? null,
    [pieces, garmentId]
  );

  const canGenerate =
    fullBodyUri !== null && garment !== null && state.kind !== 'running';

  const handleGenerate = async () => {
    if (!fullBodyUri || !garment) return;
    const startedAt = Date.now();
    setState({ kind: 'running', startedAt });

    const result = await generateTryOn({
      personPhotoUri: fullBodyUri,
      garmentPhotoUri: garment.uri,
      garmentCategory: category,
    });

    const elapsedMs = Date.now() - startedAt;
    if ('failed' in result) {
      setState({ kind: 'failed', elapsedMs, errorCode: result.errorCode });
    } else {
      setState({ kind: 'done', uri: result.uri, cache: result.cache, elapsedMs });
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear YouCam cache?',
      'Deletes every cached try-on image. Next generation will call the API.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            void clearCache();
            setState({ kind: 'idle' });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          YouCam try-on
        </Text>
        <View style={styles.headerRight}>
          <Pill
            label="Clear cache"
            variant="outline"
            size="sm"
            leadingIcon={Trash2}
            onPress={handleClearCache}
          />
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <X size={24} color={theme.color.ink.primary} strokeWidth={1.75} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.eyebrowRow}>
            <CapsLabel size="sm" tone="secondary">
              Person photo
            </CapsLabel>
            <CapsLabel size="sm" tone="tertiary">
              {'· Full body only'}
            </CapsLabel>
          </View>
          {fullBodyUri ? (
            <View style={styles.personRow}>
              <ExpoImage
                source={{ uri: fullBodyUri }}
                style={styles.personThumb}
                contentFit="cover"
                transition={0}
                cachePolicy="memory-disk"
              />
              <Button
                label="Change"
                variant="tertiary"
                size="sm"
                onPress={() => router.push('/profile-photos')}
              />
            </View>
          ) : (
            <Card
              variant="dashed"
              onPress={() => router.push('/profile-photos')}
            >
              <View style={styles.personEmpty}>
                <Scan
                  size={24}
                  color={theme.color.ink.secondary}
                  strokeWidth={1.75}
                />
                <Text style={styles.personEmptyLabel}>
                  Add a full-body photo to try looks on
                </Text>
              </View>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <CapsLabel size="sm" tone="secondary">
            Garment
          </CapsLabel>
          {pieces.length === 0 ? (
            <View style={[styles.garmentRail, styles.emptyRail]}>
              <Text style={styles.emptyText}>
                No pieces in the closet. Add one first.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.railContent}
            >
              {pieces.map((p) => {
                const selected = p.id === garmentId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setGarmentId(p.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.garmentTile,
                      selected && styles.garmentTileSelected,
                    ]}
                  >
                    <ExpoImage
                      source={{ uri: p.uri }}
                      style={styles.garmentImage}
                      contentFit="cover"
                      transition={0}
                      cachePolicy="memory-disk"
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <CapsLabel size="sm" tone="secondary">
            Category
          </CapsLabel>
          <View style={styles.chipsRow}>
            {CATEGORY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                active={category === opt.value}
                onPress={() => setCategory(opt.value)}
                accessibilityState={{ selected: category === opt.value }}
              />
            ))}
          </View>
        </View>

        <Button
          label={
            state.kind === 'running' ? 'Generating…' : 'Generate try-on'
          }
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canGenerate}
          loading={state.kind === 'running'}
          onPress={handleGenerate}
        />

        <View style={styles.resultFrame}>
          {state.kind === 'done' && <ResultLayer uri={state.uri} />}
          {state.kind === 'running' && <ShimmerLayer />}
          {state.kind === 'failed' && (
            <View style={styles.fallback}>
              <CapsLabel size="md" tone="tertiary">
                Fallback
              </CapsLabel>
              <Text style={styles.fallbackHint}>
                Provider returned no image — a curated render would ship here.
              </Text>
            </View>
          )}
          {state.kind === 'idle' && (
            <View style={styles.fallback}>
              <CapsLabel size="md" tone="tertiary">
                No render yet
              </CapsLabel>
            </View>
          )}
        </View>

        {state.kind === 'failed' && state.errorCode && (
          <View style={styles.errorWrap}>
            <IrisMessageCard
              suffix="Let's retake"
              tone="error"
              plain
              lines={[messageForCode(state.errorCode)]}
            />
          </View>
        )}

        <StatusLine state={state} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusLine({ state }: { state: GenState }) {
  if (state.kind === 'running') {
    return <Ticker startedAt={state.startedAt} />;
  }
  if (state.kind === 'done') {
    const label =
      state.cache === 'hit'
        ? `CACHE HIT · ${state.elapsedMs}MS`
        : `CACHE MISS · ${state.elapsedMs}MS`;
    return (
      <View style={styles.status}>
        <CapsLabel size="sm" tone="secondary">
          {label}
        </CapsLabel>
      </View>
    );
  }
  if (state.kind === 'failed') {
    return (
      <View style={styles.status}>
        <CapsLabel size="sm" tone="secondary">
          {`FAILED · ${state.elapsedMs}MS`}
        </CapsLabel>
      </View>
    );
  }
  return <View style={styles.status} />;
}

function Ticker({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.status}>
      <CapsLabel size="sm" tone="secondary">
        {`RUNNING · ${now - startedAt}MS`}
      </CapsLabel>
    </View>
  );
}

// ─── Reveal + shimmer layers (mirrors SceneView so motion feels the same) ─

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
    backgroundColor: theme.color.bg.primary,
  },
  headerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.xs.fontSize,
    lineHeight: theme.font.display.xs.lineHeight,
    color: theme.color.ink.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[12],
    gap: theme.space[6],
  },
  section: {
    gap: theme.space[3],
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.space[2],
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[4],
  },
  personThumb: {
    width: 96,
    aspectRatio: theme.aspect.scene,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.bg.subtle,
  },
  personEmpty: {
    alignItems: 'center',
    gap: theme.space[3],
  },
  personEmptyLabel: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
  },
  garmentRail: {
    minHeight: 96,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.bg.subtle,
  },
  emptyRail: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space[4],
  },
  emptyText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.tertiary,
    textAlign: 'center',
  },
  railContent: {
    gap: theme.space[3],
  },
  garmentTile: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  garmentTileSelected: {
    borderColor: theme.color.ink.primary,
  },
  garmentImage: {
    width: '100%',
    height: '100%',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  resultFrame: {
    width: '100%',
    aspectRatio: theme.aspect.scene,
    backgroundColor: theme.color.bg.subtle,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    paddingHorizontal: theme.space[6],
  },
  fallbackHint: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    color: theme.color.ink.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shimmerMask: {
    overflow: 'hidden',
  },
  errorWrap: {
    marginTop: theme.space[4],
  },
  status: {
    alignItems: 'center',
    minHeight: theme.font.caps.sm.lineHeight,
  },
});
