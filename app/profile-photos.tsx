// Profile photos — two managed slots (headshot + fullBody) surfaced on
// You › Profile photos. Reads/writes go through `useProfilePhotosStore`,
// which owns the URIs; on-disk files are managed by `lib/photoStorage`.
//
// Behavior notes:
//   • Camera / library both use expo-image-picker. `allowsEditing: true`
//     gives the native crop UI immediately after capture/pick.
//   • BLOCKER FIX: on iOS, launching the ImagePicker while a RN <Modal>
//     is still dismissing swallows the picker's result silently. We
//     close the sheet, WAIT for its animation, then launch — so "Use
//     photo" actually flows back through us.
//   • Long-press (300ms) on either photo opens the edit sheet with an
//     extra "Adjust crop" option that re-enters the library picker with
//     editing enabled.
//   • On-device validation rejects small or extreme-aspect photos before
//     save; a warm Iris retake card replaces the tips card until the
//     next attempt.

import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, ChevronLeft, Scan, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Card } from '@/components/Card';
import { IrisMessageCard } from '@/components/IrisMessageCard';
import { Sheet } from '@/components/Sheet';
import { theme } from '@/constants/theme';
import { validatePhoto } from '@/lib/photoValidation';
import {
  type ProfilePhotoSlot,
  useProfilePhotosStore,
} from '@/lib/stores/profilePhotosStore';
import { devLog } from '@/lib/log';

const HEADSHOT_TIPS = [
  'Face the light, not away from it.',
  "Eyes to the camera — like you'd look at a friend.",
  'Nothing covering your face. Hats off, sunglasses off.',
  'Solo shot. Just you.',
] as const;

const FULLBODY_TIPS = [
  'Head to toe — I need to see your frame, not guess it.',
  'Stand easy, arms relaxed.',
  'Plain background if you can. A door works.',
  'Fitted clothes help me read your proportions.',
] as const;

// Time to wait for the RN Modal dismiss animation to finish before we
// present the native ImagePicker. Sheet uses SlideOutDown.duration(280);
// give it a small safety margin so iOS doesn't drop the picker.
const MODAL_DISMISS_MS = 320;

type CaptureSource = 'camera' | 'library' | 'adjust';

export default function ProfilePhotosScreen() {
  const router = useRouter();

  const headshotUri = useProfilePhotosStore((s) => s.headshotUri);
  const fullBodyUri = useProfilePhotosStore((s) => s.fullBodyUri);
  const setPhoto = useProfilePhotosStore((s) => s.setPhoto);
  const clearPhoto = useProfilePhotosStore((s) => s.clearPhoto);

  const [activeSheet, setActiveSheet] = useState<ProfilePhotoSlot | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejection, setRejection] = useState<
    Partial<Record<ProfilePhotoSlot, string>>
  >({});

  const closeSheet = () => setActiveSheet(null);

  const clearRejection = (slot: ProfilePhotoSlot) => {
    setRejection((prev) => {
      if (!(slot in prev)) return prev;
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const setRejectionFor = (slot: ProfilePhotoSlot, message: string) => {
    setRejection((prev) => ({ ...prev, [slot]: message }));
  };

  const runCapture = async (slot: ProfilePhotoSlot, source: CaptureSource) => {
    if (busy) return;
    setBusy(true);

    // Clear any prior rejection message the moment the user takes a new
    // action — feels responsive, matches optimistic save philosophy.
    clearRejection(slot);

    // Close the sheet FIRST, then let the modal dismissal animation
    // complete before we hand off to the native image picker. Without
    // this delay iOS silently drops the picker's result.
    closeSheet();
    await new Promise((r) => setTimeout(r, MODAL_DISMISS_MS));

    try {
      const wantsCamera = source === 'camera';
      const perm = wantsCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (__DEV__) {
        devLog('[profile-photos] permission', {
          slot,
          source,
          status: perm.status,
          granted: perm.granted,
        });
      }
      if (!perm.granted) {
        Alert.alert(
          wantsCamera
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

      const editorAspect: [number, number] =
        slot === 'headshot' ? [1, 1] : [3, 4];
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: editorAspect,
        quality: 0.9,
      };

      if (__DEV__) {
        devLog('[profile-photos] launching picker', { slot, source, options });
      }

      const result = wantsCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (__DEV__) {
        devLog('[profile-photos] picker result', {
          canceled: result.canceled,
          assetCount: result.assets?.length ?? 0,
        });
      }

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Could not read that photo', 'Try picking it again.');
        return;
      }

      // ─── On-device validation ─────────────────────────────────────
      const check = await validatePhoto(asset.uri);
      if (__DEV__) {
        devLog('[profile-photos] validation', { slot, ...check });
      }
      if (!check.ok) {
        setRejectionFor(slot, retakeMessageFor(slot));
        return;
      }

      await setPhoto(slot, asset.uri);
      if (__DEV__) {
        devLog('[profile-photos] saved', {
          slot,
          headshot: useProfilePhotosStore.getState().headshotUri,
          fullBody: useProfilePhotosStore.getState().fullBodyUri,
        });
      }
    } catch (err) {
      Alert.alert(
        'Could not save photo',
        err instanceof Error ? err.message : 'Try again.'
      );
      if (__DEV__) console.warn('[profile-photos] capture threw', err);
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (slot: ProfilePhotoSlot) => {
    closeSheet();
    await new Promise((r) => setTimeout(r, MODAL_DISMISS_MS));
    clearRejection(slot);
    await clearPhoto(slot);
  };

  const openSheet = (slot: ProfilePhotoSlot) => {
    setActiveSheet(slot);
  };

  const openSheetLongPress = (slot: ProfilePhotoSlot) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveSheet(slot);
  };

  const activeHasPhoto =
    activeSheet === 'headshot' ? !!headshotUri : !!fullBodyUri;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
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
        <Text style={styles.title} accessibilityRole="header">
          Profile photos
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ───── HEADSHOT ───── */}
        <View style={styles.eyebrowRow}>
          <CapsLabel size="md" tone="secondary">
            Headshot
          </CapsLabel>
        </View>

        <View style={styles.slotBlock}>
          {headshotUri ? (
            <View style={styles.headshotArea}>
              <Pressable
                onPress={() => openSheet('headshot')}
                onLongPress={() => openSheetLongPress('headshot')}
                delayLongPress={300}
                accessibilityRole="button"
                accessibilityLabel="Headshot"
                accessibilityHint="Tap or long-press to edit"
                hitSlop={8}
              >
                <Avatar size="xl" source={{ uri: headshotUri }} />
              </Pressable>
              <Text style={styles.longPressHint}>Tap or hold to edit</Text>
            </View>
          ) : (
            <EmptySlotCard
              icon="camera"
              label="Add a headshot"
              onPress={() => openSheet('headshot')}
            />
          )}
        </View>

        {rejection.headshot ? (
          <View style={styles.tipsWrap}>
            <IrisMessageCard
              suffix="Let's retake"
              tone="error"
              plain
              lines={[rejection.headshot]}
            />
          </View>
        ) : (
          <View style={styles.tipsWrap}>
            <IrisMessageCard suffix="For a clear picture" lines={HEADSHOT_TIPS} />
          </View>
        )}

        {/* ───── FULL BODY ───── */}
        <View style={styles.sectionSpacer} />
        <View style={styles.eyebrowRow}>
          <CapsLabel size="md" tone="secondary">
            Full body
          </CapsLabel>
          <CapsLabel size="sm" tone="tertiary">
            {'· Used for try-on'}
          </CapsLabel>
        </View>

        <View style={styles.slotBlock}>
          {fullBodyUri ? (
            <View style={styles.fullBodyArea}>
              <Pressable
                onPress={() => openSheet('fullBody')}
                onLongPress={() => openSheetLongPress('fullBody')}
                delayLongPress={300}
                accessibilityRole="button"
                accessibilityLabel="Full body photo"
                accessibilityHint="Tap or long-press to edit"
                style={styles.fullBodyImageFrame}
              >
                <ExpoImage
                  source={{ uri: fullBodyUri }}
                  style={styles.fullBodyImage}
                  contentFit="cover"
                  transition={0}
                  cachePolicy="memory-disk"
                />
              </Pressable>
              <Text style={styles.longPressHint}>Tap or hold to edit</Text>
            </View>
          ) : (
            <EmptySlotCard
              icon="scan"
              label="Add a full-body photo"
              onPress={() => openSheet('fullBody')}
            />
          )}
        </View>

        {rejection.fullBody ? (
          <View style={styles.tipsWrap}>
            <IrisMessageCard
              suffix="Let's retake"
              tone="error"
              plain
              lines={[rejection.fullBody]}
            />
          </View>
        ) : (
          <View style={styles.tipsWrap}>
            <IrisMessageCard
              suffix="For true-to-you try-ons"
              lines={FULLBODY_TIPS}
            />
          </View>
        )}
      </ScrollView>

      <Sheet visible={activeSheet !== null} onClose={closeSheet}>
        <Pressable
          onPress={closeSheet}
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

        <View style={styles.sheetHeader}>
          <CapsLabel size="sm" tone="secondary">
            {activeSheet === 'headshot' ? 'Headshot' : 'Full body'}
          </CapsLabel>
        </View>

        <View style={styles.sheetActions}>
          {activeHasPhoto && (
            <Button
              label="Adjust crop"
              variant="secondary"
              size="lg"
              fullWidth
              disabled={busy}
              onPress={() =>
                activeSheet && void runCapture(activeSheet, 'adjust')
              }
            />
          )}
          <Button
            label={activeHasPhoto ? 'Take new photo' : 'Take photo'}
            size="lg"
            fullWidth
            disabled={busy}
            onPress={() => activeSheet && void runCapture(activeSheet, 'camera')}
          />
          <Button
            label="Choose from library"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={busy}
            onPress={() =>
              activeSheet && void runCapture(activeSheet, 'library')
            }
          />
          {activeHasPhoto && (
            <Button
              label="Remove"
              variant="destructive"
              size="lg"
              fullWidth
              disabled={busy}
              onPress={() => activeSheet && void removePhoto(activeSheet)}
            />
          )}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────

function retakeMessageFor(slot: ProfilePhotoSlot): string {
  return slot === 'headshot'
    ? "I can't quite work with this one — I need a clear, close-up of your face, front-lit. One more try?"
    : 'I need the full you, head to toe, to style you true. One more try?';
}

interface EmptySlotCardProps {
  icon: 'camera' | 'scan';
  label: string;
  onPress: () => void;
}

function EmptySlotCard({ icon, label, onPress }: EmptySlotCardProps) {
  const Icon = icon === 'camera' ? Camera : Scan;
  return (
    <Card variant="dashed" onPress={onPress}>
      <View style={styles.emptyInner}>
        <Icon
          size={24}
          color={theme.color.ink.secondary}
          strokeWidth={1.75}
        />
        <Text style={styles.emptyLabel}>{label}</Text>
      </View>
    </Card>
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
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -theme.space[2],
  },
  title: {
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
    paddingTop: theme.space[8],
    paddingBottom: theme.space[12],
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.space[2],
  },
  slotBlock: {
    marginTop: theme.space[4],
  },
  headshotArea: {
    alignItems: 'center',
    gap: theme.space[2],
  },
  fullBodyArea: {
    alignItems: 'center',
    gap: theme.space[2],
  },
  fullBodyImageFrame: {
    width: '60%',
    aspectRatio: theme.aspect.scene,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.color.bg.subtle,
  },
  fullBodyImage: {
    width: '100%',
    height: '100%',
  },
  longPressHint: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.xs.fontSize,
    lineHeight: theme.font.body.xs.lineHeight,
    color: theme.color.ink.tertiary,
  },
  emptyInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[3],
  },
  emptyLabel: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
  },
  tipsWrap: {
    marginTop: theme.space[5],
  },
  sectionSpacer: {
    height: theme.space[8],
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
    // Elevated above the sheet content so it isn't obscured by the header/actions.
    zIndex: 2,
  },
  sheetHeader: {
    paddingBottom: theme.space[4],
    alignItems: 'center',
  },
  sheetActions: {
    gap: theme.space[3],
  },
});
