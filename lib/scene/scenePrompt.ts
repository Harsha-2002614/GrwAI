// Editorial prompt for the photoreal scene model.
//
// Composes the §10.2 composition rules with the §10.3 scene-context palette
// into a single instruction. Used identically by 7a (direct Gemini) and 7b
// (Cloudflare Worker proxy) — the prompt is the contract, not the transport.
//
// Reads the user's active "Always honor" preferences from `prefsStore` at
// call time and appends their visual fragments so the generator dresses
// the subject accordingly.

import { HONOR_CONSTRAINTS } from '@/constants/honorConstraints';
import { usePrefsStore } from '@/lib/stores/prefsStore';

import type { SceneContext } from './types';
import { devLog } from '@/lib/log';

/** Maps each scene context key to its §10.3 visual description. */
const SCENE_DESCRIPTIONS: Record<SceneContext, string> = {
  work_review:
    'a modern minimalist conference room with daylight from large windows and architectural minimalism',
  casual_errand:
    'a SoHo cobblestone street on a soft afternoon, with blurred storefronts and pedestrians',
  dinner:
    'a warm restaurant interior with candlelight bokeh and wine-tone shadows',
  wedding:
    'a vineyard or garden ceremony at golden hour with soft fabric movement in the breeze',
  trip_tokyo:
    'a Shibuya side street at dusk with blurred neon signage and wet pavement reflections',
  athleisure:
    'a park path in the morning with dappled tree light and green negative space',
  brunch:
    'a sunny sidewalk cafe with white linen and mid-morning crispness',
  date:
    'a rooftop bar at sunset with the city skyline blurred and warm sodium light',
  party:
    'an indoor venue with warm uplight and soft motion-blur of background figures',
};

/**
 * Build the editorial scene instruction.
 *
 * Returns one continuous prompt: subject (from reference photo) + outfit +
 * scene, with §10.2 composition rules and §10.4 "brand never breaks"
 * identity-preservation guardrails.
 */
export function buildScenePrompt(
  outfitName: string,
  sceneContext: SceneContext
): string {
  const scene = SCENE_DESCRIPTIONS[sceneContext] ?? SCENE_DESCRIPTIONS.work_review;

  // Read at call time so a chip toggle in You settings is reflected in the
  // very next generation without re-mounting anything.
  const { honorPreferences } = usePrefsStore.getState();
  const honorFragments = honorPreferences.map(
    (id) => HONOR_CONSTRAINTS[id].scenePromptFragment
  );

  const parts = [
    `Photoreal editorial photograph of the person shown in the reference photo, wearing ${outfitName}, in ${scene}.`,
    'Directional natural light. f/2.8 background blur. Soft, contextual, never harsh.',
    'Full body fills 60–70% of the vertical frame; feet near the lower 15%, head near the upper 20% — never centered.',
    'Natural mid-stride pose with slight asymmetry — one foot forward, weight on one hip. Engaged but unposed expression.',
    'Preserve the person’s face and identity exactly — same face shape, eye color, hair, undertone, skin tone.',
    'Garments must read accurately in color, drape, and silhouette.',
    ...honorFragments,
    'No text overlays, no watermarks, no logos, no catalog-rigid posing.',
    '3:4 portrait orientation.',
  ];

  const prompt = parts.join(' ');
  if (__DEV__) {
    // Surfaces the composed prompt in the Metro logs so the chip → prompt
    // flow is verifiable end-to-end.
    devLog('[prefs] buildScenePrompt →', prompt);
  }
  return prompt;
}
