import * as market from "../providers/us/index.js";
import { cached, errorResponse, json, methodNotAllowed, numberParam, required, TTL } from "./_utils.js";

const validRanges = new Set(["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"]);
const segment = (url: URL, index: number) => decodeURIComponent(url.pathname.split("/")[index] || "").trim();

export async function handleMarket(req: Request, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/market")) return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "GET") return methodNotAllowed();
  try {
    const path = url.pathname.replace(/\/$/, "");
    if (path === "/api/market/search") {
      const q = required(url, "q"); if (q instanceof Response) return q;
      const results = await cached(`market:search:${q}`, TTL.medium, () => market.searchSymbols(q));
      return json({ results });
    }
    if (path === "/api/market/screener") {
      const limit = numberParam(url, "limit", 1500); if (limit instanceof Response) return limit;
      if (limit < 1 || limit > 1500) return json({ error: "limit must be between 1 and 1500" }, 400);
      const rows = await cached(`market:screener:${limit}`, TTL.medium, () => market.getScreener({ limit }));
      return json({ rows });
    }
    const pathSymbol = segment(url, 4);
    if ((path === "/api/market/quote" || path.startsWith("/api/market/quote/"))) {
      const symbol = url.searchParams.get("symbol") || pathSymbol;
      if (!symbol) return json({ error: "symbol is required" }, 400);
      return json(await cached(`market:quote:${symbol}`, TTL.short, () => market.getQuote(symbol)));
    }
    if ((path === "/api/market/options" || path.startsWith("/api/market/options/"))) {
      const symbol = url.searchParams.get("symbol") || pathSymbol;
      if (!symbol) return json({ error: "symbol is required" }, 400);
      return json(await cached(`market:options:${symbol}`, TTL.medium, () => market.getOptionsChain(symbol)));
    }
    if (path === "/api/market/candles") {
      const s = required(url, "symbol"); if (s instanceof Response) return s;
      const timeframe = (url.searchParams.get("timeframe") || "1Y").toUpperCase();
      if (!validRanges.has(timeframe)) return json({ error: "unsupported timeframe" }, 400);
      const candles = await cached(`market:candles:${s}:${timeframe}`, TTL.short, () => market.getHistoricalCandles(s, timeframe));
      return json({ candles });
    }
    if (path === "/api/market/fundamentals") {
      const s = required(url, "symbol"); if (s instanceof Response) return s;
      return json(await cached(`market:fundamentals:${s}`, TTL.medium, () => market.getFundamentals(s)));
    }
    return json({ error: "Not found" }, 404);
  } catch (error) { return errorResponse(error); }
}
