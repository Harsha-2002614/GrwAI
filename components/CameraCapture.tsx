// Shared camera capture screen used by onboarding (face + body photos) and
// by the Closet "Take a photo" flow.
//
// One contained 3:4 preview rectangle, enlarged so it fills most of the
// screen. Header (caps + body, optional leading X) sits at the very top.
// Flash and zoom-arrows live INSIDE the preview (top-left + bottom-center).
// Bottom bar BELOW the preview hosts three bare icons — library / shutter /
// flip — with the library and flip in glassmorphism circles via expo-blur.
//
// Digital pinch-to-zoom (gesture-handler + Reanimated) shares state with the
// arrows tap: pinching accumulates across gestures and is clamped to a
// named MAX_ZOOM. Tap snaps between 0 and a mid preset.
//
// NOTE: this is DIGITAL zoom only. Native lens switching (the iOS 0.5×/1×/2×
// selector and the optical 0.5–0.7 front / 1–5 back ranges) is unavailable
// off the native build and is intentionally NOT replicated here.

import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import {
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  RefreshCcw,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { theme } from '@/constants/theme';
import { devLog } from '@/lib/log';

// Digital zoom is clamped well below the lens max so the preview never
// degrades into a blurry crop. Tune higher later if device tests are clean.
const MAX_ZOOM = 0.6;

// ─── Per-lens zoom model ────────────────────────────────────────────────
// Back lens:  baseline 0 (full natural width — native 1× equivalent),
//             arrows tap ZOOMS IN to BACK_ALT.
// Front lens: baseline FRONT_DEFAULT (a slight crop in — opens closer
//             than full wide), arrows tap ZOOMS OUT to FRONT_ALT (= 0,
//             full lens width, more of the user visible).
// Each lens keeps its own baseline; flipping resets to that lens's
// default. Glyph derivation is unified ("at zoom>0 → Minimize2 = pull
// back; at zoom 0 → Maximize2 = zoom in") so the same icon logic works
// for both directions.
const BACK_BASE = 0;
const BACK_ALT = 0.25;
const FRONT_DEFAULT = 0.15;
const FRONT_ALT = 0;

function baseZoomFor(f: 'front' | 'back'): number {
  return f === 'front' ? FRONT_DEFAULT : BACK_BASE;
}
function altZoomFor(f: 'front' | 'back'): number {
  return f === 'front' ? FRONT_ALT : BACK_ALT;
}

const PINCH_SENSITIVITY = 0.4;
const TOAST_DURATION = 2000;

type ZoomState = 'base' | 'alt';

export type SafeAreaEdge = 'top' | 'bottom';

export type PoseGuide = 'oval' | 'rectangle' | null;

export interface CameraCapturePermissionCopy {
  titleUndetermined?: string;
  bodyUndetermined?: string;
  titleDenied?: string;
  bodyDenied?: string;
  skipLabel?: string;
}

export interface CameraCaptureProps {
  /** Called when the user taps "Use this photo" on the captured preview. */
  onConfirmed: (uri: string) => void;
  /** Optional caps label at the top of the screen. */
  promptCaps?: string;
  /** Optional one-line subhead under the caps label. */
  promptBody?: string;
  /**
   * Optional leading element rendered next to the prompt on the top row —
   * typically a close (X) for the Closet flow. Onboarding leaves this empty
   * because the shared onboarding header already provides the chevron back.
   */
  leadingControl?: ReactNode;
  /** Pose guide overlay inside the preview. */
  poseGuide?: PoseGuide;
  /** Initial camera facing direction. Defaults to 'front' (selfie). */
  initialFacing?: 'front' | 'back';
  /** Permission-denied skip CTA. If omitted, no Skip affordance renders. */
  onPermissionSkip?: () => void;
  /** Overridable permission primer copy. */
  permissionCopy?: CameraCapturePermissionCopy;
  /** A11y label override for the shutter. */
  shutterAccessibilityLabel?: string;
  /**
   * Which safe-area edges CameraCapture should pad internally. Default is
   * both — closet-camera renders into a bare screen so it needs both. The
   * onboarding capture screens pass `['bottom']` because the shared
   * onboarding header already absorbs the top safe-area inset for them.
   */
  safeAreaEdges?: SafeAreaEdge[];
}

export function CameraCapture({
  onConfirmed,
  promptCaps,
  promptBody,
  leadingControl,
  poseGuide = null,
  initialFacing = 'front',
  onPermissionSkip,
  permissionCopy,
  shutterAccessibilityLabel = 'Take photo',
  safeAreaEdges = ['top', 'bottom'],
}: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const topInset = safeAreaEdges.includes('top') ? insets.top : 0;
  const bottomInset = safeAreaEdges.includes('bottom') ? insets.bottom : 0;
  const topPad = topInset + theme.space[3];
  const bottomPad = bottomInset + theme.space[8];

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>(initialFacing);
  const [flashOn, setFlashOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Shared zoom state — driven by both the pinch gesture and the arrows tap.
  // Mirrored to React state so CameraView's `zoom` prop tracks it.
  // Initialize to the lens's own baseline so the very first frame respects
  // the per-lens default.
  const initialBase = baseZoomFor(initialFacing);
  const zoomShared = useSharedValue(initialBase);
  const pinchBase = useSharedValue(initialBase);
  const [zoom, setZoom] = useState(initialBase);
  // Discrete toggle state. The icon and the next-tap target derive from this,
  // NOT from the live `zoom` value, so the glyph never flickers while the
  // spring is settling and a pinch can't accidentally flip it mid-gesture.
  const [zoomState, setZoomState] = useState<ZoomState>('base');

  useAnimatedReaction(
    () => zoomShared.value,
    (v, prev) => {
      if (prev !== null && Math.abs(v - prev) < 0.002) return;
      runOnJS(setZoom)(v);
    }
  );

  // Reduced-motion detection — kept up to date so a system-pref change mid-
  // session is honored.
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (!cancelled) setReduceMotion(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (v) => setReduceMotion(v)
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  // Auto-dismiss any toast after its hold duration.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_DURATION);
    return () => clearTimeout(t);
  }, [toast]);

  // Reset zoom on every camera flip (front <-> back). Each lens has its OWN
  // baseline (back = 0 / full wide; front = FRONT_DEFAULT / slight crop in),
  // so we reset to the new lens's default rather than a single shared value.
  // Without this, the previous lens's crop AND the toggle's discrete state
  // would carry over. The mount run is a no-op because the initial values
  // already equal `baseZoomFor(initialFacing)`.
  useEffect(() => {
    const base = baseZoomFor(facing);
    zoomShared.value = base;
    pinchBase.value = base;
    setZoom(base);
    setZoomState('base');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  // TODO(remove after QA): trace front/back zoom + flip behavior.
  useEffect(() => {
    devLog('[zoom]', { facing, zoomValue: zoom });
  }, [facing, zoom]);

  const status = permission?.status;

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (status === 'undetermined') {
    return (
      <PermissionPrimer
        title={
          permissionCopy?.titleUndetermined ?? 'Camera permission needed'
        }
        body={
          permissionCopy?.bodyUndetermined ??
          'GRWAI needs your camera to take a photo. Your photo stays on your device.'
        }
        primaryLabel="Allow camera"
        onPrimary={async () => {
          await requestPermission();
        }}
      />
    );
  }

  if (status === 'denied') {
    const skipLabel = permissionCopy?.skipLabel ?? 'Skip for now';
    return (
      <PermissionPrimer
        title={permissionCopy?.titleDenied ?? 'Permission denied'}
        body={
          permissionCopy?.bodyDenied ??
          'Open Settings to enable the camera, or skip this step for now.'
        }
        primaryLabel={onPermissionSkip ? skipLabel : 'Allow camera'}
        onPrimary={onPermissionSkip ?? (() => requestPermission())}
      />
    );
  }

  // ─── Pinch gesture (digital zoom) ───────────────────────────────────────
  // Pinching accumulates across gestures: each pinch start captures the
  // current zoom and adds the in-flight pinch delta on top, clamped.
  //
  // When a pinch ends, reset the discrete toggle state back to 'base' so the
  // next arrows tap goes to the preset (last interaction wins — the user's
  // pinched value lives in `zoom`, but a subsequent tap acts as a fresh
  // snap-to-preset rather than fighting the pinched value).
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      pinchBase.value = zoomShared.value;
    })
    .onUpdate((e) => {
      const next = pinchBase.value + (e.scale - 1) * PINCH_SENSITIVITY;
      zoomShared.value = Math.min(Math.max(next, 0), MAX_ZOOM);
    })
    .onEnd(() => {
      runOnJS(setZoomState)('base');
    });

  // ─── Capture handlers ──────────────────────────────────────────────────

  const handleCapture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
        () => {}
      );
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      if (result?.uri) setCapturedUri(result.uri);
    } catch (err) {
      Alert.alert(
        'Could not take photo',
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
  };

  const handleUsePhoto = () => {
    if (!capturedUri) return;
    onConfirmed(capturedUri);
  };

  const handleFlipCamera = () => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleToggleFlash = () => {
    setFlashOn((v) => !v);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleToggleZoom = () => {
    // Discrete 2-step ping-pong between this lens's baseline and its
    // alternate. Back: 0 ↔ 0.25 (zoom IN on tap 1). Front: 0.15 ↔ 0 (zoom
    // OUT on tap 1). Critically-damped spring so the value moves
    // monotonically to target — no overshoot, no oscillation.
    const nextState: ZoomState = zoomState === 'base' ? 'alt' : 'base';
    const target =
      nextState === 'alt' ? altZoomFor(facing) : baseZoomFor(facing);
    setZoomState(nextState);
    if (reduceMotion) {
      zoomShared.value = target;
    } else {
      // Reanimated SpringConfig has two mutually-exclusive variants:
      // physical (mass/damping/stiffness) and duration-based
      // (dampingRatio/duration). dampingRatio: 1 = critical damping.
      zoomShared.value = withSpring(target, {
        dampingRatio: 1,
        duration: 320,
      });
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleLibrary = () => {
    // TODO(native-build): wire real library picker off Expo Go.
    setToast('Library picker coming soon');
  };

  // Icon glyph reads from the discrete toggle state — NOT from the live zoom
  // value — so the spring's settle frames can't flip the icon back and forth.
  // Unified rule: whenever the current discrete state corresponds to a
  // zoom > 0, show Minimize2 ("tap to pull back"); when the state's target
  // is 0 (full wide), show Maximize2 ("tap to zoom in"). This produces the
  // right glyph on both lenses regardless of which state is the zoomed one.
  const stateTarget =
    zoomState === 'base' ? baseZoomFor(facing) : altZoomFor(facing);
  const showReturnArrows = stateTarget > 0;
  const showLeading = !!leadingControl;
  const showPrompt = !!promptCaps || !!promptBody;

  return (
    <View style={styles.root}>
      {(showLeading || showPrompt) && (
        <View style={[styles.topRow, { paddingTop: topPad }]}>
          {showLeading && (
            <View style={[styles.leadingSlot, { top: topPad }]}>
              {leadingControl}
            </View>
          )}
          {showPrompt && (
            <View style={styles.promptBlock}>
              {promptCaps && (
                <CapsLabel size="md" tone="inverse" style={styles.promptCaps}>
                  {promptCaps}
                </CapsLabel>
              )}
              {promptBody && (
                <Text style={styles.promptBody}>{promptBody}</Text>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.previewSlot}>
        <GestureDetector gesture={pinchGesture}>
          <View style={styles.previewFrame} collapsable={false}>
            {capturedUri ? (
              <ExpoImage
                source={{ uri: capturedUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <>
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  facing={facing}
                  flash={flashOn ? 'on' : 'off'}
                  zoom={zoom}
                />
                {poseGuide === 'oval' && (
                  <View style={styles.ovalGuide} pointerEvents="none" />
                )}
                {poseGuide === 'rectangle' && (
                  <View style={styles.rectGuide} pointerEvents="none" />
                )}

                {/* Flash — in-frame top-left, dark circle (visual unchanged
                    per spec; only bottom-bar buttons get glass). */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={flashOn ? 'Turn flash off' : 'Turn flash on'}
                  onPress={handleToggleFlash}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.flashControl,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {flashOn ? (
                    <Zap
                      size={18}
                      color={theme.color.ink.inverse}
                      strokeWidth={1.75}
                    />
                  ) : (
                    <ZapOff
                      size={18}
                      color={theme.color.ink.inverse}
                      strokeWidth={1.75}
                    />
                  )}
                </Pressable>

                {/* Zoom arrows — in-frame bottom-center, dark circle, shared
                    with the pinch gesture (tap snaps; pinch accumulates). */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Zoom in and out"
                  accessibilityState={{ selected: showReturnArrows }}
                  onPress={handleToggleZoom}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.zoomControl,
                    pressed && { transform: [{ scale: 0.94 }] },
                  ]}
                >
                  {showReturnArrows ? (
                    <Minimize2
                      size={20}
                      color={theme.color.ink.inverse}
                      strokeWidth={1.75}
                    />
                  ) : (
                    <Maximize2
                      size={20}
                      color={theme.color.ink.inverse}
                      strokeWidth={1.75}
                    />
                  )}
                </Pressable>
              </>
            )}
          </View>
        </GestureDetector>
      </View>

      {capturedUri ? (
        <View style={styles.previewActions}>
          <View style={styles.previewLabels}>
            <CapsLabel size="md" tone="inverse">
              Preview
            </CapsLabel>
            <Text style={styles.previewBody}>Looks right?</Text>
          </View>
          <View style={styles.previewButtons}>
            <View style={styles.previewButton}>
              <Button
                label="Retake"
                variant="secondary"
                fullWidth
                onPress={handleRetake}
                disabled={busy}
              />
            </View>
            <View style={styles.previewButton}>
              <Button
                label="Use this photo"
                fullWidth
                onPress={handleUsePhoto}
                disabled={busy}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
          <GlassCircle
            accessibilityLabel="Choose photo from library"
            onPress={handleLibrary}
          >
            <ImageIcon
              size={26}
              color={theme.color.ink.inverse}
              strokeWidth={1.75}
            />
          </GlassCircle>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shutterAccessibilityLabel}
            onPress={handleCapture}
            disabled={busy}
            style={({ pressed }) => [
              styles.captureRing,
              pressed && { transform: [{ scale: 0.95 }] },
              busy && { opacity: 0.4 },
            ]}
          >
            <View style={styles.captureCircle} />
          </Pressable>

          <GlassCircle
            accessibilityLabel="Flip camera"
            onPress={handleFlipCamera}
          >
            <RefreshCcw
              size={26}
              color={theme.color.ink.inverse}
              strokeWidth={1.75}
            />
          </GlassCircle>
        </View>
      )}

      {toast && (
        <Animated.View
          entering={FadeIn.duration(theme.motion.duration.fast)}
          exiting={FadeOut.duration(theme.motion.duration.fast)}
          style={styles.toast}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Glass circle button (BlurView + translucent tint) ──────────────────

interface GlassCircleProps {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}

function GlassCircle({ children, onPress, accessibilityLabel }: GlassCircleProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.glassClip,
        pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 },
      ]}
    >
      <BlurView
        intensity={32}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassTint} pointerEvents="none" />
      <View style={styles.glassRing} pointerEvents="none" />
      {children}
    </Pressable>
  );
}

// ─── Permission primer ──────────────────────────────────────────────────

interface PermissionPrimerProps {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
}

function PermissionPrimer({
  title,
  body,
  primaryLabel,
  onPrimary,
}: PermissionPrimerProps) {
  return (
    <View style={styles.primerRoot}>
      <Text style={styles.primerTitle}>{title}</Text>
      <Text style={styles.primerBody}>{body}</Text>
      <View style={styles.primerCta}>
        <Button label={primaryLabel} size="lg" fullWidth onPress={onPrimary} />
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────

const PREVIEW_INSET = theme.space[3]; // 12 — large preview, slim margins
const CAPTURE_RING = 72;
const CAPTURE_CORE = 56;
const ZOOM_BUTTON = 44;
const FLASH_BUTTON = 36;
const GLASS_BUTTON = 56;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.ink.primary,
  },

  // Top row: caps eyebrow + subhead centered horizontally. The X (closet
  // only) is pinned absolutely at top-left so the text block centers around
  // the screen axis regardless of whether a leading control is present.
  // paddingTop is set inline so the safe-area top inset can be added; top
  // on the absolute leadingSlot matches that inline padding so the X and
  // the caps eyebrow line up vertically.
  topRow: {
    position: 'relative',
    paddingHorizontal: theme.space[5],
    paddingBottom: theme.space[6], // ≈24px clear gap before the preview
  },
  leadingSlot: {
    position: 'absolute',
    left: theme.space[5],
    zIndex: 1,
  },
  promptBlock: {
    alignItems: 'center',
    gap: theme.space[1],
  },
  promptCaps: {
    textAlign: 'center',
  },
  promptBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.inverse,
    opacity: 0.72,
    textAlign: 'center',
    maxWidth: 320,
  },

  previewSlot: {
    flex: 1,
    paddingHorizontal: PREVIEW_INSET,
    paddingVertical: theme.space[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Width-driven 3:4 with no flex — Yoga sizes height from width × 4/3 and
  // the parent's justifyContent:'center' lands even margins above & below.
  previewFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.color.ink.primary,
  },

  ovalGuide: {
    position: 'absolute',
    top: '12%',
    left: '15%',
    right: '15%',
    bottom: '20%',
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: theme.color.ink.inverse,
    opacity: 0.85,
  },
  rectGuide: {
    position: 'absolute',
    top: '6%',
    left: '12%',
    right: '12%',
    bottom: '6%',
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.color.ink.inverse,
    opacity: 0.85,
  },

  flashControl: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: FLASH_BUTTON,
    height: FLASH_BUTTON,
    borderRadius: FLASH_BUTTON / 2,
    backgroundColor: 'rgba(15,15,15,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomControl: {
    position: 'absolute',
    bottom: 14,
    left: '50%',
    marginLeft: -ZOOM_BUTTON / 2,
    width: ZOOM_BUTTON,
    height: ZOOM_BUTTON,
    borderRadius: ZOOM_BUTTON / 2,
    backgroundColor: 'rgba(15,15,15,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom bar: glass library + flip, classic shutter, no labels.
  // paddingBottom is set inline so the safe-area bottom inset can be added,
  // giving the shutter real breathing room above the home indicator.
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: theme.space[6],
    paddingTop: theme.space[4],
  },
  glassClip: {
    width: GLASS_BUTTON,
    height: GLASS_BUTTON,
    borderRadius: GLASS_BUTTON / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Subtle white tint over the blur so the glass reads on solid dark too.
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  glassRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: GLASS_BUTTON / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  captureRing: {
    width: CAPTURE_RING,
    height: CAPTURE_RING,
    borderRadius: CAPTURE_RING / 2,
    borderWidth: 4,
    borderColor: theme.color.ink.inverse,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,15,15,0.2)',
  },
  captureCircle: {
    width: CAPTURE_CORE,
    height: CAPTURE_CORE,
    borderRadius: CAPTURE_CORE / 2,
    backgroundColor: theme.color.ink.inverse,
  },

  // Preview/confirm action bar (after capture).
  previewActions: {
    paddingHorizontal: theme.space[5],
    paddingTop: theme.space[4],
    paddingBottom: theme.space[8],
    gap: theme.space[4],
  },
  previewLabels: {
    gap: theme.space[1],
  },
  previewBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.inverse,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: theme.space[3],
  },
  previewButton: {
    flex: 1,
  },

  // Local toast (library coming-soon).
  toast: {
    position: 'absolute',
    left: theme.space[6],
    right: theme.space[6],
    bottom: theme.space[20],
    backgroundColor: 'rgba(15,15,15,0.92)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[3],
    alignItems: 'center',
  },
  toastText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.inverse,
  },

  primerRoot: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[12],
    backgroundColor: theme.color.bg.primary,
  },
  primerTitle: {
    fontFamily: theme.font.family.serif,
    fontSize: theme.font.display.md.fontSize,
    lineHeight: theme.font.display.md.lineHeight,
    color: theme.color.ink.primary,
    textAlign: 'center',
  },
  primerBody: {
    marginTop: theme.space[3],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
  },
  primerCta: {
    marginTop: theme.space[8],
    alignSelf: 'stretch',
  },
});
