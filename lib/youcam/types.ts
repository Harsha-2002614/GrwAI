// YouCam (Perfect Corp) Clothes Virtual Try-On — shared types.
//
// The provider seam matches the photoreal scene seam: caller passes a
// request, receives either a local file URI or a `{ failed: true }` sentinel.
// The seam never throws; upstream code silently falls back to curated
// renders when a call fails.

import type { YouCamErrorCode } from './errorMessages';

export type GarmentCategory =
  | 'upper_body'
  | 'lower_body'
  | 'full_body'
  | 'outerwear';

export interface TryOnRequest {
  personPhotoUri: string;
  garmentPhotoUri: string;
  garmentCategory: GarmentCategory;
}

export type TryOnResult =
  | { uri: string; cache: 'hit' | 'miss' }
  | { failed: true; errorCode?: YouCamErrorCode };
