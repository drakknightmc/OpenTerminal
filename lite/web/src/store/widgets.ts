import { writable } from "svelte/store";

export type WidgetType =
  | "chart"
  | "quote"
  | "watchlist"
  | "news"
  | "heatmap"
  | "screener"
  | "crypto"
  | "options"
  | "portfolio"
  | "ai"
  | "macro"
  | "mutualfunds"
  | "mutualfund"
  | "indiamarket";

export type PortfolioSection = "total" | "icici_direct" | "ibkr" | "groww_mf";

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  symbol?: string;
  linked?: boolean;
  section?: PortfolioSection;
}

interface WidgetStore {
  widgets: WidgetInstance[];
  activeSymbol: string;
}

const STORAGE_KEY = "openterminal-layout";
const DEFAULT_WIDGETS: WidgetInstance[] = [
  { id: "w-portfolio-total", type: "portfolio", x: 0, y: 0, w: 12, h: 5, linked: false, section: "total" },
  { id: "w-portfolio-icici", type: "portfolio", x: 0, y: 5, w: 6, h: 13, linked: false, section: "icici_direct" },
  { id: "w-portfolio-ibkr", type: "portfolio", x: 6, y: 5, w: 6, h: 10, linked: false, section: "ibkr" },
  { id: "w-portfolio-groww", type: "portfolio", x: 6, y: 15, w: 6, h: 7, linked: false, section: "groww_mf" },
];

/**
 * Safe localStorage operations with graceful degradation.
 * If quota is exceeded or storage is unavailable, state remains in-memory only.
 */
function safeSave(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Quota exceeded, private browsing, or storage unavailable
    // Silently fail; state remains in Svelte store (session-only)
    if (err instanceof Error && err.name === "QuotaExceededError") {
      console.warn("localStorage quota exceeded; layout changes will not persist");
    }
  }
}

function loadState(): WidgetStore {
  if (typeof window === "undefined") {
    return { widgets: DEFAULT_WIDGETS, activeSymbol: "AAPL" };
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { widgets: DEFAULT_WIDGETS, activeSymbol: "AAPL" };
    }
  }
  return { widgets: DEFAULT_WIDGETS, activeSymbol: "AAPL" };
}

function createWidgetStore() {
  const { subscribe, set, update } = writable<WidgetStore>(loadState());

  return {
    subscribe,
    addWidget: (type: WidgetType, section?: PortfolioSection) => {
      update((state) => {
        const id = `w-${type}-${Date.now()}`;
        // Stack new widgets below everything else — avoids spawning on top of
        // existing widgets, since this grid has no other collision handling.
        const nextY = state.widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
        const newWidget: WidgetInstance = {
          id,
          type,
          x: 0,
          y: nextY,
          w: 6,
          h: 8,
          linked: ["chart", "quote", "news", "options"].includes(type),
          ...(section ? { section } : {}),
        };
        const newState = { ...state, widgets: [...state.widgets, newWidget] };
        safeSave(STORAGE_KEY, newState);
        return newState;
      });
    },
    removeWidget: (id: string) => {
      update((state) => {
        const newState = { ...state, widgets: state.widgets.filter((w) => w.id !== id) };
        safeSave(STORAGE_KEY, newState);
        return newState;
      });
    },
    updateLayout: (widgets: WidgetInstance[]) => {
      update((state) => {
        const newState = { ...state, widgets };
        safeSave(STORAGE_KEY, newState);
        return newState;
      });
    },
    setActiveSymbol: (symbol: string) => {
      update((state) => {
        const newState = { ...state, activeSymbol: symbol };
        safeSave(STORAGE_KEY, newState);
        return newState;
      });
    },
    resetWorkspace: () => {
      const newState = { widgets: DEFAULT_WIDGETS, activeSymbol: "AAPL" };
      safeSave(STORAGE_KEY, newState);
      set(newState);
    },
  };
}

export const widgets = createWidgetStore();
