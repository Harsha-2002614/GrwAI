// AsyncStorage-backed try-on cache.
//
// Unit budget is finite — every generation costs. Before any API call the
// provider checks the cache by a hash of (personPhotoUri + garmentPhotoUri
// + garmentCategory). Hits render from disk with zero network calls.
//
// Cache format is intentionally a flat map on AsyncStorage; we don't need
// LRU eviction yet — dev usage is bounded, and a manual clear ships with
// the dev pill.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

const INDEX_KEY = 'grwai-youcam-cache-v1';
const CACHE_DIR_NAME = 'youcam-cache';

// v2 entries carry the source garment URI so `clearCacheForGarment` can
// prune every render tied to a deleted piece. Legacy v1 entries were
// plain URI strings; readers tolerate both shapes.
interface CacheEntry {
  uri: string;
  garmentUri?: string;
}
type StoredEntry = string | CacheEntry;
type StoredIndex = Record<string, StoredEntry>;

function getCacheDir(): Directory {
  return new Directory(Paths.document, CACHE_DIR_NAME);
}

function ensureCacheDir(): void {
  const dir = getCacheDir();
  if (!dir.exists) dir.create({ intermediates: true });
}

// FNV-1a 32-bit — deterministic, non-cryptographic, dependency-free. All
// we need is a stable key; collisions are astronomically unlikely for the
// handful of (person, garment, category) triples a single user will try.
export function cacheKey(
  personUri: string,
  garmentUri: string,
  category: string
): string {
  const input = `${personUri}::${garmentUri}::${category}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

async function readIndex(): Promise<StoredIndex> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') return parsed as StoredIndex;
    return {};
  } catch {
    return {};
  }
}

async function writeIndex(index: StoredIndex): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Normalize either the v1 string entry or the v2 object entry to a URI. */
function entryUri(entry: StoredEntry): string {
  return typeof entry === 'string' ? entry : entry.uri;
}

/**
 * Returns the cached local file URI for the key, if a file still exists on
 * disk. If the index points to a missing file, prunes the stale entry.
 */
export async function readCache(key: string): Promise<string | null> {
  const index = await readIndex();
  const entry = index[key];
  if (!entry) return null;
  const uri = entryUri(entry);
  const file = new File(uri);
  if (!file.exists) {
    delete index[key];
    await writeIndex(index);
    return null;
  }
  return uri;
}

/**
 * Downloads the remote image straight into the cache directory under a
 * deterministic name and records the mapping in the index. Returns the
 * local URI.
 *
 * We use `File.downloadFileAsync` (SDK 54's new file API) rather than
 * fetching to base64 and calling `File#write`: the latter takes only one
 * arg in the new API (the base64-encoded write with an options bag was
 * removed) which was crashing with `InvalidArgsNumberException`.
 *
 * `idempotent: true` overwrites an existing file at the target path
 * (readCache already guards the happy-path — this covers the case where
 * a prior aborted download left a stale file behind).
 *
 * Throws on any failure; the caller decides whether to surface the
 * remote URL as a last-resort display fallback.
 */
export async function writeCache(
  key: string,
  remoteUrl: string,
  meta?: { garmentUri?: string }
): Promise<string> {
  ensureCacheDir();
  const dest = new File(getCacheDir(), `${key}.jpg`);
  const downloaded = await File.downloadFileAsync(remoteUrl, dest, {
    idempotent: true,
  });
  if (!downloaded.exists || downloaded.size <= 0) {
    throw new Error(
      `[youcam] cache write produced an empty file (${downloaded.uri})`
    );
  }
  const index = await readIndex();
  index[key] = { uri: downloaded.uri, garmentUri: meta?.garmentUri };
  await writeIndex(index);
  return downloaded.uri;
}

/** Wipes every cached image + the index. Called by the dev clear pill. */
export async function clearCache(): Promise<void> {
  const dir = getCacheDir();
  if (dir.exists) dir.delete();
  await AsyncStorage.removeItem(INDEX_KEY);
}

/**
 * Purge every cached render whose garment source matches `garmentUri`.
 * Legacy v1 entries (no metadata) are conservatively pruned when their
 * local file happens to sit under the same wardrobe path — for those,
 * the safest treatment is to leave them. We only touch what we can
 * prove belongs to this garment.
 */
export async function clearCacheForGarment(garmentUri: string): Promise<void> {
  const index = await readIndex();
  let mutated = false;
  for (const [key, entry] of Object.entries(index)) {
    if (typeof entry === 'string') continue; // legacy, no metadata
    if (entry.garmentUri === garmentUri) {
      try {
        const f = new File(entry.uri);
        if (f.exists) f.delete();
      } catch {
        // best-effort delete
      }
      delete index[key];
      mutated = true;
    }
  }
  if (mutated) await writeIndex(index);
}
