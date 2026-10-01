// Maps YouCam / Perfect Corp error codes to Iris-voiced retake messages.
//
// When the provider surfaces one of these codes, the try-on UI shows a
// warm Iris card with the mapped message instead of silently falling
// back — the fix is in the user's hands, and the copy is written to
// nudge them toward it without shaming the shot.

export type YouCamErrorCode =
  | 'error_src_face_too_small'
  | 'error_src_face_out_of_bound'
  | 'error_lighting_dark'
  | 'error_below_min_image_size'
  // Fallback — any code we haven't hand-mapped resolves here.
  | 'default';

/**
 * Human-friendly Iris message per code. Keep every message actionable
 * ("do X"), never blaming ("your photo is bad").
 */
export const IRIS_ERROR_MESSAGES: Record<YouCamErrorCode, string> = {
  error_src_face_too_small:
    'Come closer — your face should fill more of the frame.',
  error_src_face_out_of_bound:
    'Center yourself in the frame and try again.',
  error_lighting_dark:
    'Too dark for me to see you properly. Find brighter light?',
  error_below_min_image_size:
    "This photo's a little small. Try the original size.",
  default:
    "Something in that photo didn't work for me. A clear, front-lit shot fixes it.",
};

/**
 * Narrow arbitrary strings to a known code (or 'default'). Called from
 * the provider on any failure body so downstream UI can index the map
 * without a second sanitizer.
 */
export function coerceErrorCode(raw: string | undefined | null): YouCamErrorCode {
  if (!raw) return 'default';
  const key = raw as YouCamErrorCode;
  return key in IRIS_ERROR_MESSAGES ? key : 'default';
}

export function messageForCode(code: YouCamErrorCode): string {
  return IRIS_ERROR_MESSAGES[code];
}
