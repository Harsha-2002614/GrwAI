import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@grwai/recentLocations';
const MAX_ENTRIES = 8;

/**
 * Returns the cached recent-location list, most-recent-first. Returns [] when
 * nothing is stored or the payload is malformed (we swallow parse errors —
 * recents are a UX nicety, not a load-bearing data path).
 */
export async function getRecentLocations(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

/**
 * Prepends `location` to the recents list, deduping (case-insensitive) and
 * capping the list at 8 entries. Empty/whitespace-only strings are ignored.
 */
export async function addRecentLocation(location: string): Promise<void> {
  const trimmed = location.trim();
  if (!trimmed) return;
  try {
    const existing = await getRecentLocations();
    const lower = trimmed.toLowerCase();
    const deduped = existing.filter((x) => x.toLowerCase() !== lower);
    const next = [trimmed, ...deduped].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort cache; swallow write errors.
  }
}
