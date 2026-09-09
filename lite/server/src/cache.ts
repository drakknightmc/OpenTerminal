/**
 * Two-Tier In-Memory Cache with Stale Fallback
 *
 * This cache layer improves resilience when external API providers are unavailable.
 * It keeps two copies of each successful fetch:
 *
 * 1. Live Cache (TTL-based expiry):
 *    - 30s for quotes, candles, crypto OHLCV (frequently updated)
 *    - 5m for search, screener, news (slower-changing)
 *    - 1h for FX rates, macro data, fundamentals (very stable)
 *    - Returns fresh-as-possible data
 *
 * 2. Stale Cache (never expires):
 *    - Fallback if provider fails
 *    - If live miss AND provider down → return stale data
 *    - Prevents "unavailable" errors due to API outages
 *    - Data is potentially old (hours), but better than error
 *
 * Real-world example (user loads portfolio):
 *   1. GET /api/portfolio/networth
 *   2. Server needs USD→INR FX rate
 *   3. Checks live cache: miss (expired or first time)
 *   4. Calls Frankfurter API: down
 *   5. Returns stale rate (82.5 from yesterday)
 *   6. Portfolio displays with slightly stale conversion
 *   7. Next request 30s later → API back up → fresh rate
 *
 * ponytail: Stale cache grows indefinitely (~50MB typical), add cleanup when size > 1000.
 */

type Entry = { value: unknown; expires: number };

// Live cache with TTL-based expiry
const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expires) {
    store.delete(key);
    return undefined;
  }
  return e.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

// Stale entries are kept around so provider outages can fall back to last-known data.
const staleStore = new Map<string, unknown>();

export function staleSet(key: string, value: unknown): void {
  staleStore.set(key, value);
}

export function staleGet<T>(key: string): T | undefined {
  return staleStore.get(key) as T | undefined;
}

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  try {
    const value = await fn();
    cacheSet(key, value, ttlMs);
    staleSet(key, value);
    return value;
  } catch (err) {
    const stale = staleGet<T>(key);
    if (stale !== undefined) return stale;
    throw err;
  }
}

export function cacheStore(key: string, value: unknown, ttlMs: number): void {
  cacheSet(key, value, ttlMs);
  staleSet(key, value);
}
