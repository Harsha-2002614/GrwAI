// Curated editorial placeholder scenes (pre-upload state — see the locked
// decision "curated editorial placeholder renders during development, gated
// behind a provider seam" and DESIGN_SYSTEM §10.3 for the palette targets).
// Metro needs static `require()` calls, hence the explicit map.
import type { SceneContext } from './types';

export const PLACEHOLDER_SCENES: Record<SceneContext, number> = {
  work_review: require('@/assets/sample-scenes/work_review.jpg'),
  casual_errand: require('@/assets/sample-scenes/casual_errand.jpg'),
  dinner: require('@/assets/sample-scenes/dinner.jpg'),
  wedding: require('@/assets/sample-scenes/wedding.jpg'),
  trip_tokyo: require('@/assets/sample-scenes/trip_tokyo.jpg'),
  athleisure: require('@/assets/sample-scenes/athleisure.jpg'),
  brunch: require('@/assets/sample-scenes/brunch.jpg'),
  date: require('@/assets/sample-scenes/date.jpg'),
  party: require('@/assets/sample-scenes/party.jpg'),
};

export function placeholderScene(occasion: string): number | null {
  return (PLACEHOLDER_SCENES as Record<string, number>)[occasion] ?? null;
}
