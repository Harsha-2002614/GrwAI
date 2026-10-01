// Style swipe card library + archetype inference.
//
// Cards are gradient + caption stand-ins for real outfit photos (those arrive
// in chunk 7). Each card weights toward a category; loving more cards in a
// category tips the user's inferred archetype.
//
// Set 1 = swipes-1 (more balanced across archetypes — broad sample).
// Set 2 = swipes-2 (more polarizing — helps tiebreak any close calls).

import type { StyleSwipeChoice, TasteArchetype } from '@/lib/stores/onboardingStore';

export type ArchetypeCategory = 'modern' | 'romantic' | 'luxury' | 'eclectic';

export interface StyleCard {
  id: string;
  name: string;
  category: ArchetypeCategory;
  gradient: readonly [string, string];
  caption: string;
}

const CATEGORY_TO_ARCHETYPE: Record<ArchetypeCategory, TasteArchetype> = {
  modern: 'Modern Editorialist',
  romantic: 'Soft Romantic',
  luxury: 'Quiet Luxury',
  eclectic: 'Eclectic Mixer',
};

// ─── Set 1 (style-swipes-1) — balanced, broad ───────────────────────────────

export const STYLE_CARDS_SET_1: readonly StyleCard[] = [
  {
    id: 'm1-sharp-blazer',
    name: 'The Sharp Blazer',
    category: 'modern',
    gradient: ['#1A1A1A', '#3D3D3D'],
    caption: 'Off-duty editorial',
  },
  {
    id: 'r1-linen-lavender',
    name: 'Linen + Lavender',
    category: 'romantic',
    gradient: ['#E8D9C5', '#C9A78E'],
    caption: 'Golden hour',
  },
  {
    id: 'l1-cashmere-camel',
    name: 'Cashmere Camel',
    category: 'luxury',
    gradient: ['#C9A78E', '#8B6B52'],
    caption: 'Quiet considered',
  },
  {
    id: 'e1-vintage-denim',
    name: 'Vintage Denim Layer',
    category: 'eclectic',
    gradient: ['#C75D3A', '#8B3F22'],
    caption: 'Lived-in',
  },
  {
    id: 'm2-pinstripe-sneakers',
    name: 'Pinstripe + Sneakers',
    category: 'modern',
    gradient: ['#2B2B2B', '#6B6B6B'],
    caption: 'Boardroom remix',
  },
  {
    id: 'r2-layered-lace',
    name: 'Layered Vintage Lace',
    category: 'romantic',
    gradient: ['#F4D9CC', '#D8A89A'],
    caption: 'Slow Sunday',
  },
  {
    id: 'l2-quiet-cream',
    name: 'Quiet Cream',
    category: 'luxury',
    gradient: ['#D8C5A8', '#B89878'],
    caption: 'Tonal layering',
  },
  {
    id: 'e2-print-on-print',
    name: 'Print on Print',
    category: 'eclectic',
    gradient: ['#A8702A', '#D5A55F'],
    caption: 'No rules',
  },
];

// ─── Set 2 (style-swipes-2) — polarizing, tiebreakers ───────────────────────

export const STYLE_CARDS_SET_2: readonly StyleCard[] = [
  {
    id: 'm3-black-on-black',
    name: 'Black on Black on Black',
    category: 'modern',
    gradient: ['#0A0A0A', '#2A2A2A'],
    caption: 'Monochrome',
  },
  {
    id: 'r3-soft-pleats',
    name: 'Soft Pleats',
    category: 'romantic',
    gradient: ['#E8D9C5', '#C9B59E'],
    caption: 'Morning light',
  },
  {
    id: 'l3-tailored-cashmere',
    name: 'Tailored Cashmere',
    category: 'luxury',
    gradient: ['#C5A582', '#8B6B52'],
    caption: 'Timeless cut',
  },
  {
    id: 'e3-rust-mustard',
    name: 'Rust + Mustard',
    category: 'eclectic',
    gradient: ['#C75D3A', '#D5A55F'],
    caption: 'Color clash',
  },
  {
    id: 'm4-architectural-white',
    name: 'Architectural White',
    category: 'modern',
    gradient: ['#3D3D3D', '#7A7A7A'],
    caption: 'Hard lines',
  },
  {
    id: 'r4-sunday-slip',
    name: 'Sunday Slip Dress',
    category: 'romantic',
    gradient: ['#F4D9CC', '#E8C5B5'],
    caption: 'Easy elegance',
  },
  {
    id: 'l4-ivory-tan',
    name: 'Ivory + Tan',
    category: 'luxury',
    gradient: ['#E8DCC5', '#B89878'],
    caption: 'Considered neutrals',
  },
  {
    id: 'e4-pop-of-teal',
    name: 'Pop of Teal',
    category: 'eclectic',
    gradient: ['#1F6E7A', '#A8702A'],
    caption: 'Statement',
  },
];

export const ALL_STYLE_CARDS: readonly StyleCard[] = [
  ...STYLE_CARDS_SET_1,
  ...STYLE_CARDS_SET_2,
];

/**
 * Infer the user's taste archetype from their swipe choices.
 *
 * Counts "love" choices per category; the leading category wins. Ties are
 * broken by the most recent love (so the last "love" cast nudges the result).
 * If the user never loves anything, fall back to Modern Editorialist —
 * a safe, broadly flattering default that won't constrain Iris.
 */
export function inferArchetype(choices: readonly StyleSwipeChoice[]): TasteArchetype {
  const cardIndex = new Map<string, StyleCard>();
  for (const card of ALL_STYLE_CARDS) cardIndex.set(card.id, card);

  const loves: ArchetypeCategory[] = [];
  for (const c of choices) {
    if (c.choice !== 'love') continue;
    const card = cardIndex.get(c.cardId);
    if (card) loves.push(card.category);
  }

  if (loves.length === 0) return 'Modern Editorialist';

  const counts: Record<ArchetypeCategory, number> = {
    modern: 0,
    romantic: 0,
    luxury: 0,
    eclectic: 0,
  };
  for (const cat of loves) counts[cat] += 1;

  const max = Math.max(counts.modern, counts.romantic, counts.luxury, counts.eclectic);

  // Tiebreak: walk loves in reverse and return the first category tied for the
  // max — that's the user's most recent leaning.
  for (let i = loves.length - 1; i >= 0; i--) {
    if (counts[loves[i]] === max) {
      return CATEGORY_TO_ARCHETYPE[loves[i]];
    }
  }

  return 'Modern Editorialist';
}
