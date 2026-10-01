// Pure request body builder for Google Gemini (Nano Banana) image generation.
//
// Intentionally host-agnostic: contains no key, no URL, no transport. The 7b
// Cloudflare Worker re-uses this exact function verbatim to assemble the
// outbound body before injecting its own server-side key and forwarding to
// Google. Keep it free of platform-specific dependencies.

export interface GeminiBody {
  contents: {
    parts: (
      | { text: string }
      | { inline_data: { mime_type: string; data: string } }
    )[];
  }[];
}

export function buildGeminiBody(prompt: string, photoBase64: string): GeminiBody {
  return {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: photoBase64 } },
        ],
      },
    ],
  };
}
