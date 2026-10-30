import { all, getDb } from "../lib/db-sqlite";

const db = getDb();
const users = all<{ c: number }>("SELECT COUNT(*) AS c FROM users")[0];
const orgs = all<{ c: number }>("SELECT COUNT(*) AS c FROM organizations")[0];
const tickets = all<{ c: number }>("SELECT COUNT(*) AS c FROM tickets")[0];

console.log("Skipline Hub database ready.");
console.log(`Users: ${users?.c ?? 0}`);
console.log(`Organisations: ${orgs?.c ?? 0}`);
console.log(`Tickets: ${tickets?.c ?? 0}`);
console.log("");
console.log("Demo accounts:");
console.log("  Customer:     user@example.com / User@12345");
console.log("  Organisation: sunrise-multispeciality-hospital@skiplinehub.app / Org@12345");
console.log("  Admin:        admin@skiplinehub.app / Admin@12345");

db.close();
