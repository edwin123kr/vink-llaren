/**
 * Körs vid varje produktionsstart (efter migreringarna). Är katalogen tom läggs de 100 X-Wines-vinerna
 * som följer med repot in, så att en ny installation inte startar helt tom.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./.data/dev.db" }) });
const antal = await db.dryck.count({ where: { agareId: null } });
await db.$disconnect();
if (antal === 0) {
  console.log("Katalogen är tom: lägger in X-Wines testurval (100 viner).");
  const r = spawnSync("npx", ["tsx", "scripts/import/index.mts", "xwines", "data/fixtures/xwines-test-100.csv"], { stdio: "inherit" });
  if (r.status !== 0) console.error("Kunde inte lägga in katalogen. Appen startar ändå.");
}
