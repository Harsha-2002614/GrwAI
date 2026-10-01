// YouCam try-on provider — conforms to the seam pattern used by the scene
// generator (never throws; returns `{ failed: true }` on any error, so
// upstream code silently falls back to curated renders).
//
// Flow:
//   1. Hash inputs → check AsyncStorage cache. Hit → return, zero calls.
//   2. Miss → upload both photos in parallel (2-slot queue guards the API).
//   3. createClothTask → pollTask → download result URL straight to the
//      cache file (no manual base64 hop — File.downloadFileAsync).
//   4. Return the local URI. If the cache write fails, warn once and
//      fall back to the remote URL so the user still sees SOMETHING; it
//      expires in 2 hours but that beats a blank frame.

import { createClothTask, pollTask, uploadFile, withSlot } from './client';
import { cacheKey, readCache, writeCache } from './cache';
import { coerceErrorCode } from './errorMessages';
import type { TryOnRequest, TryOnResult } from './types';

export async function generateTryOn(
  req: TryOnRequest
): Promise<TryOnResult> {
  const key = cacheKey(
    req.personPhotoUri,
    req.garmentPhotoUri,
    req.garmentCategory
  );

  try {
    const cached = await readCache(key);
    if (cached) {
      if (__DEV__) console.log('[youcam] cache HIT', key, cached);
      return { uri: cached, cache: 'hit' };
    }

    if (__DEV__) console.log('[youcam] cache MISS', key, '→ generating');

    if (!process.env.EXPO_PUBLIC_YOUCAM_KEY) {
      console.warn('[youcam] no EXPO_PUBLIC_YOUCAM_KEY — falling back');
      return { failed: true };
    }

    // Upload both photos concurrently (each guarded by the 2-slot queue).
    const [personFileId, garmentFileId] = await Promise.all([
      withSlot(() => uploadFile(req.personPhotoUri)),
      withSlot(() => uploadFile(req.garmentPhotoUri)),
    ]);

    const taskId = await withSlot(() =>
      createClothTask({
        personFileId,
        garmentFileId,
        garmentCategory: req.garmentCategory,
      })
    );

    const result = await pollTask(taskId);
    if (result.status !== 'success' || !result.resultUrl) {
      console.warn('[youcam] task did not produce a result URL', {
        taskId,
        status: result.status,
        errorCode: result.errorCode,
      });
      return { failed: true, errorCode: coerceErrorCode(result.errorCode) };
    }

    // Pre-signed S3 URL — expires in ~2h, so download NOW, cache the
    // local URI (never the remote URL). Tag the cache entry with the
    // garment URI so `clearCacheForGarment` can purge every render
    // tied to a piece when the user deletes it.
    try {
      const localUri = await writeCache(key, result.resultUrl, {
        garmentUri: req.garmentPhotoUri,
      });
      return { uri: localUri, cache: 'miss' };
    } catch (writeErr) {
      console.warn(
        '[youcam] cache write failed — returning remote URL as fallback:',
        writeErr
      );
      // Last-resort: show the expiring remote URL. Better than a blank
      // frame; the user can save/share before it expires.
      return { uri: result.resultUrl, cache: 'miss' };
    }
  } catch (err) {
    console.warn('[youcam] generateTryOn failed:', err);
    return { failed: true };
  }
}
