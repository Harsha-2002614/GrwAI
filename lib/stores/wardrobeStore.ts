// Persisted wardrobe store — the user's captured pieces.
//
// Each piece is just a photo on disk + optional tags + a saved flag. Color
// detection runs at capture time and produces a suggestion (not a lock).
// Categories drive the editorial rail order on Closet; untagged pieces
// collect in the "Unsorted" rail at the bottom.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { deleteWardrobePhoto, saveWardrobePhoto } from '@/lib/wardrobeStorage';
import type { EventCategory } from '@/lib/mockData';

// ─── Tag taxonomy ───────────────────────────────────────────────────────
export type PieceCategory =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'accessory';

// Named swatches the user can pick directly. `'custom'` (below) indicates
// the user typed a name or picked a hex; `'multicolor'` marks a piece
// where no single color dominates (prints, stripes, colorblock). Both
// stay in one enum so downstream code has one source of truth for the
// named-family AI styling can match on.
export type NamedColor =
  | 'neutral'
  | 'black'
  | 'white'
  | 'blue'
  | 'earth'
  | 'green'
  | 'red'
  | 'pink'
  | 'multicolor';

export type PieceColor = NamedColor | 'custom';

/**
 * Free-form color the user typed or picked. `family` is always derived to
 * one of the named swatches so styling code never has to interpret a free
 * string or a raw hex on its own — the named family is what's useful to
 * future AI styling; hex is for accurate display.
 */
export interface PieceCustomColor {
  name?: string;
  hex?: string;
  family?: NamedColor;
}

// Closet's "for occasions" set is the SAME taxonomy Events uses, imported
// from the shared constants/occasions.ts source. Aliasing the type here
// means a piece that's tagged "work" can be matched directly against the
// equivalent event without converting between two parallel enums.
export type PieceOccasion = EventCategory;

// Coverage attribute — load-bearing for the modest/hijab compose filter.
// A piece with no coverage tag is treated as UNKNOWN by the filter, and
// the modest path deliberately fails closed (unknown → excluded) rather
// than open. See lib/moments/composeLook.ts.
export type PieceCoverage =
  | 'long_sleeve'
  | 'short_sleeve'
  | 'sleeveless'
  | 'modest_safe';

export interface WardrobePiece {
  id: string;
  uri: string;
  createdAt: number;
  isFavorite: boolean;
  category?: PieceCategory;
  /** When `'custom'`, `customColor` holds the typed / hex value + family. */
  color?: PieceColor;
  customColor?: PieceCustomColor;
  occasion?: PieceOccasion[];
  /** Free-text occasion the user typed via the "Other" affordance. Saved
   *  alongside any standard `occasion` entries — they coexist. */
  customOccasion?: string;
  /** True when the piece is a wardrobe workhorse that Iris should match
   *  against any occasion (plain tees, everyday sandals). Mutually
   *  exclusive with `occasion[]` at the UI layer but tolerated at the
   *  data layer — composeLook treats `anyOccasion` as a positive
   *  baseline score without touching the specific-occasion score. */
  anyOccasion?: boolean;
  /** Optional coverage attribute. When absent, the modest compose
   *  filter treats the piece as UNKNOWN and excludes it (fail-closed). */
  coverage?: PieceCoverage;
}

export interface PieceTags {
  category?: PieceCategory;
  color?: PieceColor;
  customColor?: PieceCustomColor;
  occasion?: PieceOccasion[];
  customOccasion?: string;
  anyOccasion?: boolean;
  coverage?: PieceCoverage;
}

/**
 * Carries the category + occasion picked on the FIRST piece of a batch so
 * subsequent captures from the "Add more" loop inherit them automatically
 * (color is still detected per-piece). Cleared when the user picks Done.
 */
export interface BatchTags {
  category?: PieceCategory;
  occasion?: PieceOccasion[];
}

interface WardrobeState {
  pieces: WardrobePiece[];
  batchTags: BatchTags | null;
  /**
   * Copies the temp camera URI into the wardrobe dir, persists a new piece
   * (with the supplied tags, if any), and returns the new id. Tags are
   * passed in at the same call site so review/tag never has to deal with
   * a half-saved record.
   */
  addPiece: (tempUri: string, tags?: PieceTags) => string;
  /** Convenience for batched programmatic adds. Returns the new ids. */
  addPieces: (entries: { tempUri: string; tags?: PieceTags }[]) => string[];
  /** Removes a piece + deletes the underlying photo. */
  removePiece: (id: string) => void;
  /**
   * Merge tags into an existing piece. Pass `undefined` for any field you
   * don't want to touch; a field explicitly present in the tags object is
   * applied (so passing `occasion: []` clears the array, but omitting
   * `occasion` leaves the previous value alone).
   */
  updatePieceTags: (id: string, tags: PieceTags) => void;
  toggleFavorite: (id: string, next: boolean) => void;
  setBatchTags: (b: BatchTags | null) => void;
  /** Dev-only seed/clear used by the Closet header pill. */
  clearAll: () => void;
}

/**
 * Build the optional-tag fragment for a brand-new piece. Used by both
 * addPiece + addPieces so the spread shape stays in one place.
 */
function buildTagsFragment(
  tags: PieceTags | undefined
): Partial<WardrobePiece> {
  if (!tags) return {};
  const out: Partial<WardrobePiece> = {};
  if (tags.category !== undefined) out.category = tags.category;
  if (tags.color !== undefined) out.color = tags.color;
  if (tags.customColor !== undefined) out.customColor = tags.customColor;
  if (tags.occasion !== undefined && tags.occasion.length > 0) {
    out.occasion = tags.occasion;
  }
  if (tags.customOccasion !== undefined && tags.customOccasion.length > 0) {
    out.customOccasion = tags.customOccasion;
  }
  if (tags.anyOccasion) out.anyOccasion = true;
  if (tags.coverage !== undefined) out.coverage = tags.coverage;
  return out;
}

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set) => ({
      pieces: [],
      batchTags: null,

      addPiece: (tempUri, tags) => {
        const saved = saveWardrobePhoto(tempUri);
        const piece: WardrobePiece = {
          id: saved.id,
          uri: saved.uri,
          createdAt: Date.now(),
          isFavorite: false,
          ...buildTagsFragment(tags),
        };
        set((s) => ({ pieces: [piece, ...s.pieces] }));
        return saved.id;
      },

      addPieces: (entries) => {
        const ids: string[] = [];
        const created: WardrobePiece[] = [];
        for (const e of entries) {
          const saved = saveWardrobePhoto(e.tempUri);
          created.push({
            id: saved.id,
            uri: saved.uri,
            createdAt: Date.now(),
            isFavorite: false,
            ...buildTagsFragment(e.tags),
          });
          ids.push(saved.id);
        }
        // Newest first across the batch.
        set((s) => ({ pieces: [...created.reverse(), ...s.pieces] }));
        return ids;
      },

      removePiece: (id) =>
        set((s) => {
          const target = s.pieces.find((p) => p.id === id);
          if (target) deleteWardrobePhoto(target.uri);
          return { pieces: s.pieces.filter((p) => p.id !== id) };
        }),

      updatePieceTags: (id, tags) =>
        set((s) => ({
          pieces: s.pieces.map((p) => {
            if (p.id !== id) return p;
            // Picking a NAMED swatch should clear any stale customColor.
            // updatePieceTags merges by-key, so callers pass `customColor:
            // undefined` to clear it explicitly; this branch enforces that
            // invariant whenever color is explicitly set to non-'custom'.
            const next: WardrobePiece = {
              ...p,
              ...('category' in tags ? { category: tags.category } : {}),
              ...('color' in tags ? { color: tags.color } : {}),
              ...('customColor' in tags ? { customColor: tags.customColor } : {}),
              ...('occasion' in tags ? { occasion: tags.occasion } : {}),
              ...('customOccasion' in tags
                ? { customOccasion: tags.customOccasion }
                : {}),
              ...('anyOccasion' in tags
                ? { anyOccasion: tags.anyOccasion || undefined }
                : {}),
              ...('coverage' in tags ? { coverage: tags.coverage } : {}),
            };
            if ('color' in tags && tags.color !== 'custom') {
              next.customColor = undefined;
            }
            return next;
          }),
        })),

      toggleFavorite: (id, next) =>
        set((s) => ({
          pieces: s.pieces.map((p) =>
            p.id === id ? { ...p, isFavorite: next } : p
          ),
        })),

      setBatchTags: (b) => set({ batchTags: b }),

      clearAll: () =>
        set((s) => {
          for (const p of s.pieces) deleteWardrobePhoto(p.uri);
          return { pieces: [], batchTags: null };
        }),
    }),
    {
      name: '@grwai/wardrobe',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
