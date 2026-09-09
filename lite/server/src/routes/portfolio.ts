import db from "../db.js";
import { getRate } from "../providers/fx/index.js";
import { addTransaction, computeNetWorth, getHoldings, getTransactions, type Market, type TransactionInput, type TransactionType } from "../portfolio/index.js";
import { cached, errorResponse, json, methodNotAllowed, TTL } from "./_utils.js";

const markets = new Set<Market>(["us", "india", "crypto", "mf"]);
const types = new Set<TransactionType>(["buy", "sell"]);

export async function handlePortfolio(req: Request, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/portfolio")) return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  try {
    const path = url.pathname.replace(/\/$/, "");
    if (req.method === "GET" && path === "/api/portfolio/networth") {
      return json(await computeNetWorth(db, async (amount, from, to) => amount * await cached(`fx:${from}:${to}`, TTL.long, () => getRate(from, to))));
    }
    if (req.method === "GET" && path === "/api/portfolio/holdings") return json(getHoldings(db));
    if (req.method === "GET" && path === "/api/portfolio/transactions") return json(getTransactions(db));
    if (req.method === "POST" && path === "/api/portfolio/transactions") {
      let body: Partial<TransactionInput>;
      try { body = await req.json(); } catch { return json({ error: "Request body must be valid JSON" }, 400); }
      if (!markets.has(body.market as Market)) return json({ error: "market must be us, india, crypto, or mf" }, 400);
      if (!types.has(body.type as TransactionType)) return json({ error: "type must be buy or sell" }, 400);
      if (typeof body.symbol !== "string" || !body.symbol.trim()) return json({ error: "symbol is required" }, 400);
      if (!Number.isFinite(body.quantity) || body.quantity <= 0) return json({ error: "quantity must be positive" }, 400);
      if (!Number.isFinite(body.price) || body.price < 0) return json({ error: "price must be non-negative" }, 400);
      if (typeof body.date !== "string" || !body.date.trim()) return json({ error: "date is required" }, 400);
      const tx = addTransaction(db, { market: body.market!, symbol: body.symbol.trim(), type: body.type!, quantity: body.quantity!, price: body.price!, date: body.date, notes: body.notes });
      return json(tx, 201);
    }
    return req.method === "GET" || req.method === "POST" ? json({ error: "Not found" }, 404) : methodNotAllowed();
  } catch (error) { return errorResponse(error, 500); }
}
