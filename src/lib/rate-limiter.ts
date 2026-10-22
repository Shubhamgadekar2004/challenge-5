/**
 * Token-bucket rate limiter for API endpoints.
 * Prevents abuse of AI endpoints (security + efficiency).
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

const MAX_TOKENS = 30;       // max requests per window
const REFILL_RATE = 0.5;     // tokens per second (30 per minute)

/**
 * Returns true if the request is allowed, false if rate-limited.
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + elapsed * REFILL_RATE);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    return false; // rate limited
  }

  bucket.tokens -= 1;
  return true;
}

/**
 * Cleanup stale buckets (call periodically).
 */
export function cleanupBuckets(): void {
  const now = Date.now();
  const STALE_MS = 5 * 60 * 1000; // 5 minutes
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > STALE_MS) {
      buckets.delete(key);
    }
  }
}
