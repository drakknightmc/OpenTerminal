import { Database } from "bun:sqlite";
import { join } from "path";

// Named distinctly from the old app's "data/terminal.db" (server/src/db.ts on main) —
// both apps default to a relative "./data" dir, and running this from the repo root
// would otherwise silently open the old app's incompatible database.
const dbPath = process.env.DB_PATH || "./data/openterminal-lite.db";

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
