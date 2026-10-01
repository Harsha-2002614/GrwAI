// Saved looks — the single store behind every SaveButton (DS §7.13 "Save
// state persistence": outfits → "Saved looks", pieces → Closet Favorites).
// Persisted so a save on Today survives a relaunch and shows up on the Saved tab.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SavedState {
  savedOutfitIds: string[];
  savedPieceIds: string[];
  /** Newest first. */
  savedAt: Record<string, number>;
  isSavedOutfit: (id: string) => boolean;
  toggleOutfit: (id: string, next?: boolean) => void;
  togglePiece: (id: string, next?: boolean) => void;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedOutfitIds: [],
      savedPieceIds: [],
      savedAt: {},
      isSavedOutfit: (id) => get().savedOutfitIds.includes(id),
      toggleOutfit: (id, next) =>
        set((s) => {
          const has = s.savedOutfitIds.includes(id);
          const want = next ?? !has;
          if (want === has) return s;
          const savedAt = { ...s.savedAt };
          if (want) savedAt[id] = Date.now();
          else delete savedAt[id];
          return {
            savedOutfitIds: want ? [id, ...s.savedOutfitIds] : s.savedOutfitIds.filter((x) => x !== id),
            savedAt,
          };
        }),
      togglePiece: (id, next) =>
        set((s) => {
          const has = s.savedPieceIds.includes(id);
          const want = next ?? !has;
          if (want === has) return s;
          return { savedPieceIds: want ? [id, ...s.savedPieceIds] : s.savedPieceIds.filter((x) => x !== id) };
        }),
    }),
    { name: '@grwai/saved', storage: createJSONStorage(() => AsyncStorage) }
  )
);
