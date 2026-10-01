// Iris system-prompt constraints derived from the user's "Always honor"
// preferences. This is the single hook by which the stylist reads user
// prefs — every Iris message assembled anywhere in the app should call
// `buildIrisContext()` and prepend the result to the system prompt.

import { HONOR_CONSTRAINTS } from '@/constants/honorConstraints';
import { usePrefsStore } from '@/lib/stores/prefsStore';
import { devLog } from '@/lib/log';

const HEADER =
  'ALWAYS HONOR (non-negotiable, never ask the user to re-confirm these):';

export function buildIrisContext(): string {
  const { honorPreferences } = usePrefsStore.getState();
  if (honorPreferences.length === 0) return '';

  const bullets = honorPreferences
    .map((id) => `- ${HONOR_CONSTRAINTS[id].irisConstraint}`)
    .join('\n');

  const context = `${HEADER}\n${bullets}`;
  if (__DEV__) {
    // Surfaces the composed context in Metro logs on every Iris entry so
    // the chip → prompt flow is verifiable end-to-end.
    devLog('[prefs] buildIrisContext →\n' + context);
  }
  return context;
}
