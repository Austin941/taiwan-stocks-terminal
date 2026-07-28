// ============================================================
// api/_lib/cacheControl.js — 智慧時間型快取控制 (Time-based Smart Cache-Control)
// 根據台北時間 (Asia/Taipei, UTC+8) 動態計算距離下一次資料公布時間還有幾秒
// 作為 Vercel Edge CDN 的 s-maxage，將 Serverless 流量消耗降至極致
// ============================================================

export function getSecondsUntilTaipeiTime(targetHour, targetMinute, minCacheSeconds = 300) {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const taipeiMs = utcMs + (8 * 3600000);
  const taipeiDate = new Date(taipeiMs);

  const targetDate = new Date(taipeiMs);
  targetDate.setHours(targetHour, targetMinute, 0, 0);

  if (taipeiDate >= targetDate) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const diffSeconds = Math.floor((targetDate.getTime() - taipeiDate.getTime()) / 1000);
  return Math.max(diffSeconds, minCacheSeconds);
}

export function buildTimeBasedCacheHeader(targetHour, targetMinute, minCacheSeconds = 300) {
  const sMaxAge = getSecondsUntilTaipeiTime(targetHour, targetMinute, minCacheSeconds);
  const swr = Math.min(sMaxAge, 600);
  return `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`;
}
