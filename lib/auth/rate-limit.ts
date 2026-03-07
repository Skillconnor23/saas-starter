/**
 * Simple in-memory rate limiting for auth flows (forgot-password, verify, resend).
 * Per-instance only; for multi-instance production, use Upstash Redis or similar.
 */
const COOLDOWN_MS = 60 * 1000; // 1 minute between requests per key

const lastRequest = new Map<string, number>();

function getKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier.toLowerCase().trim()}`;
}

export function checkRateLimit(
  prefix: 'forgot-password' | 'verify-email' | 'resend-verification',
  identifier: string
): boolean {
  const key = getKey(prefix, identifier);
  const last = lastRequest.get(key);
  const now = Date.now();
  if (last != null && now - last < COOLDOWN_MS) {
    return false;
  }
  lastRequest.set(key, now);
  // Prune old entries to avoid unbounded growth (keep last 1000)
  if (lastRequest.size > 1000) {
    const sorted = [...lastRequest.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(-500);
    lastRequest.clear();
    for (const [k, v] of sorted) lastRequest.set(k, v);
  }
  return true;
}
