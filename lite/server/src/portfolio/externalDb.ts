import { Database } from "bun:sqlite";
import type { Currency, Holding, Market } from "./store.js";

interface ExternalHoldingRow {
  id: number;
  source: string;
  market: string;
  symbol: string;
  shares: number;
  avg_cost: number;
  last_price: number | null;
  currency: string;
  market_value: number | null;
  updated_at: string;
}

const marketMap: Record<string, { market: Market; currency: Currency }> = {
  IN_STOCK: { market: "india", currency: "INR" },
  INTL_STOCK: { market: "us", currency: "USD" },
  IN_MF: { market: "mf", currency: "INR" },
};

export interface ExternalHolding extends Holding {
  source: string;
  sourceLabel: string;
  last_price: number | null;
  market_value: number | null;
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    icici_direct: "ICICI Direct",
    ibkr: "IBKR",
    groww_mf: "Groww MF",
  };
  return labels[source] ?? source.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Read broker/import holdings without modifying the external portfolio database. */
export function getExternalHoldings(): ExternalHolding[] {
  const path = process.env.PORTFOLIO_DB_PATH;
  if (!path) return [];

  let externalDb: Database | undefined;
  try {
    externalDb = new Database(path, { readonly: true });
    const rows = externalDb
      .prepare(
        `SELECT rowid AS id, source, market, symbol, shares, avg_cost, last_price,
                currency, market_value, updated_at
         FROM holdings
         ORDER BY source, market, symbol`
      )
      .all() as ExternalHoldingRow[];

    return rows.flatMap((row) => {
      const mapped = marketMap[row.market];
      if (!mapped) return [];
      return [{
        id: -row.id,
        market: mapped.market,
        symbol: row.symbol,
        currency: mapped.currency,
        quantity: row.shares,
        avg_cost: row.avg_cost,
        created_at: row.updated_at,
        updated_at: row.updated_at,
        source: row.source,
        sourceLabel: sourceLabel(row.source),
        last_price: row.last_price,
        market_value: row.market_value,
      }];
    });
  } catch {
    // The external portfolio is optional; manual holdings remain available.
    return [];
  } finally {
    externalDb?.close();
  }
}
