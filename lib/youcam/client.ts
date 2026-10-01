// YouCam (Perfect Corp) REST client.
//
// TODO(production): EXPO_PUBLIC_ vars ship in the client bundle.
// Before store release, proxy YouCam calls server-side so the key never
// leaves the server.
//
// Every AI endpoint is async: create task → poll for task_status.
// Units are only consumed on `success` — but expired tasks that were never
// polled can still consume units, so we never abandon a running poll.

import { File } from 'expo-file-system';

import type { GarmentCategory } from './types';

const BASE_URL = 'https://yce-api-01.makeupar.com';
// Note the space after `Bearer` — YouCam is strict about the header form.
function authHeader(): string {
  const key = process.env.EXPO_PUBLIC_YOUCAM_KEY ?? '';
  return `Bearer ${key}`;
}

// ─── Concurrency guard ───────────────────────────────────────────────────
//
// No more than 2 tasks may be in flight at once. This throttles both the
// dev test screen and any future batch flows so we never blow the unit
// budget on parallel storms.

const MAX_CONCURRENT = 2;
let inFlight = 0;
const waiters: (() => void)[] = [];

async function acquireSlot(): Promise<void> {
  if (inFlight < MAX_CONCURRENT) {
    inFlight += 1;
    return;
  }
  await new Promise<void>((resolve) => {
    waiters.push(() => {
      inFlight += 1;
      resolve();
    });
  });
}

function releaseSlot(): void {
  inFlight = Math.max(0, inFlight - 1);
  const next = waiters.shift();
  if (next) next();
}

export async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await fn();
  } finally {
    releaseSlot();
  }
}

// ─── uploadFile ──────────────────────────────────────────────────────────
//
// Two-step: (1) register the file's metadata to get a `file_id` and a
// pre-signed PUT descriptor, (2) upload raw bytes to that pre-signed URL
// with the exact headers YouCam returned.
//
// CRITICAL: skipping the PUT step returns 404/500 on the task later —
// registration alone does not "count" as an upload.

interface RegisterFileRequest {
  files: {
    content_type: string;
    file_name: string;
    file_size: number;
  }[];
}

interface RegisterFileResponse {
  status: number;
  data?: {
    files?: {
      file_id: string;
      requests: {
        method: string;
        url: string;
        headers: Record<string, string>;
      }[];
    }[];
  };
  error?: unknown;
}

function inferContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  // jpg/jpeg/anything else — YouCam accepts jpeg for camera output.
  return 'image/jpeg';
}

function inferFileName(uri: string, contentType: string): string {
  const last = uri.split('/').pop() ?? 'upload';
  if (/\.[a-z0-9]+$/i.test(last)) return last;
  const ext =
    contentType === 'image/png'
      ? 'png'
      : contentType === 'image/webp'
        ? 'webp'
        : 'jpg';
  return `${last}.${ext}`;
}

export async function uploadFile(localUri: string): Promise<string> {
  const src = new File(localUri);
  if (!src.exists) {
    throw new Error(`[youcam] uploadFile: source not found (${localUri})`);
  }

  const size = src.size ?? 0;
  if (size === 0) {
    throw new Error('[youcam] uploadFile: source file is empty');
  }

  const contentType = inferContentType(localUri);
  const fileName = inferFileName(localUri, contentType);

  const registerBody: RegisterFileRequest = {
    files: [
      {
        content_type: contentType,
        file_name: fileName,
        file_size: size,
      },
    ],
  };

  const registerRes = await fetch(`${BASE_URL}/s2s/v2.0/file`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registerBody),
  });

  if (!registerRes.ok) {
    const text = await registerRes.text().catch(() => '');
    throw new Error(
      `[youcam] register file failed: ${registerRes.status} ${text}`
    );
  }

  const registerData = (await registerRes.json()) as RegisterFileResponse;
  const file = registerData?.data?.files?.[0];
  const putReq = file?.requests?.[0];
  if (!file?.file_id || !putReq?.url) {
    throw new Error(
      `[youcam] register file: missing file_id or PUT descriptor (${JSON.stringify(
        registerData
      )})`
    );
  }

  // Pre-signed PUT — must send raw bytes, with the exact headers YouCam
  // gave us (usually Content-Type + Content-Length).
  const bytes = await src.bytes();
  const putRes = await fetch(putReq.url, {
    method: putReq.method || 'PUT',
    headers: putReq.headers,
    body: bytes,
  });

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => '');
    throw new Error(
      `[youcam] PUT bytes failed: ${putRes.status} ${text}`
    );
  }

  return file.file_id;
}

// ─── createClothTask ─────────────────────────────────────────────────────
//
// The exact body-field names for the cloth endpoint are UNVERIFIED against
// the real API response — YouCam's docs across endpoints alternate between
// `src_file_id` / `source_file_id` / `person_id` and similar for garment.
// Kept in this single mapper so a rename after the first InvalidParameters
// response from prod is a one-line fix. Log the full 400 body on failure —
// their error surface names the bad field.
//
// Known:
//   • endpoint = POST /s2s/v2.0/task/cloth
//   • must reference two previously uploaded file_ids (person + garment)
//   • must include a garment category (upper/lower/full/outerwear)
//   • change_shoes: false (per product spec)
//
// Response: { data: { task_id: "…" } }

interface CreateClothTaskParams {
  personFileId: string;
  garmentFileId: string;
  garmentCategory: GarmentCategory;
}

function buildClothTaskBody(p: CreateClothTaskParams): Record<string, unknown> {
  // Best-guess field names; adjust after first live 400 response.
  return {
    src_file_id: p.personFileId,
    ref_file_id: p.garmentFileId,
    garment_category: p.garmentCategory,
    change_shoes: false,
  };
}

interface CreateTaskResponse {
  status: number;
  data?: { task_id?: string };
  error?: unknown;
}

export async function createClothTask(
  params: CreateClothTaskParams
): Promise<string> {
  const body = buildClothTaskBody(params);
  const res = await fetch(`${BASE_URL}/s2s/v2.0/task/cloth`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // On 400 the body names the offending field — surface it verbatim so
    // we can correct `buildClothTaskBody` in one line.
    const text = await res.text().catch(() => '');
    throw new Error(
      `[youcam] createClothTask ${res.status}: body=${JSON.stringify(
        body
      )} response=${text}`
    );
  }

  const data = (await res.json()) as CreateTaskResponse;
  const taskId = data?.data?.task_id;
  if (!taskId) {
    throw new Error(
      `[youcam] createClothTask: missing task_id (${JSON.stringify(data)})`
    );
  }
  return taskId;
}

// ─── pollTask ────────────────────────────────────────────────────────────
//
// Poll every `POLL_INTERVAL_MS` up to `MAX_POLL_MS`. Respect
// `polling_interval` when the server suggests one. Never bail on a
// "running" task before timeout — an abandoned task can still bill.

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_MS = 120_000;

// The response shape varies across YouCam endpoints and even between
// running/success/error snapshots of the SAME endpoint. We keep the
// polling fields typed (`task_status`, `polling_interval`) and treat
// the result branch as untyped — resolved by an ordered probe with a
// deep-walk fallback so no shape mutation quietly breaks us.
interface PollResponse {
  status?: number;
  data?: {
    task_id?: string;
    task_status?: 'processing' | 'running' | 'success' | 'error' | string;
    polling_interval?: number;
  } & Record<string, unknown>;
  error?: unknown;
}

export interface PollResult {
  status: 'success' | 'error';
  resultUrl?: string;
  /** YouCam error code lifted from the response, if any. */
  errorCode?: string;
}

// ─── URL resolver ────────────────────────────────────────────────────────
//
// Ordered probe first (fastest, most specific), deep walk second (safety
// net). Any hit via the deep walk logs its path so we can hard-code the
// correct one after we've observed a real success payload.

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

const IMAGE_EXT_RE = /\.(?:jpg|jpeg|png|webp)(?:$|\?)/i;

function looksLikeResultUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  if (!v.startsWith('https://')) return false;
  return (
    v.includes('s3') || v.includes('makeupar') || IMAGE_EXT_RE.test(v)
  );
}

function get(obj: unknown, key: string | number): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== 'object') return undefined;
  return (obj as Record<string | number, unknown>)[key];
}

/**
 * Deep-walk `root` looking for the first string value that looks like a
 * result URL. Records the JSON-pointer-style path (`results.0.url`) so
 * the caller can hard-code it after the first live success.
 */
function deepFindUrl(
  root: unknown,
  maxDepth = 6
): { url: string; path: string } | undefined {
  const stack: { node: unknown; path: string; depth: number }[] = [
    { node: root, path: '$', depth: 0 },
  ];
  while (stack.length > 0) {
    const { node, path, depth } = stack.shift() as {
      node: unknown;
      path: string;
      depth: number;
    };
    if (node === null || node === undefined) continue;
    if (looksLikeResultUrl(node)) {
      return { url: node, path };
    }
    if (depth >= maxDepth) continue;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i += 1) {
        stack.push({ node: node[i], path: `${path}.${i}`, depth: depth + 1 });
      }
    } else if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        stack.push({ node: v, path: `${path}.${k}`, depth: depth + 1 });
      }
    }
  }
  return undefined;
}

interface ResolvedUrl {
  url: string;
  path: string;
  viaDeepWalk: boolean;
}

/**
 * Resolve the result URL from a success payload. Tries the known shapes
 * in order, then falls back to a bounded deep walk. Returns `undefined`
 * only when neither strategy finds anything usable.
 */
function resolveResultUrl(data: unknown): ResolvedUrl | undefined {
  // Ordered probe — `results.url` first because that's the path we've
  // observed in a live success payload from the cloth endpoint. The
  // remaining paths stay so we survive shape drift across sibling
  // endpoints or future API tweaks.
  const orderedProbes: { path: string; get: () => unknown }[] = [
    { path: 'results.url', get: () => get(get(data, 'results'), 'url') },
    { path: 'results.0.url', get: () => get(get(get(data, 'results'), 0), 'url') },
    {
      path: 'results.0.data.0.url',
      get: () =>
        get(get(get(get(get(data, 'results'), 0), 'data'), 0), 'url'),
    },
    {
      path: 'results.output.0.url',
      get: () =>
        get(get(get(get(data, 'results'), 'output'), 0), 'url'),
    },
    { path: 'result.url', get: () => get(get(data, 'result'), 'url') },
    { path: 'url', get: () => get(data, 'url') },
  ];

  for (const probe of orderedProbes) {
    const v = probe.get();
    if (typeof v === 'string' && v.length > 0) {
      return { url: v, path: probe.path, viaDeepWalk: false };
    }
  }

  const deep = deepFindUrl(data);
  if (deep) return { url: deep.url, path: deep.path, viaDeepWalk: true };
  return undefined;
}

/**
 * Walk the response looking for a YouCam error code. Multiple locations
 * are possible depending on which layer failed — probe a few known
 * shapes, then fall back to a bounded deep walk for any string value
 * under a key named `code` or `error_code`.
 */
function extractErrorCode(payload: PollResponse): string | undefined {
  const d = payload.data;
  const perResult = get(get(d, 'results'), 0);
  const candidates: unknown[] = [
    get(get(perResult, 'error'), 'code'),
    get(perResult, 'code'),
    get(get(d, 'error'), 'code'),
    get(d, 'error_code'),
    get(d, 'code'),
    get(payload.error, 'code'),
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return undefined;
}

/** Deep-probe for a `dst_id` string. Used only for dev logging today —
 *  YouCam surfaces it on the final response and we may need it later
 *  for task chaining (e.g. background swap after a cloth try-on). */
function extractDstId(data: unknown, maxDepth = 6): string | undefined {
  const stack: { node: unknown; depth: number }[] = [
    { node: data, depth: 0 },
  ];
  while (stack.length > 0) {
    const { node, depth } = stack.shift() as { node: unknown; depth: number };
    if (node === null || node === undefined) continue;
    if (depth >= maxDepth) continue;
    if (Array.isArray(node)) {
      for (const v of node) stack.push({ node: v, depth: depth + 1 });
    } else if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (k === 'dst_id' && typeof v === 'string' && v.length > 0) return v;
        stack.push({ node: v, depth: depth + 1 });
      }
    }
  }
  return undefined;
}

export async function pollTask(taskId: string): Promise<PollResult> {
  const started = Date.now();
  let nextIntervalMs = POLL_INTERVAL_MS;
  let loggedRaw = false;

  while (Date.now() - started < MAX_POLL_MS) {
    await new Promise((r) => setTimeout(r, nextIntervalMs));

    const res = await fetch(`${BASE_URL}/s2s/v2.0/task/cloth/${taskId}`, {
      method: 'GET',
      headers: { Authorization: authHeader() },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // Do NOT bail here — a transient 5xx while a task is running should
      // not abandon it. Retry after the standard interval.
      if (__DEV__) {
        console.warn('[youcam] poll transient error', res.status, text);
      }
      nextIntervalMs = POLL_INTERVAL_MS;
      continue;
    }

    const raw = (await res.json()) as JsonValue;
    const data = raw as PollResponse;

    if (__DEV__ && !loggedRaw) {
      // First running/processing snapshot — useful for shape inspection.
      console.log('[youcam] poll raw response:', JSON.stringify(data));
      loggedRaw = true;
    }

    const suggested = data?.data?.polling_interval;
    if (typeof suggested === 'number' && suggested > 0) {
      // API returns seconds; clamp to a sane range.
      nextIntervalMs = Math.min(30_000, Math.max(1_000, suggested * 1_000));
    }

    const status = data?.data?.task_status;

    if (status === 'success' || status === 'error') {
      // Always dump the FINAL payload — the running snapshot doesn't tell
      // us the result shape, and we can't afford to miss it again.
      if (__DEV__) {
        console.log('[youcam] FINAL poll response:', JSON.stringify(data));
        const dstId = extractDstId(data);
        if (dstId) console.log('[youcam] dst_id from final:', dstId);
      }
    }

    if (status === 'success') {
      const resolved = resolveResultUrl(data.data);
      if (resolved) {
        if (__DEV__) {
          console.log(
            '[youcam] result URL resolved via',
            resolved.viaDeepWalk ? `DEEP WALK path=${resolved.path}` : `probe path=${resolved.path}`,
            '→',
            resolved.url
          );
        }
        return { status: 'success', resultUrl: resolved.url };
      }
      console.warn(
        '[youcam] success status but no URL found; full payload:',
        JSON.stringify(data)
      );
      return { status: 'success' };
    }

    if (status === 'error') {
      return { status: 'error', errorCode: extractErrorCode(data) };
    }
    // Any other status ('running', 'processing', undefined) → keep polling.
  }

  // Hit the wall clock — treat as error so the caller falls back.
  if (__DEV__) console.warn('[youcam] poll timeout after', MAX_POLL_MS, 'ms');
  return { status: 'error' };
}
