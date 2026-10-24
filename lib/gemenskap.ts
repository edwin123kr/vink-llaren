import "server-only";
import { db } from "@/lib/db";

/**
 * Betyg från alla användare. Snittet räknar alla betyg anonymt; kommentarer visas bara från den som
 * delar sina kommentarer, och då med förnamn.
 */
export async function gemensamtBetyg(dryckIds: string[]): Promise<Map<string, { snitt: number; antal: number }>> {
  if (!dryckIds.length) return new Map();
  const rader = await db.betyg.groupBy({ by: ["dryckId"], where: { dryckId: { in: dryckIds } }, _avg: { betyg: true }, _count: { _all: true } });
  return new Map(rader.map((r) => [r.dryckId, { snitt: Math.round(r._avg.betyg ?? 0), antal: r._count._all }]));
}

export type Recension = { id: string; namn: string; betyg: number; kommentar: string; datum: Date; egen: boolean };

export async function recensioner(dryckId: string, anvandareId: string, antal = 10): Promise<Recension[]> {
  const rader = await db.betyg.findMany({
    where: { dryckId, kommentar: { not: null }, OR: [{ anvandareId }, { anvandare: { delaKommentarer: true } }] },
    include: { anvandare: { select: { namn: true } } },
    orderBy: { datum: "desc" },
    take: antal,
  });
  return rader.map((b) => ({
    id: b.id,
    namn: b.anvandare.namn.trim().split(/\s+/)[0] || "En användare",
    betyg: b.betyg,
    kommentar: b.kommentar!,
    datum: b.datum,
    egen: b.anvandareId === anvandareId,
  }));
}
