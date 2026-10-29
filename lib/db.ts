import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema";
import { seedInitialData } from "./seed";

export type SQLValue = string | number | bigint | null | Uint8Array;

type DbGlobal = typeof globalThis & { __skiplineDb?: DatabaseSync };

function databasePath() {
  const configured = process.env.DATABASE_PATH || "data/skipline.db";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

export function getDb(): DatabaseSync {
  const g = globalThis as DbGlobal;
  if (g.__skiplineDb) return g.__skiplineDb;

  const file = databasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA_SQL);
  g.__skiplineDb = db;

  try {
    seedInitialData(db);
  } catch (error) {
    console.error("[skipline] database seed failed", error);
  }

  return db;
}

export function all<T = Record<string, unknown>>(
  sql: string,
  ...params: SQLValue[]
): T[] {
  const rows = getDb().prepare(sql).all(...params) as T[];
  return rows.map((row) => ({ ...row }));
}

export function one<T = Record<string, unknown>>(
  sql: string,
  ...params: SQLValue[]
): T | undefined {
  const row = getDb().prepare(sql).get(...params) as T | undefined;
  return row ? { ...row } : undefined;
}

export function run(sql: string, ...params: SQLValue[]) {
  return getDb().prepare(sql).run(...params);
}

export function withTransaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw error;
  }
}

export function getSetting(key: string, fallback: string): string {
  const row = one<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    key,
  );
  return row?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}
