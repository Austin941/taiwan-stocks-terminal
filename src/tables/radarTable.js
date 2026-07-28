// ============================================================
// RADAR TABLE — 熱門個股即時排行表
// ============================================================
import { state } from '../state.js';
import { getTbody } from '../dom.js';
import { updateTableDelta, triggerFlashIfChanged } from '../ui.js';
import { renderAmountCell } from './tableHelpers.js';

async function _showChart(id, mode) {
  const { showChart } = await import('../chart.js');
  showChart(id, mode);
}
async function _showTechChart(d) {
  const { showTechChart } = await import('../views.js');
  showTechChart(d);
}

export function renderRadarTable() {
  const desc = document.getElementById('radar-description');
  if (desc) desc.textContent = '顯示全市場即時成交金額與資金變化前 200 檔個股';
  state.currentRadarData = [...state.allMarketData].filter(d => d.amount > 0);
  resortRadarTable();
}

export function resortRadarTable(targetDays = state.currentPeriodDays) {
  const sorted = [...state.currentRadarData].sort((a, b) => {
    const key = state.radarSortCol;
    let vA = 0, vB = 0;
    if (key === 'price')        { vA = a.price || 0;             vB = b.price || 0; }
    else if (key === 'change')  {
      vA = (a.price && a.prevClose) ? (a.price - a.prevClose) : 0;
      vB = (b.price && b.prevClose) ? (b.price - b.prevClose) : 0;
    }
    else if (key === 'amount')  { vA = a.amountDiff ?? a.amount; vB = b.amountDiff ?? b.amount; }
    else if (key === 'amount_abs') { vA = a.amount; vB = b.amount; }
    else if (key === 'volume') { vA = a.volume; vB = b.volume; }
    else { vA = a.dailyReturn; vB = b.dailyReturn; }
    if (!isFinite(vA)) return 1;
    if (!isFinite(vB)) return -1;
    return state.radarSortDesc ? vB - vA : vA - vB;
  });
  renderRadarFromData(sorted.slice(0, 200), targetDays);
}

export function renderRadarFromData(data, targetDays = state.currentPeriodDays) {
  const tbody = getTbody('view-radar', targetDays);
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">暫無交易資料</td></tr>';
    return;
  }
  const maxVal = Math.max(...data.map(d => Math.abs(d.amountDiff ?? d.amount))) || 1;

  updateTableDelta(tbody, data,
    d => d.stock ? d.stock['股票代號'] : d.symbol,
    (tr, d, index) => {
      const stock   = d.stock;
      if (!stock) return;
      const sector  = stock['產業別'] || '無';
      const ret     = d.dailyReturn;
      const price   = d.price ? d.price.toFixed(2) : '-';
      const changeVal = (d.price && d.prevClose) ? (d.price - d.prevClose) : 0;
      const changeStr = changeVal > 0 ? `+${changeVal.toFixed(2)}` : changeVal < 0 ? `${changeVal.toFixed(2)}` : '0.00';
      const cls     = ret > 0 ? 'color-positive' : ret < 0 ? 'color-negative' : '';
      const sign    = ret > 0 ? '+' : '';
      const retPct  = Math.min(Math.abs(ret) / 10 * 100, 100);
      const retBar  = ret > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)';
      const amtCell = renderAmountCell(d.amount, d.amountDiff, maxVal);

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><div class="stock-name-cell">
          <strong>${stock['股票名稱']}</strong>
          <span class="stock-symbol">${stock['股票代號']}</span>
        </div></td>
        <td><span class="badge-sector">${sector}</span></td>
        <td class="text-right font-bold ${cls}">${price}</td>
        <td class="text-right font-bold ${cls}">${changeStr}</td>
        <td class="text-right ${cls} data-bar-cell">
          <div class="data-bar" style="width:${retPct}%;background:${retBar}"></div>
          <strong class="data-bar-text">${sign}${ret.toFixed(2)}%</strong>
        </td>
        <td class="text-right">${Math.round(d.volume).toLocaleString()}</td>
        ${amtCell}
        <td class="text-right" style="color:#94a3b8">${(d.amount / 1e8).toFixed(2)}</td>
      `;



      const oldAmt = tr.getAttribute('data-amount');
      if (!tr.hasAttribute('data-amount')) {
        tr.addEventListener('click', () => {
          if (stock['產業別']) _showChart(stock['產業別'], 'sector');
          _showTechChart(d);
        });
      }
      tr.setAttribute('data-amount', d.amount);
      triggerFlashIfChanged(tr, oldAmt, d.amount);
    }
  );
}
