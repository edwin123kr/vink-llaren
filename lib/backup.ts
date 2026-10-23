import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Säkerhetskopia (JSON): allt som är ditt, plus de katalogdrycker som det refererar till.
 * Hela den importerade katalogen (X-Wines/Open Food Facts) tas inte med; den kan importeras igen med skriptet.
 */
export const BACKUP_VERSION = 1;

export async function skapaBackup(medBilder = true) {
  const [flaskor, betyg, onskningar, provningar, smakanalyser] = await Promise.all([
    db.flaska.findMany(),
    db.betyg.findMany(),
    db.onskning.findMany(),
    db.provning.findMany(),
    db.smakanalys.findMany(),
  ]);
  const ids = new Set<string>([...flaskor.map((f) => f.dryckId), ...betyg.map((b) => b.dryckId), ...(onskningar.map((o) => o.dryckId).filter(Boolean) as string[])]);
  const drycker = await db.dryck.findMany({ where: { OR: [{ id: { in: [...ids] } }, { kalla: { in: ["manuell", "ai"] } }] } });
  const bildIds = drycker.map((d) => d.bildUrl?.match(/^\/api\/bild\/([a-z0-9]+)$/)?.[1]).filter(Boolean) as string[];
  const bilder = medBilder ? (await db.bild.findMany({ where: { id: { in: bildIds } } })).map((b) => ({ id: b.id, typ: b.typ, data: Buffer.from(b.data).toString("base64") })) : [];
  return { app: "vinkallaren", version: BACKUP_VERSION, exporterad: new Date().toISOString(), drycker, flaskor, betyg, onskningar, provningar, smakanalyser, bilder };
}

const datum = z.coerce.date();
const Backup = z.object({
  app: z.literal("vinkallaren"),
  version: z.number().int().max(BACKUP_VERSION),
  drycker: z.array(z.object({ id: z.string(), namn: z.string(), typ: z.string(), kategori: z.string(), kalla: z.string(), ean: z.string().nullable().optional() }).passthrough()),
  flaskor: z.array(z.object({ id: z.string(), dryckId: z.string(), antal: z.number().int() }).passthrough()),
  betyg: z.array(z.object({ id: z.string(), dryckId: z.string(), betyg: z.number().int().min(0).max(100) }).passthrough()),
  onskningar: z.array(z.object({ id: z.string(), namn: z.string() }).passthrough()).default([]),
  provningar: z.array(z.object({ id: z.string(), titel: z.string() }).passthrough()).default([]),
  smakanalyser: z.array(z.object({ id: z.string(), typ: z.string() }).passthrough()).default([]),
  bilder: z.array(z.object({ id: z.string(), typ: z.string(), data: z.string() })).default([]),
});

type Rad = Record<string, unknown>;
const DATUMFALT = ["skapad", "uppdaterad", "inkopsdatum", "datum"];
function rensa(r: Rad, falt: string[]): Rad {
  const out: Rad = {};
  for (const k of falt) if (k in r) out[k] = DATUMFALT.includes(k) && r[k] != null ? datum.parse(r[k]) : r[k];
  return out;
}

const F = {
  dryck: ["id", "namn", "producent", "typ", "kategori", "druvor", "land", "region", "argang", "alkoholhalt", "volymMl", "fyllighet", "sotma", "syra", "stravhet", "rokighet", "aromer", "mat", "beskrivning", "bildUrl", "ean", "sbArtikelnr", "prisCa", "prisUppskattat", "kalla", "kallaId", "licens", "sok", "skapad"],
  flaska: ["id", "dryckId", "antal", "inkopspris", "inkopsdatum", "inkopsstalle", "plats", "drickFran", "drickTill", "anteckningar", "skapad"],
  betyg: ["id", "dryckId", "flaskaId", "provningId", "betyg", "kommentar", "tillfalle", "datum"],
  onskning: ["id", "dryckId", "namn", "motivering", "prisCa", "kalla", "skapad"],
  provning: ["id", "titel", "datum", "deltagare", "antalViner", "budgetPerPerson", "tema", "forslag", "skapad"],
  smakanalys: ["id", "typ", "antalBetyg", "resultat", "skapad"],
};

export type ImportResultat = { ok: true; antal: Record<string, number> } | { ok: false; fel: string };

/** Läser in en säkerhetskopia. "ersatt" tömmer dina egna data först (katalogen behålls). */
export async function lasInBackup(input: unknown, lage: "slaihop" | "ersatt"): Promise<ImportResultat> {
  const p = Backup.safeParse(input);
  if (!p.success) return { ok: false, fel: "Filen är inte en giltig säkerhetskopia från Vinkällaren." };
  const b = p.data;
  const antal: Record<string, number> = { drycker: 0, flaskor: 0, betyg: 0, onskningar: 0, provningar: 0, bilder: 0 };
  await db.$transaction(async (tx) => {
    if (lage === "ersatt") {
      await tx.betyg.deleteMany();
      await tx.flaska.deleteMany();
      await tx.onskning.deleteMany();
      await tx.provning.deleteMany();
      await tx.smakanalys.deleteMany();
    }
    for (const bild of b.bilder) {
      await tx.bild.upsert({ where: { id: bild.id }, update: {}, create: { id: bild.id, typ: bild.typ, data: new Uint8Array(Buffer.from(bild.data, "base64")) } });
      antal.bilder++;
    }
    // drycker: samma id → uppdatera; samma EAN men annat id → använd den befintliga
    const idMap = new Map<string, string>();
    for (const d of b.drycker as Rad[]) {
      const data = rensa(d, F.dryck);
      const ean = data.ean as string | null | undefined;
      const krock = ean ? await tx.dryck.findUnique({ where: { ean }, select: { id: true } }) : null;
      if (krock && krock.id !== d.id) {
        idMap.set(d.id as string, krock.id);
        continue;
      }
      await tx.dryck.upsert({ where: { id: d.id as string }, update: data as never, create: data as never });
      antal.drycker++;
    }
    const dId = (id: unknown) => (id == null ? null : (idMap.get(id as string) ?? (id as string)));
    for (const f of b.flaskor as Rad[]) {
      const data = { ...rensa(f, F.flaska), dryckId: dId(f.dryckId) as string };
      await tx.flaska.upsert({ where: { id: f.id as string }, update: data as never, create: data as never });
      antal.flaskor++;
    }
    for (const pr of b.provningar as Rad[]) {
      const data = rensa(pr, F.provning);
      await tx.provning.upsert({ where: { id: pr.id as string }, update: data as never, create: data as never });
      antal.provningar++;
    }
    for (const r of b.betyg as Rad[]) {
      const data = { ...rensa(r, F.betyg), dryckId: dId(r.dryckId) as string };
      await tx.betyg.upsert({ where: { id: r.id as string }, update: data as never, create: data as never });
      antal.betyg++;
    }
    for (const o of b.onskningar as Rad[]) {
      const data = { ...rensa(o, F.onskning), dryckId: dId(o.dryckId) };
      await tx.onskning.upsert({ where: { id: o.id as string }, update: data as never, create: data as never });
      antal.onskningar++;
    }
    for (const s of b.smakanalyser as Rad[]) {
      const data = rensa(s, F.smakanalys);
      await tx.smakanalys.upsert({ where: { id: s.id as string }, update: data as never, create: data as never });
    }
  });
  return { ok: true, antal };
}
