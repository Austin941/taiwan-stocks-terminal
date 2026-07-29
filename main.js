// ============================================================
// MAIN — Pure Bootstrap (< 80 lines)
// 職責：只做初始化協調，所有邏輯都委派給專責模組
// ============================================================
import Papa from 'papaparse';
import { state }            from './src/state.js';
import { showSkeleton, hideSkeleton } from './src/skeleton.js';
import { processData }      from './src/dataProcessor.js';
import { initRouter }       from './src/routes.js';
import { initEvents }       from './src/events.js';
import { initGlobalSearch } from './src/search.js';
import { initSidebarResizer, initVerticalResizer } from './src/resizer.js';
import { initStockDrawer }  from './src/stockDrawer.js';
import { fetchHistoricalRanking } from './src/api.js';
import { REFRESH_INTERVAL_MS } from './src/constants.js';
import { showChart }        from './src/chart.js';

// ---- Global error boundary ----
window.onerror = (msg, _src, _line, _col, err) => console.error('[GlobalError]', msg, err);
window.addEventListener('unhandledrejection', e => console.error('[UnhandledRejection]', e.reason));

// ---- Project Pause Switch (專案暫停開關) ----
const IS_PAUSED = true;

// ============================================================
async function init() {
  showSkeleton(); // Instant perceived performance

  try {
    const el = document.getElementById('last-updated');
    if (IS_PAUSED) {
      if (el) el.textContent = '⏸️ 專案已暫停服務（已停止所有即時資料輪詢與 API 請求，零用量消耗中）';
      console.log('[PauseMode] Project is paused. No live network requests will be executed.');
      return;
    }

    // 1. Parallel: load stock CSV + historical ranking
    const [_, historicalData] = await Promise.all([
      _loadStockCSV(),
      fetchHistoricalRanking(),
    ]);
    state.historicalRanking = historicalData;

    // 2. First live data load
    await processData();

    // 3. Initialize all subsystems
    initRouter();       // Hash SPA routing (integrates SmartRouter)
    initEvents();       // UI events (tabs, sort, period, xaxis)
    initGlobalSearch(); // Ctrl+K search overlay
    initSidebarResizer();
    initVerticalResizer();
    initStockDrawer();  // 360 stock drawer with chip data

    // 4. Auto-select top sector to avoid blank chart on load
    const defaultSector = state.sectorRankingData[0]?.sector || '半導體業';
    showChart(defaultSector, 'sector');

    // 5. Live refresh every 15s (market-open, 1-day mode only)
    setInterval(() => {
      if (state.currentPeriodDays === 1 && state.isMarketOpenNow && !IS_PAUSED) {
        processData(true); // silent refresh
      }
    }, REFRESH_INTERVAL_MS);

  } catch (err) {
    console.error('[Init] Fatal error:', err);
    const el = document.getElementById('last-updated');
    if (el) el.textContent = '初始化失敗，請重新整理頁面。';
  } finally {
    hideSkeleton();
  }
}

// ---- Load stock CSV ----
async function _loadStockCSV() {
  const todayStr = new Date().toISOString().split('T')[0];
  return new Promise((resolve, reject) => {
    Papa.parse(`./stocks.csv?v=${todayStr}`, {
      download: true,
      header: true,
      complete: results => {
        state.allStocks = results.data.filter(d => d['股票代號'] && d['股票名稱']);
        resolve();
      },
      error: reject,
    });
  });
}

init();
