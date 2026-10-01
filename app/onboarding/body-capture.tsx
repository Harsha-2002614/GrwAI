import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { CameraCapture } from '@/components/CameraCapture';
import { theme } from '@/constants/theme';
import { savePhoto } from '@/lib/photoStorage';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

export default function BodyCaptureScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const setBodyPhotoUri = useOnboardingStore((s) => s.setBodyPhotoUri);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);

  const handleConfirmed = async (tempUri: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const permanentUri = await savePhoto(tempUri, 'body');
      setBodyPhotoUri(permanentUri);
      markScreenComplete(6);
      router.push('/onboarding/color-analysis');
    } catch (err) {
      Alert.alert(
        'Could not save photo',
        err instanceof Error ? err.message : 'Try again.'
      );
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.ink.primary }}>
      <CameraCapture
        promptCaps="Full body in frame"
        promptBody="Stand back. Show your head to feet."
        poseGuide="rectangle"
        shutterAccessibilityLabel="Capture body photo"
        safeAreaEdges={['bottom']}
        onConfirmed={handleConfirmed}
        onPermissionSkip={() => router.replace('/onboarding/body-intro')}
        permissionCopy={{
          titleUndetermined: 'Camera permission needed',
          bodyUndetermined:
            'GRWAI needs your camera to take your body photo. Your photo stays on your device.',
        }}
      />
    </View>
  );
}
