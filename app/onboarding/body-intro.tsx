import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import type { ComponentType } from 'react';
import {
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { CapsLabel } from '@/components/CapsLabel';
import { Italic } from '@/components/Italic';
import { theme } from '@/constants/theme';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

const BODY_PLACEHOLDER_ASSET = require('@/assets/onboarding-placeholders/body-placeholder.jpg');

export default function BodyIntroScreen() {
  const router = useRouter();
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);
  const setBodyPhotoUri = useOnboardingStore((s) => s.setBodyPhotoUri);
  const setSkippedPhotos = useOnboardingStore((s) => s.setSkippedPhotos);
  const hasFacePhoto = useOnboardingStore((s) => s.facePhotoUri !== null);

  const handleTakePhoto = () => {
    router.push('/onboarding/body-capture');
  };

  const handleSkip = () => {
    if (__DEV__) {
      // QA FIX EXPERIMENT #2: Image.resolveAssetSource is native-only (not
      // implemented by react-native-web), so guard it — on web the bundled
      // asset module already carries a `uri`.
      const placeholder =
        typeof RNImage.resolveAssetSource === 'function'
          ? RNImage.resolveAssetSource(BODY_PLACEHOLDER_ASSET)
          : (BODY_PLACEHOLDER_ASSET as { uri?: string } | null);
      setBodyPhotoUri(placeholder?.uri ?? null);
    } else {
      setSkippedPhotos(true);
    }
    markScreenComplete(5);
    // If the face photo was also skipped in production, there's nothing to
    // analyze — go straight past color-analysis. (Chunk 6c's next screen is
    // the figure baseline; for now we land on /(tabs) as the chunk-6c stub.)
    if (!__DEV__ && !hasFacePhoto) {
      router.replace('/(tabs)');
      return;
    }
    router.push('/onboarding/color-analysis');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.eyebrow}>
          <CapsLabel size="md" tone="secondary">
            Building your stylist
          </CapsLabel>
        </View>

        <Text style={styles.headline}>
          Iris needs your full <Italic tone="rust">silhouette</Italic>
        </Text>

        <Text style={styles.body}>
          A full-body photo helps Iris see how clothes will fall on you — fit,
          length, and drape. Same privacy as your face photo.
        </Text>

        <View style={styles.trustList}>
          <TrustRow
            icon={Eye}
            caps="What Iris uses"
            body="Your proportions, posture, height."
          />
          <TrustRow
            icon={EyeOff}
            caps="What Iris never does"
            body="Share your photo, train on it, or use it for ads."
          />
          <TrustRow
            icon={Lock}
            caps="Who sees it"
            body="Only you. Stored encrypted on your device."
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Take body photo"
          size="lg"
          fullWidth
          onPress={handleTakePhoto}
        />
        <View style={styles.tertiaryWrap}>
          <Button
            label="Skip for now"
            variant="tertiary"
            onPress={handleSkip}
          />
        </View>
      </View>
    </View>
  );
}

interface TrustRowProps {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  caps: string;
  body: string;
}

function TrustRow({ icon: Icon, caps, body }: TrustRowProps) {
  return (
    <View style={styles.trustRow}>
      <View style={styles.trustIconWrap}>
        <Icon
          size={18}
          color={theme.color.ink.primary}
          strokeWidth={1.75}
        />
      </View>
      <View style={styles.trustText}>
        <CapsLabel size="sm" tone="primary">
          {caps}
        </CapsLabel>
        <Text style={styles.trustBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.bg.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[6],
    paddingBottom: theme.space[12],
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
  body: {
    marginTop: theme.space[4],
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.md.fontSize,
    lineHeight: theme.font.body.md.lineHeight,
    color: theme.color.ink.secondary,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 340,
  },
  trustList: {
    marginTop: theme.space[8],
    gap: theme.space[4],
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space[3],
  },
  trustIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trustText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  trustBody: {
    fontFamily: theme.font.family.sans,
    fontSize: theme.font.body.sm.fontSize,
    lineHeight: theme.font.body.sm.lineHeight,
    color: theme.color.ink.secondary,
  },
  footer: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.space[3],
    paddingBottom: theme.space[6],
    backgroundColor: theme.color.bg.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border.light,
    alignItems: 'center',
    gap: theme.space[2],
  },
  tertiaryWrap: {
    alignItems: 'center',
  },
});
