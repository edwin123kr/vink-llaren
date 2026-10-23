import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./.data/dev.db" }) });
// demokontot och allt det äger (drycker, flaskor, betyg …) försvinner via cascade
const { count: konton } = await db.anvandare.deleteMany({ where: { epost: "demo@exempel.se" } });
const { count } = await db.dryck.deleteMany({ where: { kalla: "demo" } });
console.log(`Tog bort ${konton} demokonto och ${count} övriga exempeldrycker.`);
await db.$disconnect();
