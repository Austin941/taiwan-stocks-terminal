// ============================================================
// STOCK DRAWER — 360 個股全景透視抽屜
// 功能：Tag 牆、一年法人籌碼趨勢、千張大戶持股比例
// ============================================================
import { state } from './state.js';
import { bus, Events } from './eventBus.js';
import { API, CACHE_TTL } from './constants.js';

// SWR Cache for drawer data (TTL: 5min per stock)
const _cache = new Map();

function _swr(key, fetcher, ttl = CACHE_TTL.CHIP) {
  const c = _cache.get(key);
  if (c && Date.now() - c.ts < ttl) return Promise.resolve(c.data);
  return fetcher().then(data => { _cache.set(key, { data, ts: Date.now() }); return data; })
                  .catch(() => c ? c.data : null);
}

// ---- DOM helpers ----
const $ = id => document.getElementById(id);

export function initStockDrawer() {
  const closeBtn = $('drawer-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  // Close on overlay click (outside drawer)
  document.addEventListener('click', e => {
    const drawer = $('stock-360-drawer');
    if (drawer && drawer.classList.contains('open') && !drawer.contains(e.target)) {
      // Only close if click is not on a bubble/table row trigger
      if (!e.target.closest('[data-open-drawer]')) closeDrawer();
    }
  });

  // Listen for open event from EventBus
  bus.on(Events.STOCK_DRAWER_OPEN, stockData => openDrawer(stockData));
  bus.on(Events.STOCK_DRAWER_CLOSE, closeDrawer);
}

export function openDrawer(stockData) {
  if (!stockData?.stock) return;
  const stock  = stockData.stock;
  const symbol = stock['股票代號'];
  const name   = stock['股票名稱'];

  // Update drawer title
  const titleEl = $('drawer-stock-title');
  if (titleEl) titleEl.textContent = `${name} (${symbol})`;

  // Render meta badges
  _renderMetaBadges(stock);

  // Render theme Tag wall
  _renderThemeTags(stock);

  // Render chip section with loading state first
  _renderChipLoading();

  // Open the drawer
  const drawer = $('stock-360-drawer');
  if (drawer) drawer.classList.add('open');

  // Async: fetch chip data (1 year, SWR cached)
  _fetchAndRenderChip(symbol);
}

export function closeDrawer() {
  const drawer = $('stock-360-drawer');
  if (drawer) drawer.classList.remove('open');
  bus.emit(Events.STOCK_DRAWER_CLOSE);
}

function _renderMetaBadges(stock) {
  const sectorTag = $('drawer-sector-tag');
  const groupTag  = $('drawer-group-tag');

  if (sectorTag) {
    sectorTag.textContent = stock['產業別'] || '未分類';
    sectorTag.onclick = async () => {
      const { showChart } = await import('./chart.js');
      showChart(stock['產業別'], 'sector');
      closeDrawer();
    };
  }

  if (groupTag) {
    const groupName = stock.group || stock['集團別'];
    if (groupName && groupName !== '獨立/未歸類') {
      groupTag.textContent = groupName;
      groupTag.style.display = '';
      groupTag.onclick = async () => {
        const { showChart } = await import('./chart.js');
        showChart(groupName, 'group');
        closeDrawer();
      };
    } else {
      groupTag.style.display = 'none';
    }
  }
}

function _renderThemeTags(stock) {
  const wall = $('drawer-theme-tags');
  if (!wall) return;
  wall.innerHTML = '';

  const themes = (stock['題材清單'] || '').split(/[,、]/).map(t => t.trim()).filter(Boolean);
  if (themes.length === 0) {
    wall.innerHTML = '<span style="color:#64748b;font-size:0.85em">無題材標籤</span>';
    return;
  }

  themes.forEach(theme => {
    const btn = document.createElement('button');
    btn.className = 'drawer-tag-btn';
    btn.textContent = theme;
    btn.addEventListener('click', async () => {
      const { showChart } = await import('./chart.js');
      showChart(theme, 'theme');
      closeDrawer();
    });
    wall.appendChild(btn);
  });
}

function _renderChipLoading() {
  const content = $('drawer-chip-content');
  if (!content) return;
  content.innerHTML = `
    <div class="chip-loading">
      <div class="spinner" style="width:24px;height:24px;border-width:2px;margin:0 auto"></div>
      <p style="text-align:center;color:#94a3b8;font-size:0.85rem;margin-top:8px">載入法人籌碼資料中...</p>
    </div>
  `;
}

async function _fetchAndRenderChip(symbol) {
  try {
    // Fetch chip data and major holders in parallel (both SWR cached)
    const [chipData, majorData] = await Promise.all([
      _swr(`chip:${symbol}`, () => fetch(`${API.CHIP}?stock=${symbol}&days=240`).then(r => r.ok ? r.json() : null)),
      _swr(`major:${symbol}`, () => fetch(`${API.MAJOR_HOLDERS}?stock=${symbol}`).then(r => r.ok ? r.json() : null)),
    ]);

    _renderChipPanel(symbol, chipData, majorData);
  } catch (err) {
    const content = $('drawer-chip-content');
    if (content) content.innerHTML = '<p style="color:#94a3b8;text-align:center;font-size:0.85rem">法人資料暫時無法取得</p>';
  }
}

function _renderChipPanel(symbol, chipData, majorData) {
  const content = $('drawer-chip-content');
  if (!content) return;

  // ---- Chip summary (latest day) ----
  const latest = Array.isArray(chipData?.data) ? chipData.data[chipData.data.length - 1] : null;
  const foreign   = latest?.foreign_net   ?? '—';
  const trust     = latest?.trust_net     ?? '—';
  const dealer    = latest?.dealer_net    ?? '—';
  const margin    = latest?.margin_ratio  ?? '—';

  // ---- Major holders ----
  const top1000  = majorData?.top1000_ratio  ?? '—';
  const top600   = majorData?.top600_ratio   ?? '—';
  const top400   = majorData?.top400_ratio   ?? '—';
  const top200   = majorData?.top200_ratio   ?? '—';

  // ---- Accumulate chip trend (last 20 days) ----
  const recentDays = Array.isArray(chipData?.data) ? chipData.data.slice(-20) : [];
  const foreignCum = recentDays.reduce((acc, d) => acc + (d.foreign_net || 0), 0);
  const trustCum   = recentDays.reduce((acc, d) => acc + (d.trust_net   || 0), 0);

  const fSign = foreignCum >= 0 ? '+' : '';
  const fCls  = foreignCum >= 0 ? 'color-positive' : 'color-negative';
  const tSign = trustCum >= 0 ? '+' : '';
  const tCls  = trustCum >= 0 ? 'color-positive' : 'color-negative';

  const fmt = v => (typeof v === 'number') ? v.toLocaleString() : v;

  content.innerHTML = `
    <div style="margin-bottom:12px">
      <div class="drawer-section-title" style="margin-bottom:8px">📅 今日法人買賣超 (張)</div>
      <div class="chip-grid">
        <div class="chip-card">
          <div class="chip-title">外資</div>
          <div class="chip-val ${Number(foreign) >= 0 ? 'color-positive' : 'color-negative'}">${Number(foreign) >= 0 ? '+' : ''}${fmt(foreign)}</div>
        </div>
        <div class="chip-card">
          <div class="chip-title">投信</div>
          <div class="chip-val ${Number(trust) >= 0 ? 'color-positive' : 'color-negative'}">${Number(trust) >= 0 ? '+' : ''}${fmt(trust)}</div>
        </div>
        <div class="chip-card">
          <div class="chip-title">自營商</div>
          <div class="chip-val ${Number(dealer) >= 0 ? 'color-positive' : 'color-negative'}">${Number(dealer) >= 0 ? '+' : ''}${fmt(dealer)}</div>
        </div>
        <div class="chip-card">
          <div class="chip-title">融資使用率</div>
          <div class="chip-val style-gold">${margin}%</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:12px">
      <div class="drawer-section-title" style="margin-bottom:8px">📈 近 20 日累積買賣超</div>
      <div class="chip-grid">
        <div class="chip-card">
          <div class="chip-title">外資 20日累積</div>
          <div class="chip-val ${fCls}">${fSign}${fmt(foreignCum)} 張</div>
        </div>
        <div class="chip-card">
          <div class="chip-title">投信 20日累積</div>
          <div class="chip-val ${tCls}">${tSign}${fmt(trustCum)} 張</div>
        </div>
      </div>
    </div>

    <div>
      <div class="drawer-section-title" style="margin-bottom:8px">🏦 千張大戶持股比例</div>
      <div class="chip-grid">
        <div class="chip-card">
          <div class="chip-title">1000張以上</div>
          <div class="chip-val style-gold">${top1000}%</div>
        </div>
        <div class="chip-card">
          <div class="chip-title">600-999張</div>
          <div class="chip-val" style="color:#38bdf8">${top600}%</div>
        </div>
        <div class="chip-card">
          <div class="chip-title">400-599張</div>
          <div class="chip-val" style="color:#38bdf8">${top400}%</div>
        </div>
        <div class="chip-card">
          <div class="chip-title">200-399張</div>
          <div class="chip-val" style="color:#94a3b8">${top200}%</div>
        </div>
      </div>
    </div>
  `;
}
