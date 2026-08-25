/**
 * High-performance in-memory TTL Cache with pattern invalidation.
 * Stores pre-compiled public menu responses to drastically reduce database reads
 * during peak restaurant hours.
 */
interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export class MemoryCache {
    private store = new Map<string, CacheEntry<any>>();
    private defaultTtlMs: number;
    private maxEntries: number;

    constructor(defaultTtlMs: number = 60_000, maxEntries: number = 1000) {
        this.defaultTtlMs = defaultTtlMs;
        this.maxEntries = maxEntries;

        // Periodic pruning of expired keys every 2 minutes
        const timer = setInterval(() => this.pruneExpired(), 120_000);
        if (timer.unref) {
            timer.unref(); // Do not prevent process from exiting
        }
    }

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }

        return entry.value as T;
    }

    set<T>(key: string, value: T, ttlMs?: number): void {
        // Enforce maximum size via eviction of oldest entry
        if (this.store.size >= this.maxEntries) {
            const firstKey = this.store.keys().next().value;
            if (firstKey) this.store.delete(firstKey);
        }

        const duration = ttlMs ?? this.defaultTtlMs;
        this.store.set(key, {
            value,
            expiresAt: Date.now() + duration,
        });
    }

    delete(key: string): void {
        this.store.delete(key);
    }

    /**
     * Invalidate all keys matching a prefix or substring (e.g. `menu:slug` or `restaurant:slug`)
     */
    invalidatePrefix(prefix: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }

    clear(): void {
        this.store.clear();
    }

    private pruneExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}

export const publicMenuCache = new MemoryCache(60_000, 1000);
