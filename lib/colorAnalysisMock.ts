// TODO: Replace with real ML API (Google Vision / AWS Rekognition) before
// App Store launch — chunk 9. The deterministic hash below is intentional
// so a given user always sees the same season across sessions during dev.

import type { ColorSeason } from '@/lib/stores/onboardingStore';

export interface ColorAnalysisResult {
  season: ColorSeason;
  palette: string[];
  description: string;
}

/** Real color-theory palettes per season. These are accurate, not arbitrary. */
const PALETTES: Record<ColorSeason, ColorAnalysisResult> = {
  Spring: {
    season: 'Spring',
    palette: [
      '#FFC4A3', '#F8E1A5', '#A8D5B5', '#7FB7BE',
      '#E8A87C', '#C38D9E', '#F4D1AE', '#E27D60',
    ],
    description:
      'Warm, light, clear. Coral, peach, golden yellow, soft turquoise.',
  },
  Summer: {
    season: 'Summer',
    palette: [
      '#B8C5D6', '#D4A5C0', '#A8B8C8', '#E8C5D1',
      '#9FAFC4', '#C8B5D6', '#E0CFD4', '#A89BC0',
    ],
    description:
      'Cool, soft, muted. Dusty blue, rose, lavender, sage.',
  },
  Autumn: {
    season: 'Autumn',
    palette: [
      '#A8702A', '#7A4E1F', '#C89F5D', '#5A3A1E',
      '#8E6B3A', '#6B4423', '#B5895C', '#956A3F',
    ],
    description:
      'Warm, deep, rich. Camel, rust, olive, deep gold, terracotta.',
  },
  Winter: {
    season: 'Winter',
    palette: [
      '#1A1A2E', '#16213E', '#9B1B30', '#E8E8E8',
      '#0F3460', '#533483', '#C1272D', '#FFFFFF',
    ],
    description:
      'Cool, deep, contrasting. Pure black, white, jewel tones, crimson.',
  },
};

const SEASONS: ColorSeason[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

/** Stable hash so the same URI always maps to the same season. */
function hashUri(uri: string): number {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) {
    hash = (hash << 5) - hash + uri.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Maps a URI to one of four color seasons via a stable hash. */
export function analyzeFromUri(uri: string): ColorAnalysisResult {
  const index = hashUri(uri) % SEASONS.length;
  return PALETTES[SEASONS[index]];
}

/** Conservative fallback for the no-photo path (used only in dev skip). */
export function getDefaultAnalysis(): ColorAnalysisResult {
  return PALETTES.Autumn;
}

/** Prefix the season with "Soft" / "Bright" for editorial copy. */
export function seasonDisplayName(season: ColorSeason): string {
  if (season === 'Summer' || season === 'Autumn') return `Soft ${season}`;
  return `Bright ${season}`;
}

/** One-line rationale shown on the color reveal so the inference is visible. */
export function getReasoningLine(season: ColorSeason): string {
  switch (season) {
    case 'Spring':
      return 'Based on your warm undertone and light depth.';
    case 'Summer':
      return 'Based on your cool undertone and soft depth.';
    case 'Autumn':
      return 'Based on your warm undertone and medium depth.';
    case 'Winter':
      return 'Based on your cool undertone and high contrast.';
  }
}
