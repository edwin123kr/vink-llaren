/**
 * Kontoverktyg för den som driver appen (kräver åtkomst till servern):
 *   npm run konto -- lista
 *   npm run konto -- losenord <epost> <nytt-lösenord>   (t.ex. när någon har glömt sitt)
 *   npm run konto -- overta <epost>                     (flyttar data från före konton till ett konto)
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hashaLosenord } from "../lib/losenord";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./.data/dev.db" }) });
const [kommando, epostIn, extra] = process.argv.slice(2);
const epost = epostIn?.trim().toLowerCase();

async function hitta() {
  const a = epost ? await db.anvandare.findUnique({ where: { epost } }) : null;
  if (!a) throw new Error(`Hittar inget konto med e-posten ${epost ?? "(saknas)"}.`);
  return a;
}

try {
  if (kommando === "lista") {
    const konton = await db.anvandare.findMany({ orderBy: { skapad: "asc" }, include: { _count: { select: { flaskor: true, betyg: true } } } });
    for (const k of konton) console.log(`${k.epost.padEnd(32)} ${k.namn.padEnd(20)} ${k._count.flaskor} flaskor, ${k._count.betyg} betyg, sedan ${k.skapad.toISOString().slice(0, 10)}`);
    if (!konton.length) console.log("Inga konton än.");
  } else if (kommando === "losenord") {
    const a = await hitta();
    if (!extra || extra.length < 8) throw new Error("Ange ett nytt lösenord med minst 8 tecken.");
    await db.$transaction([db.anvandare.update({ where: { id: a.id }, data: { losenordHash: await hashaLosenord(extra) } }), db.session.deleteMany({ where: { anvandareId: a.id } })]);
    console.log(`Nytt lösenord satt för ${a.epost}. Kontot har loggats ut överallt.`);
  } else if (kommando === "overta") {
    const a = await hitta();
    const fran = { where: { anvandareId: "lokal" }, data: { anvandareId: a.id } };
    const r = await db.$transaction([
      db.flaska.updateMany(fran),
      db.betyg.updateMany(fran),
      db.onskning.updateMany(fran),
      db.provning.updateMany(fran),
      db.smakanalys.updateMany(fran),
      db.dryck.updateMany({ where: { agareId: "lokal" }, data: { agareId: a.id } }),
      db.bild.updateMany({ where: { agareId: null }, data: { agareId: a.id } }),
    ]);
    await db.anvandare.deleteMany({ where: { id: "lokal" } });
    console.log(`Flyttade ${r[0].count} flaskor, ${r[1].count} betyg, ${r[2].count} önskningar, ${r[3].count} provningar och ${r[5].count} egna drycker till ${a.epost}.`);
  } else {
    console.log("Användning: npm run konto -- lista | losenord <epost> <nytt-lösenord> | overta <epost>");
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
