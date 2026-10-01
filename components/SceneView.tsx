import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '@/constants/theme';
import { placeholderScene } from '@/lib/scene/placeholderScenes';
import { generateScene } from '@/lib/scene/sceneGenerator';
import type { SceneContext } from '@/lib/scene/types';
import {
  sceneKey,
  useGeneratedScenesStore,
  useScene,
} from '@/lib/stores/generatedScenesStore';
import { Badge } from './Badge';
import { CapsLabel } from './CapsLabel';
import { SceneCaption } from './SceneCaption';

type AspectRatio = '3:4' | '4:5';

interface LivePhotoreal {
  /** Reference photo for identity-preserving generation. Null disables. */
  userPhotoUri: string | null;
  outfitName: string;
}

interface SceneViewProps {
  /** Stable identifier for the outfit (used to key future scene cache lookups) */
  outfitId: string;
  /** Occasion key (work_review, casual_errand, dinner, etc) */
  occasion: string;
  aspectRatio?: AspectRatio;
  /** Caption strip location label, e.g., "SOHO · SOFT AFTERNOON" */
  captionLocation?: string;
  /** Optional weather chip on caption strip (emoji per dual-icon rule) */
  weather?: { label: string; emoji?: string };
  /** Top-left floating tag (e.g., "OFFICE · SYNCED: TEAM STANDUP") */
  tag?: ReactNode;
  /** Top-right corner content (typically <SaveButton onPhoto />) */
  cornerAction?: ReactNode;
  /** Hide the ILLUSTRATION badge (e.g., when used as a pure decorative tile) */
  hideModeBadge?: boolean;
  /**
   * Opt-in to live photoreal generation (chunk 7a: Today hero only).
   * When set + __DEV__ + key + userPhotoUri present, kicks off generation on
   * mount and crossfades the result over the placeholder. Any failure leaves
   * the placeholder visible silently — the brand never breaks (§10.4).
   */
  livePhotoreal?: LivePhotoreal;
  style?: StyleProp<ViewStyle>;
}

// §9.2 motion patterns
const SHIMMER_DURATION = 1400; // ms, linear gradient sweep
const CROSSFADE_DURATION = 480; // ms, hero reveal (decelerate)
const DECELERATE = Easing.bezier(0, 0, 0, 1);

/**
 * Smart wrapper for the figure visual.
 *
 * Default mode renders the illustration placeholder (chunk 2 behavior). When
 * the `livePhotoreal` prop is provided AND we're in __DEV__ with a Gemini
 * key, kicks off scene generation on mount, shows the §9.2 shimmer over the
 * placeholder, then crossfades the result in over 480ms. Cached scenes
 * (status === 'ready') render instantly with no shimmer.
 */
export function SceneView({
  outfitId,
  occasion,
  aspectRatio = '3:4',
  captionLocation,
  weather,
  tag,
  cornerAction,
  hideModeBadge,
  livePhotoreal,
  style,
}: SceneViewProps) {
  const aspect =
    aspectRatio === '4:5' ? theme.aspect.sceneFullscreen : theme.aspect.scene;
  const occasionLabel = occasion.replaceAll('_', ' ');

  const scene = useScene(outfitId, occasion);
  const setLoading = useGeneratedScenesStore((s) => s.setLoading);
  const setReady = useGeneratedScenesStore((s) => s.setReady);
  const setFailed = useGeneratedScenesStore((s) => s.setFailed);

  // Kick off generation on mount when in live mode, key is present, photo is
  // available, and we haven't already attempted this scene.
  useEffect(() => {
    if (!livePhotoreal) return;

    const sceneStatus = scene?.status ?? 'undefined';
    const keyPresent = !!process.env.EXPO_PUBLIC_GEMINI_KEY;
    const hasPhoto = !!livePhotoreal.userPhotoUri;
    // Generate only in dev, with a key, a photo, and no prior attempt for this scene.
    if (!hasPhoto || !__DEV__ || !keyPresent || sceneStatus !== 'undefined') return;

    const key = sceneKey(outfitId, occasion);
    const userPhotoUri = livePhotoreal.userPhotoUri as string;
    const outfitName = livePhotoreal.outfitName;
    setLoading(key);
    generateScene({
      userPhotoUri,
      outfitName,
      sceneContext: occasion as SceneContext,
    }).then((res) => {
      if ('uri' in res) setReady(key, res.uri);
      else setFailed(key);
    });
    // We intentionally only react to identity-shaping inputs. Re-runs on
    // every store change would cause storms.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    outfitId,
    occasion,
    livePhotoreal?.userPhotoUri,
    livePhotoreal?.outfitName,
  ]);

  const photorealUri = scene?.status === 'ready' ? scene.uri : null;
  const isLoading = scene?.status === 'loading';
  const placeholder = placeholderScene(occasion);

  return (
    <View style={[styles.frame, { aspectRatio: aspect }, style]}>
      {/* Layer 0 — placeholder. Always present so the brand never breaks:
          a curated editorial scene for the occasion (DS §10.3), or the
          labelled tile when no scene exists for this context. */}
      {placeholder ? (
        <ExpoImage
          source={placeholder}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={0}
          accessibilityLabel={`${occasionLabel} scene`}
        />
      ) : (
        <View style={styles.illustration}>
          <CapsLabel size="md" tone="tertiary" style={styles.placeholderLabel}>
            {occasionLabel}
          </CapsLabel>
          <Text style={styles.placeholderHint}>illustration placeholder</Text>
        </View>
      )}

      {/* Layer 1 — photoreal image, crossfades in over 480ms when ready. */}
      {photorealUri && <PhotorealLayer uri={photorealUri} />}

      {/* Layer 2 — shimmer sweep while loading, sits above the placeholder. */}
      {isLoading && !photorealUri && <ShimmerLayer />}

      {/* Overlays — these sit on top of any photoreal layer so tags, save
          actions, and the caption strip stay legible. */}
      {tag && <View style={styles.topLeft}>{tag}</View>}
      {cornerAction && <View style={styles.topRight}>{cornerAction}</View>}
      {!hideModeBadge && !cornerAction && (
        <View style={styles.topRight}>
          <Badge variant="illustration" size="sm" />
        </View>
      )}

      {captionLocation && (
        <SceneCaption
          location={captionLocation}
          weather={weather?.label}
          weatherEmoji={weather?.emoji}
        />
      )}
    </View>
  );
}

// ─── Photoreal crossfade layer ───────────────────────────────────────────

function PhotorealLayer({ uri }: { uri: string }) {
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

// ─── Skeleton shimmer layer (§9.2 — 1400ms linear gradient sweep) ────────

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
    transform: [
      { translateX: startX + (endX - startX) * progress.value },
    ],
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
  frame: {
    backgroundColor: theme.color.bg.subtle,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
  },
  placeholderLabel: {
    textAlign: 'center',
  },
  placeholderHint: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    color: theme.color.ink.tertiary,
    fontStyle: 'italic',
  },
  shimmerMask: {
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
});
