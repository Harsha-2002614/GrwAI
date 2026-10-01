import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Pronouns are intentionally not collected in onboarding. Identity + "Always
// honor" preferences moved to `lib/stores/prefsStore.ts` so they can be
// edited from Settings and consumed by generation + Iris uniformly.

export type ColorSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export type BodyShape =
  | 'pear'
  | 'apple'
  | 'hourglass'
  | 'rectangle'
  | 'inverted-triangle';

export type FitPreference =
  | 'oversized'
  | 'fitted'
  | 'structured'
  | 'flowy';

export type TasteArchetype =
  | 'Modern Editorialist'
  | 'Soft Romantic'
  | 'Quiet Luxury'
  | 'Eclectic Mixer';

export interface StyleSwipeChoice {
  cardId: string;
  choice: 'love' | 'pass';
}

// ─── Chunk 6d: about-you + life-context ─────────────────────────────────
//
// `lifeContext` is a transient life signal — comfort + accuracy framing
// only, never a body score and never required. Identity + always-honor
// live in `prefsStore` now (single source of truth for gen + Iris).

export type LifeContext =
  | 'pregnant'
  | 'postpartum'
  | 'body-changing'
  | 'recovering-surgery'
  | 'nothing-right-now';

export interface OnboardingState {
  // Flags
  hasCompletedOnboarding: boolean;
  hasSkippedOnboarding: boolean;
  /** Furthest screen the user has reached (0..10). Increases monotonically. */
  currentScreenIndex: number;
  /** True once AsyncStorage rehydration finishes — gate UI on this. */
  isHydrated: boolean;

  // Screen 2 (Account)
  email: string | null;
  // NOTE: password is intentionally NEVER stored in this Zustand store or
  // in AsyncStorage. Real auth ships in chunk 9.

  // Screen 3 (Name) — first name only; pronouns no longer collected here.
  firstName: string | null;

  // Screens 4–6 (Face + Body photos)
  facePhotoUri: string | null;
  bodyPhotoUri: string | null;
  /** When true, the user opted out of the photo capture path. In production
   *  the downstream Today/Closet screens fall back to illustration mode. In
   *  dev we bundle placeholder photos so QA can still proceed. */
  hasSkippedPhotos: boolean;

  // Screen 7 (Color analysis)
  colorSeason: ColorSeason | null;
  colorPalette: string[] | null;

  // Chunk 6d: about-you + life-context (Act 2 — picture-accuracy questions)
  // Identity + honorPreferences live in prefsStore.
  lifeContext: LifeContext | null;

  // Chunk 6c: fit / shape / swipes / archetype
  fitPreference: FitPreference | null;
  bodyShape: BodyShape | null;
  heightInches: number | null;
  styleSwipeChoices: StyleSwipeChoice[];
  tasteArchetype: TasteArchetype | null;

  // Actions
  setEmail: (email: string) => void;
  setFirstName: (name: string) => void;
  setFacePhotoUri: (uri: string | null) => void;
  setBodyPhotoUri: (uri: string | null) => void;
  setSkippedPhotos: (skipped: boolean) => void;
  setColorAnalysis: (season: ColorSeason, palette: string[]) => void;
  setLifeContext: (ctx: LifeContext | null) => void;
  setFitPreference: (fit: FitPreference | null) => void;
  setBodyShape: (shape: BodyShape | null) => void;
  addSwipeChoice: (choice: StyleSwipeChoice) => void;
  setTasteArchetype: (archetype: TasteArchetype | null) => void;
  markScreenComplete: (screenIndex: number) => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const INITIAL_FIELDS: Omit<
  OnboardingState,
  | 'setEmail'
  | 'setFirstName'
  | 'setFacePhotoUri'
  | 'setBodyPhotoUri'
  | 'setSkippedPhotos'
  | 'setColorAnalysis'
  | 'setLifeContext'
  | 'setFitPreference'
  | 'setBodyShape'
  | 'addSwipeChoice'
  | 'setTasteArchetype'
  | 'markScreenComplete'
  | 'skipOnboarding'
  | 'completeOnboarding'
  | 'resetOnboarding'
> = {
  hasCompletedOnboarding: false,
  hasSkippedOnboarding: false,
  currentScreenIndex: 0,
  isHydrated: false,
  email: null,
  firstName: null,
  facePhotoUri: null,
  bodyPhotoUri: null,
  hasSkippedPhotos: false,
  colorSeason: null,
  colorPalette: null,
  lifeContext: null,
  fitPreference: null,
  bodyShape: null,
  heightInches: null,
  styleSwipeChoices: [],
  tasteArchetype: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...INITIAL_FIELDS,

      setEmail: (email) => set({ email }),
      setFirstName: (name) => set({ firstName: name }),
      setFacePhotoUri: (facePhotoUri) => set({ facePhotoUri }),
      setBodyPhotoUri: (bodyPhotoUri) => set({ bodyPhotoUri }),
      setSkippedPhotos: (hasSkippedPhotos) => set({ hasSkippedPhotos }),
      setColorAnalysis: (colorSeason, colorPalette) =>
        set({ colorSeason, colorPalette }),

      setLifeContext: (lifeContext) => set({ lifeContext }),

      setFitPreference: (fitPreference) => set({ fitPreference }),
      setBodyShape: (bodyShape) => set({ bodyShape }),
      addSwipeChoice: (choice) =>
        set((state) => ({
          styleSwipeChoices: [...state.styleSwipeChoices, choice],
        })),
      setTasteArchetype: (tasteArchetype) => set({ tasteArchetype }),

      markScreenComplete: (idx) =>
        set((state) => ({
          currentScreenIndex: Math.max(state.currentScreenIndex, idx),
        })),

      skipOnboarding: () =>
        set({ hasSkippedOnboarding: true }),

      completeOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
          hasSkippedOnboarding: false,
        }),

      // Resets every persisted field back to defaults. `isHydrated` is
      // re-forced to true so the gate stays unblocked after a reset.
      resetOnboarding: () =>
        set({ ...INITIAL_FIELDS, isHydrated: true }),
    }),
    {
      name: '@grwai/onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist everything except the transient hydration flag.
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
