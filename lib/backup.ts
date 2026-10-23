import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Säkerhetskopia (JSON): allt som är ditt, plus de katalogdrycker som det refererar till.
 * Hela den importerade katalogen (X-Wines/Open Food Facts) tas inte med; den kan importeras igen med skriptet.
 */
export const BACKUP_VERSION = 1;

export async function skapaBackup(anvandareId: string, medBilder = true) {
  const mitt = { where: { anvandareId } };
  const [flaskor, betyg, onskningar, provningar, smakanalyser] = await Promise.all([
    db.flaska.findMany(mitt),
    db.betyg.findMany(mitt),
    db.onskning.findMany(mitt),
    db.provning.findMany(mitt),
    db.smakanalys.findMany(mitt),
  ]);
  const ids = new Set<string>([...flaskor.map((f) => f.dryckId), ...betyg.map((b) => b.dryckId), ...(onskningar.map((o) => o.dryckId).filter(Boolean) as string[])]);
  // egna drycker plus de katalogdrycker som dina poster pekar på
  const drycker = await db.dryck.findMany({ where: { OR: [{ agareId: anvandareId }, { id: { in: [...ids] }, agareId: null }] } });
  const bildIds = drycker.map((d) => d.bildUrl?.match(/^\/api\/bild\/([a-z0-9]+)$/)?.[1]).filter(Boolean) as string[];
  const bilder = medBilder ? (await db.bild.findMany({ where: { id: { in: bildIds } } })).map((b) => ({ id: b.id, typ: b.typ, data: Buffer.from(b.data).toString("base64") })) : [];
  const utan = <T extends { anvandareId?: string }>(rader: T[]) => rader.map(({ anvandareId: _a, ...r }) => (void _a, r));
  return {
    app: "vinkallaren",
    version: BACKUP_VERSION,
    exporterad: new Date().toISOString(),
    drycker: drycker.map(({ agareId, ...d }) => ({ ...d, egen: agareId != null })),
    flaskor: utan(flaskor),
    betyg: utan(betyg),
    onskningar: utan(onskningar),
    provningar: utan(provningar),
    smakanalyser: utan(smakanalyser),
    bilder,
  };
}

const datum = z.coerce.date();
const Backup = z.object({
  app: z.literal("vinkallaren"),
  version: z.number().int().max(BACKUP_VERSION),
  drycker: z.array(z.object({ id: z.string(), namn: z.string(), typ: z.string(), kategori: z.string(), kalla: z.string(), ean: z.string().nullable().optional(), egen: z.boolean().optional() }).passthrough()),
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

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];
const KATALOGKALLOR = ["xwines", "openfoodfacts"];

/**
 * Läser in en säkerhetskopia till ditt konto. "ersatt" tömmer dina egna poster först (katalogen och
 * andras data rörs aldrig). Id som redan används av någon annan får nya id, så att en kopia från en vän
 * går att läsa in utan att något skrivs över.
 */
export async function lasInBackup(anvandareId: string, input: unknown, lage: "slaihop" | "ersatt"): Promise<ImportResultat> {
  const p = Backup.safeParse(input);
  if (!p.success) return { ok: false, fel: "Filen är inte en giltig säkerhetskopia från Vinkällaren." };
  const b = p.data;
  const antal: Record<string, number> = { drycker: 0, flaskor: 0, betyg: 0, onskningar: 0, provningar: 0, bilder: 0 };
  const mitt = { where: { anvandareId } };

  await db.$transaction(async (tx: Tx) => {
    if (lage === "ersatt") {
      await tx.betyg.deleteMany(mitt);
      await tx.flaska.deleteMany(mitt);
      await tx.onskning.deleteMany(mitt);
      await tx.provning.deleteMany(mitt);
      await tx.smakanalys.deleteMany(mitt);
    }
    for (const bild of b.bilder) {
      if (await tx.bild.findUnique({ where: { id: bild.id }, select: { id: true } })) continue;
      await tx.bild.create({ data: { id: bild.id, typ: bild.typ, data: new Uint8Array(Buffer.from(bild.data, "base64")), agareId: anvandareId } });
      antal.bilder++;
    }

    const dMap = new Map<string, string>();
    for (const d of b.drycker as Rad[]) {
      const id = d.id as string;
      const data = rensa(d, F.dryck);
      const befintlig = await tx.dryck.findUnique({ where: { id }, select: { agareId: true } });
      if (befintlig?.agareId === anvandareId) {
        await tx.dryck.update({ where: { id }, data: data as never });
        dMap.set(id, id);
        antal.drycker++;
        continue;
      }
      if (befintlig && befintlig.agareId === null) {
        dMap.set(id, id); // finns i den delade katalogen
        continue;
      }
      const ean = (data.ean as string | null | undefined) || null;
      const kandidat =
        (ean && (await tx.dryck.findFirst({ where: { ean, OR: [{ agareId: null }, { agareId: anvandareId }] }, orderBy: { agareId: "desc" }, select: { id: true } }))) ||
        (d.egen === false && KATALOGKALLOR.includes(String(data.kalla)) && data.kallaId
          ? await tx.dryck.findFirst({ where: { agareId: null, kalla: String(data.kalla), kallaId: String(data.kallaId) }, select: { id: true } })
          : null);
      if (kandidat) {
        dMap.set(id, kandidat.id);
        continue;
      }
      // ny egen dryck; behåll id om det är ledigt
      const ny = await tx.dryck.create({ data: { ...data, ...(befintlig ? { id: undefined } : {}), agareId: anvandareId } as never, select: { id: true } });
      dMap.set(id, ny.id);
      antal.drycker++;
    }
    const dryck = (id: unknown) => (id == null ? null : (dMap.get(id as string) ?? null));

    /** Uppdatera om posten är din, annars skapa (med nytt id om det gamla används av någon annan). */
    async function spara(modell: "flaska" | "provning" | "betyg" | "onskning" | "smakanalys", rad: Rad, data: Rad): Promise<string> {
      const id = rad.id as string;
      const m = tx[modell] as unknown as {
        findUnique: (a: object) => Promise<{ anvandareId: string } | null>;
        update: (a: object) => Promise<{ id: string }>;
        create: (a: object) => Promise<{ id: string }>;
      };
      const finns = await m.findUnique({ where: { id }, select: { anvandareId: true } });
      if (finns?.anvandareId === anvandareId) return (await m.update({ where: { id }, data, select: { id: true } })).id;
      const { id: _bort, ...utanId } = data;
      void _bort;
      return (await m.create({ data: { ...(finns ? utanId : data), anvandareId }, select: { id: true } })).id;
    }

    const fMap = new Map<string, string>();
    for (const f of b.flaskor as Rad[]) {
      const dId = dryck(f.dryckId);
      if (!dId) continue;
      fMap.set(f.id as string, await spara("flaska", f, { ...rensa(f, F.flaska), dryckId: dId }));
      antal.flaskor++;
    }
    const pMap = new Map<string, string>();
    for (const pr of b.provningar as Rad[]) {
      pMap.set(pr.id as string, await spara("provning", pr, rensa(pr, F.provning)));
      antal.provningar++;
    }
    for (const r of b.betyg as Rad[]) {
      const dId = dryck(r.dryckId);
      if (!dId) continue;
      await spara("betyg", r, {
        ...rensa(r, F.betyg),
        dryckId: dId,
        flaskaId: r.flaskaId ? (fMap.get(r.flaskaId as string) ?? null) : null,
        provningId: r.provningId ? (pMap.get(r.provningId as string) ?? null) : null,
      });
      antal.betyg++;
    }
    for (const o of b.onskningar as Rad[]) {
      await spara("onskning", o, { ...rensa(o, F.onskning), dryckId: dryck(o.dryckId) });
      antal.onskningar++;
    }
    for (const sa of b.smakanalyser as Rad[]) await spara("smakanalys", sa, rensa(sa, F.smakanalys));
  });
  return { ok: true, antal };
}
