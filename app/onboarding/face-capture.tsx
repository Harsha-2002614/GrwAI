import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { CameraCapture } from '@/components/CameraCapture';
import { theme } from '@/constants/theme';
import { analyzeFromUri } from '@/lib/colorAnalysisMock';
import { savePhoto } from '@/lib/photoStorage';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

export default function FaceCaptureScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const setFacePhotoUri = useOnboardingStore((s) => s.setFacePhotoUri);
  const setColorAnalysis = useOnboardingStore((s) => s.setColorAnalysis);
  const markScreenComplete = useOnboardingStore((s) => s.markScreenComplete);

  const handleConfirmed = async (tempUri: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const permanentUri = await savePhoto(tempUri, 'face');
      setFacePhotoUri(permanentUri);
      const analysis = analyzeFromUri(permanentUri);
      setColorAnalysis(analysis.season, analysis.palette);
      markScreenComplete(4);
      router.push('/onboarding/body-intro');
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
        promptCaps="Center your face"
        promptBody="Good light. Look at the camera."
        poseGuide="oval"
        shutterAccessibilityLabel="Capture face photo"
        safeAreaEdges={['bottom']}
        onConfirmed={handleConfirmed}
        onPermissionSkip={() => router.replace('/onboarding/face-intro')}
        permissionCopy={{
          titleUndetermined: 'Camera permission needed',
          bodyUndetermined:
            'GRWAI needs your camera to take your face photo. Your photo stays on your device.',
        }}
      />
    </View>
  );
}
