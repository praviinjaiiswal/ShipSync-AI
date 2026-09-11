/**
 * Distributed Caching Layer — Upstash Redis (REST) with local fallback.
 * 
 * Configured for serverless/edge environments with consistent multi-instance cache.
 * Falls back gracefully to in-memory caching and fresh computation if Redis is unavailable.
 * 
 * Presets:
 *   Duty calculations:  5 minutes (CACHE_TTL.DUTY_CALC)
 *   HS code lookups:    24 hours
 *   AI suggestions:     7 days
 *   Static reference:   24 hours
 */

import { Redis } from "@upstash/redis";

type CacheEntry<T> = { value: T; expiresAt: number };

// In-process local store (L1 cache / offline fallback)
const localStore = new Map<string, CacheEntry<unknown>>();

/** TTL presets in milliseconds */
export const CACHE_TTL = {
  HS_CODE: 24 * 60 * 60 * 1000, // 24 hours
  AI_SUGGESTION: 7 * 24 * 60 * 60 * 1000, // 7 days
  STATIC_REF: 24 * 60 * 60 * 1000, // 24 hours
  DUTY_CALC: 5 * 60 * 1000, // 5 minutes
  DUTY_RATE: 24 * 60 * 60 * 1000, // 24 hours
  DEFAULT: 5 * 60 * 1000, // 5 minutes default
} as const;

let redisClient: Redis | null = null;
let redisInitialized = false;
let redisWarningLogged = false;

/**
 * Initialize or retrieve the singleton Upstash Redis client.
 */
export function getRedisClient(): Redis | null {
  if (redisInitialized) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  redisInitialized = true;

  if (!url || !token) {
    if (!redisWarningLogged) {
      console.warn(
        "[Cache] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not found in environment. Operating in memory-fallback mode."
      );
      redisWarningLogged = true;
    }
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    return redisClient;
  } catch (err: any) {
    console.warn(
      "[Cache] Failed to initialize Upstash Redis client. Falling back to in-memory:",
      err?.message || err
    );
    return null;
  }
}

/**
 * Build a tenant-namespaced cache key.
 */
export function tenantCacheKey(companyId: string, ...parts: string[]): string {
  return `company:${companyId}:${parts.join(":")}`;
}

export const createTenantKey = tenantCacheKey;

/**
 * Build a global cache key for reference/static data.
 */
export function globalCacheKey(...parts: string[]): string {
  return `global:${parts.join(":")}`;
}

/**
 * Synchronous REST query helper for Upstash Redis when running in Node.js runtime.
 */
function fetchRedisSync<T>(key: string): T | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execFileSync } = require("child_process");
    const curlBin = process.platform === "win32" ? "curl.exe" : "curl";
    const endpoint = `${url.replace(/\/$/, "")}/get/${encodeURIComponent(key)}`;

    const stdout = execFileSync(
      curlBin,
      ["-s", "--max-time", "1", "-H", `Authorization: Bearer ${token}`, endpoint],
      { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }
    );

    if (!stdout) return null;
    const res = JSON.parse(stdout);
    if (res.error) {
      console.warn(`[Cache] Upstash Redis returned error for key "${key}":`, res.error);
      return null;
    }

    if (res.result === null || res.result === undefined) {
      return null;
    }

    if (typeof res.result === "string") {
      try {
        return JSON.parse(res.result) as T;
      } catch {
        return res.result as unknown as T;
      }
    }

    return res.result as T;
  } catch (err: any) {
    if (!redisWarningLogged) {
      console.warn(
        `[Cache] Upstash Redis unreachable (${err?.message || "timeout"}). Skipping cache and computing fresh.`
      );
      redisWarningLogged = true;
    }
    return null;
  }
}

/**
 * Get a cached value by key.
 * Checks L1 in-memory cache first, then attempts Upstash Redis REST.
 * Returns null if not found or if Redis is unreachable (prompts fresh computation).
 */
export function getCached<T>(key: string): T | null {
  // 1. Fast local memory cache check
  const localEntry = localStore.get(key);
  if (localEntry) {
    if (Date.now() <= localEntry.expiresAt) {
      return localEntry.value as T;
    }
    localStore.delete(key);
  }

  // 2. Query Upstash Redis if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const remoteVal = fetchRedisSync<T>(key);
    if (remoteVal !== null && remoteVal !== undefined) {
      // Re-populate L1 with 5-minute TTL
      localStore.set(key, { value: remoteVal, expiresAt: Date.now() + CACHE_TTL.DUTY_CALC });
      return remoteVal;
    }
  }

  return null;
}

/**
 * Asynchronous variant for callers that prefer direct promise resolution.
 */
export async function getCachedAsync<T>(key: string): Promise<T | null> {
  const localEntry = localStore.get(key);
  if (localEntry) {
    if (Date.now() <= localEntry.expiresAt) {
      return localEntry.value as T;
    }
    localStore.delete(key);
  }

  const client = getRedisClient();
  if (!client) return null;

  try {
    const remoteVal = await client.get<T>(key);
    if (remoteVal !== null && remoteVal !== undefined) {
      localStore.set(key, { value: remoteVal, expiresAt: Date.now() + CACHE_TTL.DUTY_CALC });
      return remoteVal;
    }
  } catch (err: any) {
    console.warn(`[Cache] Redis async get failed for "${key}", computing fresh:`, err?.message || err);
  }

  return null;
}

/**
 * Set a cached value with a TTL (defaults to 5 minutes).
 * Writes immediately to L1 memory and dispatches asynchronously to Upstash Redis.
 */
export function setCached<T>(key: string, value: T, ttlMs: number = CACHE_TTL.DEFAULT): void {
  // 1. Store in L1 memory
  localStore.set(key, { value, expiresAt: Date.now() + ttlMs });

  // 2. Dispatched to Upstash Redis if configured
  const client = getRedisClient();
  if (client) {
    client.set(key, value, { px: ttlMs }).catch((err: any) => {
      console.warn(`[Cache] Upstash Redis set failed for "${key}":`, err?.message || err);
    });
  }
}

/**
 * Asynchronous variant of setCached.
 */
export async function setCachedAsync<T>(
  key: string,
  value: T,
  ttlMs: number = CACHE_TTL.DEFAULT
): Promise<void> {
  localStore.set(key, { value, expiresAt: Date.now() + ttlMs });

  const client = getRedisClient();
  if (client) {
    try {
      await client.set(key, value, { px: ttlMs });
    } catch (err: any) {
      console.warn(`[Cache] Upstash Redis setAsync failed for "${key}":`, err?.message || err);
    }
  }
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function invalidateByPrefix(prefix: string): number {
  let count = 0;
  localStore.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      localStore.delete(key);
      count++;
    }
  });

  const client = getRedisClient();
  if (client) {
    // Asynchronously scan and delete prefix keys in Redis
    (async () => {
      try {
        let cursor = 0;
        do {
          const [nextCursor, keys] = await client.scan(cursor, {
            match: `${prefix}*`,
            count: 100,
          });
          cursor = Number(nextCursor);
          if (keys && keys.length > 0) {
            await client.del(...keys);
          }
        } while (cursor !== 0);
      } catch (err: any) {
        console.warn(`[Cache] Upstash Redis invalidateByPrefix failed for "${prefix}":`, err?.message || err);
      }
    })();
  }

  return count;
}

/**
 * Invalidate a single cache key.
 */
export function invalidateKey(key: string): boolean {
  const deleted = localStore.delete(key);

  const client = getRedisClient();
  if (client) {
    client.del(key).catch((err: any) => {
      console.warn(`[Cache] Upstash Redis del failed for "${key}":`, err?.message || err);
    });
  }

  return deleted;
}

/**
 * Get cache stats (for monitoring/debugging).
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return { size: localStore.size, keys: Array.from(localStore.keys()) };
}

/**
 * Simple hash function for creating cache keys from long strings.
 */
export function hashString(str: string): string {
  let hash = 0;
  const normalized = str.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export const hashKey = hashString;