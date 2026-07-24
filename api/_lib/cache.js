// ============================================================
// _lib/cache.js — In-Memory LRU Cache
// 共享快取：所有 API handler 共用同一份記憶體快取
// ============================================================

class LRUCache {
  constructor(maxSize = 200) {
    this._map   = new Map();
    this._max   = maxSize;
  }

  get(key) {
    if (!this._map.has(key)) return null;
    const entry = this._map.get(key);
    if (Date.now() > entry.expiresAt) {
      this._map.delete(key);
      return null;
    }
    this._map.delete(key);
    this._map.set(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs) {
    if (this._map.has(key)) this._map.delete(key);
    else if (this._map.size >= this._max) {
      this._map.delete(this._map.keys().next().value);
    }
    this._map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  has(key) { return this.get(key) !== null; }
  size()   { return this._map.size; }
}

export const cache = new LRUCache(200);

export const TTL = {
  MARKET_LIVE:   10_000,    // 10s
  CLOSING:       3_600_000, // 1hr
  CHIP:          300_000,   // 5min
  MARGIN:        300_000,   // 5min
  T86:           600_000,   // 10min
  KLINE:         300_000,   // 5min
};

export async function withCache(key, fetcher, ttlMs, staleOk = true) {
  const cached = cache.get(key);
  if (cached !== null) return cached;

  if (_inflight.has(key)) {
    return _inflight.get(key);
  }

  const promise = fetcher()
    .then(data => {
      cache.set(key, data, ttlMs);
      _inflight.delete(key);
      return data;
    })
    .catch(err => {
      _inflight.delete(key);
      if (staleOk) {
        const stale = _staleMap.get(key);
        if (stale !== undefined) return stale;
      }
      throw err;
    });

  _inflight.set(key, promise);
  promise.then(data => _staleMap.set(key, data)).catch(() => {});

  return promise;
}

const _inflight = new Map();
const _staleMap = new Map();
