// ============================================================
// EVENT BUS — Decoupled pub/sub event system
// Replaces direct module-to-module calls to reduce coupling
// ============================================================

class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /** Subscribe to an event */
  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(handler);
    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /** Unsubscribe from an event */
  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }
  }

  /** Emit an event with optional data */
  emit(event, data) {
    const handlers = this._listeners.get(event) || [];
    handlers.forEach(h => {
      try { h(data); }
      catch (err) { console.error(`[EventBus] Error in handler for "${event}":`, err); }
    });
  }

  /** Subscribe once — auto-unsubscribes after first call */
  once(event, handler) {
    const off = this.on(event, data => { handler(data); off(); });
  }
}

// Singleton global event bus
export const bus = new EventBus();

// ---- Typed Event Names (prevents typo bugs) ----
export const Events = {
  DATA_UPDATED:       'data:updated',
  CHART_SHOW:         'chart:show',
  STOCK_DRAWER_OPEN:  'stock:drawer:open',
  STOCK_DRAWER_CLOSE: 'stock:drawer:close',
  PERIOD_CHANGED:     'period:changed',
  SORT_CHANGED:       'sort:changed',
  VIEW_CHANGED:       'view:changed',
  SEARCH_QUERY:       'search:query',
  MARKET_STATUS:      'market:status',
};
