"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { typFor } from "@/lib/kategorier";
import { sokText } from "@/lib/sok";
import { BetygIn, DryckIn, FlaskaIn, faltFel, type FaltFel } from "@/lib/validering";

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
export async function laggTillFranKatalog(dryckId: string, flaska: unknown): Promise<Resultat> {
  const f = FlaskaIn.safeParse(flaska);
  if (!f.success) return { ok: false, fel: faltFel(f.error) };
  const dryck = await db.dryck.findUnique({ where: { id: dryckId }, select: { id: true } });
  if (!dryck) return { ok: false, fel: { _: "Drycken finns inte längre i katalogen." } };
  const ny = await db.flaska.create({ data: { ...flaskaData(f.data), dryckId } });
  uppdatera();
  return { ok: true, id: ny.id };
}

/** Ny dryck (manuellt eller AI-ifylld och granskad) plus flaska i ett steg. */
export async function laggTillNy(dryck: unknown, flaska: unknown, kalla: "manuell" | "ai" = "manuell"): Promise<Resultat> {
  const d = DryckIn.safeParse(dryck);
  const f = FlaskaIn.safeParse(flaska);
  if (!d.success || !f.success) {
    return { ok: false, fel: { ...(d.success ? {} : faltFel(d.error)), ...(f.success ? {} : prefix(faltFel(f.error), "flaska.")) } };
  }
  if (d.data.ean) {
    const finns = await db.dryck.findUnique({ where: { ean: d.data.ean }, select: { id: true } });
    if (finns) {
      const ny = await db.flaska.create({ data: { ...flaskaData(f.data), dryckId: finns.id } });
      uppdatera();
      return { ok: true, id: ny.id };
    }
  }
  const ny = await db.$transaction(async (tx) => {
    const dr = await tx.dryck.create({ data: { ...dryckData(d.data), kalla } });
    return tx.flaska.create({ data: { ...flaskaData(f.data), dryckId: dr.id } });
  });
  uppdatera();
  return { ok: true, id: ny.id };
}

export async function redigeraFlaska(flaskaId: string, dryck: unknown, flaska: unknown): Promise<Resultat> {
  const d = DryckIn.safeParse(dryck);
  const f = FlaskaIn.safeParse(flaska);
  if (!d.success || !f.success) {
    return { ok: false, fel: { ...(d.success ? {} : faltFel(d.error)), ...(f.success ? {} : prefix(faltFel(f.error), "flaska.")) } };
  }
  const cur = await db.flaska.findUnique({ where: { id: flaskaId }, select: { dryckId: true } });
  if (!cur) return { ok: false, fel: { _: "Flaskan finns inte längre." } };
  if (d.data.ean) {
    const krock = await db.dryck.findFirst({ where: { ean: d.data.ean, NOT: { id: cur.dryckId } }, select: { id: true } });
    if (krock) return { ok: false, fel: { ean: "En annan dryck i katalogen har redan den här streckkoden." } };
  }
  await db.$transaction([
    db.dryck.update({ where: { id: cur.dryckId }, data: dryckData(d.data) }),
    db.flaska.update({ where: { id: flaskaId }, data: flaskaData(f.data) }),
  ]);
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
  const fl = await db.flaska.findUnique({ where: { id: flaskaId }, select: { id: true, dryckId: true, antal: true } });
  if (!fl) return { ok: false, fel: { _: "Flaskan finns inte längre." } };
  if (fl.antal < 1) return { ok: false, fel: { _: "Det finns inga flaskor kvar att dricka." } };
  await db.$transaction(async (tx) => {
    await tx.flaska.update({ where: { id: fl.id }, data: { antal: { decrement: 1 } } });
    if (b?.success) await tx.betyg.create({ data: { ...b.data, dryckId: fl.dryckId, flaskaId: fl.id } });
  });
  uppdatera(flaskaId);
  return { ok: true, id: flaskaId };
}

export async function andraAntal(flaskaId: string, delta: 1 | -1): Promise<Resultat> {
  const fl = await db.flaska.findUnique({ where: { id: flaskaId }, select: { antal: true } });
  if (!fl) return { ok: false, fel: { _: "Flaskan finns inte längre." } };
  const antal = Math.max(0, Math.min(999, fl.antal + delta));
  await db.flaska.update({ where: { id: flaskaId }, data: { antal } });
  uppdatera(flaskaId);
  return { ok: true, id: flaskaId };
}

/** Tar bort posten ur samlingen. Drycken och betygshistoriken finns kvar. */
export async function taBortFlaska(flaskaId: string): Promise<Resultat> {
  await db.flaska.delete({ where: { id: flaskaId } }).catch(() => null);
  uppdatera();
  return { ok: true, id: flaskaId };
}

export async function taBortBetyg(betygId: string): Promise<Resultat> {
  const b = await db.betyg.delete({ where: { id: betygId } }).catch(() => null);
  uppdatera(b?.flaskaId ?? undefined);
  return { ok: true, id: betygId };
}

function prefix(fel: FaltFel, p: string): FaltFel {
  return Object.fromEntries(Object.entries(fel).map(([k, v]) => [p + k, v]));
}
