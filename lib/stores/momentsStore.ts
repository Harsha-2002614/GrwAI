// User-composed moments (Iris flow) — a tiny persisted store so
// selections survive between the composer, the look screen, and the
// Events tab. Mock/sample events on Events stay in local useState;
// this store is layered on top for Iris-authored entries only.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { EventCategory } from '@/lib/mockData';
import type { DressCode } from '@/lib/moments/composeLook';

export interface IrisMoment {
  id: string;
  occasion: EventCategory;
  /** Local midnight of the target day. Stored as an ISO string for
   *  persistence — hydrate back into a Date at read time. */
  dateIso: string;
  /** 0..23 for the target time-of-day (parsed or default-for-occasion).
   *  Kept separate from `dateIso` so the day-vs-time semantics are
   *  explicit and we never accidentally show "12:00 AM". */
  hours: number;
  minutes: number;
  city: string;
  dressCode: DressCode;
  /** The one-line "why" surfaced on the look screen; kept so returning
   *  from Events → look shows the same rationale without recomposing. */
  why: string;
  /** Composer's raw input, for debugging + future refinement. */
  raw?: string;
  /** Local file URI of the composed try-on render, once it succeeds.
   *  When set, Events cards use this as the hero image. */
  renderUri?: string;
  createdAt: number;
}

interface MomentsState {
  moments: IrisMoment[];
  addMoment: (m: Omit<IrisMoment, 'id' | 'createdAt'>) => IrisMoment;
  setRenderUri: (id: string, uri: string) => void;
  removeMoment: (id: string) => void;
  clearMoments: () => void;
}

export const useMomentsStore = create<MomentsState>()(
  persist(
    (set) => ({
      moments: [],
      addMoment: (m) => {
        const created: IrisMoment = {
          ...m,
          id: `iris_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: Date.now(),
        };
        set((s) => ({ moments: [created, ...s.moments] }));
        return created;
      },
      setRenderUri: (id, uri) =>
        set((s) => ({
          moments: s.moments.map((m) =>
            m.id === id ? { ...m, renderUri: uri } : m
          ),
        })),
      removeMoment: (id) =>
        set((s) => ({ moments: s.moments.filter((m) => m.id !== id) })),
      clearMoments: () => set({ moments: [] }),
    }),
    {
      name: 'grwai-moments',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
