type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  retryAfterSec?: number;
};

/**
 * Simple in-memory rate limiter (per runtime instance).
 * Sufficient for MVP; use Redis/Upstash for multi-instance enforcement.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export function clientIpFromForwarded(forwarded: string | null): string {
  if (!forwarded) return "unknown";
  return forwarded.split(",")[0]?.trim() || "unknown";
}
