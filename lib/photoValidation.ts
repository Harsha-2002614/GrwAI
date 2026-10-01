// Lightweight on-device checks that run before we persist a picked photo.
// Two rules, each catches a common cause of a downstream YouCam rejection
// (which costs a network round-trip and stresses the unit budget):
//
//   • Short side ≥ 480px — anything smaller is likely a screenshot or a
//     library thumbnail. YouCam typically returns `error_below_min_image_size`
//     on these.
//   • Aspect ratio no more extreme than 3:1 either way — panoramas or
//     ultra-tall crops don't leave a subject the model can work with.
//
// Runs against a local URI using RN's built-in `Image.getSize` (no native
// binaries beyond what Expo Go already includes). Never throws; on any
// probe error we `pass` — the API-level validation catches the rest.

import { Image } from 'react-native';

export type PhotoRejection =
  | { kind: 'too_small'; shortSide: number }
  | { kind: 'extreme_aspect'; ratio: number };

export interface PhotoValidationResult {
  ok: boolean;
  rejection?: PhotoRejection;
  width?: number;
  height?: number;
}

const MIN_SHORT_SIDE = 480;
const MAX_ASPECT_RATIO = 3; // either landscape 3:1 or portrait 1:3.

function getSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err instanceof Error ? err : new Error(String(err)))
    );
  });
}

export async function validatePhoto(
  uri: string
): Promise<PhotoValidationResult> {
  try {
    const { width, height } = await getSize(uri);
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);
    const ratio = longSide / Math.max(1, shortSide);

    if (shortSide < MIN_SHORT_SIDE) {
      return {
        ok: false,
        width,
        height,
        rejection: { kind: 'too_small', shortSide },
      };
    }
    if (ratio > MAX_ASPECT_RATIO) {
      return {
        ok: false,
        width,
        height,
        rejection: { kind: 'extreme_aspect', ratio },
      };
    }
    return { ok: true, width, height };
  } catch (err) {
    if (__DEV__) console.warn('[photoValidation] probe failed', err);
    // Fail-open — let the API-side validation catch it.
    return { ok: true };
  }
}
