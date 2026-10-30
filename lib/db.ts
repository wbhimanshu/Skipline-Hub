import { AsyncLocalStorage } from "node:async_hooks";
import { Pool, types, type PoolClient, type QueryResultRow } from "pg";
import { configureDns } from "./dns-fallback";
import { SCHEMA_PG_SQL } from "./schema-pg";

configureDns();

export type SQLValue = string | number | bigint | boolean | null | Uint8Array | Date;

type DbGlobal = typeof globalThis & {
  __skiplinePool?: Pool;
  __skiplineSchema?: Promise<void>;
};

const transactionStore = new AsyncLocalStorage<PoolClient>();

types.setTypeParser(20, (value) => Number(value));
types.setTypeParser(1700, (value) => Number(value));
types.setTypeParser(1082, (value) => value);

function connectionString() {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not configured. Add your Neon Postgres connection string to .env.local.",
    );
  }
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}

function pool() {
  const g = globalThis as DbGlobal;
  if (!g.__skiplinePool) {
    g.__skiplinePool = new Pool({
      connectionString: connectionString(),
      max: Number(process.env.PG_POOL_MAX || 5),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    });
  }
  return g.__skiplinePool;
}

async function ensureSchema() {
  const g = globalThis as DbGlobal;
  if (!g.__skiplineSchema) {
    g.__skiplineSchema = (async () => {
      const client = await pool().connect();
      try {
        await client.query(SCHEMA_PG_SQL);
      } finally {
        client.release();
      }
    })().catch((error) => {
      g.__skiplineSchema = undefined;
      throw error;
    });
  }
  return g.__skiplineSchema;
}

export function convertPlaceholders(sql: string): string {
  let index = 0;
  let out = "";
  let single = false;
  let double = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (lineComment) {
      out += char;
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      out += char;
      if (char === "*" && next === "/") {
        out += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }
    if (!single && !double) {
      if (char === "-" && next === "-") {
        out += char + next;
        i += 1;
        lineComment = true;
        continue;
      }
      if (char === "/" && next === "*") {
        out += char + next;
        i += 1;
        blockComment = true;
        continue;
      }
    }
    if (char === "'" && !double) {
      if (single && next === "'") {
        out += char + next;
        i += 1;
        continue;
      }
      single = !single;
      out += char;
      continue;
    }
    if (char === '"' && !single) {
      double = !double;
      out += char;
      continue;
    }
    if (char === "?" && !single && !double) {
      index += 1;
      out += `$${index}`;
      continue;
    }
    out += char;
  }
  return out;
}

function queryable() {
  return transactionStore.getStore() ?? pool();
}

async function query<T extends QueryResultRow>(
  sql: string,
  params: SQLValue[],
) {
  await ensureSchema();
  return queryable().query<T>(convertPlaceholders(sql), params);
}

export async function all<T = Record<string, unknown>>(
  sql: string,
  ...params: SQLValue[]
): Promise<T[]> {
  const result = await query(sql, params);
  return result.rows as T[];
}

export async function one<T = Record<string, unknown>>(
  sql: string,
  ...params: SQLValue[]
): Promise<T | undefined> {
  const rows = await all<T>(sql, ...params);
  return rows[0];
}

export async function run(sql: string, ...params: SQLValue[]) {
  const result = await query(sql, params);
  return { changes: result.rowCount ?? 0 };
}

export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const existing = transactionStore.getStore();
  if (existing) return fn();

  await ensureSchema();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await transactionStore.run(client, fn);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getSetting(key: string, fallback: string): Promise<string> {
  const row = await one<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    key,
  );
  return row?.value ?? fallback;
}

export async function setSetting(key: string, value: string) {
  await run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}
