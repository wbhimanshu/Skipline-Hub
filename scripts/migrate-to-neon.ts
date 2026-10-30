import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import { configureDns } from "../lib/dns-fallback";
import { SCHEMA_PG_SQL } from "../lib/schema-pg";

const TABLES = [
  "organizations",
  "users",
  "sessions",
  "counters",
  "tickets",
  "notifications",
  "audit_logs",
  "emergency_requests",
  "restrictions",
  "appeals",
  "reports",
  "settings",
  "email_log",
] as const;

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const file = path.join(process.cwd(), name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function databasePath() {
  const configured = process.env.DATABASE_PATH || "data/skipline.db";
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

function connectionString() {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!raw) throw new Error("DATABASE_URL is not configured.");
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}

function normalize(value: unknown) {
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "bigint") return value.toString();
  return value;
}

async function main() {
  loadEnv();
  configureDns();
  const sqliteFile = databasePath();
  if (!fs.existsSync(sqliteFile)) {
    throw new Error(`SQLite database not found at ${sqliteFile}`);
  }

  const sqlite = new DatabaseSync(sqliteFile);
  const pool = new Pool({ connectionString: connectionString(), max: 3 });

  try {
    console.log("Applying Postgres schema...");
    await pool.query(SCHEMA_PG_SQL);

    for (const table of TABLES) {
      const info = sqlite
        .prepare(`PRAGMA table_info(${table})`)
        .all() as Array<{ name: string }>;
      if (!info.length) {
        console.log(`  ${table}: table missing in SQLite, skipped`);
        continue;
      }
      const columns = info.map((column) => column.name);
      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all() as Array<
        Record<string, unknown>
      >;
      if (!rows.length) {
        console.log(`  ${table}: 0 rows`);
        continue;
      }

      let copied = 0;
      const chunkSize = 200;
      for (let start = 0; start < rows.length; start += chunkSize) {
        const chunk = rows.slice(start, start + chunkSize);
        const params: unknown[] = [];
        const tuples = chunk.map((row) => {
          const placeholders = columns.map((column) => {
            params.push(normalize(row[column]));
            return `$${params.length}`;
          });
          return `(${placeholders.join(", ")})`;
        });
        const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")} ON CONFLICT DO NOTHING`;
        await pool.query(sql, params);
        copied += chunk.length;
      }
      console.log(`  ${table}: ${copied} rows processed`);
    }

    const summary = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users) AS users,
         (SELECT COUNT(*) FROM organizations) AS organizations,
         (SELECT COUNT(*) FROM tickets) AS tickets,
         (SELECT COUNT(*) FROM settings) AS settings`,
    );
    console.log("Neon is ready:", summary.rows[0]);
  } finally {
    sqlite.close();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
