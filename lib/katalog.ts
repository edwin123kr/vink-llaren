import "server-only";
import { db } from "@/lib/db";
import { synligaDrycker } from "@/lib/auth";
import { gemensamtBetyg } from "@/lib/gemenskap";
import { normalisera } from "@/lib/sok";
import type { Prisma } from "@/lib/generated/prisma/client";

export const KALLOR: Record<string, { namn: string; licens: string; url?: string }> = {
  xwines: { namn: "X-Wines", licens: "CC0-1.0", url: "https://github.com/rogerioxavier/X-Wines" },
  openfoodfacts: { namn: "Open Food Facts", licens: "ODbL-1.0", url: "https://world.openfoodfacts.org" },
  ai: { namn: "Vinkällarens användare", licens: "Egen" },
  manuell: { namn: "Vinkällarens användare", licens: "Egen" },
  demo: { namn: "Vinkällaren", licens: "Egen" },
};

/** Sök i katalogen: varje ord måste finnas i söktexten (namn, producent, region, land, druvor). */
export async function sokKatalog(anvandareId: string, q: string, opts: { kategori?: string; typ?: string; limit?: number } = {}) {
  const ord = normalisera(q).split(" ").filter((w) => w.length > 0).slice(0, 6);
  const where: Prisma.DryckWhereInput = {
    AND: [...ord.map((w) => ({ sok: { contains: w } })), synligaDrycker(anvandareId)],
    ...(opts.kategori ? { kategori: opts.kategori } : {}),
    ...(opts.typ ? { typ: opts.typ } : {}),
  };
  const traffar = await db.dryck.findMany({
    where,
    take: Math.min(opts.limit ?? 20, 50) * 3,
    select: { id: true, namn: true, producent: true, kategori: true, typ: true, land: true, region: true, argang: true, prisCa: true, bildUrl: true, kalla: true, sok: true },
  });
  // enkel rankning: namnet börjar med sökordet först, sedan kortare namn
  const forsta = ord[0] ?? "";
  const valda = traffar
    .map((t) => ({ t, poang: (normalisera(t.namn).startsWith(forsta) ? 0 : 1) * 1000 + t.namn.length }))
    .sort((a, b) => a.poang - b.poang)
    .slice(0, opts.limit ?? 20);
  const betyg = await gemensamtBetyg(valda.map(({ t }) => t.id));
  return valda.map(({ t }) => {
    const { sok: _sok, ...rest } = t;
    void _sok;
    return { ...rest, betyg: betyg.get(t.id) ?? null };
  });
}
