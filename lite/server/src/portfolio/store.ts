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
    const totalCost = newAvgCost * newQty + tx.price * tx.quantity;
    newQty += tx.quantity;
    newAvgCost = newQty > 0 ? totalCost / newQty : 0;
  } else {
    // Sell: reduce quantity, keep avg_cost for unrealized P&L calculations
    const sold = Math.min(tx.quantity, newQty);
    newQty -= sold;
    if (newQty === 0) {
      newAvgCost = 0;
    }
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
      const totalCost = avgCost * qty + tx.price * tx.quantity;
      qty += tx.quantity;
      avgCost = qty > 0 ? totalCost / qty : 0;
    } else {
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
