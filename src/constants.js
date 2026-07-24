// ============================================================
// CONSTANTS — App-wide constants and configuration
// ============================================================

export const API = {
  PROXY:          '/api/proxy',
  CLOSING:        '/api/closing',
  CHIP:           '/api/chip',
  MAJOR_HOLDERS:  '/api/major_holders',
  MARGIN:         '/api/margin',
  KLINE:          '/api/kline',
  BANKS:          '/api/banks',
  BRANCHES:       '/api/branches',
};

export const CACHE_TTL = {
  MARKET:     30_000,   // 30s — live market data
  CHIP:       300_000,  // 5min — chip/holder data
  HISTORICAL: 3_600_000 // 1hr — historical ranking
};

export const THEME_BLACKLIST = new Set([
  '半導體', '電子零組件', '電子代工', '通信網路',
  '其他電子', '光電', '電腦及週邊設備'
]);

export const REFRESH_INTERVAL_MS = 15_000; // 15 seconds live refresh

export const CHUNK_SIZE     = 100;   // TWSE MIS query chunk size
export const MAX_CONCURRENCY = 10;   // max parallel fetch requests
