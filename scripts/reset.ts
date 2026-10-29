import fs from "node:fs";
import path from "node:path";

const configured = process.env.DATABASE_PATH || "data/skipline.db";
const file = path.isAbsolute(configured)
  ? configured
  : path.join(process.cwd(), configured);

for (const suffix of ["", "-wal", "-shm"]) {
  const target = `${file}${suffix}`;
  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
    console.log(`Removed ${path.relative(process.cwd(), target)}`);
  }
}

async function main() {
  const { all, getDb } = await import("../lib/db");
  const db = getDb();
  const orgs = all<{ c: number }>("SELECT COUNT(*) AS c FROM organizations")[0];
  console.log("");
  console.log("Database reset and reseeded.");
  console.log(`Organisations: ${orgs?.c ?? 0}`);
  console.log("Demo customer: user@example.com / User@12345");
  db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
