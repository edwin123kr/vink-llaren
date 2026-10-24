/**
 * Katalogimport från öppna källor.
 *
 *   npm run import -- xwines <fil.csv[.gz]>                 X-Wines (CC0). Test/Slim/Full-CSV från projektets GitHub/Google Drive.
 *   npm run import -- off <fil.jsonl[.gz]|fil.csv[.gz]>  Open Food Facts-dump (ODbL). JSONL eller den tabbseparerade CSV:n.
 *
 * Flaggor: --limit N   --dry-run
 *
 * Dubbletter: först på EAN, sedan på namn + producent + årgång (normaliserat).
 * En dubblett skapar ingen ny rad; tomma fält på den befintliga raden fylls i från den nya källan.
 * Varje rad sparar källa (kalla), id i källan (kallaId) och licens. En logg skrivs till data/import-logs/.
 */
import "dotenv/config";
import { createReadStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createGunzip, gunzipSync } from "node:zlib";
import { createInterface } from "node:readline";
import path from "node:path";
import { skapaKlient } from "../../lib/prisma-klient";
import { dubblettNyckel } from "../../lib/sok";
import { csvObjects, parseCsv } from "./csv";
import { fromOff, fromXWines, type DryckInput, type OffProduct } from "./normalize";

const [kalla, fil, ...rest] = process.argv.slice(2);
const limit = Number(rest[rest.indexOf("--limit") + 1]) || Infinity;
const dryRun = rest.includes("--dry-run");

if (!["xwines", "off"].includes(kalla ?? "") || !fil) {
  console.error("Användning: npm run import -- <xwines|off> <fil> [--limit N] [--dry-run]");
  process.exit(1);
}

const db = skapaKlient();

/* --- befintliga nycklar för dubblettkontroll --- */
// bara den delade katalogen; användarnas egna drycker rörs inte
const befintliga = await db.dryck.findMany({ where: { agareId: null }, select: { id: true, namn: true, producent: true, argang: true, ean: true } });
const perEan = new Map(befintliga.filter((d) => d.ean).map((d) => [d.ean!, d.id]));
const perNyckel = new Map(befintliga.map((d) => [dubblettNyckel(d), d.id]));

const stat = { lasta: 0, ogiltiga: 0, nya: 0, dubbletter: 0, kompletterade: 0 };
const logg: { rad: number; status: string; kallaId?: string; namn?: string; matchadMot?: string }[] = [];
let batch: DryckInput[] = [];

async function flush() {
  if (!batch.length || dryRun) return void (batch = []);
  await db.dryck.createMany({ data: batch });
  batch = [];
}

const FYLLBARA = ["producent", "land", "region", "alkoholhalt", "volymMl", "fyllighet", "syra", "bildUrl", "ean"] as const;

async function hantera(d: DryckInput | null, rad: number) {
  stat.lasta++;
  if (!d) {
    stat.ogiltiga++;
    return;
  }
  const match = (d.ean && perEan.get(d.ean)) || perNyckel.get(dubblettNyckel(d));
  if (match) {
    stat.dubbletter++;
    logg.push({ rad, status: "dubblett", kallaId: d.kallaId, namn: d.namn, matchadMot: match });
    if (!dryRun && !match.startsWith("ny:")) {
      const cur = await db.dryck.findUnique({ where: { id: match } });
      if (cur) {
        const fyll: Record<string, unknown> = {};
        for (const k of FYLLBARA) if (cur[k] == null && d[k] != null) fyll[k] = d[k];
        if (d.druvor.length && !Array.isArray(cur.druvor)) fyll.druvor = d.druvor;
        if (d.mat.length && !Array.isArray(cur.mat)) fyll.mat = d.mat;
        if (fyll.ean && perEan.has(fyll.ean as string)) delete fyll.ean;
        if (Object.keys(fyll).length) {
          await db.dryck.update({ where: { id: match }, data: fyll });
          stat.kompletterade++;
        }
      }
    }
    return;
  }
  const tmp = `ny:${d.kalla}:${d.kallaId}`;
  if (d.ean) perEan.set(d.ean, tmp);
  perNyckel.set(dubblettNyckel(d), tmp);
  batch.push(d);
  stat.nya++;
  if (batch.length >= 500) await flush();
}

function lines(file: string) {
  const s = createReadStream(file);
  return createInterface({ input: file.endsWith(".gz") ? s.pipe(createGunzip()) : s, crlfDelay: Infinity });
}

const start = Date.now();
if (kalla === "xwines") {
  let i = 0;
  const text = fil.endsWith(".gz") ? gunzipSync(readFileSync(fil)).toString("utf8") : readFileSync(fil, "utf8");
  for (const r of csvObjects(text)) {
    if (++i > limit) break;
    await hantera(fromXWines(r), i);
  }
} else if (/\.jsonl(\.gz)?$/.test(fil)) {
  let i = 0;
  for await (const line of lines(fil)) {
    if (!line.trim()) continue;
    if (++i > limit) break;
    let p: OffProduct | null = null;
    try {
      p = JSON.parse(line);
    } catch {
      /* trasig rad räknas som ogiltig */
    }
    await hantera(p ? fromOff(p) : null, i);
  }
} else {
  // Open Food Facts CSV-dump (tabbseparerad). Läses rad för rad.
  let header: string[] | null = null;
  let i = 0;
  for await (const line of lines(fil)) {
    const cells = [...parseCsv(line, "\t")][0] ?? [];
    if (!header) {
      header = cells;
      continue;
    }
    if (++i > limit) break;
    const o: Record<string, string> = {};
    header.forEach((h, k) => (o[h] = cells[k] ?? ""));
    await hantera(fromOff({ ...o, categories_tags: o.categories_tags, origins_tags: o.origins_tags, alcohol_100g: o.alcohol_100g } as OffProduct), i);
  }
}
await flush();

const dir = path.join("data", "import-logs");
mkdirSync(dir, { recursive: true });
const loggfil = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${kalla}.json`);
writeFileSync(loggfil, JSON.stringify({ kalla, fil, dryRun, stat, sekunder: (Date.now() - start) / 1000, rader: logg }, null, 2));

console.log(`${dryRun ? "[torrkörning] " : ""}${kalla}: ${stat.lasta} lästa · ${stat.nya} nya · ${stat.dubbletter} dubbletter (${stat.kompletterade} kompletterade) · ${stat.ogiltiga} hoppade över`);
console.log(`Logg: ${loggfil}`);
await db.$disconnect();
