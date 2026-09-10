/**
 * Portfolio Database Schema (SQLite)
 *
 * This schema stores manual holdings and transactions for the portfolio engine.
 * It uses weighted-average cost accounting (WAC) to calculate unrealized P&L.
 *
 * External holdings (from brokers) are read separately from PORTFOLIO_DB_PATH
 * and merged at query time; they are NOT stored here.
 */

import { Database } from "bun:sqlite";

export function initSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS holdings (
      -- Core identification
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market TEXT NOT NULL CHECK (market IN ('us', 'india', 'crypto', 'mf')),
      symbol TEXT NOT NULL,
      currency TEXT NOT NULL CHECK (currency IN ('USD', 'INR')),

      -- Current position state (updated by transactions)
      quantity REAL NOT NULL DEFAULT 0,
      avg_cost REAL NOT NULL DEFAULT 0,  -- Weighted average cost per unit (updated on each buy)
                                          -- Used to calculate unrealized P&L: (last_price - avg_cost) * quantity

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      -- Constraint: only one holding per market + symbol pair
      UNIQUE(market, symbol)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      holding_id INTEGER NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,

      -- Transaction type and quantity
      type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
      quantity REAL NOT NULL CHECK (quantity > 0),  -- Always positive; type determines direction
      price REAL NOT NULL CHECK (price >= 0),      -- Price per unit
      date TEXT NOT NULL,  -- ISO format (YYYY-MM-DD) or timestamp
      notes TEXT,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for query performance
    CREATE INDEX IF NOT EXISTS idx_transactions_holding_id ON transactions(holding_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_holdings_market ON holdings(market);
  `);
}
