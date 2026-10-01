// Local (no-LLM) parser for the moment-composer.
//
// Given free text like "I have a wedding next Saturday", pull out the
// occasion + date. Anything we can't confidently identify is left as
// `undefined` so the composer's next Iris turn asks for it explicitly —
// we never fabricate the answer.
//
// Design notes:
//   • Occasion keywords are anchored to the shared occasion set
//     (constants/occasions.ts) so a rename there flows here.
//   • Date phrases are resolved against `now` at parse time. "next
//     Saturday" always means the SATURDAY OF NEXT WEEK, not this
//     Saturday even if today is a Tuesday — that matches how humans
//     read the phrase and avoids surprises.

import type { EventCategory } from '@/lib/mockData';

export interface ParsedTime {
  hours: number; // 0..23
  minutes: number; // 0..59
}

export interface ParsedMoment {
  raw: string;
  occasion?: EventCategory;
  /** Local midnight of the target day. Time is separate — combine with
   *  `time` (or the occasion default) before writing to the moment. */
  date?: Date;
  /** Optional time-of-day extracted from the raw text (24h). */
  time?: ParsedTime;
}

// ─── Occasion detection ──────────────────────────────────────────────

// Ordered longest → shortest so multi-word phrases match before their
// substrings (e.g., "work review" beats "work").
const OCCASION_KEYWORDS: { needle: RegExp; key: EventCategory }[] = [
  { needle: /\b(wedding|reception|ceremony)\b/i, key: 'wedding' },
  { needle: /\b(interview|review|standup|meeting|conference|presentation|work|office)\b/i, key: 'work' },
  { needle: /\b(brunch|breakfast)\b/i, key: 'brunch' },
  { needle: /\b(dinner|supper|lunch)\b/i, key: 'dinner' },
  { needle: /\b(party|birthday|celebration|housewarming)\b/i, key: 'party' },
  { needle: /\b(date|romantic)\b/i, key: 'date' },
  { needle: /\b(trip|vacation|holiday|travel|flight)\b/i, key: 'trip' },
];

function findOccasion(text: string): EventCategory | undefined {
  for (const { needle, key } of OCCASION_KEYWORDS) {
    if (needle.test(text)) return key;
  }
  return undefined;
}

// ─── Date detection ─────────────────────────────────────────────────

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const MONTH_INDEX: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Next occurrence of a weekday. If `next` is true, always jump into
 *  next week even when today matches the target day. */
function nextWeekday(from: Date, weekday: number, next: boolean): Date {
  const base = startOfDay(from);
  const delta = (weekday - base.getDay() + 7) % 7;
  const days = delta === 0 ? 7 : delta;
  const result = new Date(base);
  result.setDate(base.getDate() + (next ? days + (delta === 0 ? 0 : 7) - (delta === 0 ? 7 : 0) : days));
  // Simpler restatement: `next X` → +7 to whatever `X` alone would return.
  if (next) {
    result.setTime(base.getTime());
    result.setDate(base.getDate() + days + 7);
  }
  return result;
}

/** "this weekend" — the coming Saturday (or today if it IS Saturday). */
function thisWeekend(from: Date): Date {
  const base = startOfDay(from);
  const delta = (6 - base.getDay() + 7) % 7;
  const result = new Date(base);
  result.setDate(base.getDate() + delta);
  return result;
}

function findDate(text: string, now: Date): Date | undefined {
  const t = text.toLowerCase();

  if (/\btoday\b/.test(t)) return startOfDay(now);
  if (/\btomorrow\b/.test(t)) {
    const d = startOfDay(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (/\bthis weekend\b/.test(t)) return thisWeekend(now);

  // "in N days" / "in N weeks"
  const inRel = t.match(/\bin\s+(\d{1,2})\s+(day|days|week|weeks)\b/);
  if (inRel) {
    const n = parseInt(inRel[1], 10);
    const unit = inRel[2].startsWith('week') ? 7 : 1;
    const d = startOfDay(now);
    d.setDate(d.getDate() + n * unit);
    return d;
  }

  // "next <weekday>" / "this <weekday>" / bare "<weekday>"
  for (const [name, idx] of Object.entries(WEEKDAY_INDEX)) {
    const nextRe = new RegExp(`\\bnext\\s+${name}\\b`, 'i');
    if (nextRe.test(t)) return nextWeekday(now, idx, true);
    const thisRe = new RegExp(`\\bthis\\s+${name}\\b`, 'i');
    if (thisRe.test(t)) return nextWeekday(now, idx, false);
    const bareRe = new RegExp(`\\b${name}\\b`, 'i');
    if (bareRe.test(t)) return nextWeekday(now, idx, false);
  }

  // "March 27", "Mar 27", "March 27 2027"
  const monthDay = t.match(
    /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i
  );
  if (monthDay) {
    const month = MONTH_INDEX[monthDay[1].toLowerCase()];
    const day = parseInt(monthDay[2], 10);
    const year = monthDay[3]
      ? parseInt(monthDay[3], 10)
      : now.getFullYear();
    if (month !== undefined && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      // If year wasn't provided and the resulting date is in the past,
      // bump to next year — "March 3" in April clearly means next March.
      if (!monthDay[3] && d.getTime() < startOfDay(now).getTime()) {
        d.setFullYear(year + 1);
      }
      return d;
    }
  }

  return undefined;
}

// ─── Time detection ─────────────────────────────────────────────────

const TIME_BANDS: { needle: RegExp; hours: number; minutes: number }[] = [
  { needle: /\bnoon\b/i, hours: 12, minutes: 0 },
  { needle: /\bmidnight\b/i, hours: 0, minutes: 0 },
  { needle: /\bearly morning\b/i, hours: 7, minutes: 0 },
  { needle: /\bmorning\b/i, hours: 9, minutes: 0 },
  { needle: /\blate morning\b/i, hours: 11, minutes: 0 },
  { needle: /\bmidday\b/i, hours: 12, minutes: 30 },
  { needle: /\bafternoon\b/i, hours: 14, minutes: 0 },
  { needle: /\bearly evening\b/i, hours: 18, minutes: 0 },
  { needle: /\bevening\b/i, hours: 19, minutes: 0 },
  { needle: /\blate evening\b/i, hours: 21, minutes: 0 },
  { needle: /\bnight\b/i, hours: 20, minutes: 0 },
];

/**
 * Extract a time-of-day. Explicit clock times win over bands. Handles
 * "8pm", "8 pm", "8:30 pm", "20:00", "at 8", "at 19:30", "noon",
 * "evening", …. Returns undefined when nothing recognizable is present.
 */
function findTime(text: string): ParsedTime | undefined {
  // 24h "HH:MM" or "H:MM" with no am/pm anywhere nearby — accept only
  // when hours > 12 so we don't misread "8:30" (which needs an am/pm).
  const iso = text.match(/\b(?:at\s+)?(\d{1,2}):(\d{2})\b(?!\s*(?:am|pm))/i);
  if (iso) {
    const h = parseInt(iso[1], 10);
    const m = parseInt(iso[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59 && (h > 12 || h === 0)) {
      return { hours: h, minutes: m };
    }
  }

  // 12h "8pm", "8:30 pm", "at 8 pm", "at 8:30am"
  const twelve = text.match(
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
  );
  if (twelve) {
    let h = parseInt(twelve[1], 10);
    const m = twelve[2] ? parseInt(twelve[2], 10) : 0;
    const period = twelve[3].toLowerCase();
    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
      if (period === 'am') h = h === 12 ? 0 : h;
      else h = h === 12 ? 12 : h + 12;
      return { hours: h, minutes: m };
    }
  }

  // Named bands (evening, morning, noon, …) — checked longest → shortest.
  const bands = [...TIME_BANDS].sort(
    (a, b) => b.needle.source.length - a.needle.source.length
  );
  for (const b of bands) {
    if (b.needle.test(text)) return { hours: b.hours, minutes: b.minutes };
  }

  return undefined;
}

// ─── Occasion defaults ─────────────────────────────────────────────────
//
// When the user doesn't tell us a time, don't ask — pick a sane default
// based on the occasion so cards never display "12:00 AM". These are
// deliberately vague ("evening"-ish, "morning"-ish) rather than sharp
// times so we don't feel wrong when a user actually picks the exact hour.

const DEFAULT_TIME_BY_OCCASION: Record<EventCategory, ParsedTime> = {
  wedding: { hours: 17, minutes: 0 }, // 5 PM ceremonies are common
  dinner: { hours: 19, minutes: 0 }, // 7 PM
  party: { hours: 20, minutes: 0 }, // 8 PM
  date: { hours: 19, minutes: 30 }, // 7:30 PM
  brunch: { hours: 11, minutes: 0 }, // 11 AM
  work: { hours: 9, minutes: 0 }, // 9 AM standup / desk
  trip: { hours: 9, minutes: 0 }, // 9 AM (departure-ish)
};

export function defaultTimeForOccasion(o: EventCategory): ParsedTime {
  return DEFAULT_TIME_BY_OCCASION[o];
}

/** Combine a midnight `date` with an hours/minutes `time`, returning a
 *  fresh Date. Safe to call with any date instance. */
export function combineDateAndTime(date: Date, time: ParsedTime): Date {
  const d = new Date(date);
  d.setHours(time.hours, time.minutes, 0, 0);
  return d;
}

/** Parse a moment string. `now` is injectable for testing; defaults to
 *  `new Date()`. */
export function parseMoment(text: string, now: Date = new Date()): ParsedMoment {
  const raw = text.trim();
  return {
    raw,
    occasion: findOccasion(raw),
    date: findDate(raw, now),
    time: findTime(raw),
  };
}
