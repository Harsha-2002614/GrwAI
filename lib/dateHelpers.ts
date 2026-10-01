/**
 * Re-evaluate on every screen mount (no caching) so crossing midnight
 * in-app refreshes on next navigation.
 */

export function getDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

const WEEKDAY_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
] as const;

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Round hours drop the `:00`: 9:00 AM → "9 AM", 9:30 AM → "9:30 AM". Applied
 *  in both the picker's SELECTED preview and the form's WHEN row. */
function formatHourMinute(d: Date): string {
  const h24 = d.getHours();
  const m = d.getMinutes();
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 || 12;
  if (m === 0) return `${h} ${period}`;
  return `${h}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Human-readable form-row label for a chosen datetime. Body case, not caps.
 *    diff = 0     → "Today · 2:00 PM"
 *    diff = 1     → "Tomorrow · 7:00 PM"
 *    diff ≥ 2     → "Saturday · Mar 27 · 9:00 AM"
 *  Past dates render the full 3-piece form. */
export function formatWhenDisplay(d: Date): string {
  const now = new Date();
  const today0 = new Date(now);
  today0.setHours(0, 0, 0, 0);
  const start0 = new Date(d);
  start0.setHours(0, 0, 0, 0);
  const diff = Math.round((start0.getTime() - today0.getTime()) / 86400000);
  const time = formatHourMinute(d);
  if (diff === 0) return `Today · ${time}`;
  if (diff === 1) return `Tomorrow · ${time}`;
  return `${WEEKDAY_LONG[d.getDay()]} · ${MONTH_SHORT[d.getMonth()]} ${d.getDate()} · ${time}`;
}
