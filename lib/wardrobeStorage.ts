// Disk-side storage for captured wardrobe pieces.
//
// Mirrors the photoStorage.ts pattern: photos live under the app's document
// directory in a stable subfolder so they survive across launches. Unlike
// the onboarding face/body photos (which are keyed by type and overwrite
// one another), each wardrobe piece gets its own UUID-style filename and
// is independent of the others.

import { Directory, File, Paths } from 'expo-file-system';

const WARDROBE_DIR_NAME = 'wardrobe';

function getWardrobeDir(): Directory {
  return new Directory(Paths.document, WARDROBE_DIR_NAME);
}

function ensureWardrobeDir(): void {
  const dir = getWardrobeDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/** RFC 4122 v4-ish id, suitable for file names. We don't need cryptographic
 *  uniqueness here — collision-resistance + URL/file safety is enough. */
function newPieceId(): string {
  const rand = () =>
    Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, '0');
  return `p-${Date.now().toString(36)}-${rand()}`;
}

/**
 * Copies the photo at `tempUri` (camera output URI) into the wardrobe
 * directory under a fresh filename. Returns `{ id, uri }` so the caller can
 * persist both in the Zustand store and reference the file later.
 */
export function saveWardrobePhoto(tempUri: string): { id: string; uri: string } {
  ensureWardrobeDir();
  const id = newPieceId();
  const dest = new File(getWardrobeDir(), `${id}.jpg`);
  const src = new File(tempUri);
  src.copy(dest);
  return { id, uri: dest.uri };
}

/** Removes the file at the given wardrobe URI if present. Safe to call with
 *  a URI that no longer exists (no-op + no throw). */
export function deleteWardrobePhoto(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // intentionally empty — the store entry is the source of truth.
  }
}
