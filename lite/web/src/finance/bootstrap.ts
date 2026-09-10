// Registers every built section so Rail has something to show. Import this
// once, before the Shell mounts (App.svelte does it first thing) -- Rail
// reads getSections() at its own mount time, so registration has to happen
// before that, not lazily per-route.
import { RegisterSection, RegisterWidget } from "./registry";
import type { WidgetType } from "../store/widgets";

RegisterSection({ id: "overview", label: "Overview", group: "Position", routes: ["/"] });
RegisterSection({ id: "investments", label: "Investments", group: "Position", routes: ["/investments"] });
RegisterSection({ id: "networth", label: "Net worth", group: "Position", routes: ["/networth"] });
RegisterSection({ id: "markets", label: "Markets", group: "Markets", routes: ["/markets"] });
RegisterSection({ id: "inbox", label: "Inbox", group: "System", routes: ["/inbox"] });

const widget = (type: WidgetType, label: string, provider: string, shortcut?: string, symbolAware = false) =>
  RegisterWidget({ type, label, provider, shortcut, symbolAware, defaultSize: { w: 6, h: 8 } });

widget("chart", "Chart", "us", "⌥1", true);
widget("quote", "Quote", "us", "⌥2", true);
widget("watchlist", "Watchlist", "us");
widget("news", "News", "news", "⌥3", true);
widget("screener", "Screener", "us", "⌥4");
widget("heatmap", "Heatmap", "us", "⌥5");
widget("crypto", "Crypto", "crypto", "⌥6");
widget("options", "Options", "us", "⌥7", true);
widget("portfolio", "Portfolio", "portfolio", "⌥8");
widget("ai", "AI Assistant", "ai", "⌥9", true);
widget("macro", "Macro", "macro");
widget("mutualfund", "Mutual Fund", "mutualfunds");
widget("indiamarket", "India Market", "india");
