import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH;

// database is persisted only if DB_PATH is set, otherwise in-memory store is used.
if (DB_PATH) {
  mkdirSync(dirname(DB_PATH), { recursive: true });
}
const db = new DatabaseSync(DB_PATH ?? ":memory:");

db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    user       TEXT    NOT NULL UNIQUE,
    token      TEXT    NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

const selectToken = db.prepare("SELECT token FROM tokens WHERE user = ?");

const insertToken = db.prepare(`
  INSERT INTO tokens (user, token)
  VALUES (?, ?)
  ON CONFLICT(user) DO UPDATE SET
    token      = excluded.token,
    updated_at = unixepoch()
`);

export function getCachedToken(user: string | undefined): string | null {
  if (!user) return null;
  const row = selectToken.get(user) as { token: string } | undefined;
  return row?.token ?? null;
}

export function setCachedToken(user: string, token: string): void {
  insertToken.run(user, token);
}

export function clearDb(): void {
  db.exec("DELETE FROM tokens");
}
