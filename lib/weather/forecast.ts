// Open-Meteo forecast, no key required.
//
// Two REST hops:
//   1. Geocoding: /v1/search?name=<city>       → latitude/longitude
//   2. Forecast:  /v1/forecast?...&daily=...    → daily rows keyed by date
//
// Cache: (cityKey, dateKey) → forecast, TTL 6h in AsyncStorage. Failures
// are silent — the composer skips the weather turn rather than blocking.

import AsyncStorage from '@react-native-async-storage/async-storage';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_KEY = 'grwai-weather-v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const MAX_FORECAST_DAYS = 14;

export type WeatherLabel =
  | 'sunny'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'fog'
  | 'clear';

export interface WeatherForecast {
  tempMaxF: number;
  tempMinF: number;
  precipitationChance: number; // 0..1
  label: WeatherLabel;
  /** True when the forecast is a seasonal normal (target date beyond 14
   *  days), NOT a real short-range forecast. */
  seasonal: boolean;
}

interface CacheEntry {
  ts: number;
  data: WeatherForecast;
}
type Cache = Record<string, CacheEntry>;

// ─── WMO weathercode → label ─────────────────────────────────────────
// https://open-meteo.com/en/docs — table of codes.
function labelFromCode(code: number): WeatherLabel {
  if (code === 0) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'cloudy';
}

// ─── Utilities ────────────────────────────────────────────────────────
function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function keyFor(city: string, date: Date): string {
  return `${city.trim().toLowerCase()}::${isoDate(date)}`;
}

function daysFromNow(d: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

// ─── Cache ────────────────────────────────────────────────────────────
async function readCache(): Promise<Cache> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') return parsed as Cache;
    return {};
  } catch {
    return {};
  }
}

async function writeCache(cache: Cache): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Best-effort cache; swallow write errors.
  }
}

// ─── API ──────────────────────────────────────────────────────────────

interface GeocodeResult {
  results?: { latitude?: number; longitude?: number; name?: string }[];
}

async function geocode(
  city: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as GeocodeResult;
    const hit = data.results?.[0];
    if (!hit || typeof hit.latitude !== 'number' || typeof hit.longitude !== 'number') {
      return null;
    }
    return { lat: hit.latitude, lon: hit.longitude };
  } catch {
    return null;
  }
}

interface DailyForecast {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    weathercode?: number[];
  };
}

async function fetchDaily(
  lat: number,
  lon: number,
  targetIso: string
): Promise<WeatherForecast | null> {
  try {
    const url =
      `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
      '&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&temperature_unit=celsius&timezone=auto&forecast_days=16';
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as DailyForecast;
    const times = data.daily?.time ?? [];
    const idx = times.indexOf(targetIso);
    if (idx < 0) return null;
    const maxC = data.daily?.temperature_2m_max?.[idx];
    const minC = data.daily?.temperature_2m_min?.[idx];
    const prob = data.daily?.precipitation_probability_max?.[idx];
    const code = data.daily?.weathercode?.[idx];
    if (
      typeof maxC !== 'number' ||
      typeof minC !== 'number' ||
      typeof code !== 'number'
    ) {
      return null;
    }
    return {
      tempMaxF: cToF(maxC),
      tempMinF: cToF(minC),
      precipitationChance:
        typeof prob === 'number' ? Math.max(0, Math.min(1, prob / 100)) : 0,
      label: labelFromCode(code),
      seasonal: false,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch (or read from cache) the forecast for a given city + date. Never
 * throws; returns null on any failure so the composer skips the weather
 * turn cleanly.
 *
 * For dates beyond the 14-day forecast window we bail rather than serve
 * a wrong number — Open-Meteo's ERA5 climate endpoint exists but adds a
 * whole second integration for a marginal signal.
 */
export async function getForecast(
  city: string,
  date: Date
): Promise<WeatherForecast | null> {
  if (!city.trim()) return null;
  const key = keyFor(city, date);
  const cache = await readCache();
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const delta = daysFromNow(date);
  if (delta < 0 || delta > MAX_FORECAST_DAYS) {
    // Out of forecast horizon. Rather than lie, return null so the
    // composer omits the weather line entirely.
    return null;
  }

  const geo = await geocode(city);
  if (!geo) return null;
  const forecast = await fetchDaily(geo.lat, geo.lon, isoDate(date));
  if (!forecast) return null;

  cache[key] = { ts: Date.now(), data: forecast };
  await writeCache(cache);
  return forecast;
}

/** Human-friendly one-liner Iris can drop into the composer. */
export function describeForecast(f: WeatherForecast): string {
  const midpoint = Math.round((f.tempMaxF + f.tempMinF) / 2);
  const cond =
    f.label === 'clear'
      ? 'clear'
      : f.label === 'sunny'
        ? 'sunny'
        : f.label === 'cloudy'
          ? 'cloudy'
          : f.label === 'rain'
            ? 'rain likely'
            : f.label === 'snow'
              ? 'snow likely'
              : f.label === 'thunderstorm'
                ? 'thunderstorms'
                : 'overcast';
  return `around ${midpoint}° and ${cond}`;
}
