import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }) });
const { count } = await db.dryck.deleteMany({ where: { kalla: "demo" } });
console.log(`Tog bort ${count} exempeldrycker (och deras flaskor och betyg).`);
await db.$disconnect();
