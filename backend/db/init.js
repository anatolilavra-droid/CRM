import db from "./database.js";

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  amount REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_clients_owner_id ON clients(owner_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id)`);

console.log("Tables 'users', 'clients', 'deals' are ready.");
