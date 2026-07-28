// ============================================================
// api/_lib/cacheControl.js — 智慧時間與休市開市快取控制
// 根據台北時間 (Asia/Taipei, UTC+8)、週末假日與休市狀態動態調整快取時間
// ============================================================

/**
 * 判斷指定台北時間是否為週末 (週六=6, 週日=0)
 * @param {Date} taipeiDate
 * @returns {boolean}
 */
export function isWeekend(taipeiDate) {
  const day = taipeiDate.getDay();
  return day === 0 || day === 6;
}

/**
 * 計算距離下一個指定時刻 (targetHour:targetMinute) 的秒數
 * 若當天為週末假日，會自動展延至下一個交易日 (週一) 的目標時間！
 * @param {number} targetHour - 0-23
 * @param {number} targetMinute - 0-59
 * @param {number} minCacheSeconds - 最小快取秒數
 * @returns {number} s-maxage 秒數
 */
export function getSecondsUntilTaipeiTime(targetHour, targetMinute, minCacheSeconds = 300) {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const taipeiMs = utcMs + (8 * 3600000);
  const taipeiDate = new Date(taipeiMs);

  const targetDate = new Date(taipeiMs);
  targetDate.setHours(targetHour, targetMinute, 0, 0);

  // 若今日已過目標時刻，設定為明日目標時刻
  if (taipeiDate >= targetDate) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  // 假日/週末自動跨到下一個工作日 (週一)
  while (isWeekend(targetDate)) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const diffSeconds = Math.floor((targetDate.getTime() - taipeiDate.getTime()) / 1000);
  return Math.max(diffSeconds, minCacheSeconds);
}

/**
 * 生成標頭，並支援當抓不到新資料時延長快取的安全機制
 * @param {number} targetHour 
 * @param {number} targetMinute 
 * @param {number} minCacheSeconds 
 * @returns {string}
 */
export function buildTimeBasedCacheHeader(targetHour, targetMinute, minCacheSeconds = 300) {
  const sMaxAge = getSecondsUntilTaipeiTime(targetHour, targetMinute, minCacheSeconds);
  const swr = Math.min(sMaxAge, 3600); // 最長 1 小時平滑降級
  return `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`;
}
