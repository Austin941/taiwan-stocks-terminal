// ============================================================
// TABLE HELPERS — Shared helpers for all table components
// ============================================================

/** Render a data-bar amount cell with optional diff vs absolute */
export function renderAmountCell(amount, amountDiff, maxVal) {
  const diffVal    = amountDiff !== undefined ? amountDiff : (amount || 0);
  const diffIn100M = diffVal / 1e8;
  const sign       = diffIn100M > 0 ? '+' : '';
  const cls        = diffIn100M > 0 ? 'color-positive' : diffIn100M < 0 ? 'color-negative' : '';
  const pct        = Math.min((Math.abs(diffVal) / (maxVal || 1)) * 100, 100);
  const barBg      = diffIn100M >= 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)';
  return `
    <td class="text-right data-bar-cell ${cls}" title="成交金額: ${(amount/1e8).toFixed(2)}億">
      <div class="data-bar" style="width:${pct}%;background:${barBg}"></div>
      <strong class="data-bar-text">${sign}${diffIn100M.toFixed(2)}</strong>
    </td>
  `;
}
