/**
 * Enhanced Caching Layer — tenant-namespaced, with TTL presets and invalidation.
 * 
 * Cache keys MUST be namespaced per companyId for tenant-specific data.
 * Reference/static data can use global keys.
 * 
 * TTL Presets:
 *   HS code lookups:    24 hours
 *   AI suggestions:     7 days (keyed by hash of product description)
 *   Static reference:   24 hours (countries, currencies, incoterms)
 *   Duty calculations:  5 minutes (for form tweaking sessions)
 */

type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

/** TTL presets in milliseconds */
export const CACHE_TTL = {
  HS_CODE: 24 * 60 * 60 * 1000,        // 24 hours
  AI_SUGGESTION: 7 * 24 * 60 * 60 * 1000, // 7 days
  STATIC_REF: 24 * 60 * 60 * 1000,     // 24 hours
  DUTY_CALC: 5 * 60 * 1000,            // 5 minutes
  DUTY_RATE: 24 * 60 * 60 * 1000,      // 24 hours
  DEFAULT: 60 * 60 * 1000,             // 1 hour
} as const;

/**
 * Build a tenant-namespaced cache key.
 * For tenant-specific data, always use this to prevent cross-tenant cache leakage.
 */
export function tenantCacheKey(companyId: string, ...parts: string[]): string {
  return `company:${companyId}:${parts.join(':')}`;
}

export const createTenantKey = tenantCacheKey;

/**
 * Build a global cache key for reference/static data (not tenant-specific).
 */
export function globalCacheKey(...parts: string[]): string {
  return `global:${parts.join(':')}`;
}

/**
 * Get a cached value by key. Returns null if not found or expired.
 */
export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

/**
 * Set a cached value with a TTL.
 */
export function setCached<T>(key: string, value: T, ttlMs = CACHE_TTL.DEFAULT): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalidate all cache entries matching a prefix.
 * Use for write-through cache busting (e.g., when admin updates a duty rate).
 */
export function invalidateByPrefix(prefix: string): number {
  let count = 0;
  store.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      store.delete(key);
      count++;
    }
  });
  return count;
}

/**
 * Invalidate a single cache key.
 */
export function invalidateKey(key: string): boolean {
  return store.delete(key);
}

/**
 * Get cache stats (for monitoring/debugging).
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return { size: store.size, keys: Array.from(store.keys()) };
}

/**
 * Simple hash function for creating cache keys from long strings (e.g., product descriptions).
 */
export function hashString(str: string): string {
  let hash = 0;
  const normalized = str.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export const hashKey = hashString;