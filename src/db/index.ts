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
    user    TEXT    NOT NULL,
    token   TEXT    NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

const selectToken = db.prepare(
  "SELECT token FROM tokens WHERE user = ? ORDER BY created_at DESC LIMIT 1",
);

const insertToken = db.prepare(
  "INSERT INTO tokens (user, token) VALUES (?, ?)",
);

export function getCachedToken(user: string): string | null {
  const row = selectToken.get(user) as { token: string } | undefined;
  return row?.token ?? null;
}

export function setCachedToken(user: string, token: string): void {
  insertToken.run(user, token);
}
