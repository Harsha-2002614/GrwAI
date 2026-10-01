// Closet piece → YouCam garment_category mapping.
//
// The internal `PieceCategory` union is compact (`top`, `bottom`,
// `dress`, `outerwear`, `shoes`, `accessory`) but the spec's mapping
// table names the human-facing tags (blouses, jeans, sarees, blazers,
// …). We accept both: the piece's stored `category` drives the switch,
// and any customOccasion / synonym string we happen to receive routes
// through the same table.
//
// Silent misroutes are the worst failure mode here — try-on that
// silhouettes a dress against `upper_body` returns technically valid
// but visually wrong images. When we hit an unmapped tag we `warn` so
// the log names the culprit, then fall back to `upper_body`.

import type { WardrobePiece, PieceCategory } from '@/lib/stores/wardrobeStore';
import type { GarmentCategory } from './types';

const CATEGORY_TABLE: Record<PieceCategory, GarmentCategory | null> = {
  top: 'upper_body',
  bottom: 'lower_body',
  dress: 'full_body',
  outerwear: 'outerwear',
  // Try-on doesn't meaningfully apply to shoes / accessories; we route
  // them through the fallback so callers get a warn in dev.
  shoes: null,
  accessory: null,
};

// Extra keyword fallbacks so a stray label ("jeans", "saree", …) still
// routes correctly. Checked lowercased against category + customOccasion
// only when the primary category is missing.
const KEYWORD_TABLE: Record<string, GarmentCategory> = {
  shirt: 'upper_body',
  blouse: 'upper_body',
  sweater: 'upper_body',
  tee: 'upper_body',
  't-shirt': 'upper_body',
  tshirt: 'upper_body',
  jean: 'lower_body',
  jeans: 'lower_body',
  pants: 'lower_body',
  skirt: 'lower_body',
  shorts: 'lower_body',
  gown: 'full_body',
  jumpsuit: 'full_body',
  saree: 'full_body',
  jacket: 'outerwear',
  coat: 'outerwear',
  blazer: 'outerwear',
};

/**
 * Deterministic mapping from a WardrobePiece to a YouCam garment
 * category. Never asks the user; always returns a category.
 */
export function categoryForPiece(piece: WardrobePiece): GarmentCategory {
  if (piece.category) {
    const mapped = CATEGORY_TABLE[piece.category];
    if (mapped) return mapped;
    console.warn(
      `[youcam/categoryMap] unmapped piece.category="${piece.category}" — falling back to upper_body (piece ${piece.id})`
    );
    return 'upper_body';
  }

  // Second pass: try keyword lookup on the optional customOccasion. This
  // catches "jeans" / "saree" typed into the free-text field even when
  // the structured category was skipped.
  const custom = piece.customOccasion?.toLowerCase().trim();
  if (custom) {
    for (const [needle, category] of Object.entries(KEYWORD_TABLE)) {
      if (custom.includes(needle)) return category;
    }
  }

  console.warn(
    `[youcam/categoryMap] piece has no category and no keyword match — falling back to upper_body (piece ${piece.id})`
  );
  return 'upper_body';
}
