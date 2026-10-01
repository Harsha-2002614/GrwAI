// Canonical store for identity + "Always honor" preferences.
//
// One source of truth read by four consumers:
//   • onboarding "About you" (app/onboarding/name.tsx)
//   • You tab "Styling preferences" (app/(tabs)/you.tsx)
//   • Image prompt builder      (lib/scene/scenePrompt.ts)
//   • Iris context builder       (lib/irisContext.ts)
//
// Persisted separately from onboardingStore so these facts survive a
// re-onboarding and can be edited from Settings at any time.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const HONOR_IDS = [
  'hijab_modest',
  'saree',
  'seated_fit',
  'one_handed',
  'sensory_friendly',
] as const;

export type HonorId = (typeof HONOR_IDS)[number];

// The identity chips shown in onboarding + You settings. Typed as
// `string | null` per spec so a future custom value (e.g. free-text from
// self-describe) can flow through the same field without a schema change.
export const IDENTITY_IDS = [
  'woman',
  'man',
  'non-binary',
  'self-describe',
  'prefer-not-to-say',
] as const;

export type IdentityId = (typeof IDENTITY_IDS)[number];

export interface PrefsState {
  identity: string | null;
  // Free-text label paired with `identity === 'self-describe'`. Cleared
  // automatically when identity moves off self-describe.
  identityLabel: string | null;
  honorPreferences: HonorId[];
  /** True once AsyncStorage rehydration finishes — gate UI on this if needed. */
  isHydrated: boolean;

  setIdentity: (id: string | null, label?: string | null) => void;
  toggleHonor: (id: HonorId) => void;
  resetPrefs: () => void;
}

const INITIAL: Pick<
  PrefsState,
  'identity' | 'identityLabel' | 'honorPreferences' | 'isHydrated'
> = {
  identity: null,
  identityLabel: null,
  honorPreferences: [],
  isHydrated: false,
};

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      ...INITIAL,

      setIdentity: (id, label = null) =>
        set({
          identity: id,
          identityLabel: id === 'self-describe' ? label : null,
        }),

      // Immutable toggle — always constructs a new array.
      toggleHonor: (id) =>
        set((state) => ({
          honorPreferences: state.honorPreferences.includes(id)
            ? state.honorPreferences.filter((v) => v !== id)
            : [...state.honorPreferences, id],
        })),

      resetPrefs: () => set({ ...INITIAL, isHydrated: true }),
    }),
    {
      name: 'grwai-prefs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const { isHydrated: _ignored, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    }
  )
);
