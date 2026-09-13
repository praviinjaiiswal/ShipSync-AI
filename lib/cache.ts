/**
 * Distributed Caching Layer — Upstash Redis (REST) with In-Memory Fallback.
 * 
 * Works seamlessly in Next.js Serverless & Edge environments.
 * If UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing or unreachable,
 * it falls back cleanly to an in-memory Map with zero crashes.
 */

import { Redis } from '@upstash/redis';

type CacheEntry<T> = { value: T; expiresAt: number };

// In-process local store (fallback when Redis is not configured or offline)
const localStore = new Map<string, CacheEntry<unknown>>();

/** TTL presets in milliseconds */
export const CACHE_TTL = {
  HS_CODE: 24 * 60 * 60 * 1000,        // 24 hours
  AI_SUGGESTION: 7 * 24 * 60 * 60 * 1000, // 7 days
  STATIC_REF: 24 * 60 * 60 * 1000,     // 24 hours
  DUTY_CALC: 5 * 60 * 1000,            // 5 minutes
  DUTY_RATE: 24 * 60 * 60 * 1000,      // 24 hours
  DEFAULT: 5 * 60 * 1000,              // 5 minutes default
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
        '[Cache] Upstash Redis not configured — falling back to in-memory cache, this is NOT safe for multi-instance production'
      );
      redisWarningLogged = true;
    }
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (err: unknown) {
    console.warn(
      '[Cache] Failed to initialize Upstash Redis client. Falling back to in-memory cache:',
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Build a tenant-namespaced cache key.
 */
export function tenantCacheKey(companyId: string, ...parts: string[]): string {
  return `company:${companyId}:${parts.join(':')}`;
}

export const createTenantKey = tenantCacheKey;

/**
 * Build a global cache key for reference/static data.
 */
export function globalCacheKey(...parts: string[]): string {
  return `global:${parts.join(':')}`;
}

/**
 * Get a cached value by key.
 * Resolves from Upstash Redis if configured; otherwise reads from local in-memory store.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();

  if (client) {
    try {
      const val = await client.get<T>(key);
      if (val !== null && val !== undefined) {
        return val;
      }
      return null;
    } catch (err: unknown) {
      console.warn(`[Cache] Redis get failed for key "${key}", falling back to memory:`, err instanceof Error ? err.message : err);
    }
  }

  // Fallback to local in-memory store
  const localEntry = localStore.get(key);
  if (!localEntry) return null;

  if (Date.now() > localEntry.expiresAt) {
    localStore.delete(key);
    return null;
  }

  return localEntry.value as T;
}

/**
 * Alias for backward compatibility
 */
export const getCachedAsync = getCached;

/**
 * Set a cached value with a TTL (in milliseconds).
 * Writes to Upstash Redis if configured; otherwise writes to local in-memory store.
 * Preserves the exact TTL without downgrading.
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlMs: number = CACHE_TTL.DEFAULT
): Promise<void> {
  const client = getRedisClient();

  if (client) {
    try {
      await client.set(key, value, { px: ttlMs });
      return;
    } catch (err: unknown) {
      console.warn(`[Cache] Redis set failed for key "${key}", writing to memory fallback:`, err instanceof Error ? err.message : err);
    }
  }

  // Write to local in-memory store with full, untouched TTL
  localStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Alias for backward compatibility
 */
export const setCachedAsync = setCached;

/**
 * Invalidate all cache entries matching a prefix using Redis SCAN + DEL.
 * In fallback mode, cleans all matching keys from local store.
 */
export async function invalidateByPrefix(prefix: string): Promise<number> {
  let count = 0;

  // Clear from local memory
  localStore.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      localStore.delete(key);
      count++;
    }
  });

  const client = getRedisClient();
  if (client) {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await client.scan(cursor, {
          match: `${prefix}*`,
          count: 100,
        });
        cursor = String(nextCursor);
        if (keys && keys.length > 0) {
          count += keys.length;
          await client.del(...keys);
        }
      } while (cursor !== '0' && cursor !== 'undefined' && cursor !== '');
    } catch (err: unknown) {
      console.warn(`[Cache] Redis invalidateByPrefix failed for "${prefix}":`, err instanceof Error ? err.message : err);
    }
  }

  return count;
}

/**
 * Invalidate a single cache key.
 */
export async function invalidateKey(key: string): Promise<boolean> {
  const localDeleted = localStore.delete(key);
  const client = getRedisClient();

  if (client) {
    try {
      const res = await client.del(key);
      return res > 0 || localDeleted;
    } catch (err: unknown) {
      console.warn(`[Cache] Redis invalidateKey failed for "${key}":`, err instanceof Error ? err.message : err);
    }
  }

  return localDeleted;
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
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export const hashKey = hashString;