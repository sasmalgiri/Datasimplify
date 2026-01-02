type LimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

// Best-effort, in-memory limiter.
// Note: On serverless this is per-instance (still useful, but not perfect).
const buckets: Map<string, { lastRequestAt: number }> = new Map();

export function enforceMinInterval(options: {
  key: string;
  minIntervalMs: number;
  now?: number;
}): LimitResult {
  const now = options.now ?? Date.now();
  const prev = buckets.get(options.key);

  if (!prev) {
    buckets.set(options.key, { lastRequestAt: now });
    return { ok: true };
  }

  const elapsed = now - prev.lastRequestAt;
  if (elapsed < options.minIntervalMs) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((options.minIntervalMs - elapsed) / 1000)),
    };
  }

  prev.lastRequestAt = now;
  buckets.set(options.key, prev);
  return { ok: true };
}
