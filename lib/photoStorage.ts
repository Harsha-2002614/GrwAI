import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

// expo-file-system's Directory/File/Paths API has no web implementation —
// `new Directory(Paths.document, …)` throws on react-native-web, which took
// the whole profile-photos migration down on web (QA GRW-12). On web the
// picker already hands us a blob:/data: URI that lives for the session, so we
// keep it as-is and skip disk persistence entirely.
const IS_WEB = Platform.OS === 'web';

// Onboarding uses `face` / `body`. The You › Profile photos surface uses
// the newer `headshot` / `fullBody` slot names so a rename inside product
// copy doesn't touch the on-disk convention. Both live in the same folder
// with their own deterministic filenames — that way the onboarding photos
// and the profile-photo slots can coexist without stomping each other.
export type PhotoType = 'face' | 'body' | 'headshot' | 'fullBody';

const PHOTO_DIR_NAME = 'photos';

const FILE_NAMES: Record<PhotoType, string> = {
  face: 'face-photo.jpg',
  body: 'body-photo.jpg',
  headshot: 'headshot.jpg',
  fullBody: 'fullbody.jpg',
};

function getPhotoDir(): Directory {
  return new Directory(Paths.document, PHOTO_DIR_NAME);
}

function getPhotoFile(type: PhotoType): File {
  return new File(getPhotoDir(), FILE_NAMES[type]);
}

async function ensureDirectory(): Promise<void> {
  const dir = getPhotoDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/**
 * Copies the photo at `tempUri` (a temp camera / library URI) into the
 * app's document directory under a deterministic filename. Returns the
 * new permanent URI. Calling this again with the same `type` overwrites
 * the previous photo.
 */
export async function savePhoto(
  tempUri: string,
  type: PhotoType
): Promise<string> {
  if (IS_WEB) return tempUri;
  await ensureDirectory();
  const dest = getPhotoFile(type);
  if (dest.exists) {
    dest.delete();
  }
  const src = new File(tempUri);
  src.copy(dest);
  return dest.uri;
}

/** Removes the persisted photo from disk if present. */
export async function deletePhoto(type: PhotoType): Promise<void> {
  if (IS_WEB) return;
  const file = getPhotoFile(type);
  if (file.exists) {
    file.delete();
  }
}

/** Returns the persisted URI for the given type, or null when no file exists. */
export async function getPhotoUri(type: PhotoType): Promise<string | null> {
  if (IS_WEB) return null;
  const file = getPhotoFile(type);
  return file.exists ? file.uri : null;
}

/**
 * Non-destructive copy from a legacy onboarding slot into a profile-photo
 * slot. Used once, from profilePhotosStore, to seed `headshot`/`fullBody`
 * for users who completed onboarding before the profile-photos surface
 * shipped. Returns the new destination URI, or null when the source is
 * missing (so callers can decide whether to persist).
 */
export async function copySlot(
  from: PhotoType,
  to: PhotoType
): Promise<string | null> {
  if (IS_WEB) return null;
  const src = getPhotoFile(from);
  if (!src.exists) return null;
  await ensureDirectory();
  const dest = getPhotoFile(to);
  if (dest.exists) dest.delete();
  src.copy(dest);
  return dest.uri;
}
