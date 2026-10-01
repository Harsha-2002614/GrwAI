// On-device dominant-color detection for closet pieces.
//
// Spec scope: free, fully on-device, Expo Go only — no API, no network,
// no vision model, no native deps. The intended approach is to downscale
// the captured photo with expo-image-manipulator, sample/average pixels,
// and nearest-match to one of the closet swatches.
//
// Status: returns `null` for now. expo-image-manipulator gives us a
// resized image's encoded bytes (PNG/JPEG) but not raw pixel data, and
// decoding either format in pure JS — Expo Go forbids new native deps —
// requires a non-trivial decoder + zlib (PNG) or Huffman/DCT machinery
// (JPEG). The spec explicitly authorizes the "leave color unset" fallback:
//   "If ANY approach needs a native build or new native dep, do NOT use
//    it — fall back to a simpler on-device method, or leave color unset."
// So we ship the API + behavior contract (Promise<PieceColor | null>) and
// the review/tag screen falls back gracefully — no swatch pre-selected,
// the user picks manually.
//
// TODO(color-detect): land a real implementation once one of:
//   (a) a tiny pure-JS PNG/JPEG pixel reader proves acceptable,
//   (b) we move off Expo Go (a native module can read raw pixels), or
//   (c) we accept a thumbnail-render → captureRef path with a JS canvas.
// When that lands, swap the stub for a real averageColor() + classifySwatch()
// pair and the rest of the UI already knows what to do with the result.

import type { PieceColor } from '@/lib/stores/wardrobeStore';

export interface DetectedColor {
  color: PieceColor;
  /** 0–1 confidence in the swatch match. Reserved for the future real
   *  implementation — the UI doesn't gate behavior on it today. */
  confidence: number;
}

/**
 * Attempt to detect the dominant color of the photo at `uri`. Returns
 * `null` when detection is unavailable (the current Expo-Go stub case) or
 * when sampling fails. Never throws — callers should treat a `null` return
 * as "no suggestion".
 */
export async function detectDominantColor(
  _uri: string
): Promise<DetectedColor | null> {
  // Intentional stub. See file-level comment.
  return null;
}
