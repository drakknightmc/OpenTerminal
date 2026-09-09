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
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }
        return newState;
      });
    },
    removeWidget: (id: string) => {
      update((state) => {
        const newState = { ...state, widgets: state.widgets.filter((w) => w.id !== id) };
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }
        return newState;
      });
    },
    updateLayout: (widgets: WidgetInstance[]) => {
      update((state) => {
        const newState = { ...state, widgets };
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }
        return newState;
      });
    },
    setActiveSymbol: (symbol: string) => {
      update((state) => {
        const newState = { ...state, activeSymbol: symbol };
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        }
        return newState;
      });
    },
    resetWorkspace: () => {
      const newState = { widgets: DEFAULT_WIDGETS, activeSymbol: "AAPL" };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      }
      set(newState);
    },
  };
}

export const widgets = createWidgetStore();
