// Persisted cache of generated photoreal scenes.
//
// Key = `${outfitId}:${sceneContext}`. Status moves idle → loading → ready
// (or failed). 'ready' entries survive app relaunch so reopening Today shows
// the cached image instantly; 'failed' entries also persist so we don't
// hammer the API for a known-bad combination during a session.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SceneStatus = 'idle' | 'loading' | 'ready' | 'failed';

export interface GeneratedScene {
  uri: string;
  status: SceneStatus;
}

interface GeneratedScenesState {
  scenes: Record<string, GeneratedScene>;
  setLoading: (key: string) => void;
  setReady: (key: string, uri: string) => void;
  setFailed: (key: string) => void;
}

export function sceneKey(outfitId: string, sceneContext: string): string {
  return `${outfitId}:${sceneContext}`;
}

export const useGeneratedScenesStore = create<GeneratedScenesState>()(
  persist(
    (set) => ({
      scenes: {},
      setLoading: (key) =>
        set((s) => ({
          scenes: {
            ...s.scenes,
            [key]: { uri: s.scenes[key]?.uri ?? '', status: 'loading' },
          },
        })),
      setReady: (key, uri) =>
        set((s) => ({
          scenes: { ...s.scenes, [key]: { uri, status: 'ready' } },
        })),
      setFailed: (key) =>
        set((s) => ({
          scenes: {
            ...s.scenes,
            [key]: { uri: s.scenes[key]?.uri ?? '', status: 'failed' },
          },
        })),
    }),
    {
      name: '@grwai/generated-scenes',
      storage: createJSONStorage(() => AsyncStorage),
      // TODO(remove after QA): in dev, drop any persisted ready/failed entries
      // on launch so an earlier session's outcome doesn't short-circuit a
      // fresh attempt while we're still iterating on the Gemini path.
      // Mutating `state` here lands BEFORE subscribers observe the rehydrated
      // value, so the Today hero's mount effect sees an empty scenes map.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (__DEV__) {
          state.scenes = {};
        }
      },
    }
  )
);

/** Reactive selector: subscribes the calling component to changes. */
export function useScene(
  outfitId: string,
  sceneContext: string
): GeneratedScene | undefined {
  return useGeneratedScenesStore((s) => s.scenes[sceneKey(outfitId, sceneContext)]);
}

/** Imperative read — does NOT subscribe. Safe to call outside render. */
export function getScene(
  outfitId: string,
  sceneContext: string
): GeneratedScene | undefined {
  return useGeneratedScenesStore.getState().scenes[
    sceneKey(outfitId, sceneContext)
  ];
}
