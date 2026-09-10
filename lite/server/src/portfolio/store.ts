import { Database } from "bun:sqlite";

export type Market = "us" | "india" | "crypto" | "mf";
export type Currency = "USD" | "INR";
export type TransactionType = "buy" | "sell";

export interface Holding {
  id: number;
  market: Market;
  symbol: string;
  currency: Currency;
  quantity: number;
  avg_cost: number;
  created_at: string;
  updated_at: string;
  source?: string;
  sourceLabel?: string;
  last_price?: number | null;
  market_value?: number | null;
}

export interface Transaction {
  id: number;
  holding_id: number;
  type: TransactionType;
  quantity: number;
  price: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface TransactionInput {
  market: Market;
  symbol: string;
  type: TransactionType;
  quantity: number;
  price: number;
  date: string;
  notes?: string;
}

/**
 * Add a transaction and update the holding's quantity and average cost.
 * Uses weighted-average-cost accounting: avg_cost = (old_total_cost + new_cost) / new_qty
 * For sells, realized P&L is tracked implicitly (sell_price - avg_cost) * qty_sold
 */
export function addTransaction(db: Database, tx: TransactionInput): Transaction {
  // Ensure holding exists
  const holding = db
    .prepare(
      `SELECT id FROM holdings WHERE market = ? AND symbol = ?`
    )
    .get(tx.market, tx.symbol) as { id: number } | undefined;

  let holdingId: number;
  if (holding) {
    holdingId = holding.id;
  } else {
    // Create new holding
    const market_currency_map: Record<Market, Currency> = {
      us: "USD",
      crypto: "USD",
      india: "INR",
      mf: "INR",
    };
    const currency = market_currency_map[tx.market];
    const result = db
      .prepare(
        `INSERT INTO holdings (market, symbol, currency, quantity, avg_cost) VALUES (?, ?, ?, 0, 0)`
      )
      .run(tx.market, tx.symbol, currency);
    holdingId = Number(result.lastInsertRowid);
  }

  // Get current holding state
  const currentHolding = db
    .prepare(`SELECT quantity, avg_cost FROM holdings WHERE id = ?`)
    .get(holdingId) as { quantity: number; avg_cost: number };

  let newQty = currentHolding.quantity;
  let newAvgCost = currentHolding.avg_cost;

  if (tx.type === "buy") {
    // Weighted-average cost: (old_total_cost + new_cost) / new_qty
    // Example: 100 shares @ $10 avg, buy 50 @ $15:
    //   total_cost = (10 * 100) + (15 * 50) = 1000 + 750 = 1750
    //   new_qty = 100 + 50 = 150
    //   avg_cost = 1750 / 150 = 11.67 (new average cost per share)
    const totalCost = newAvgCost * newQty + tx.price * tx.quantity;
    newQty += tx.quantity;
    newAvgCost = newQty > 0 ? totalCost / newQty : 0;
  } else {
    // Sell: reduce quantity, keep avg_cost for unrealized P&L calculations on remaining holdings
    // Example: 150 shares @ $11.67 avg, sell 50:
    //   Realized P&L = (sell_price - avg_cost) * qty_sold (calculated by computeRealizedPnlForHolding)
    //   Remaining: 100 shares @ $11.67 avg (unchanged)
    const sold = Math.min(tx.quantity, newQty);
    newQty -= sold;
    if (newQty === 0) {
      // Fully liquidated: reset avg_cost to 0 to keep state clean
      newAvgCost = 0;
    }
    // Note: avg_cost is NOT updated on partial sells, it persists for P&L calculation
  }

  // Update holding
  db.prepare(
    `UPDATE holdings SET quantity = ?, avg_cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(newQty, newAvgCost, holdingId);

  // Insert transaction
  const result = db
    .prepare(
      `INSERT INTO transactions (holding_id, type, quantity, price, date, notes) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(holdingId, tx.type, tx.quantity, tx.price, tx.date, tx.notes || null);

  return {
    id: Number(result.lastInsertRowid),
    holding_id: holdingId,
    type: tx.type,
    quantity: tx.quantity,
    price: tx.price,
    date: tx.date,
    notes: tx.notes,
    created_at: new Date().toISOString(),
  };
}

/**
 * Get all holdings, optionally filtered by market.
 */
export function getHoldings(db: Database, market?: Market): Holding[] {
  if (market) {
    return db
      .prepare(`SELECT * FROM holdings WHERE market = ? ORDER BY symbol`)
      .all(market) as Holding[];
  }
  return db.prepare(`SELECT * FROM holdings ORDER BY market, symbol`).all() as Holding[];
}

/**
 * Get transaction log, optionally filtered by holding ID.
 */
export function getTransactions(db: Database, holdingId?: number): Transaction[] {
  if (holdingId) {
    return db
      .prepare(`SELECT * FROM transactions WHERE holding_id = ? ORDER BY date DESC, id DESC`)
      .all(holdingId) as Transaction[];
  }
  return db.prepare(`SELECT * FROM transactions ORDER BY date DESC, id DESC`).all() as Transaction[];
}

/**
 * Delete a holding and all its transactions.
 */
export function deleteHolding(db: Database, id: number): void {
  db.prepare(`DELETE FROM transactions WHERE holding_id = ?`).run(id);
  db.prepare(`DELETE FROM holdings WHERE id = ?`).run(id);
}

/**
 * Compute realized P&L for a holding or all holdings.
 * Realized P&L = sum((sell_price - avg_cost) * qty_sold) for all sell transactions
 * avg_cost is tracked at the time of each transaction via weighted average.
 */
export function getRealizedPnl(db: Database, holdingId?: number): number {
  // For each sell transaction, compute (sell_price - avg_cost_at_time) * qty
  // Since we don't store avg_cost per transaction, we compute it by replaying the transaction log

  if (holdingId) {
    return computeRealizedPnlForHolding(db, holdingId);
  }

  // Aggregate across all holdings
  const holdings = getHoldings(db);
  let totalRealizedPnl = 0;
  for (const holding of holdings) {
    totalRealizedPnl += computeRealizedPnlForHolding(db, holding.id);
  }
  return totalRealizedPnl;
}

/**
 * Helper: compute realized P&L for a single holding by replaying transactions.
 *
 * We can't store avg_cost per transaction, so we replay the transaction log
 * to recompute the cost basis at each sell. This is expensive but correct.
 *
 * Real example:
 *   T1: Buy 100 @ $10  → qty=100, avgCost=$10
 *   T2: Buy 50 @ $20   → qty=150, avgCost=$13.33 (weighted)
 *   T3: Sell 75 @ $25  → realizedPnl = (25 - 13.33) * 75 = $875, qty=75
 *   T4: Sell 75 @ $30  → realizedPnl += (30 - 13.33) * 75 = $1250, qty=0
 *   Total realized = $875 + $1250 = $2125
 *
 * The holding's current avg_cost ($13.33 above) is used to calculate
 * unrealized P&L on the remaining holdings.
 */
function computeRealizedPnlForHolding(db: Database, holdingId: number): number {
  const transactions = db
    .prepare(`SELECT * FROM transactions WHERE holding_id = ? ORDER BY date, id`)
    .all(holdingId) as Transaction[];

  let qty = 0;
  let avgCost = 0;
  let realizedPnl = 0;

  for (const tx of transactions) {
    if (tx.type === "buy") {
      // Replay the weighted-average cost calculation at this point in history
      const totalCost = avgCost * qty + tx.price * tx.quantity;
      qty += tx.quantity;
      avgCost = qty > 0 ? totalCost / qty : 0;
    } else {
      // On sell: realized P&L = (sell_price - avg_cost_at_time) * qty_sold
      const sold = Math.min(tx.quantity, qty);
      realizedPnl += (tx.price - avgCost) * sold;
      qty -= sold;
      if (qty === 0) {
        avgCost = 0;
      }
    }
  }

  return realizedPnl;
}
