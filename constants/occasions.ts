// Shared occasion taxonomy.
//
// Source-of-truth for the §14 event-chip set. Events (when categorizing a
// moment) and Closet (when tagging a piece "for occasions") both import
// from here so the two surfaces never drift on labels, emoji, or value
// strings. Adding/removing an occasion in one place updates both.
//
// Emoji include the U+FE0F variation selector (̈), per §14, so iOS
// renders them as full-color glyphs instead of monochrome text. The escape
// sequences (`\u{1F4BC}`) keep the file ASCII-safe.

import type { EventCategory } from '@/lib/mockData';

export interface OccasionDef {
  key: EventCategory;
  label: string;
  /** Emoji glyph WITH the U+FE0F variation selector appended. */
  emoji: string;
}

export const OCCASIONS: readonly OccasionDef[] = [
  { key: 'work', label: 'Work', emoji: '\u{1F4BC}️' }, // 💼
  { key: 'dinner', label: 'Dinner', emoji: '\u{1F942}️' }, // 🥂
  { key: 'wedding', label: 'Wedding', emoji: '\u{1F48D}️' }, // 💍
  { key: 'trip', label: 'Trip', emoji: '✈️' }, // ✈️
  { key: 'party', label: 'Party', emoji: '\u{1F389}️' }, // 🎉
  { key: 'date', label: 'Date', emoji: '❤️' }, // ❤️
  { key: 'brunch', label: 'Brunch', emoji: '\u{1F373}️' }, // 🍳
];

const BY_KEY = new Map<EventCategory, OccasionDef>(
  OCCASIONS.map((o) => [o.key, o])
);

export function getOccasion(key: EventCategory): OccasionDef | undefined {
  return BY_KEY.get(key);
}

/** Compose the user-facing pluralization used in batch prompts and labels. */
export function occasionLabel(key: EventCategory): string {
  return getOccasion(key)?.label ?? key;
}
