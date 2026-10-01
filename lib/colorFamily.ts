// Map a free-form color name or hex to one of the named closet swatches.
//
// The named family is the semantic label AI styling will match against —
// it's much more useful than the raw user string ("burgundy") or hex
// ("#7B1F2C") because the prompt builder already speaks in terms of the
// eight named swatches. Hex is for accurate visual display; family is
// what the styling logic cares about.

import type { NamedColor } from '@/lib/stores/wardrobeStore';

interface KeywordRule {
  family: NamedColor;
  /** Lowercase substrings that imply this family. */
  hits: string[];
}

// Ordered: more specific terms first so "navy" doesn't get classified by
// a later catch-all. Black/white go before brown so "off-black" beats
// "off-white" doesn't crossfire.
const KEYWORDS: KeywordRule[] = [
  {
    family: 'black',
    hits: ['black', 'charcoal', 'onyx', 'jet', 'coal', 'ebony'],
  },
  {
    family: 'white',
    hits: ['white', 'ivory', 'cream', 'snow', 'alabaster', 'eggshell', 'bone'],
  },
  {
    family: 'blue',
    hits: [
      'blue',
      'navy',
      'cobalt',
      'royal',
      'sky',
      'azure',
      'denim',
      'teal',
      'cerulean',
      'indigo',
    ],
  },
  {
    family: 'earth',
    hits: [
      'brown',
      'tan',
      'khaki',
      'olive',
      'beige',
      'sand',
      'camel',
      'nude',
      'rust',
      'amber',
      'terracotta',
      'mocha',
      'chocolate',
      'taupe',
      'sepia',
    ],
  },
  {
    family: 'green',
    hits: [
      'green',
      'sage',
      'mint',
      'forest',
      'emerald',
      'moss',
      'leaf',
      'jade',
      'kelly',
    ],
  },
  {
    family: 'red',
    hits: [
      'red',
      'crimson',
      'scarlet',
      'wine',
      'burgundy',
      'maroon',
      'cherry',
      'cardinal',
      'merlot',
      'oxblood',
    ],
  },
  {
    family: 'pink',
    hits: [
      'pink',
      'magenta',
      'fuchsia',
      'rose',
      'blush',
      'coral',
      'peach',
      'salmon',
    ],
  },
  {
    family: 'neutral',
    hits: ['neutral', 'grey', 'gray', 'silver', 'pewter'],
  },
];

/**
 * Map a typed color name to a named family. Returns `null` when the name
 * doesn't match any keyword so the caller can decide on a default
 * (typically 'neutral'). Case-insensitive; tolerates multi-word names
 * like "deep forest green" or "off-white".
 */
export function inferColorFamilyFromName(name: string): NamedColor | null {
  if (!name) return null;
  const haystack = name.toLowerCase();
  for (const rule of KEYWORDS) {
    for (const hit of rule.hits) {
      if (haystack.includes(hit)) return rule.family;
    }
  }
  return null;
}

// ─── Named-swatch reference hexes used for hex → family fallback ─────────
// Kept in sync with the swatches in app/closet-tag.tsx by convention; if
// the swatches change there, mirror them here too.
const SWATCH_HEXES: Record<NamedColor, string> = {
  neutral: '#C5B89F',
  black: '#1A1A1A',
  white: '#FAFAFA',
  blue: '#3D5A80',
  earth: '#8B6B52',
  green: '#5A7C4A',
  red: '#B5413A',
  pink: '#C73E73',
  // Multicolor has no single reference hex — treat as neutral for the
  // hex-distance fallback so it never gets used as a nearest-family
  // target when parsing free-text color names.
  multicolor: '#C5B89F',
};

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').trim();
  if (m.length !== 6) return null;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return [r, g, b];
}

/** Squared Euclidean distance in RGB — cheap and good enough for matching
 *  to a coarse 8-swatch family. */
function rgbDistance(
  a: [number, number, number],
  b: [number, number, number]
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/**
 * Map a hex like "#7B1F2C" to the nearest named family by Euclidean
 * distance against the swatch reference colors. Returns null on a
 * malformed hex so callers fall back gracefully.
 */
export function inferColorFamilyFromHex(hex: string): NamedColor | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  let bestFamily: NamedColor | null = null;
  let bestDist = Infinity;
  for (const [family, swatchHex] of Object.entries(SWATCH_HEXES) as [
    NamedColor,
    string,
  ][]) {
    const swatchRgb = hexToRgb(swatchHex);
    if (!swatchRgb) continue;
    const d = rgbDistance(rgb, swatchRgb);
    if (d < bestDist) {
      bestDist = d;
      bestFamily = family;
    }
  }
  return bestFamily;
}

/**
 * High-level: derive a family from whichever of (typed name, hex) is set.
 * Name takes precedence because it carries semantic intent the hex can't
 * always preserve (e.g. "burgundy" with a pinkish photo).
 */
export function deriveColorFamily(input: {
  name?: string;
  hex?: string;
}): NamedColor | null {
  if (input.name) {
    const fromName = inferColorFamilyFromName(input.name);
    if (fromName) return fromName;
  }
  if (input.hex) return inferColorFamilyFromHex(input.hex);
  return null;
}
