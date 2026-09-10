/**
 * External Broker Database Integration
 *
 * OpenTerminal can read holdings from external broker databases (ICICI Direct,
 * IBKR, Groww, etc.) without writing to them. This allows consolidating portfolio
 * data from multiple sources into a single net worth calculation.
 *
 * The external database is expected to be a SQLite database (or similar) with a
 * `holdings` table containing broker data. OpenTerminal reads this once per API
 * call (on-demand), combining with user's manual holdings in openterminal-lite.db.
 *
 * Setup:
 * 1. Export your broker's portfolio to a SQLite database (see schema below)
 * 2. Set PORTFOLIO_DB_PATH environment variable to the database file path
 * 3. Server will automatically read and include external holdings in net worth
 * 4. If file not found or unreadable, external holdings are skipped gracefully
 *
 * Expected schema (can use symlink to broker's actual database):
 *   CREATE TABLE holdings (
 *     rowid INTEGER PRIMARY KEY,
 *     source TEXT,           -- "icici_direct", "ibkr", "groww_mf", etc.
 *     market TEXT,           -- "IN_STOCK", "INTL_STOCK", "IN_MF" (maps to us/india/crypto/mf)
 *     symbol TEXT,           -- Stock symbol or fund code
 *     shares REAL,           -- Quantity held
 *     avg_cost REAL,         -- Average cost per unit
 *     last_price REAL,       -- Last known price (for P&L calculation)
 *     currency TEXT,         -- "INR", "USD"
 *     market_value REAL,     -- Total value (shares * last_price) if available
 *     updated_at TEXT        -- Last update timestamp (ISO format)
 *   );
 *
 * Symlink usage (e.g., on vault-pi):
 *   ln -s /path/to/broker/portfolio.db /var/lib/openterminal/portfolio-external.db
 *   export PORTFOLIO_DB_PATH=/var/lib/openterminal/portfolio-external.db
 *
 * Why symlink? Because the broker database might be on a different mount/NFS,
 * and symlinks are cheaper than copying large files. WAL mode on broker DB
 * means the symlink points to -wal and -shm files as well; opening read-only
 * avoids write conflicts.
 *
 * Note: IDs are negated (-rowid) to distinguish external holdings from manual ones
 * (manual holdings have positive IDs). This allows filtering/grouping by source.
 */

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
