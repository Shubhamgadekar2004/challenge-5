import { beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, cleanupBuckets } from '@/lib/rate-limiter';

describe('rate limiter', () => {
  beforeEach(() => {
    cleanupBuckets();
  });

  it('allows the configured burst size before throttling', () => {
    const key = 'limit-test';

    for (let i = 0; i < 30; i += 1) {
      expect(checkRateLimit(key)).toBe(true);
    }

    expect(checkRateLimit(key)).toBe(false);
  });

  it('removes stale buckets when cleaned up', () => {
    checkRateLimit('stale-key');
    cleanupBuckets();
    expect(checkRateLimit('stale-key')).toBe(true);
  });
});
