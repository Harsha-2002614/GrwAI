// Orchestrator: reads the user's local photo, calls the provider, writes the
// result to disk. Returns a SceneResult; never throws.

import { Directory, File, Paths } from 'expo-file-system';

import { buildScenePrompt } from './scenePrompt';
import { requestSceneImage } from './sceneProvider';
import type { SceneRequest, SceneResult } from './types';
import { devLog } from '@/lib/log';

const SCENES_DIR_NAME = 'scenes';

function getScenesDir(): Directory {
  return new Directory(Paths.document, SCENES_DIR_NAME);
}

function ensureScenesDir(): void {
  const dir = getScenesDir();
  if (!dir.exists) dir.create({ intermediates: true });
}

/** Filesystem-safe slug for the cached on-disk filename. */
function diskKey(outfitName: string, sceneContext: string): string {
  const slug = outfitName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug}__${sceneContext}`;
}

export async function generateScene(req: SceneRequest): Promise<SceneResult> {
  // Hard guard: live calls only in dev with a key present. The check lives in
  // the orchestrator so the network module itself stays host-agnostic for 7b.
  if (!__DEV__) {
    // TODO(remove after QA)
    devLog('[7a] generateScene guard: skipped (not __DEV__)');
    return { failed: true };
  }
  if (!process.env.EXPO_PUBLIC_GEMINI_KEY) {
    // TODO(remove after QA)
    devLog('[7a] generateScene guard: skipped (no GEMINI key)');
    return { failed: true };
  }

  // TODO(remove after QA)
  devLog('[7a] generateScene userPhotoUri:', req.userPhotoUri);

  try {
    const src = new File(req.userPhotoUri);
    if (!src.exists) {
      // TODO(remove after QA)
      devLog('[7a] generateScene: source file does not exist on disk');
      return { failed: true };
    }

    const photoBase64 = await src.base64();
    // TODO(remove after QA)
    devLog('[7a] generateScene photoBase64.length:', photoBase64.length);

    const prompt = buildScenePrompt(req.outfitName, req.sceneContext);
    // TODO(remove after QA)
    devLog('[7a] generateScene calling provider');

    const b64 = await requestSceneImage(prompt, photoBase64);
    if (!b64) {
      // TODO(remove after QA)
      devLog('[7a] generateScene result: failed (no image bytes)');
      return { failed: true };
    }

    ensureScenesDir();
    const dest = new File(
      getScenesDir(),
      `${diskKey(req.outfitName, req.sceneContext)}.jpg`
    );
    if (dest.exists) dest.delete();
    dest.create();
    dest.write(b64, { encoding: 'base64' });

    // TODO(remove after QA)
    devLog('[7a] generateScene result: uri =', dest.uri);
    return { uri: dest.uri };
  } catch (err) {
    // TODO(remove after QA)
    devLog('[7a] generateScene caught error:', err);
    return { failed: true };
  }
}
