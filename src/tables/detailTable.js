// ============================================================
// DETAIL TABLE — 泡泡圖底部成分股明細表
// ============================================================
import { state } from '../state.js';
import { setActiveRow } from '../dom.js';
import { updateTableDelta, triggerFlashIfChanged } from '../ui.js';
import { renderAmountCell } from './tableHelpers.js';

async function _showTechChart(d) {
  const { showTechChart } = await import('../views.js');
  showTechChart(d);
}

export function renderDetailTable(data) {
  const tbody = document.getElementById('detailTableBody');
  if (!tbody) return;

  if (!data?.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" data-ignore="true">無資料</td></tr>';
    return;
  }

  const sorted = [...data].sort((a, b) => {
    const col = state.currentDetailSort.column;
    let vA, vB;
    if (col === 'price')        { vA = a.price || 0;          vB = b.price || 0; }
    else if (col === 'return')  { vA = a.dailyReturn || 0;   vB = b.dailyReturn || 0; }
    else if (col === 'volume')  { vA = a.volume || 0;         vB = b.volume || 0; }
    else if (col === 'amount')  { vA = a.amountDiff ?? a.amount ?? 0; vB = b.amountDiff ?? b.amount ?? 0; }
    else if (col === 'amount_abs') { vA = a.amount || 0;     vB = b.amount || 0; }
    else if (col === 'sector')  {
      vA = a.stock ? (a.stock['產業別'] || '') : '';
      vB = b.stock ? (b.stock['產業別'] || '') : '';
      return state.currentDetailSort.order === 'desc'
        ? vB.localeCompare(vA, 'zh-Hant')
        : vA.localeCompare(vB, 'zh-Hant');
    }
    else { vA = a.symbol || ''; vB = b.symbol || ''; }

    if (vA < vB) return state.currentDetailSort.order === 'desc' ? 1 : -1;
    if (vA > vB) return state.currentDetailSort.order === 'desc' ? -1 : 1;
    return 0;
  });

  const maxVal = Math.max(...sorted.map(d => Math.abs(d.amountDiff ?? d.amount))) || 1;

  updateTableDelta(tbody, sorted, item => item.symbol, (tr, item, idx) => {
    const oldAmt = tr.getAttribute('data-amount');
    if (item.isMissing) {
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${item.stock['股票名稱']} (${item.symbol})</td>
        <td>-</td>
        <td class="text-right text-slate-500">-</td>
        <td class="text-right text-slate-500">無資料</td>
        <td class="text-right text-slate-500">-</td>
        <td class="text-right text-slate-500">-</td>
        <td class="text-right text-slate-500">-</td>
      `;
    } else {
      const ret    = item.dailyReturn;
      const price  = item.price ? item.price.toFixed(2) : '-';
      let cls      = ret > 0 ? 'text-danger color-positive' : ret < 0 ? 'text-success color-negative' : '';
      if (ret >= 9.8)  cls += ' badge-limit-up';
      if (ret <= -9.8) cls += ' badge-limit-down';
      const sign    = ret > 0 ? '+' : '';
      const amtCell = renderAmountCell(item.amount, item.amountDiff, maxVal);
      const absAmt  = (item.amount / 1e8).toFixed(2);

      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><a href="#" class="stock-link">
          <strong style="color:#facc15">${item.stock['股票名稱']}</strong> <span style="color:#94a3b8;font-size:0.85em">${item.symbol}</span>
        </a></td>
        <td><span class="badge-sector" style="font-size:0.75em">${item.stock['產業別'] || '無'}</span></td>
        <td class="text-right font-bold" style="color:#f8fafc">${price}</td>
        <td class="text-right font-bold"><span class="${cls}">${sign}${ret.toFixed(2)}%</span></td>
        <td class="text-right">${Math.round(item.volume).toLocaleString()}</td>
        ${amtCell}
        <td class="text-right" style="color:#94a3b8">${absAmt}</td>
      `;

      tr.setAttribute('data-symbol', item.symbol);
      if (!tr.hasAttribute('data-amount')) {
        tr.addEventListener('click', e => {
          e.preventDefault();
          setActiveRow(tr);
          _showTechChart({ stock: item.stock, dailyReturn: item.dailyReturn, volume: item.volume, amount: item.amount });
        });
      }
    }
    tr.setAttribute('data-amount', item.amount || 0);
    triggerFlashIfChanged(tr, oldAmt, item.amount || 0);
  });
}
