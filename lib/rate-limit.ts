/**
 * Server-side Rate Limiter — sliding-window, in-memory (per-instance).
 * 
 * For production across Vercel serverless instances, swap the store
 * implementation with Upstash Redis. The interface stays the same.
 * 
 * Presets:
 *   AI endpoints:     20 req/min per user
 *   Search endpoints: 60 req/min per user
 *   Upload endpoints:  5 req/min per user
 */

import { RateLimitError } from '@/lib/errors';

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs * 2;
  store.forEach((entry, key) => {
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
      store.delete(key);
    }
  });
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/** Preset configurations */
export const RATE_LIMITS = {
  ai: { maxRequests: 20, windowMs: 60_000 } as RateLimitConfig,
  search: { maxRequests: 60, windowMs: 60_000 } as RateLimitConfig,
  upload: { maxRequests: 5, windowMs: 60_000 } as RateLimitConfig,
  auth: { maxRequests: 10, windowMs: 60_000 } as RateLimitConfig,
} as const;

/**
 * Check and enforce rate limit for a given identifier (usually userId).
 * Throws RateLimitError (429) if the limit is breached.
 * 
 * Usage:
 *   checkRateLimit(`ai:${ctx.userId}`, RATE_LIMITS.ai);
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): void {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  cleanup(config.windowMs);

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    // Calculate retry-after in seconds
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);

    throw new RateLimitError(
      Math.max(1, retryAfterSec),
      `Rate limit exceeded. Max ${config.maxRequests} requests per ${config.windowMs / 1000}s.`
    );
  }

  // Record this request
  entry.timestamps.push(now);
}

export const RATE_LIMIT_PRESETS = {
  AI: RATE_LIMITS.ai,
  SEARCH: RATE_LIMITS.search,
  UPLOAD: RATE_LIMITS.upload,
  AUTH: RATE_LIMITS.auth,
};

export const rateLimiter = {
  check: async (_req: any, identifier: string, config: RateLimitConfig) => {
    checkRateLimit(identifier, config);
  },
};
