/**
 * Seed data for GRWAI dev. Real APIs (weather, calendar, location) wire in
 * later chunks. Interfaces are exported so future screens can reuse shapes.
 */

export interface User {
  name: string;
  pronouns: string;
  location: string;
}

export interface Weather {
  tempF: number;
  condition: string;
  humidity: number;
  /** Single-word adjective that feeds the hero headline italic — "humid",
   *  "crisp", "stormy", "warm". Swap-in point for future weather logic. */
  descriptor: string;
}

/** Source label for the Today screen's "From X" context chips. Distinct from
 *  `EventSource` (which describes how a real event entered the events list). */
export type ChipSource = 'calendar' | 'resy' | 'imessage';

export interface TodayEvent {
  time: string;
  title: string;
  source: ChipSource;
}

export interface Outfit {
  id: string;
  name: string;
  occasion?: string;
  contextLabel?: string;
  /** Mock retail total for the look (BUILD_SPEC §4.6). */
  price?: number;
  /** One-line italic stylist blurb (BUILD_SPEC §4.6). */
  blurb?: string;
  /** Component pills, caps (BUILD_SPEC §4.6). */
  components?: string[];
  /** Scene caption strip location (DS §7.11). */
  captionLocation?: string;
}

export type EventCategory =
  | 'work'
  | 'dinner'
  | 'wedding'
  | 'trip'
  | 'party'
  | 'date'
  | 'brunch';

export type EventSource = 'calendar' | 'manual' | 'sample';

export interface EventOutfit {
  name: string;
  components: string[];
  /** Emoji glyphs with explicit U+FE0F variation selector — see DESIGN_SYSTEM
   *  v1.3 dual-icon rule. */
  emoji: string[];
}

export interface Event {
  id: string;
  title: string;
  category: EventCategory;
  /** Caps label inside the EventMoodHeader, e.g., "CONFERENCE ROOM". */
  contextLabel: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  locationDetail?: string;
  source: EventSource;
  isFeatured?: boolean;
  outfit?: EventOutfit;
}

export const user: User = {
  name: 'Harsha',
  pronouns: 'she/her',
  location: 'San Francisco',
};

export const weather: Weather = {
  tempF: 72,
  condition: 'Partly cloudy',
  humidity: 68,
  descriptor: 'humid',
};

export const todayEvents: TodayEvent[] = [
  { time: '2:00 PM', title: 'Quarterly review', source: 'calendar' },
];

export const featuredOutfit: Outfit = {
  id: 'soft-power',
  name: 'Soft Power',
  occasion: 'work_review',
  contextLabel: 'OFFICE · SYNCED: TEAM STANDUP',
  price: 286,
  blurb: 'Cream blouse under an unlined blazer keeps the review crisp without the armour. Tailored trousers do the talking.',
  components: ['CREAM BLOUSE', 'UNLINED BLAZER', 'TAILORED TROUSERS', 'LOAFERS'],
  captionLocation: 'CONFERENCE ROOM · DAYLIGHT',
};

export const alternateOutfits: Outfit[] = [
  {
    id: 'city-stroll',
    name: 'City Stroll',
    occasion: 'casual_errand',
    contextLabel: 'CASUAL · ERRAND-FRIENDLY',
    price: 218,
    blurb: 'Mariniere reads polished without trying. Indigo softens the contrast.',
    components: ['STRIPED KNIT', 'VINTAGE DENIM', 'WHITE SNEAKERS', 'CROSSBODY'],
    captionLocation: 'SOHO · SOFT AFTERNOON',
  },
  {
    id: 'after-hours',
    name: 'After Hours',
    occasion: 'dinner',
    contextLabel: 'DINNER · 7:30 PM',
    price: 342,
    blurb: 'Wine slip moves with the room. Slingbacks won\u2019t kill you on cobblestones. Gold chain catches dim light.',
    components: ['WINE SLIP DRESS', 'SLINGBACK HEELS', 'GOLD CHAIN', 'BLACK CLUTCH'],
    captionLocation: 'CANDLELIT · WINE-TONE SHADOWS',
  },
];

export const todayOutfits: Outfit[] = [featuredOutfit, ...alternateOutfits];

/** The look Iris shows at the end of onboarding, per taste archetype
 *  (onboarding/first-look-preview). Saving it lands on the Saved tab like
 *  any other look, so the first save in the product is never lost. */
export const firstLookOutfits: Record<string, Outfit> = {
  'Modern Editorialist': {
    id: 'first-look-modern-editorialist',
    name: 'Sharp Charcoal + Trench',
    occasion: 'work_review',
    contextLabel: 'WORK · RAINY',
    blurb: 'Charcoal on charcoal, then a trench to cut the rain. Sharp without being loud.',
    components: ['CHARCOAL KNIT', 'STRAIGHT TROUSERS', 'BELTED TRENCH', 'CHELSEA BOOTS'],
    captionLocation: 'CITY STREET · OVERCAST',
  },
  'Soft Romantic': {
    id: 'first-look-soft-romantic',
    name: 'Cashmere + Soft Pleats',
    occasion: 'brunch',
    contextLabel: 'WORK · RAINY',
    blurb: 'Cashmere softens the day; pleats keep the movement. Nothing fights the weather.',
    components: ['CASHMERE CREW', 'PLEATED MIDI', 'TRENCH', 'BALLET FLATS'],
    captionLocation: 'CAFÉ WINDOW · SOFT LIGHT',
  },
  'Quiet Luxury': {
    id: 'first-look-quiet-luxury',
    name: 'Cream Knit + Tailored Wool',
    occasion: 'work_review',
    contextLabel: 'WORK · RAINY',
    blurb: 'Cream knit under tailored wool. The kind of quiet that gets noticed.',
    components: ['CREAM KNIT', 'WOOL TROUSERS', 'CAMEL COAT', 'LOAFERS'],
    captionLocation: 'LOBBY · WARM LIGHT',
  },
  'Eclectic Mixer': {
    id: 'first-look-eclectic-mixer',
    name: 'Vintage Denim + Statement Boots',
    occasion: 'casual_errand',
    contextLabel: 'WORK · RAINY',
    blurb: 'Vintage denim, boots that start conversations, and a coat that closes them.',
    components: ['VINTAGE DENIM', 'STATEMENT BOOTS', 'GRAPHIC KNIT', 'LONG COAT'],
    captionLocation: 'SOHO · AFTER RAIN',
  },
};

export function getOutfit(id: string): Outfit | undefined {
  return (
    todayOutfits.find((o) => o.id === id) ??
    Object.values(firstLookOutfits).find((o) => o.id === id)
  );
}

// ─── Events ──────────────────────────────────────────────────────────────

function atTime(base: Date, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function nextSunday(from: Date): Date {
  const d = new Date(from);
  const daysUntil = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  return d;
}

/** Five seed events keyed to today. Dates are recomputed on every call so the
 *  countdown caps ("T-9D", "TODAY · 2:00 PM") stay accurate as the calendar
 *  advances during dev. */
export function getEvents(): Event[] {
  const now = new Date();
  const tokyoStart = addDays(now, 21);

  return [
    {
      id: 'qr-review',
      title: 'QR review with Maya',
      category: 'work',
      contextLabel: 'CONFERENCE ROOM',
      startDate: atTime(now, 14, 0),
      location: 'Office',
      source: 'calendar',
      isFeatured: true,
      outfit: {
        name: 'The Polish',
        components: ['cream blouse', 'tailored trousers'],
        emoji: ['\u{1F455}️', '\u{1F456}️'],
      },
    },
    {
      id: 'liholiho',
      title: 'Dinner at Liholiho',
      category: 'dinner',
      contextLabel: 'YAKITORI BAR',
      startDate: atTime(addDays(now, 1), 19, 0),
      location: 'Liholiho Yakitori',
      locationDetail: 'Polk St',
      source: 'calendar',
      outfit: {
        name: 'Easy Drama',
        components: ['black silk shirt', 'wide leg trousers'],
        emoji: ['\u{1F454}️', '\u{1F456}️'],
      },
    },
    {
      id: 'sisters-wedding',
      title: "Sister's wedding",
      category: 'wedding',
      contextLabel: 'VINEYARD',
      startDate: atTime(addDays(now, 9), 16, 30),
      location: 'Napa Valley',
      locationDetail: 'Outdoor',
      source: 'manual',
      outfit: {
        name: 'Garden Hour',
        components: ['blush midi dress', 'block heels'],
        emoji: ['\u{1F457}️', '\u{1F97F}️'],
      },
    },
    {
      id: 'tokyo-trip',
      title: 'Tokyo trip',
      category: 'trip',
      contextLabel: 'TOKYO',
      startDate: atTime(tokyoStart, 9, 0),
      endDate: atTime(addDays(tokyoStart, 7), 18, 0),
      location: 'Tokyo, Japan',
      locationDetail: '7 days',
      source: 'manual',
      outfit: {
        name: 'Capsule Edit',
        components: ['layering pieces', 'walkable boots'],
        emoji: ['\u{1F9E5}️', '\u{1F462}️'],
      },
    },
    {
      id: 'brunch-mira',
      title: 'Brunch with Mira',
      category: 'brunch',
      contextLabel: 'CAFE PATIO',
      startDate: atTime(nextSunday(now), 11, 0),
      location: 'Tartine Manufactory',
      source: 'sample',
      outfit: {
        name: 'Soft Sunday',
        components: ['linen jumpsuit', 'sneakers'],
        emoji: ['\u{1F457}️', '\u{1F45F}️'],
      },
    },
  ];
}

/** For the empty-state demo (dev "Empty" toggle). */
export const seedEmptyEvents: Event[] = [];

/** Three preview events spread across the next 7 days, deliberately drawn
 *  from categories not already used in `getEvents()` so the mood-header
 *  gradients read as new. Returned by "See a sample week" in the Add sheet. */
export function getSampleWeek(): Event[] {
  const now = new Date();
  return [
    {
      id: 'sample-rooftop-tue',
      title: 'Rooftop drinks',
      category: 'date',
      contextLabel: 'SKYLINE BAR',
      startDate: atTime(addDays(now, 2), 19, 30),
      location: 'El Techo',
      locationDetail: 'Mission',
      source: 'sample',
      outfit: {
        name: 'Slow Burn',
        components: ['silk cami', 'high-waist denim'],
        emoji: ['\u{1F457}️', '\u{1F45F}️'],
      },
    },
    {
      id: 'sample-housewarming',
      title: 'Maya’s housewarming',
      category: 'party',
      contextLabel: 'LOFT',
      startDate: atTime(addDays(now, 5), 20, 0),
      location: 'Dogpatch',
      source: 'sample',
      outfit: {
        name: 'Pour One Out',
        components: ['leather skirt', 'cropped knit'],
        emoji: ['\u{1F457}️', '\u{1F45E}️'],
      },
    },
    {
      id: 'sample-firstdate',
      title: 'First date · Anchor',
      category: 'date',
      contextLabel: 'NORTH BEACH',
      startDate: atTime(addDays(now, 6), 18, 30),
      location: 'Tony’s Pizza',
      source: 'sample',
      outfit: {
        name: 'Less Is More',
        components: ['plain tee', 'wide-leg trouser'],
        emoji: ['\u{1F455}️', '\u{1F456}️'],
      },
    },
  ];
}

/** Three faked events appended after the OAuth flow completes. */
export function getOAuthCalendarEvents(): Event[] {
  const now = new Date();
  return [
    {
      id: 'oauth-standup',
      title: 'Team standup',
      category: 'work',
      contextLabel: 'CONFERENCE ROOM',
      startDate: atTime(addDays(now, 1), 10, 0),
      location: 'Zoom',
      source: 'calendar',
    },
    {
      id: 'oauth-yoga',
      title: 'Yoga',
      category: 'work',
      contextLabel: 'STUDIO',
      startDate: atTime(addDays(now, 3), 18, 0),
      location: 'Yoga Garden',
      source: 'calendar',
    },
    {
      id: 'oauth-coffee-sam',
      title: 'Coffee with Sam',
      category: 'brunch',
      contextLabel: 'CAFE',
      startDate: atTime(addDays(now, 4), 15, 0),
      location: 'Sightglass',
      source: 'calendar',
    },
  ];
}

// ─── Closet ──────────────────────────────────────────────────────────────

export type ClosetCategory =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories';

export type ClosetSeason = 'spring' | 'summer' | 'fall' | 'winter' | 'all-season';

export interface ClosetPiece {
  id: string;
  name: string;
  category: ClosetCategory;
  color: string;
  fabric: string;
  season: ClosetSeason[];
  isFavorite: boolean;
  /** How many past outfits this piece appears in. Drives the "ON YOU · N"
   *  badge on PieceCards when ≥ 2. */
  onYouCount?: number;
  /** Gradient stop 1 — top-left of the tile. */
  imageColor: string;
  /** Gradient stop 2 — bottom-right of the tile. */
  imageAccent: string;
  /** Single emoji glyph (with U+FE0F variation selector) standing in until
   *  the chunk-7 photoreal pipeline lands. */
  emoji: string;
}

/** Twelve seed pieces across all six categories. Recompute fresh each call
 *  so mutating state (favorite toggles) doesn't leak between mounts. */
export function getClosetPieces(): ClosetPiece[] {
  return [
    {
      id: 'p1',
      name: 'Cream silk blouse',
      category: 'tops',
      color: 'Cream',
      fabric: 'Silk',
      season: ['spring', 'summer', 'fall'],
      isFavorite: true,
      onYouCount: 4,
      imageColor: '#F5E6D3',
      imageAccent: '#E8C9A0',
      emoji: '\u{1F455}️',
    },
    {
      id: 'p2',
      name: 'Black silk button-up',
      category: 'tops',
      color: 'Black',
      fabric: 'Silk',
      season: ['fall', 'winter'],
      isFavorite: true,
      onYouCount: 6,
      imageColor: '#2A2A2A',
      imageAccent: '#1A1A1A',
      emoji: '\u{1F454}️',
    },
    {
      id: 'p3',
      name: 'Tailored wool trousers',
      category: 'bottoms',
      color: 'Charcoal',
      fabric: 'Wool',
      season: ['fall', 'winter'],
      isFavorite: false,
      onYouCount: 3,
      imageColor: '#3D3D3D',
      imageAccent: '#2A2A2A',
      emoji: '\u{1F456}️',
    },
    {
      id: 'p4',
      name: 'Wide-leg linen trousers',
      category: 'bottoms',
      color: 'Stone',
      fabric: 'Linen',
      season: ['spring', 'summer'],
      isFavorite: false,
      onYouCount: 2,
      imageColor: '#E8DCC8',
      imageAccent: '#D4C5A8',
      emoji: '\u{1F456}️',
    },
    {
      id: 'p5',
      name: 'Blush midi dress',
      category: 'dresses',
      color: 'Blush',
      fabric: 'Crepe',
      season: ['spring', 'summer'],
      isFavorite: true,
      onYouCount: 1,
      imageColor: '#EFD9D9',
      imageAccent: '#DFB5B5',
      emoji: '\u{1F457}️',
    },
    {
      id: 'p6',
      name: 'Wine slip dress',
      category: 'dresses',
      color: 'Wine',
      fabric: 'Silk',
      season: ['fall'],
      isFavorite: true,
      onYouCount: 2,
      imageColor: '#5C2A2E',
      imageAccent: '#3D1A1E',
      emoji: '\u{1F457}️',
    },
    {
      id: 'p7',
      name: 'Camel wool coat',
      category: 'outerwear',
      color: 'Camel',
      fabric: 'Wool',
      season: ['fall', 'winter'],
      isFavorite: true,
      onYouCount: 5,
      imageColor: '#C5A782',
      imageAccent: '#A88B65',
      emoji: '\u{1F9E5}️',
    },
    {
      id: 'p8',
      name: 'Black leather jacket',
      category: 'outerwear',
      color: 'Black',
      fabric: 'Leather',
      season: ['fall', 'spring'],
      isFavorite: false,
      onYouCount: 2,
      imageColor: '#1F1F1F',
      imageAccent: '#0F0F0F',
      emoji: '\u{1F9E5}️',
    },
    {
      id: 'p9',
      name: 'Strappy black heels',
      category: 'shoes',
      color: 'Black',
      fabric: 'Leather',
      season: ['all-season'],
      isFavorite: true,
      onYouCount: 4,
      imageColor: '#1A1A1A',
      imageAccent: '#0F0F0F',
      emoji: '\u{1F97F}️',
    },
    {
      id: 'p10',
      name: 'Block-heel sandals',
      category: 'shoes',
      color: 'Nude',
      fabric: 'Leather',
      season: ['spring', 'summer'],
      isFavorite: false,
      onYouCount: 1,
      imageColor: '#D4B896',
      imageAccent: '#B8966F',
      emoji: '\u{1F461}️',
    },
    {
      id: 'p11',
      name: 'Walkable ankle boots',
      category: 'shoes',
      color: 'Cognac',
      fabric: 'Leather',
      season: ['fall', 'winter'],
      isFavorite: false,
      onYouCount: 3,
      imageColor: '#8B5A3C',
      imageAccent: '#6B4128',
      emoji: '\u{1F462}️',
    },
    {
      id: 'p12',
      name: 'Gold hoop earrings',
      category: 'accessories',
      color: 'Gold',
      fabric: 'Metal',
      season: ['all-season'],
      isFavorite: false,
      onYouCount: 8,
      imageColor: '#E8C566',
      imageAccent: '#C9A33D',
      emoji: '\u{1F442}️',
    },
  ];
}

export const seedEmptyCloset: ClosetPiece[] = [];
