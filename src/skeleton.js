// ============================================================
// SKELETON — Loading skeleton screen (instant perceived performance)
// ============================================================

const SKELETON_ID = 'app-skeleton-overlay';

/** Show full-page loading skeleton */
export function showSkeleton() {
  if (document.getElementById(SKELETON_ID)) return;

  const overlay = document.createElement('div');
  overlay.id = SKELETON_ID;
  overlay.innerHTML = `
    <div class="skeleton-layout">
      <!-- Header skeleton -->
      <div class="skeleton-header">
        <div class="skel-box" style="width:280px;height:28px;border-radius:6px"></div>
        <div class="skel-box" style="width:360px;height:36px;border-radius:8px;flex:1;max-width:380px;margin:0 16px"></div>
        <div class="skel-box" style="width:120px;height:32px;border-radius:6px"></div>
      </div>

      <div class="skeleton-body">
        <!-- Left: Chart skeleton -->
        <div class="skeleton-main">
          <div class="skel-box" style="width:200px;height:24px;margin-bottom:16px;border-radius:4px"></div>
          <div class="skel-box" style="flex:1;border-radius:12px"></div>
          <div style="display:flex;gap:8px;margin-top:12px">
            ${[60, 80, 55, 75, 65, 70, 50].map(w =>
              `<div class="skel-box" style="width:${w}px;height:10px;border-radius:3px"></div>`
            ).join('')}
          </div>
        </div>

        <!-- Right: Sidebar skeleton -->
        <div class="skeleton-sidebar">
          <div style="display:flex;gap:6px;margin-bottom:12px">
            ${['產業','題材','集團','熱門'].map(t =>
              `<div class="skel-box" style="width:52px;height:30px;border-radius:6px"></div>`
            ).join('')}
          </div>
          ${Array(8).fill(0).map((_, i) => `
            <div class="skel-row">
              <div class="skel-box" style="width:20px;height:16px;border-radius:3px"></div>
              <div class="skel-box" style="flex:1;height:16px;border-radius:3px"></div>
              <div class="skel-box" style="width:50px;height:16px;border-radius:3px"></div>
              <div class="skel-box" style="width:60px;height:16px;border-radius:3px"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Mobile bottom tab bar skeleton -->
      <div class="skeleton-mobile-tabs">
        ${['🏭','🏷️','🏢','🔥','🔍'].map(icon =>
          `<div class="skel-tab">
            <div class="skel-box" style="width:24px;height:24px;border-radius:6px;margin:0 auto 4px"></div>
            <div class="skel-box" style="width:30px;height:8px;border-radius:3px;margin:0 auto"></div>
          </div>`
        ).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

/** Hide skeleton with fade-out */
export function hideSkeleton() {
  const el = document.getElementById(SKELETON_ID);
  if (!el) return;
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.3s ease';
  setTimeout(() => el.remove(), 320);
}
