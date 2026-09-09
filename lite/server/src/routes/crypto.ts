import * as crypto from "../providers/crypto/index.js";
import { cached, errorResponse, json, methodNotAllowed, numberParam, required, TTL } from "./_utils.js";

export async function handleCrypto(req: Request, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/crypto")) return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "GET") return methodNotAllowed();
  try {
    const path = url.pathname.replace(/\/$/, "");
    if (path === "/api/crypto") {
      const assets = await cached("crypto:markets", TTL.medium, () => crypto.getTopAssets(50));
      return json({ assets });
    }
    if (path === "/api/crypto/dominance") return json(await cached("crypto:dominance", TTL.medium, crypto.getDominance));
    if (path === "/api/crypto/ohlcv") {
      const symbol = required(url, "symbol"); if (symbol instanceof Response) return symbol;
      const timeframe = (url.searchParams.get("timeframe") || "1D").toUpperCase();
      const candles = await cached(`crypto:ohlcv:${symbol}:${timeframe}`, TTL.short, () => crypto.getOHLCV(symbol, timeframe));
      return json({ candles });
    }
    if (path.startsWith("/api/crypto/quote/")) {
      const id = decodeURIComponent(path.split("/")[4] || "");
      if (!id) return json({ error: "idOrSymbol is required" }, 400);
      return json(await cached(`crypto:quote:${id}`, TTL.short, () => crypto.getQuote(id)));
    }
    return json({ error: "Not found" }, 404);
  } catch (error) { return errorResponse(error); }
}
