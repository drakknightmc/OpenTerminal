import * as india from "../providers/india/index.js";
import { cached, errorResponse, json, methodNotAllowed, required, TTL } from "./_utils.js";

const ranges = new Set(["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"]);
export async function handleIndia(req: Request, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/india")) return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "GET") return methodNotAllowed();
  try {
    const path = url.pathname.replace(/\/$/, "");
    const symbol = decodeURIComponent(path.split("/")[4] || "");
    if (path === "/api/india/indices") {
      const indices = await cached("india:indices", TTL.medium, india.getIndices);
      return json({ indices });
    }
    if (path.startsWith("/api/india/quote/") && symbol) return json(await cached(`india:quote:${symbol}`, TTL.short, () => india.getQuote(symbol)));
    if (path === "/api/india/candles") {
      const s = required(url, "symbol"); if (s instanceof Response) return s;
      const timeframe = (url.searchParams.get("timeframe") || "1Y").toUpperCase();
      if (!ranges.has(timeframe)) return json({ error: "unsupported timeframe" }, 400);
      return json(await cached(`india:candles:${s}:${timeframe}`, TTL.short, () => india.getHistoricalCandles(s, timeframe)));
    }
    return json({ error: "Not found" }, 404);
  } catch (error) { return errorResponse(error); }
}
