"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { EGNA_FORST, kravAnvandare, synligaDrycker } from "@/lib/auth";
import { typFor } from "@/lib/kategorier";
import { dubblettNyckel, normalisera, sokText } from "@/lib/sok";
import { aiMode } from "@/lib/ai";
import { satBildOmSaknas } from "@/lib/bilder";
import { BetygIn, DryckIn, FlaskaIn, faltFel, type FaltFel } from "@/lib/validering";

/** Längre tidsgräns för transaktioner, eftersom databasen kan ligga långt bort (t.ex. Neon). */
const TX = { maxWait: 10_000, timeout: 20_000 };

export type Resultat = { ok: true; id: string } | { ok: false; fel: FaltFel };

function dryckData(d: ReturnType<typeof DryckIn.parse>) {
  return { ...d, typ: typFor(d.kategori), sok: sokText(d), prisUppskattat: d.prisUppskattat ?? false };
}

function flaskaData(f: ReturnType<typeof FlaskaIn.parse>) {
  return { ...f, inkopsdatum: f.inkopsdatum ? new Date(f.inkopsdatum) : null };
}

function uppdatera(id?: string) {
  revalidatePath("/");
  revalidatePath("/historik");
  revalidatePath("/statistik");
  if (id) revalidatePath(`/flaska/${id}`);
}

/** Ny flaska av en dryck som redan finns i katalogen. */
export async function laggTillFranKatalog(dryckId: string, flaska: unknown, bildUrl?: string | null): Promise<Resultat> {
  const anv = await kravAnvandare();
  const f = FlaskaIn.safeParse(flaska);
  if (!f.success) return { ok: false, fel: faltFel(f.error) };
  const dryck = await db.dryck.findFirst({ where: { id: dryckId, ...synligaDrycker(anv.id) }, select: { id: true } });
  if (!dryck) return { ok: false, fel: { _: "Drycken finns inte längre i katalogen." } };
  const ny = await db.flaska.create({ data: { ...flaskaData(f.data), dryckId, anvandareId: anv.id } });
  // ett etikettfoto som togs när flaskan identifierades blir katalogens bild om den saknar en
  if (bildUrl) await satBildOmSaknas(dryckId, bildUrl, anv.id);
  uppdatera();
  return { ok: true, id: ny.id };
}

/** Fält som en ny tillagd dryck får fylla i hos en befintlig katalogdryck om de saknas där ("lär sig"). */
const FYLLBARA = ["producent", "land", "region", "argang", "alkoholhalt", "volymMl", "fyllighet", "sotma", "syra", "stravhet", "rokighet", "beskrivning", "bildUrl", "ean", "sbArtikelnr", "prisCa"] as const;

/**
 * Ny dryck plus flaska i ett steg. Drycken hamnar i den gemensamma katalogen, så att nästa person som
 * söker hittar den. Finns den redan där (samma streckkod, eller samma namn, producent och årgång)
 * används den befintliga, och tomma uppgifter fylls i med det du har angett.
 */
export async function laggTillNy(dryck: unknown, flaska: unknown, kalla: "manuell" | "ai" = "manuell"): Promise<Resultat> {
  const anv = await kravAnvandare();
  const d = DryckIn.safeParse(dryck);
  const f = FlaskaIn.safeParse(flaska);
  if (!d.success || !f.success) {
    return { ok: false, fel: { ...(d.success ? {} : faltFel(d.error)), ...(f.success ? {} : prefix(faltFel(f.error), "flaska.")) } };
  }
  const data = dryckData(d.data);
  // exempeldata från AI:ns provläge ska inte hamna i den gemensamma katalogen
  const dela = !(kalla === "ai" && aiMode() === "mock");

  const ny = await db.$transaction(async (tx) => {
    const finns =
      (data.ean && (await tx.dryck.findFirst({ where: { ean: data.ean, ...synligaDrycker(anv.id) }, orderBy: EGNA_FORST }))) ||
      (await tx.dryck.findMany({ where: { sok: { contains: normalisera(data.namn) }, ...synligaDrycker(anv.id) }, take: 200 })).find((x) => dubblettNyckel(x) === dubblettNyckel(data)) ||
      null;
    let dryckId: string;
    if (finns) {
      dryckId = finns.id;
      const fyll: Record<string, unknown> = {};
      for (const k of FYLLBARA) if (finns[k] == null && data[k] != null) fyll[k] = data[k];
      if ((finns.druvor == null || (Array.isArray(finns.druvor) && !finns.druvor.length)) && data.druvor.length) fyll.druvor = data.druvor;
      if (fyll.ean && (await tx.dryck.findFirst({ where: { ean: fyll.ean as string, agareId: finns.agareId }, select: { id: true } }))) delete fyll.ean;
      if (Object.keys(fyll).length) await tx.dryck.update({ where: { id: finns.id }, data: { ...fyll, sok: sokText({ ...finns, ...fyll } as never) } });
    } else {
      const dr = await tx.dryck.create({ data: { ...data, kalla, agareId: dela ? null : anv.id, skapadAvId: anv.id } });
      dryckId = dr.id;
    }
    return tx.flaska.create({ data: { ...flaskaData(f.data), dryckId, anvandareId: anv.id } });
  }, TX);
  uppdatera();
  return { ok: true, id: ny.id };
}

/**
 * Sparar ändringar. Är drycken din egen uppdateras den; är den från den delade katalogen
 * skapas en egen kopia, så att andras samlingar inte påverkas.
 */
export async function redigeraFlaska(flaskaId: string, dryck: unknown, flaska: unknown): Promise<Resultat> {
  const anv = await kravAnvandare();
  const d = DryckIn.safeParse(dryck);
  const f = FlaskaIn.safeParse(flaska);
  if (!d.success || !f.success) {
    return { ok: false, fel: { ...(d.success ? {} : faltFel(d.error)), ...(f.success ? {} : prefix(faltFel(f.error), "flaska.")) } };
  }
  const cur = await db.flaska.findFirst({ where: { id: flaskaId, anvandareId: anv.id }, select: { dryckId: true, dryck: { select: { agareId: true, skapadAvId: true, kalla: true, kallaId: true, licens: true, bildUrl: true } } } });
  if (!cur) return { ok: false, fel: { _: "Flaskan finns inte längre." } };
  if (d.data.ean) {
    const krock = await db.dryck.findFirst({ where: { ean: d.data.ean, agareId: anv.id, NOT: { id: cur.dryckId } }, select: { id: true } });
    if (krock) return { ok: false, fel: { ean: "En annan av dina drycker har redan den här streckkoden." } };
  }
  // Den som lade in en dryck i katalogen får rätta den så länge ingen annan har den i sin samling eller historik.
  const andraAnvander =
    cur.dryck.agareId === null &&
    ((await db.flaska.count({ where: { dryckId: cur.dryckId, NOT: { anvandareId: anv.id } } })) > 0 ||
      (await db.betyg.count({ where: { dryckId: cur.dryckId, NOT: { anvandareId: anv.id } } })) > 0);
  const egen = cur.dryck.agareId === anv.id || (cur.dryck.agareId === null && cur.dryck.skapadAvId === anv.id && !andraAnvander);
  await db.$transaction(async (tx) => {
    let dryckId = cur.dryckId;
    if (egen) {
      await tx.dryck.update({ where: { id: dryckId }, data: dryckData(d.data) });
    } else {
      const kopia = await tx.dryck.create({
        data: { ...dryckData(d.data), bildUrl: d.data.bildUrl ?? cur.dryck.bildUrl, kalla: cur.dryck.kalla, kallaId: cur.dryck.kallaId, licens: cur.dryck.licens, agareId: anv.id },
      });
      dryckId = kopia.id;
      // dina betyg på den här flaskan följer med till kopian
      await tx.betyg.updateMany({ where: { anvandareId: anv.id, flaskaId }, data: { dryckId } });
    }
    await tx.flaska.update({ where: { id: flaskaId }, data: { ...flaskaData(f.data), dryckId } });
  }, TX);
  uppdatera(flaskaId);
  return { ok: true, id: flaskaId };
}

/**
 * "Drack den": minskar antalet med en och sparar betyget (om ett gavs) i historiken.
 * betyg = null betyder "Hoppa över".
 */
export async function drackDen(flaskaId: string, betyg: unknown | null): Promise<Resultat> {
  const b = betyg == null ? null : BetygIn.safeParse(betyg);
  if (b && !b.success) return { ok: false, fel: faltFel(b.error) };
  const anv = await kravAnvandare();
  const fl = await db.flaska.findFirst({ where: { id: flaskaId, anvandareId: anv.id }, select: { id: true, dryckId: true, antal: true } });
  if (!fl) return { ok: false, fel: { _: "Flaskan finns inte längre." } };
  if (fl.antal < 1) return { ok: false, fel: { _: "Det finns inga flaskor kvar att dricka." } };
  await db.$transaction(async (tx) => {
    await tx.flaska.update({ where: { id: fl.id }, data: { antal: { decrement: 1 } } });
    if (b?.success) await tx.betyg.create({ data: { ...b.data, dryckId: fl.dryckId, flaskaId: fl.id, anvandareId: anv.id } });
  });
  uppdatera(flaskaId);
  return { ok: true, id: flaskaId };
}

export async function andraAntal(flaskaId: string, delta: 1 | -1): Promise<Resultat> {
  const anv = await kravAnvandare();
  const fl = await db.flaska.findFirst({ where: { id: flaskaId, anvandareId: anv.id }, select: { antal: true } });
  if (!fl) return { ok: false, fel: { _: "Flaskan finns inte längre." } };
  const antal = Math.max(0, Math.min(999, fl.antal + delta));
  await db.flaska.update({ where: { id: flaskaId }, data: { antal } });
  uppdatera(flaskaId);
  return { ok: true, id: flaskaId };
}

/** Tar bort posten ur samlingen. Drycken och betygshistoriken finns kvar. */
export async function taBortFlaska(flaskaId: string): Promise<Resultat> {
  const anv = await kravAnvandare();
  await db.flaska.deleteMany({ where: { id: flaskaId, anvandareId: anv.id } });
  uppdatera();
  return { ok: true, id: flaskaId };
}

export async function taBortBetyg(betygId: string): Promise<Resultat> {
  const anv = await kravAnvandare();
  const b = await db.betyg.findFirst({ where: { id: betygId, anvandareId: anv.id }, select: { flaskaId: true } });
  if (b) await db.betyg.delete({ where: { id: betygId } });
  uppdatera(b?.flaskaId ?? undefined);
  return { ok: true, id: betygId };
}

function prefix(fel: FaltFel, p: string): FaltFel {
  return Object.fromEntries(Object.entries(fel).map(([k, v]) => [p + k, v]));
}
