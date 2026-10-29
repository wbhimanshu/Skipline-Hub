type Bucket = { attempts: number[]; blockedUntil?: number };

const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    const fresh = bucket.attempts.filter((t) => now - t < 3_600_000);
    if (fresh.length === 0 && (!bucket.blockedUntil || bucket.blockedUntil < now)) {
      buckets.delete(key);
    } else {
      bucket.attempts = fresh;
    }
  }
}

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
  blockMs = windowMs,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  cleanup(now);
  const bucket = buckets.get(key) ?? { attempts: [] };
  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      ok: false,
      retryAfter: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }
  if (bucket.blockedUntil && bucket.blockedUntil <= now) {
    bucket.blockedUntil = undefined;
    bucket.attempts = [];
  }
  bucket.attempts = bucket.attempts.filter((t) => now - t < windowMs);
  if (bucket.attempts.length >= max) {
    bucket.blockedUntil = now + blockMs;
    buckets.set(key, bucket);
    return { ok: false, retryAfter: Math.ceil(blockMs / 1000) };
  }
  bucket.attempts.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfter: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
