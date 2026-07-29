// ============================================================
// DATA PROCESSOR — Aggregation core (extracted from main.js)
// Handles: snapshot merge, sector/theme/group aggregation
// ============================================================
import { state } from './state.js';
import { fetchSnapshot } from './api.js';
import { getConglomeratesByStockCode } from './stock_api.js';
import { THEME_BLACKLIST } from './constants.js';
import { bus, Events } from './eventBus.js';
import { renderSectorTable } from './tables/sectorTable.js';
import { renderThemeTable } from './tables/themeTable.js';
import { renderGroupTable } from './tables/groupTable.js';
import { renderRadarTable } from './tables/radarTable.js';

/**
 * Main data processing pipeline:
 * 1. Fetch live snapshot (with retry + concurrency)
 * 2. Merge with stock CSV list
 * 3. Aggregate sector / theme / group rankings
 * 4. Update state and emit DATA_UPDATED event
 */
export async function processData(isSilentRefresh = false) {
  try {
    const result = await fetchSnapshot(state.allStocks);
    if (!result) return;

    const marketCache = result.data || result;
    state.isMarketOpenNow   = result.isMarketOpen !== undefined ? result.isMarketOpen : true;
    state.liveSnapshotCache = marketCache;

    // Update timestamp display
    const status = state.isMarketOpenNow ? ' 🟢 盤中即時 (15s自動刷新)' : ' 🔴 已收盤';
    const el = document.getElementById('last-updated');
    if (el) el.textContent = `最後更新：${new Date().toLocaleTimeString('zh-TW', { hour12: false })}${status}`;

    // Emit market status
    bus.emit(Events.MARKET_STATUS, { isOpen: state.isMarketOpenNow });

    // Build 1-day historical reference lookup
    const hist1Map = {};
    if (state.historicalRanking?.[1]?.allStocks) {
      state.historicalRanking[1].allStocks.forEach(s => {
        hist1Map[s.stock['股票代號']] = s;
      });
    }

    // ---------- Build allMarketData ----------
    state.allMarketData = state.allStocks.map(stock => {
      const sym  = stock['股票代號'];
      const snap = marketCache[sym];
      let dailyReturn = 0, volume = 0, amount = 0, price = 0, prevClose = 0;
      let volumeDiff = 0, amountDiff = 0;
      if (snap) {
        price     = snap.price     || 0;
        prevClose = snap.prevClose || 0;
        volume    = snap.volume    || 0;
        if (prevClose > 0 && price > 0)
          dailyReturn = ((price - prevClose) / prevClose) * 100;
        amount = price * volume * 1000;

        const h1 = hist1Map[sym];
        if (h1 && h1.amount > 0) {
          amountDiff = amount - h1.amount;
          volumeDiff = volume - h1.volume;
        } else {
          amountDiff = amount * (dailyReturn / 100);
          volumeDiff = volume * (dailyReturn / 100);
        }
      }

      const groupName = getConglomeratesByStockCode(sym);
      stock.group = groupName;
      return { stock, dailyReturn, volume, amount, price, prevClose, symbol: sym, volumeDiff, amountDiff, group: groupName };
    });

    // ---------- Aggregate sector / theme / group ----------
    const sectorMap = {}, themeMap = {}, groupMap = {};

    state.allMarketData.forEach(d => {
      const sector = d.stock['產業別'];
      if (sector && sector !== '無' && sector !== '') {
        const s = sectorMap[sector] ||= { sector, totalVolume: 0, totalAmount: 0, totalVolumeDiff: 0, totalAmountDiff: 0, weightedReturnSum: 0 };
        s.totalVolume       += d.volume;
        s.totalAmount       += d.amount;
        s.totalVolumeDiff   += d.volumeDiff || 0;
        s.totalAmountDiff   += d.amountDiff || 0;
        s.weightedReturnSum += d.dailyReturn * d.amount;
      }

      const groupName = getConglomeratesByStockCode(d.stock['股票代號']);
      if (groupName && groupName !== '獨立/未歸類') {
        const g = groupMap[groupName] ||= { group: groupName, totalVolume: 0, totalAmount: 0, totalVolumeDiff: 0, totalAmountDiff: 0, weightedReturnSum: 0, count: 0 };
        g.totalVolume       += d.volume;
        g.totalAmount       += d.amount;
        g.totalVolumeDiff   += d.volumeDiff || 0;
        g.totalAmountDiff   += d.amountDiff || 0;
        g.weightedReturnSum += d.dailyReturn * d.amount;
        g.count             += 1;
      }

      const themes = d.stock['題材清單'];
      if (themes) {
        themes.split('、').map(t => t.trim())
          .filter(t => t && t !== sector && !THEME_BLACKLIST.has(t))
          .forEach(theme => {
            const t = themeMap[theme] ||= { theme, totalVolume: 0, totalAmount: 0, totalVolumeDiff: 0, totalAmountDiff: 0, weightedReturnSum: 0, count: 0 };
            t.totalVolume       += d.volume;
            t.totalAmount       += d.amount;
            t.totalVolumeDiff   += d.volumeDiff || 0;
            t.totalAmountDiff   += d.amountDiff || 0;
            t.weightedReturnSum += d.dailyReturn * d.amount;
            t.count             += 1;
          });
      }
    });

    // ---------- Write aggregated ranking into state ----------
    state.sectorRankingData = Object.values(sectorMap).map(s => ({
      sector: s.sector, totalVolume: s.totalVolume, totalAmount: s.totalAmount,
      totalVolumeDiff: s.totalVolumeDiff, totalAmountDiff: s.totalAmountDiff,
      avgReturn: s.totalAmount > 0 ? s.weightedReturnSum / s.totalAmount : 0,
    }));

    state.themeRankingData = Object.values(themeMap).map(t => ({
      theme: t.theme, totalVolume: t.totalVolume, totalAmount: t.totalAmount,
      totalVolumeDiff: t.totalVolumeDiff, totalAmountDiff: t.totalAmountDiff,
      avgReturn: t.totalAmount > 0 ? t.weightedReturnSum / t.totalAmount : 0,
      count: t.count,
    }));

    state.groupRankingData = Object.values(groupMap).map(g => ({
      group: g.group, totalVolume: g.totalVolume, totalAmount: g.totalAmount,
      totalVolumeDiff: g.totalVolumeDiff, totalAmountDiff: g.totalAmountDiff,
      avgReturn: g.totalAmount > 0 ? g.weightedReturnSum / g.totalAmount : 0,
      count: g.count,
    }));

    // ---------- Render tables (only for 1-day mode) ----------
    if (state.currentPeriodDays === 1) {
      renderSectorTable();
      renderThemeTable();
      renderGroupTable();
      renderRadarTable();
    }

    // ---------- Silently refresh chart if open ----------
    if (state.currentSector && state.currentPeriodDays === 1) {
      const { renderChart } = await import('./chart.js');
      const bubbleView = document.getElementById('bubble-chart-view');
      if (bubbleView && !bubbleView.classList.contains('hidden')) {
        renderChart(state.currentSector, state.currentChartMode, isSilentRefresh);
      }
    }

    // Emit update event for any listeners
    bus.emit(Events.DATA_UPDATED, { isSilentRefresh });

  } catch (err) {
    console.error('[DataProcessor] processData error:', err);
    const el = document.getElementById('last-updated');
    if (el) el.textContent = '最後更新：載入失敗，請稍後再試。';
  }
}
