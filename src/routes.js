// ============================================================
// ROUTES — SmartRouter 路由定義與 Handler 集中管理
// 路由：#/stock/:code, #/group/:name, #/theme/:name, #/sector/:name
// ============================================================
import { SmartRouter } from './smart_router.js';
import { bus, Events } from './eventBus.js';
import { state } from './state.js';

let router;

export function initRouter() {
  router = new SmartRouter({
    routes: {
      '/stock/:code': ({ code }) => {
        // 尋找對應個股資料並開啟 360 抽屜
        const stockData = state.allMarketData.find(d => d.symbol === code);
        if (stockData) {
          bus.emit(Events.STOCK_DRAWER_OPEN, stockData);
        } else {
          console.warn(`[Router] Stock ${code} not found in market data`);
        }
      },

      '/sector/:name': async ({ name }) => {
        const decoded = decodeURIComponent(name);
        const { showChart } = await import('./chart.js');
        showChart(decoded, 'sector');
        switchSidebarToTab('view-ranking');
      },

      '/theme/:name': async ({ name }) => {
        const decoded = decodeURIComponent(name);
        const { showChart } = await import('./chart.js');
        showChart(decoded, 'theme');
        switchSidebarToTab('view-theme');
      },

      '/group/:name': async ({ name }) => {
        const decoded = decodeURIComponent(name);
        const { showChart } = await import('./chart.js');
        showChart(decoded, 'group');
        switchSidebarToTab('view-group');
      },

      '/': () => {
        // Default: show market overview
        const first = state.sectorRankingData[0]?.sector || '半導體業';
        import('./chart.js').then(({ showChart }) => showChart(first, 'sector'));
      },

      // Fallback guard — prevents blank screen on unrecognized routes
      '*': () => {
        const first = state.sectorRankingData[0]?.sector || '半導體業';
        import('./chart.js').then(({ showChart }) => showChart(first, 'sector'));
      },
    }
  });

  // Handle initial URL on page load
  router.handleRoute();
}

/** Navigate to a route programmatically */
export function navigateTo(path, opts = {}) {
  if (router) router.navigate(path, opts);
  else window.location.hash = path;
}

/** Helper: Switch sidebar tab */
function switchSidebarToTab(viewId) {
  document.querySelectorAll('.sidebar-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === viewId);
  });
  document.querySelectorAll('.sidebar-view').forEach(v => {
    v.classList.toggle('hidden', v.id !== viewId);
    v.classList.toggle('active', v.id === viewId);
  });
}
