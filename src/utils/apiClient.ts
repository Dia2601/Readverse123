/**
 * READVERSE Robust API Client
 * - In-flight request deduplication
 * - AbortController timeout protection
 * - Fast memory caching for idempotent calls
 * - Graceful fallback handling (no white screen / crash)
 */

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  cacheTtlMs?: number;
  dedupe?: boolean;
}

// In-flight promise registry for deduplication
const inFlightRequests = new Map<string, Promise<any>>();

// Fast memory cache for idempotent GET / POST responses
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const memoryCache = new Map<string, CacheEntry>();

/**
 * Universal safe API caller
 */
export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {},
  fallback: T
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const timeoutMs = options.timeoutMs ?? 11000; // 11s timeout
  const dedupe = options.dedupe ?? true;
  const cacheTtlMs = options.cacheTtlMs ?? 0;

  // Build a unique key for deduplication and caching
  const bodyString = typeof options.body === "string" ? options.body : "";
  const requestKey = `${method}:${url}:${bodyString}`;

  // 1. Check memory cache if TTL is specified
  if (cacheTtlMs > 0) {
    const cached = memoryCache.get(requestKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
  }

  // 2. Return identical in-flight promise if request is already pending
  if (dedupe && inFlightRequests.has(requestKey)) {
    try {
      return (await inFlightRequests.get(requestKey)!) as T;
    } catch {
      return fallback;
    }
  }

  // 3. Execute request with AbortController timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const fetchPromise = (async (): Promise<T> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        // Non-200 response -> return fallback gracefully
        console.warn(`[apiFetch] HTTP ${response.status} from ${url}`);
        return fallback;
      }

      const json = await response.json();

      // Store in memory cache if requested
      if (cacheTtlMs > 0 && json) {
        memoryCache.set(requestKey, {
          data: json,
          expiresAt: Date.now() + cacheTtlMs,
        });

        // Prune old cache entries if map grows large
        if (memoryCache.size > 200) {
          const now = Date.now();
          for (const [k, v] of memoryCache.entries()) {
            if (v.expiresAt <= now) memoryCache.delete(k);
          }
        }
      }

      return json as T;
    } catch (err: any) {
      clearTimeout(timer);
      if (err?.name === "AbortError") {
        console.warn(`[apiFetch] Request timed out after ${timeoutMs}ms: ${url}`);
      } else {
        console.warn(`[apiFetch] Network or parse error for ${url}:`, err?.message || err);
      }
      return fallback;
    } finally {
      inFlightRequests.delete(requestKey);
    }
  })();

  if (dedupe) {
    inFlightRequests.set(requestKey, fetchPromise);
  }

  return fetchPromise;
}

/**
 * Clear a cached request if data was modified
 */
export function invalidateApiCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(urlPrefix)) {
      memoryCache.delete(key);
    }
  }
}
