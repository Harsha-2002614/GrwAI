// Photoreal scene generation — provider-agnostic types.
//
// 7a: implemented against Google Gemini (Nano Banana) via direct REST.
// 7b: same types unchanged; only sceneProvider.ts swaps to the Worker URL.

export type SceneContext =
  | 'work_review'
  | 'casual_errand'
  | 'dinner'
  | 'wedding'
  | 'trip_tokyo'
  | 'athleisure'
  | 'brunch'
  | 'date'
  | 'party';

export interface SceneRequest {
  userPhotoUri: string;
  outfitName: string;
  sceneContext: SceneContext;
}

export type SceneResult = { uri: string } | { failed: true };
