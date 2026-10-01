// THE 7b SEAM.
//
// In 7a this calls Google Gemini directly using a dev-only key. In 7b the URL
// flips to your Cloudflare Worker and the `x-goog-api-key` header drops out
// (the Worker injects the key server-side). Body shape (buildGeminiBody) and
// response parsing stay identical — that's why those live in their own files.
//
// Never throws to the caller. Any failure → resolves to `null`.

import { buildGeminiBody } from './geminiBody';
import { devLog } from '@/lib/log';

// Free-tier image-capable Gemini model. Verify the exact slug against
// AI Studio when updating; the API rejects unknown model names with 404.
const SCENE_MODEL = 'gemini-2.5-flash-image';

const SCENE_API = {
  url: `https://generativelanguage.googleapis.com/v1beta/models/${SCENE_MODEL}:generateContent`,
  headers: (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'x-goog-api-key': process.env.EXPO_PUBLIC_GEMINI_KEY ?? '',
  }),
};

const TIMEOUT_MS = 15000;

interface GeminiPart {
  inlineData?: { data?: string };
  inline_data?: { data?: string };
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
}

/** Walk the response and return the first part with image bytes, if any. */
function extractImagePart(data: GeminiResponse | null): string | null {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    // Google's REST surface uses snake_case; some SDKs and the streaming
    // surface return camelCase. Check both so a future surface tweak doesn't
    // silently regress the integration.
    const b64 = part?.inlineData?.data ?? part?.inline_data?.data;
    if (typeof b64 === 'string' && b64.length > 0) return b64;
  }
  return null;
}

async function postOnce(
  body: unknown,
  signal: AbortSignal
): Promise<string | null> {
  try {
    const res = await fetch(SCENE_API.url, {
      method: 'POST',
      headers: SCENE_API.headers(),
      body: JSON.stringify(body),
      signal,
    });
    // TODO(remove after QA)
    devLog('[7a] provider HTTP status:', res.status);
    if (!res.ok) {
      // TODO(remove after QA)
      devLog('[7a] provider non-OK response — returning null');
      return null;
    }
    const data = (await res.json()) as GeminiResponse;
    const image = extractImagePart(data);
    // TODO(remove after QA)
    devLog(
      '[7a] provider image part found:',
      image ? `yes (${image.length} chars)` : 'no'
    );
    return image;
  } catch (err) {
    // TODO(remove after QA)
    devLog('[7a] provider fetch threw:', err);
    return null;
  }
}

/**
 * Request a generated scene image as a base64 string. Returns null on any
 * failure (timeout, network, non-200, malformed payload, no image part).
 *
 * Retries once with explicit `responseModalities: ['TEXT', 'IMAGE']` because
 * some Gemini surfaces default to TEXT-only output and silently drop the
 * image part on the first call.
 */
export async function requestSceneImage(
  prompt: string,
  photoBase64: string
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const baseBody = buildGeminiBody(prompt, photoBase64);
    const first = await postOnce(baseBody, controller.signal);
    if (first) return first;

    const retryBody = {
      ...baseBody,
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    };
    const second = await postOnce(retryBody, controller.signal);
    return second ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
