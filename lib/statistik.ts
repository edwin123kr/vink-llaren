/** Statistik över samlingen och betygen. Rena funktioner (testas i statistik.test.ts). */
export interface StatFlaska {
  antal: number;
  inkopspris: number | null;
  prisCa: number | null;
  kategori: string;
  drickFran: number | null;
  drickTill: number | null;
}

export interface StatBetyg {
  dryckId: string;
  namn: string;
  betyg: number; // tiondelar
  druvor: string[];
  land: string | null;
  pris: number | null; // inköpspris eller ungefärligt pris
}

export function samlingsvarde(flaskor: StatFlaska[]) {
  let kant = 0;
  let uppskattat = 0;
  let utanPris = 0;
  let antal = 0;
  for (const f of flaskor) {
    antal += f.antal;
    if (f.inkopspris != null) kant += f.inkopspris * f.antal;
    else if (f.prisCa != null) uppskattat += f.prisCa * f.antal;
    else utanPris += f.antal;
  }
  return { antal, poster: flaskor.length, kant, uppskattat, totalt: kant + uppskattat, utanPris };
}

export function perKategori(flaskor: StatFlaska[]) {
  const m = new Map<string, number>();
  for (const f of flaskor) m.set(f.kategori, (m.get(f.kategori) ?? 0) + f.antal);
  return [...m.entries()].map(([kategori, antal]) => ({ kategori, antal })).sort((a, b) => b.antal - a.antal);
}

/** Snittbetyg per grupp (druva, land). Varje betyg räknas en gång. */
export function snittPer(betyg: StatBetyg[], nyckel: (b: StatBetyg) => string[], minAntal = 1) {
  const m = new Map<string, { sum: number; n: number }>();
  for (const b of betyg) {
    for (const k of nyckel(b)) {
      const g = m.get(k) ?? { sum: 0, n: 0 };
      g.sum += b.betyg;
      g.n++;
      m.set(k, g);
    }
  }
  return [...m.entries()]
    .filter(([, g]) => g.n >= minAntal)
    .map(([namn, g]) => ({ namn, snitt: Math.round(g.sum / g.n), antal: g.n }))
    .sort((a, b) => b.snitt - a.snitt || b.antal - a.antal || a.namn.localeCompare(b.namn, "sv"));
}

/**
 * Mest prisvärda: betyg per krona, uttryckt som "betygspoäng per 100 kr".
 * Bara drycker med både betyg och pris. Snittbetyg per dryck.
 */
export function prisvardast(betyg: StatBetyg[], max = 10) {
  const per = new Map<string, { namn: string; sum: number; n: number; pris: number | null }>();
  for (const b of betyg) {
    const g = per.get(b.dryckId) ?? { namn: b.namn, sum: 0, n: 0, pris: b.pris };
    g.sum += b.betyg;
    g.n++;
    if (g.pris == null && b.pris != null) g.pris = b.pris;
    per.set(b.dryckId, g);
  }
  return [...per.entries()]
    .filter(([, g]) => g.pris != null && g.pris > 0)
    .map(([dryckId, g]) => {
      const snitt = g.sum / g.n;
      return { dryckId, namn: g.namn, snitt: Math.round(snitt), pris: g.pris!, per100kr: Math.round(((snitt / 10) / g.pris!) * 100 * 100) / 100 };
    })
    .sort((a, b) => b.per100kr - a.per100kr)
    .slice(0, max);
}
