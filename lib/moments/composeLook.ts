// Rule-based look composer (no LLM).
//
// Order of operations matters here:
//
//   1. Always-honor filters run FIRST as HARD filters. Any piece that
//      violates a non-negotiable is removed from the candidate pool
//      before anything else considers it. Documented per rule below.
//   2. Every surviving piece gets a score against (occasion, dress code,
//      weather).
//   3. We pick the highest-scoring option per zone (`full_body`,
//      `upper_body`, `lower_body`, `outerwear` — the last conditional
//      on temperature).
//   4. For any zone that ends empty, we emit a `gap` with a
//      user-facing descriptor so the look-strip can say "1 to source".
//
// The output also carries a one-line "why" Iris shows on the look
// screen. Keep it under ~90 chars — it renders on a single line.

import type { HonorId } from '@/lib/stores/prefsStore';
import type {
  PieceCategory,
  WardrobePiece,
} from '@/lib/stores/wardrobeStore';
import type { EventCategory } from '@/lib/mockData';
import type { WeatherForecast } from '@/lib/weather/forecast';

export type DressCode = 'casual' | 'smart_casual' | 'semi_formal' | 'formal';

export type LookZone = 'full_body' | 'upper_body' | 'lower_body' | 'outerwear';

export interface ComposeInput {
  pieces: WardrobePiece[];
  occasion: EventCategory;
  dressCode: DressCode;
  honorPreferences: HonorId[];
  weather?: WeatherForecast | null;
  /** Piece IDs to skip in this composition — used by "Show another
   *  option" on moment-look to walk down the ranked candidate list. */
  skipPieceIds?: ReadonlySet<string>;
}

export interface ComposedSlot {
  zone: LookZone;
  piece?: WardrobePiece;
  /** Present when the zone couldn't be filled from the owned closet. */
  gap?: { descriptor: string };
}

export interface ComposedLook {
  slots: ComposedSlot[];
  why: string;
  ownedCount: number;
  toSourceCount: number;
  /** True when the modest filter left NO viable pieces for the primary
   *  zones. The look screen surfaces an honest Iris message rather than
   *  a stealth-relaxed composition. */
  blockedByCoverage?: boolean;
  /** True when no runner-up existed for any zone during this compose
   *  (moment-look uses this to disable "Show another option" and echo
   *  Iris's "this is the piece that fits best" note). */
  hasAlternatives: boolean;
  /** Convenience for the accessory line — precomputed off the same
   *  (occasion, dressCode, weather) so callers don't rebuild it. */
  accessoryLine: string;
}

// ─── Modest fail-closed filter (CRITICAL) ────────────────────────────

/**
 * Keyword deny-list applied to ANY piece when `hijab_modest` is on.
 * Runs across category + customOccasion + coverage. If a piece's
 * fabric of tags mentions any of these, it's excluded outright — no
 * exceptions, no scoring override. Fail-closed: unknown = excluded.
 */
const MODEST_DENY_RE =
  /\b(sleeveless|tank|cami|strap|mini|short|crop|backless|halter|slip|bodycon)\b/i;

/** A top qualifies for the modest path only when explicitly tagged
 *  `long_sleeve` or `modest_safe`. Untagged tops (unknown coverage) are
 *  EXCLUDED. */
function modestTopIsSafe(piece: WardrobePiece): boolean {
  if (piece.coverage === 'long_sleeve') return true;
  if (piece.coverage === 'modest_safe') return true;
  return false;
}

/** A dress/full-body piece requires the explicit `modest_safe` flag —
 *  we intentionally never auto-approve dresses under modest, because
 *  full-body repaints also mangle any headwear the render tries to
 *  preserve. See the render guard on moment-look. */
function modestFullBodyIsSafe(piece: WardrobePiece): boolean {
  return piece.coverage === 'modest_safe';
}

/**
 * Returns true when the piece SURVIVES all active honor filters.
 *
 * Each guard is documented with the "why" so a future edit knows what
 * the rule protects.
 */
function passesHonor(piece: WardrobePiece, honor: HonorId[]): boolean {
  const label = `${piece.category ?? ''} ${piece.customOccasion ?? ''} ${piece.coverage ?? ''}`.toLowerCase();

  for (const id of honor) {
    switch (id) {
      case 'hijab_modest': {
        // 1. Deny-list first — cheap, absolute.
        if (MODEST_DENY_RE.test(label)) return false;
        // 2. Zone-specific coverage rules. Full-body dresses require
        //    explicit modest_safe; tops must be long_sleeve/modest_safe.
        //    Anything else (untagged tops, other categories) falls
        //    through to broader filtering downstream.
        if (piece.category === 'top' && !modestTopIsSafe(piece)) return false;
        if (piece.category === 'dress' && !modestFullBodyIsSafe(piece)) {
          return false;
        }
        break;
      }
      case 'seated_fit':
        if (/\b(train|floor[- ]length|maxi trench|long trench)\b/.test(label)) {
          return false;
        }
        break;
      case 'one_handed':
        if (/\b(button[- ]front|back zip|back-zip|lace[- ]up|corset|hook and eye)\b/.test(label)) {
          return false;
        }
        break;
      case 'sensory_friendly':
        if (/\b(wool|sequin|lace|tulle|beaded)\b/.test(label)) return false;
        break;
      case 'saree':
        // Positive bias only — see scorePiece.
        break;
    }
  }
  return true;
}

// ─── Zone mapping ─────────────────────────────────────────────────────

function zoneForCategory(cat: PieceCategory | undefined): LookZone | null {
  switch (cat) {
    case 'top':
      return 'upper_body';
    case 'bottom':
      return 'lower_body';
    case 'dress':
      return 'full_body';
    case 'outerwear':
      return 'outerwear';
    case 'shoes':
    case 'accessory':
    default:
      return null;
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────

const DRESS_CODE_HINTS: Record<DressCode, RegExp> = {
  casual: /\b(casual|weekend|errand|athleisure|denim|jean)\b/,
  smart_casual: /\b(smart|refined|nice)\b/,
  semi_formal: /\b(semi[- ]formal|cocktail|dressy)\b/,
  formal: /\b(formal|black[- ]tie|gown|tuxedo|suit)\b/,
};

function scorePiece(piece: WardrobePiece, input: ComposeInput): number {
  let score = 0;
  const label = `${piece.category ?? ''} ${piece.customOccasion ?? ''}`.toLowerCase();

  if (piece.occasion?.includes(input.occasion)) score += 40;
  else if (piece.anyOccasion) score += 15;

  const dcRe = DRESS_CODE_HINTS[input.dressCode];
  if (dcRe.test(label)) score += 15;
  if (
    (input.dressCode === 'formal' || input.dressCode === 'semi_formal') &&
    piece.category === 'dress'
  ) {
    score += 10;
  }

  const w = input.weather;
  if (w) {
    const midF = (w.tempMaxF + w.tempMinF) / 2;
    if (midF < 55 && piece.category === 'outerwear') score += 20;
    if (midF > 78 && /\b(sleeveless|tank|linen|silk|breezy)\b/.test(label)) {
      score += 8;
    }
    if (w.precipitationChance > 0.4 && piece.category === 'outerwear') {
      score += 6;
    }
  }

  if (piece.isFavorite) score += 3;
  if (input.honorPreferences.includes('saree') && /\bsaree\b/.test(label)) {
    score += 12;
  }
  return score;
}

// ─── Composer ─────────────────────────────────────────────────────────

interface ZonePick {
  best?: WardrobePiece;
  /** Total number of candidates in this zone (after filtering). Used
   *  to detect whether runners-up exist for "Show another option". */
  candidateCount: number;
}

function pickZone(
  pool: WardrobePiece[],
  zone: LookZone,
  input: ComposeInput
): ZonePick {
  const inZone = pool.filter((p) => zoneForCategory(p.category) === zone);
  const skipped = input.skipPieceIds ?? new Set<string>();
  const eligible = inZone.filter((p) => !skipped.has(p.id));
  if (eligible.length === 0) {
    return { candidateCount: inZone.length };
  }
  const scored = eligible
    .map((p) => ({ p, s: scorePiece(p, input) }))
    .sort((a, b) => b.s - a.s);
  return { best: scored[0]?.p, candidateCount: inZone.length };
}

function gapDescriptor(zone: LookZone, input: ComposeInput): string {
  const dc = input.dressCode;
  const cold =
    input.weather && (input.weather.tempMaxF + input.weather.tempMinF) / 2 < 55;
  switch (zone) {
    case 'full_body':
      return dc === 'formal'
        ? 'A gown or long silhouette'
        : dc === 'semi_formal'
          ? 'A cocktail dress'
          : 'A dress';
    case 'upper_body':
      return dc === 'formal' || dc === 'semi_formal'
        ? 'A refined top (long sleeve)'
        : 'A clean top';
    case 'lower_body':
      return dc === 'formal' || dc === 'semi_formal'
        ? 'Tailored trousers or a skirt'
        : 'A well-cut bottom';
    case 'outerwear':
      return cold ? 'A warm coat' : 'A light jacket';
  }
}

// ─── Accessory line (rule-based; text only) ──────────────────────────

/**
 * ONE line of accessory guidance, keyed to (occasion, dressCode,
 * weather). Text-only — no accessory rendering, no data model. Keep
 * outputs short so they trail the "why" line cleanly.
 */
function buildAccessoryLine(input: ComposeInput): string {
  const cold =
    input.weather && (input.weather.tempMaxF + input.weather.tempMinF) / 2 < 55;
  const wet =
    input.weather && input.weather.precipitationChance > 0.4;

  const base = (() => {
    switch (input.occasion) {
      case 'wedding':
        return input.dressCode === 'formal'
          ? 'small earrings, a structured clutch, closed-toe heels'
          : 'small earrings, a structured clutch, closed-toe flats';
      case 'dinner':
        return input.dressCode === 'casual'
          ? 'a delicate chain, low boots'
          : 'a slim watch or delicate chain, low heels';
      case 'party':
        return 'a bold earring, an evening clutch';
      case 'date':
        return 'one statement piece, a small crossbody';
      case 'brunch':
        return 'sunglasses, a canvas tote';
      case 'work':
        return input.dressCode === 'formal' || input.dressCode === 'semi_formal'
          ? 'a slim watch, minimal jewelry, a leather tote'
          : 'a leather tote, minimal jewelry';
      case 'trip':
        return 'a compact crossbody, comfortable shoes';
    }
  })();

  const weatherTail = cold
    ? '; add a scarf'
    : wet
      ? '; carry a compact umbrella'
      : '';
  return `Finish it: ${base}${weatherTail}.`;
}

// ─── Why line ─────────────────────────────────────────────────────────

function dressCodeLabel(dc: DressCode): string {
  switch (dc) {
    case 'casual':
      return 'Casual';
    case 'smart_casual':
      return 'Smart casual';
    case 'semi_formal':
      return 'Semi-formal';
    case 'formal':
      return 'Formal';
  }
}

function honorNote(honor: HonorId[]): string | null {
  if (honor.includes('seated_fit')) return 'styled seated';
  if (honor.includes('one_handed')) return 'easy fastenings';
  if (honor.includes('hijab_modest')) return 'full coverage';
  return null;
}

function buildWhy(
  input: ComposeInput,
  slots: ComposedSlot[],
  blockedByCoverage: boolean
): string {
  if (blockedByCoverage) {
    return "Nothing in your closet meets your coverage settings for this — here's what to source.";
  }
  const bits: string[] = [];
  bits.push(dressCodeLabel(input.dressCode));
  if (input.weather) {
    const mid = Math.round(
      (input.weather.tempMaxF + input.weather.tempMinF) / 2
    );
    bits.push(`${mid}°`);
  }
  const note = honorNote(input.honorPreferences);
  if (note) bits.push(note);
  const filledZones = slots.filter((s) => s.piece).length;
  const tail =
    filledZones === 0
      ? 'a starter direction to shop from'
      : 'breathable layers, one considered detail';
  return `${bits.join(', ')} — ${tail}.`;
}

// ─── Compose ─────────────────────────────────────────────────────────

export function composeLook(input: ComposeInput): ComposedLook {
  const isModest = input.honorPreferences.includes('hijab_modest');

  // Step 1: honor filters remove disqualified pieces from EVERY zone.
  const pool = input.pieces.filter((p) => passesHonor(p, input.honorPreferences));

  // Modest path: NEVER select full_body dresses even if a modest_safe
  // one exists — the render guard needs to skip full_body calls in this
  // profile (full-body repaints mangle headwear). Chained upper + lower
  // is the only path.
  const dcLeansFull =
    input.dressCode === 'formal' || input.dressCode === 'semi_formal';
  const useFullBody = !isModest && dcLeansFull;

  const fullBodyPick = useFullBody ? pickZone(pool, 'full_body', input) : { candidateCount: 0 };
  const upperPick = pickZone(pool, 'upper_body', input);
  const lowerPick = pickZone(pool, 'lower_body', input);

  const slots: ComposedSlot[] = [];

  // Modest hard-block: if the profile is modest AND no upper survived
  // the coverage filter, the composition is BLOCKED. We surface the
  // gaps honestly rather than fall back to a full_body or an unsafe
  // top — the user needs a truthful message, not a stealth relaxation.
  const modestBlocked = isModest && !upperPick.best;

  if (modestBlocked) {
    // All gaps, primary zone first. No pieces get selected.
    slots.push({
      zone: 'upper_body',
      gap: { descriptor: gapDescriptor('upper_body', input) },
    });
    slots.push({
      zone: 'lower_body',
      gap: {
        descriptor: lowerPick.best
          ? // Even if we HAVE a bottom, we still want the strip to say
            // "to source" for the upper — the composition as a whole
            // isn't viable, so the bottom shouldn't count.
            gapDescriptor('lower_body', input)
          : gapDescriptor('lower_body', input),
      },
    });
  } else if (fullBodyPick.best && (useFullBody || (!upperPick.best && !lowerPick.best))) {
    slots.push({ zone: 'full_body', piece: fullBodyPick.best });
  } else if (upperPick.best || lowerPick.best) {
    if (upperPick.best) slots.push({ zone: 'upper_body', piece: upperPick.best });
    else
      slots.push({
        zone: 'upper_body',
        gap: { descriptor: gapDescriptor('upper_body', input) },
      });
    if (lowerPick.best) slots.push({ zone: 'lower_body', piece: lowerPick.best });
    else
      slots.push({
        zone: 'lower_body',
        gap: { descriptor: gapDescriptor('lower_body', input) },
      });
  } else {
    slots.push({
      zone: useFullBody ? 'full_body' : 'upper_body',
      gap: {
        descriptor: gapDescriptor(useFullBody ? 'full_body' : 'upper_body', input),
      },
    });
    if (!useFullBody) {
      slots.push({
        zone: 'lower_body',
        gap: { descriptor: gapDescriptor('lower_body', input) },
      });
    }
  }

  // Outerwear only when it's cold enough to matter.
  const midF = input.weather
    ? (input.weather.tempMaxF + input.weather.tempMinF) / 2
    : null;
  let outerPick: ZonePick = { candidateCount: 0 };
  if (midF !== null && midF < 60 && !modestBlocked) {
    outerPick = pickZone(pool, 'outerwear', input);
    if (outerPick.best) slots.push({ zone: 'outerwear', piece: outerPick.best });
    else
      slots.push({
        zone: 'outerwear',
        gap: { descriptor: gapDescriptor('outerwear', input) },
      });
  }

  // Alternatives exist when at least one selected zone has >1 candidate
  // available (after the current pick is subtracted).
  const skipCount = input.skipPieceIds?.size ?? 0;
  const totalCandidates =
    (useFullBody ? fullBodyPick.candidateCount : 0) +
    upperPick.candidateCount +
    lowerPick.candidateCount +
    outerPick.candidateCount;
  const totalSelected = slots.filter((s) => s.piece).length;
  const hasAlternatives = totalCandidates - skipCount - totalSelected > 0;

  const ownedCount = slots.filter((s) => s.piece).length;
  const toSourceCount = slots.filter((s) => s.gap).length;

  return {
    slots,
    why: buildWhy(input, slots, modestBlocked),
    ownedCount,
    toSourceCount,
    blockedByCoverage: modestBlocked || undefined,
    hasAlternatives,
    accessoryLine: buildAccessoryLine(input),
  };
}
