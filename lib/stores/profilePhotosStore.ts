// Persisted "Profile photos" state — the two named slots surfaced on
// You › Profile photos. Files themselves are managed by photoStorage;
// this store holds the current permanent URIs so components can render
// them synchronously without an async disk probe.
//
// One-time migration: users who completed onboarding before the profile
// photos surface shipped have onboarding `face` / `body` photos on disk.
// On first hydrate we non-destructively copy those into the new
// `headshot` / `fullBody` slots so their profile page isn't empty on
// first visit. The onboarding files are left in place.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { copySlot, deletePhoto, getPhotoUri, savePhoto } from '@/lib/photoStorage';

export type ProfilePhotoSlot = 'headshot' | 'fullBody';

export interface ProfilePhotosState {
  headshotUri: string | null;
  fullBodyUri: string | null;
  /** True once AsyncStorage rehydration + one-time migration finished. */
  isHydrated: boolean;

  /** Copy the temp URI into the slot, replacing any existing file. */
  setPhoto: (slot: ProfilePhotoSlot, tempUri: string) => Promise<void>;
  /** Delete the photo file and clear the URI. */
  clearPhoto: (slot: ProfilePhotoSlot) => Promise<void>;
}

const INITIAL: Pick<
  ProfilePhotosState,
  'headshotUri' | 'fullBodyUri' | 'isHydrated'
> = {
  headshotUri: null,
  fullBodyUri: null,
  isHydrated: false,
};

async function migrateOnboardingPhotos(
  current: Pick<ProfilePhotosState, 'headshotUri' | 'fullBodyUri'>
): Promise<Partial<ProfilePhotosState>> {
  const next: Partial<ProfilePhotosState> = {};

  // Headshot: prefer any already-set URI; otherwise copy the onboarding
  // face photo. If nothing exists, leave null.
  if (!current.headshotUri) {
    const migrated = await copySlot('face', 'headshot');
    if (migrated) next.headshotUri = migrated;
  } else {
    // Guard against stale AsyncStorage entries whose file was deleted
    // underneath us (dev reload of documents dir, TestFlight update, etc).
    const stillThere = await getPhotoUri('headshot');
    if (!stillThere) next.headshotUri = null;
  }

  if (!current.fullBodyUri) {
    const migrated = await copySlot('body', 'fullBody');
    if (migrated) next.fullBodyUri = migrated;
  } else {
    const stillThere = await getPhotoUri('fullBody');
    if (!stillThere) next.fullBodyUri = null;
  }

  return next;
}

export const useProfilePhotosStore = create<ProfilePhotosState>()(
  persist(
    (set) => ({
      ...INITIAL,

      setPhoto: async (slot, tempUri) => {
        const permanentUri = await savePhoto(tempUri, slot);
        // Cache-buster: append a fingerprint so <ExpoImage> reloads even
        // though the on-disk filename is unchanged. Only for file:// URIs —
        // a query string corrupts blob:/data: URIs on web.
        const busted = permanentUri.startsWith('file:')
          ? `${permanentUri}?v=${Date.now()}`
          : permanentUri;
        set(
          slot === 'headshot'
            ? { headshotUri: busted }
            : { fullBodyUri: busted }
        );
      },

      clearPhoto: async (slot) => {
        await deletePhoto(slot);
        set(
          slot === 'headshot'
            ? { headshotUri: null }
            : { fullBodyUri: null }
        );
      },
    }),
    {
      name: 'grwai-profile-photos',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        headshotUri: state.headshotUri,
        fullBodyUri: state.fullBodyUri,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        void migrateOnboardingPhotos({
          headshotUri: state.headshotUri,
          fullBodyUri: state.fullBodyUri,
        }).then((patch) => {
          useProfilePhotosStore.setState({ ...patch, isHydrated: true });
        });
        // Fall-through in case migration promise never resolves (shouldn't
        // happen; belt-and-braces so UI never stalls).
        setTimeout(() => {
          if (!useProfilePhotosStore.getState().isHydrated) {
            useProfilePhotosStore.setState({ isHydrated: true });
          }
        }, 1000);
      },
    }
  )
);
