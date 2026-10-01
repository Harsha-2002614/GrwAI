// Standalone "Take a photo" route.
//
// Kept as a route so the batch-add loop (`/closet-camera?batch=1`) has a
// stable target. Instead of hosting the in-app CameraCapture (which
// lacks a crop step), this route fires the native camera via
// expo-image-picker with a 1:1 crop, then hands off to /closet-tag with
// the batch flag preserved.

import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';

export default function ClosetCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ batch?: string }>();
  const inBatch = params.batch === '1';
  // Guard against firing twice under React 18 double-invoke.
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    void (async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera permission needed',
          'You can enable this in Settings.',
          [
            { text: 'Not now', style: 'cancel', onPress: () => router.back() },
            {
              text: 'Open Settings',
              onPress: () => {
                void Linking.openSettings();
                router.back();
              },
            },
          ]
        );
        return;
      }
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });
        if (result.canceled) {
          router.back();
          return;
        }
        const uri = result.assets?.[0]?.uri;
        if (!uri) {
          router.back();
          return;
        }
        const batchQuery = inBatch ? '&batch=1' : '';
        router.replace(
          `/closet-tag?tempUri=${encodeURIComponent(uri)}${batchQuery}`
        );
      } catch (err) {
        Alert.alert(
          'Could not take photo',
          err instanceof Error ? err.message : 'Try again.'
        );
        router.back();
      }
    })();
  }, [router, inBatch]);

  // Full-bleed neutral scrim while the native picker is presenting on top.
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.fill} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.ink.primary },
  fill: { flex: 1 },
});
