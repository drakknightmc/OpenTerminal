import { Database } from "bun:sqlite";
import { join } from "path";

const dbPath = process.env.DB_PATH || "./data/terminal.db";

// Ensure data directory exists
const dataDir = join(dbPath, "..");
try {
  await import("fs").then((fs) => fs.promises.mkdir(dataDir, { recursive: true }));
} catch (e) {
  // Directory already exists
}

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.exec("PRAGMA journal_mode = WAL");

// Create a trivial meta table to prove the DB layer works
db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    initialized_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Ensure we have a single row
db.exec(`
  INSERT OR IGNORE INTO meta (id) VALUES (1)
`);

export default db;
