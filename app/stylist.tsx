// Stylist screen — Iris chat surface.
//
// Message-first UX, no free-chat LLM yet. Beyond the empty-state
// greeting + quick-start pills the screen exists to host TWO things:
//   • A visible-but-disabled voice affordance.
//   • The photo attachment flow: user takes/uploads a garment they
//     DON'T own yet, Iris renders it on their fullBody profile photo
//     via the existing YouCam provider, and offers to fold it into
//     the closet.
//
// PRINCIPLE: for anything the user owns, Iris already knows it (closet
// + profile photos). The attachment path is strictly for "considering
// this new piece" — copy reflects that.

import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  Send,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CapsLabel } from '@/components/CapsLabel';
import { IrisMessageCard } from '@/components/IrisMessageCard';
import { ListRow } from '@/components/ListRow';
import { Pill } from '@/components/Pill';
import { SaveButton } from '@/components/SaveButton';
import { Sheet } from '@/components/Sheet';
import { Tag } from '@/components/Tag';
import { theme } from '@/constants/theme';
import { buildIrisContext } from '@/lib/irisContext';
import { IRIS_THINKING_MS, scriptedReply, type IrisAction } from '@/lib/irisScript';
import { messageForCode, type YouCamErrorCode } from '@/lib/youcam/errorMessages';
import { generateTryOn } from '@/lib/youcam/provider';
import type { GarmentCategory } from '@/lib/youcam/types';
import { useProfilePhotosStore } from '@/lib/stores/profilePhotosStore';

// §9.2 motion.
const ENTER_MS = 480;
const ENTER_DY = 8;
const DECELERATE = Easing.bezier(0, 0, 0, 1);
const SHIMMER_DURATION = 1400;
const CROSSFADE_DURATION = 480;
const INSTANT_MS = 300;
const MODAL_DISMISS_MS = 320;

// Rotating status labels shown under the shimmer during YouCam calls,
// matching the try-on screen so the wait feels consistent app-wide.
const STATUS_LABELS = [
  'READING THE PIECE',
  'FITTING IT TO YOU',
  'ALMOST THERE',
] as const;
const STATUS_ROTATE_MS = 8_000;

interface CategoryOption {
  label: string;
  category: GarmentCategory;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { label: 'Top', category: 'upper_body' },
  { label: 'Bottom', category: 'lower_body' },
  { label: 'Dress', category: 'full_body' },
  { label: 'Layer', category: 'outerwear' },
];

// ─── Turn model ─────────────────────────────────────────────────────
//
// Discriminated union so each render branch is exhaustively covered.

type Turn =
  | { kind: 'user_text'; id: string; text: string }
  | { kind: 'user_image'; id: string; uri: string }
  | { kind: 'user_chip'; id: string; label: string }
  | { kind: 'iris_message'; id: string; text: string; suffix?: string; actions?: IrisAction[] }
  | { kind: 'iris_thinking'; id: string }
  | { kind: 'iris_guard_photo'; id: string }
  | { kind: 'iris_prompt_category'; id: string; sourceUri: string }
  | { kind: 'iris_running'; id: string; startedAt: number }
  | {
      kind: 'iris_render';
      id: string;
      uri: string;
      sourceUri: string;
      category: GarmentCategory;
    }
  | { kind: 'iris_error'; id: string; errorCode: YouCamErrorCode };

let turnCounter = 0;
function nextId(prefix: string): string {
  turnCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${turnCounter.toString(36)}`;
}

function greetingForNow(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function StylistScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const fullBodyUri = useProfilePhotosStore((s) => s.fullBodyUri);

  const focusInput = () => inputRef.current?.focus();

  const startWhatGoesWith = () => {
    // Insert the prefix and focus — no deeper flow. If the user wants
    // to send it as-is they can; usually they'll type the piece name.
    setInput((prev) => (prev.startsWith('What goes with ') ? prev : 'What goes with '));
    focusInput();
  };

  useEffect(() => {
    buildIrisContext();
  }, []);

  useEffect(() => {
    // Auto-scroll to the newest turn.
    const t = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      80
    );
    return () => clearTimeout(t);
  }, [turns.length]);

  const greeting = useMemo(() => greetingForNow(), []);

  // ─── Text send ─────────────────────────────────────────────────────

  // Scripted reply (lib/irisScript): no LLM yet, but a sent message must
  // never vanish into an empty chat. Thinking turn → keyword-routed reply
  // with action chips that lead to the surfaces that can help today.
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
  }, []);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const thinkingId = nextId('i');
    setTurns((prev) => [
      ...prev,
      { kind: 'user_text', id: nextId('u'), text: trimmed },
      { kind: 'iris_thinking', id: thinkingId },
    ]);
    setInput('');
    const reply = scriptedReply(trimmed);
    replyTimer.current = setTimeout(() => {
      setTurns((prev) => [
        ...prev.filter((t) => t.id !== thinkingId),
        {
          kind: 'iris_message',
          id: nextId('i'),
          text: reply.text,
          suffix: reply.suffix,
          actions: reply.actions,
        },
      ]);
    }, IRIS_THINKING_MS);
  };

  const handleIrisAction = (action: IrisAction) => {
    if (action.prefill === '__attach__') {
      setAttachOpen(true);
      return;
    }
    if (action.prefill) {
      setInput(action.prefill);
      focusInput();
      return;
    }
    if (action.route) router.push(action.route as never);
  };

  // ─── Attachment picker ─────────────────────────────────────────────

  const openAttach = () => setAttachOpen(true);

  const pickAndAppend = async (source: 'camera' | 'library') => {
    setAttachOpen(false);
    // Give the sheet's dismiss animation room to complete before the
    // native picker presents — iOS silently loses the picker result
    // otherwise (same fix as profile-photos).
    await new Promise((r) => setTimeout(r, MODAL_DISMISS_MS));

    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          source === 'camera'
            ? 'Camera permission needed'
            : 'Photo library permission needed',
          'You can enable this in Settings.',
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ]
        );
        return;
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      appendAttachmentFlow(uri);
    } catch (err) {
      Alert.alert(
        'Could not read that photo',
        err instanceof Error ? err.message : 'Try again.'
      );
    }
  };

  /**
   * Appends the initial turns for a fresh attachment. If no fullBody
   * profile photo exists, we short-circuit to the guard card and
   * NEVER call YouCam.
   */
  const appendAttachmentFlow = (uri: string) => {
    if (!fullBodyUri) {
      setTurns((prev) => [
        ...prev,
        { kind: 'user_image', id: nextId('u'), uri },
        { kind: 'iris_guard_photo', id: nextId('i') },
      ]);
      return;
    }
    setTurns((prev) => [
      ...prev,
      { kind: 'user_image', id: nextId('u'), uri },
      {
        kind: 'iris_message',
        id: nextId('i'),
        text: "Ooh — thinking about this one? Give me a second, I'll show you.",
      },
      { kind: 'iris_prompt_category', id: nextId('i'), sourceUri: uri },
    ]);
  };

  // ─── Category chip → run generation ───────────────────────────────

  const handlePickCategory = (
    promptId: string,
    sourceUri: string,
    opt: CategoryOption
  ) => {
    if (!fullBodyUri) return;
    // Replace the prompt with a user-chip bubble + kick off generation.
    const runningId = nextId('i');
    setTurns((prev) => {
      const filtered = prev.filter((t) => t.id !== promptId);
      return [
        ...filtered,
        { kind: 'user_chip', id: nextId('u'), label: opt.label },
        { kind: 'iris_running', id: runningId, startedAt: Date.now() },
      ];
    });

    void generateTryOn({
      personPhotoUri: fullBodyUri,
      garmentPhotoUri: sourceUri,
      garmentCategory: opt.category,
    }).then((res) => {
      setTurns((prev) => {
        const filtered = prev.filter((t) => t.id !== runningId);
        if ('failed' in res) {
          return [
            ...filtered,
            {
              kind: 'iris_error',
              id: nextId('i'),
              errorCode: res.errorCode ?? 'default',
            },
          ];
        }
        return [
          ...filtered,
          {
            kind: 'iris_render',
            id: nextId('i'),
            uri: res.uri,
            sourceUri,
            category: opt.category,
          },
        ];
      });
    });
  };

  const handleAddToCloset = (sourceUri: string) => {
    router.push(`/closet-tag?tempUri=${encodeURIComponent(sourceUri)}`);
  };

  const handleJustLooking = () => {
    setTurns((prev) => [
      ...prev,
      { kind: 'user_chip', id: nextId('u'), label: 'Just looking' },
    ]);
  };

  // ─── Quick-start chips ─────────────────────────────────────────────

  const goCompose = () => router.push('/moment-composer');

  // ─── Render ────────────────────────────────────────────────────────

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

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Reanimated 4 on web re-positions an `entering` wrapper as
              position:absolute once siblings are appended, so every turn
              rendered on top of the greeting (QA GRW-17). Native keeps the
              §9.2 fade-in; web renders the greeting in normal flow. */}
          <Animated.View
            entering={
              Platform.OS === 'web'
                ? undefined
                : FadeInDown.duration(ENTER_MS).easing(DECELERATE).withInitialValues({
                    transform: [{ translateY: ENTER_DY }],
                  })
            }
          >
            <IrisMessageCard
              plain
              suffix={greeting.toUpperCase()}
              lines={[
                'What are we solving today? A moment, a piece, a maybe — tell me.',
              ]}
            />
            <View style={styles.quickRow}>
              <Pill
                label="Style my next event"
                variant="outline"
                onPress={goCompose}
              />
              <Pill
                label="What goes with…"
                variant="outline"
                onPress={startWhatGoesWith}
              />
            </View>
          </Animated.View>

          {turns.map((t) => (
            <TurnView
              key={t.id}
              turn={t}
              onPickCategory={handlePickCategory}
              onAddToCloset={handleAddToCloset}
              onJustLooking={handleJustLooking}
              onAddPhoto={() => router.push('/profile-photos')}
              onAction={handleIrisAction}
              saved={savedIds.has(t.id)}
              onToggleSaved={(next) => {
                setSavedIds((prev) => {
                  const s = new Set(prev);
                  if (next) s.add(t.id);
                  else s.delete(t.id);
                  return s;
                });
              }}
            />
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          {/* Single rounded field wraps + / input / mic per §7.2 flex
              recipe (align-items: center, gap 8, flex-shrink: 0 icons). */}
          <View style={styles.inputField}>
            <Pressable
              onPress={openAttach}
              accessibilityRole="button"
              accessibilityLabel="Attach a photo"
              hitSlop={8}
              style={({ pressed }) => [
                styles.fieldIcon,
                pressed && styles.fieldIconPressed,
              ]}
            >
              <Plus
                size={20}
                color={theme.color.ink.secondary}
                strokeWidth={1.75}
              />
            </Pressable>

            <TextInput
              ref={inputRef}
              style={styles.fieldInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Iris anything…"
              placeholderTextColor={theme.color.ink.tertiary}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
              blurOnSubmit
            />
          </View>

          <Pressable
            onPress={() => sendMessage(input)}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={input.trim().length === 0}
            hitSlop={8}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                opacity: input.trim().length === 0 ? 0.4 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <Send size={18} color={theme.color.ink.inverse} strokeWidth={2} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Sheet visible={attachOpen} onClose={() => setAttachOpen(false)}>
        <Pressable
          onPress={() => setAttachOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          hitSlop={8}
          style={({ pressed }) => [
            styles.sheetClose,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <X size={20} color={theme.color.ink.primary} strokeWidth={1.75} />
        </Pressable>

        {/* Caps eyebrow, 8px below the drag-handle row (Sheet already
            reserves that space via its handleWrap marginBottom). */}
        <View style={styles.sheetEyebrow}>
          <CapsLabel size="md" tone="secondary">
            Show Iris something
          </CapsLabel>
        </View>

        <ListRow
          title="Take a photo"
          subtitle="For pieces you're thinking about"
          leading={<RustIconTile Icon={Camera} />}
          inset
          onPress={() => void pickAndAppend('camera')}
        />
        <ListRow
          title="Upload from library"
          subtitle="A screenshot or a saved photo"
          leading={<RustIconTile Icon={ImageIcon} />}
          isLast
          inset
          onPress={() => void pickAndAppend('library')}
        />
      </Sheet>
    </SafeAreaView>
  );
}

// ─── Turn renderer ─────────────────────────────────────────────────

interface TurnViewProps {
  turn: Turn;
  onPickCategory: (promptId: string, sourceUri: string, opt: CategoryOption) => void;
  onAddToCloset: (sourceUri: string) => void;
  onJustLooking: () => void;
  onAddPhoto: () => void;
  onAction: (action: IrisAction) => void;
  saved: boolean;
  onToggleSaved: (next: boolean) => void;
}

function TurnView({
  turn,
  onPickCategory,
  onAddToCloset,
  onJustLooking,
  onAddPhoto,
  onAction,
  saved,
  onToggleSaved,
}: TurnViewProps) {
  switch (turn.kind) {
    case 'user_text':
      return (
        <View style={styles.userBubbleWrap}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{turn.text}</Text>
          </View>
        </View>
      );
    case 'user_chip':
      return (
        <View style={styles.userBubbleWrap}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{turn.label}</Text>
          </View>
        </View>
      );
    case 'user_image':
      return (
        <View style={styles.userBubbleWrap}>
          <ExpoImage
            source={{ uri: turn.uri }}
            style={styles.userImage}
            contentFit="cover"
            transition={0}
            cachePolicy="memory-disk"
          />
        </View>
      );
    case 'iris_message':
      return (
        <View style={styles.irisGroup}>
          <IrisMessageCard plain suffix={turn.suffix} lines={[turn.text]} />
          {turn.actions && turn.actions.length > 0 && (
            <View style={styles.chipsRow}>
              {turn.actions.map((a) => (
                <Pill
                  key={a.label}
                  label={a.label}
                  variant="outline"
                  onPress={() => onAction(a)}
                />
              ))}
            </View>
          )}
        </View>
      );
    case 'iris_thinking':
      return <ThinkingCard />;
    case 'iris_guard_photo':
      return (
        <View style={styles.irisGroup}>
          <IrisMessageCard
            plain
            lines={["Add a full-body photo first and I'll show you in it."]}
          />
          <View style={styles.chipsRow}>
            <Pill
              label="Add photo"
              variant="outline"
              onPress={onAddPhoto}
            />
          </View>
        </View>
      );
    case 'iris_prompt_category':
      return (
        <View style={styles.irisGroup}>
          <IrisMessageCard plain lines={['What is it?']} />
          <View style={styles.chipsRow}>
            {CATEGORY_OPTIONS.map((opt) => (
              <Pill
                key={opt.category}
                label={opt.label}
                onPress={() => onPickCategory(turn.id, turn.sourceUri, opt)}
              />
            ))}
          </View>
        </View>
      );
    case 'iris_running':
      return (
        <View style={styles.irisGroup}>
          <IrisMessageCard
            plain
            lines={['Fitting it to you — usually 10–20 seconds.']}
          />
          <RunningFrame startedAt={turn.startedAt} />
        </View>
      );
    case 'iris_render':
      return (
        <View style={styles.irisGroup}>
          <View style={styles.renderFrame}>
            <ResultLayer uri={turn.uri} />
            <View style={styles.topLeft}>
              <Tag>{'NOT IN YOUR CLOSET · YET'}</Tag>
            </View>
            <View style={styles.topRight}>
              <SaveButton
                saved={saved}
                onChange={onToggleSaved}
                size="sm"
                onPhoto
              />
            </View>
          </View>
          <IrisMessageCard plain lines={['Want it in the family?']} />
          <View style={styles.chipsRow}>
            <Pill
              label="Add to closet"
              variant="accent"
              onPress={() => onAddToCloset(turn.sourceUri)}
            />
            <Pill
              label="Just looking"
              variant="outline"
              onPress={onJustLooking}
            />
          </View>
        </View>
      );
    case 'iris_error':
      return (
        <IrisMessageCard
          suffix="Let's retake"
          tone="error"
          plain
          lines={[messageForCode(turn.errorCode)]}
        />
      );
  }
}

// ─── Thinking indicator ─────────────────────────────────────────────
// Three ink/tertiary dots pulsing in sequence inside a warm Iris card, so
// a sent message is visibly "received" before the reply lands (§9.2).

function ThinkingCard() {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Iris is thinking"
      accessibilityLiveRegion="polite"
    >
      <IrisMessageCard
        plain
        suffix="THINKING"
        lines={[]}
        headline={
          <View style={styles.thinkingDots}>
            {[0, 1, 2].map((i) => (
              <ThinkingDot key={i} delay={i * 160} />
            ))}
          </View>
        }
      />
    </View>
  );
}

function ThinkingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: 480, easing: DECELERATE }),
        -1,
        true
      );
    }, delay);
    return () => {
      clearTimeout(t);
      cancelAnimation(opacity);
    };
  }, [delay, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.thinkingDot, style]} />;
}

// ─── Leading icon tile for the attachment sheet rows ────────────────
// 40px rust-soft circle with a 20px accent/rust icon (§6.4). Used only
// on the attachment sheet — kept local because no other list row uses
// this treatment.

interface RustIconTileProps {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

function RustIconTile({ Icon }: RustIconTileProps) {
  return (
    <View style={styles.rustTile}>
      <Icon size={20} color={theme.color.accent.rust} strokeWidth={1.75} />
    </View>
  );
}

// ─── Shimmer + reveal (inline; mirrors try-on styling) ─────────────

interface RunningFrameProps {
  startedAt: number;
}

function RunningFrame({ startedAt }: RunningFrameProps) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const initial =
      Math.floor((Date.now() - startedAt) / STATUS_ROTATE_MS) %
      STATUS_LABELS.length;
    setIdx(initial);
    const id = setInterval(
      () => setIdx((i) => (i + 1) % STATUS_LABELS.length),
      STATUS_ROTATE_MS
    );
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <View style={styles.runningFrame}>
      <ShimmerLayer />
      <View style={styles.runningStatus}>
        <View style={styles.runningStatusPill}>
          <Text style={styles.runningStatusText}>{STATUS_LABELS[idx]}</Text>
        </View>
      </View>
    </View>
  );
}

function ResultLayer({ uri }: { uri: string }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    // Skip the fade when the result comes back near-instantly (cache
    // hit) so it doesn't feel like fake latency.
    const elapsed = 0; // conservative — we don't have startedAt here.
    if (elapsed < INSTANT_MS) {
      opacity.value = withTiming(1, {
        duration: CROSSFADE_DURATION,
        easing: DECELERATE,
      });
    } else {
      opacity.value = 1;
    }
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

const HEADER_HEIGHT = theme.layout.headerHeight;
const CLOSE_BUTTON_SIZE = 36;
const USER_IMAGE_SIZE = 200;
const RUNNING_FRAME_WIDTH_PCT = 0.65;

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
  scroll: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[6],
    gap: theme.space[5],
  },
  quickRow: {
    marginTop: theme.space[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  userBubbleWrap: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[3],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.ink.primary,
  },
  userText: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.inverse,
  },
  userImage: {
    width: USER_IMAGE_SIZE,
    height: USER_IMAGE_SIZE,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.bg.subtle,
  },
  irisGroup: {
    gap: theme.space[3],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: theme.space[2],
    paddingVertical: theme.space[1],
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.ink.tertiary,
  },
  renderFrame: {
    // Iris message image — 3:4, ~65% width per §7.14 in-message hero.
    width: `${RUNNING_FRAME_WIDTH_PCT * 100}%`,
    aspectRatio: theme.aspect.scene,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.color.bg.subtle,
    alignSelf: 'flex-start',
  },
  topLeft: {
    position: 'absolute',
    top: theme.space[3],
    left: theme.space[3],
  },
  topRight: {
    position: 'absolute',
    top: theme.space[3],
    right: theme.space[3],
  },
  runningFrame: {
    width: `${RUNNING_FRAME_WIDTH_PCT * 100}%`,
    aspectRatio: theme.aspect.scene,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.color.bg.subtle,
    alignSelf: 'flex-start',
  },
  runningStatus: {
    position: 'absolute',
    bottom: theme.space[3],
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  runningStatusPill: {
    paddingHorizontal: theme.space[3],
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.overlay.light,
  },
  runningStatusText: {
    fontFamily: theme.font.family.sansSemibold,
    fontSize: theme.font.caps.sm.fontSize,
    lineHeight: theme.font.caps.sm.lineHeight,
    letterSpacing: theme.font.caps.sm.letterSpacing,
    color: theme.color.ink.primary,
    textTransform: 'uppercase',
  },
  shimmerMask: {
    overflow: 'hidden',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingBottom: theme.space[3],
    paddingTop: theme.space[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border.light,
    backgroundColor: theme.color.bg.primary,
  },
  // Single rounded field — bg/subtle, radius/full, 48px min height.
  // Anti-overlap: align-items center + gap 8; icons are flex-shrink 0
  // so the input is the only element that yields under narrow widths.
  inputField: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.color.bg.subtle,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    // Default: transparent — the field's bg/subtle fills the circle
    // area; the pressed style overrides with bg/warm for the flash.
    backgroundColor: 'transparent',
  },
  fieldIconPressed: {
    backgroundColor: theme.color.bg.warm,
  },
  fieldInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 32,
    maxHeight: 120,
    paddingVertical: 0,
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.primary,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.color.ink.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sheetClose: {
    position: 'absolute',
    top: theme.space[3],
    right: theme.space[3],
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sheetEyebrow: {
    marginTop: theme.space[2],
    marginBottom: theme.space[4],
  },
  rustTile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.color.accent.rustSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
