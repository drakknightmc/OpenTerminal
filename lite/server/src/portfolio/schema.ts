import { Database } from "bun:sqlite";

export function initSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market TEXT NOT NULL CHECK (market IN ('us', 'india', 'crypto', 'mf')),
      symbol TEXT NOT NULL,
      currency TEXT NOT NULL CHECK (currency IN ('USD', 'INR')),
      quantity REAL NOT NULL DEFAULT 0,
      avg_cost REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(market, symbol)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      holding_id INTEGER NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
      quantity REAL NOT NULL CHECK (quantity > 0),
      price REAL NOT NULL CHECK (price >= 0),
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_holding_id ON transactions(holding_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_holdings_market ON holdings(market);
  `);
}
