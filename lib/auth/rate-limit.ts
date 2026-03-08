/**
 * In-memory rate limiting for auth, invite, and upload flows.
 * Per-instance only; for multi-instance production, use Redis (e.g. Upstash).
 *
 * Usage:
 *   checkRateLimit('sign-in', identifier, { windowMs: 900_000, maxRequests: 10 })
 *   Returns true if allowed, false if rate limited.
 */

export type RateLimitPreset =
  | 'forgot-password'
  | 'resend-verification'
  | 'sign-in-ip'
  | 'sign-in-email'
  | 'sign-up-ip'
  | 'reset-password-ip'
  | 'join-class-invite'
  | 'create-class-invite'
  | 'upload'
  | 'accept-invite-ip';

const PRESETS: Record<
  RateLimitPreset,
  { windowMs: number; maxRequests: number }
> = {
  'forgot-password': { windowMs: 60_000, maxRequests: 3 }, // 3 per min per email
  'resend-verification': { windowMs: 60_000, maxRequests: 3 }, // 3 per min per email
  'sign-in-ip': { windowMs: 900_000, maxRequests: 30 }, // 30 per 15 min per IP
  'sign-in-email': { windowMs: 900_000, maxRequests: 10 }, // 10 per 15 min per email (brute force)
  'sign-up-ip': { windowMs: 900_000, maxRequests: 5 }, // 5 per 15 min per IP
  'reset-password-ip': { windowMs: 900_000, maxRequests: 5 }, // 5 per 15 min per IP
  'join-class-invite': { windowMs: 900_000, maxRequests: 20 }, // 20 per 15 min per user
  'create-class-invite': { windowMs: 900_000, maxRequests: 15 }, // 15 per 15 min per user
  upload: { windowMs: 900_000, maxRequests: 30 }, // 30 per 15 min per user
  'accept-invite-ip': { windowMs: 900_000, maxRequests: 30 }, // 30 per 15 min per IP
};

type WindowEntry = { count: number; windowStart: number };

const windows = new Map<string, WindowEntry>();

const MAX_ENTRIES = 10_000;

function getKey(prefix: string, identifier: string): string {
  return `${prefix}:${String(identifier).toLowerCase().trim()}`;
}

function prune() {
  if (windows.size <= MAX_ENTRIES) return;
  const now = Date.now();
  const toDelete: string[] = [];
  for (const [k, v] of windows) {
    if (now - v.windowStart > 900_000) toDelete.push(k); // expire 15+ min old
  }
  for (const k of toDelete) windows.delete(k);
  if (windows.size > MAX_ENTRIES) {
    const sorted = [...windows.entries()].sort(
      (a, b) => a[1].windowStart - b[1].windowStart
    );
    const toRemove = sorted.slice(0, Math.floor(MAX_ENTRIES / 2));
    for (const [k] of toRemove) windows.delete(k);
  }
}

/**
 * Check rate limit. Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(
  preset: RateLimitPreset,
  identifier: string
): boolean {
  const config = PRESETS[preset];
  const key = getKey(preset, identifier);
  const now = Date.now();

  let entry = windows.get(key);
  if (!entry) {
    windows.set(key, { count: 1, windowStart: now });
    prune();
    return true;
  }

  if (now - entry.windowStart >= config.windowMs) {
    entry = { count: 1, windowStart: now };
    windows.set(key, entry);
    prune();
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }
  entry.count++;
  prune();
  return true;
}

/**
 * Get client IP from request headers. Use in API routes or server components.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = headers.get('x-real-ip');
  if (real) return real.trim();
  const cf = headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  return 'unknown';
}
