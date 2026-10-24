/**
 * Körs vid varje produktionsstart (efter migreringarna).
 *  - Är katalogen tom läggs de 100 X-Wines-vinerna som följer med repot in.
 *  - Ligger en större X-Wines-fil i data/katalog/ och katalogen bara har testurvalet läses den in.
 * Importen hoppar över dubbletter, så inget dubbleras.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { skapaKlient } from "../lib/prisma-klient";

const db = skapaKlient();
const xwines = await db.dryck.count({ where: { agareId: null, kalla: "xwines" } });
await db.$disconnect();

const importera = (fil: string) => {
  const r = spawnSync("npx", ["tsx", "scripts/import/index.mts", "xwines", fil], { stdio: "inherit" });
  if (r.status !== 0) console.error(`Kunde inte läsa in ${fil}. Appen startar ändå.`);
};

const stora = readdirSync("data/katalog").filter((f) => /^xwines.*\.csv(\.gz)?$/i.test(f));
if (xwines < 1000 && stora.length) {
  for (const f of stora) {
    console.log(`Läser in vinkatalogen från data/katalog/${f} …`);
    importera(`data/katalog/${f}`);
  }
} else if (xwines === 0) {
  console.log("Katalogen är tom: lägger in X-Wines testurval (100 viner).");
  importera("data/fixtures/xwines-test-100.csv");
}
