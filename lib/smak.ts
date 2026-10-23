/**
 * Lokal smakanalys (ingen AI): profil, favoriter, "undvik"-kandidater, otestade stilar
 * och rekommendationskandidater ur katalogen. AI:n får bara resonera ovanpå de här siffrorna.
 */
import type { SmakKey, Typ } from "./kategorier";

export interface BetygadDryck {
  dryckId: string;
  namn: string;
  typ: Typ;
  kategori: string;
  druvor: string[];
  land: string | null;
  region: string | null;
  profil: Partial<Record<SmakKey, number | null>>;
  snitt: number; // tiondelar
  antal: number;
}

export interface KatalogDryck {
  id: string;
  namn: string;
  producent: string | null;
  typ: Typ;
  kategori: string;
  druvor: string[];
  land: string | null;
  region: string | null;
  profil: Partial<Record<SmakKey, number | null>>;
  prisCa: number | null;
}

export const DIM: Record<Typ, SmakKey[]> = {
  vin: ["fyllighet", "sotma", "syra", "stravhet"],
  sprit: ["fyllighet", "sotma", "rokighet"],
};

export const GILLAR = 70; // 7,0 och uppåt
export const GILLAR_MINDRE = 60; // under 6,0

export type Profil = Record<SmakKey, number | null>;

/** Medelprofil (0–12) för en mängd drycker, viktad med antal betyg. */
export function medelprofil(drycker: BetygadDryck[], dims: SmakKey[]): Profil {
  const out = {} as Profil;
  for (const k of dims) {
    let sum = 0;
    let w = 0;
    for (const d of drycker) {
      const v = d.profil[k];
      if (v == null) continue;
      sum += v * d.antal;
      w += d.antal;
    }
    out[k] = w ? Math.round((sum / w) * 10) / 10 : null;
  }
  return out;
}

export interface Grupp {
  namn: string;
  snitt: number;
  antal: number;
}

/** Snittbetyg per druva, land, region eller kategori. */
export function grupper(drycker: BetygadDryck[], nyckel: (d: BetygadDryck) => string[]): Grupp[] {
  const m = new Map<string, { sum: number; n: number }>();
  for (const d of drycker) {
    for (const k of nyckel(d)) {
      const g = m.get(k) ?? { sum: 0, n: 0 };
      g.sum += d.snitt * d.antal;
      g.n += d.antal;
      m.set(k, g);
    }
  }
  return [...m.entries()].map(([namn, g]) => ({ namn, snitt: Math.round(g.sum / g.n), antal: g.n })).sort((a, b) => b.snitt - a.snitt || b.antal - a.antal);
}

/** Stilar som konsekvent fått lågt betyg (minst två betyg, snitt under 5,5). */
export function undvikKandidater(drycker: BetygadDryck[]): Grupp[] {
  const alla = [
    ...grupper(drycker, (d) => d.druvor),
    ...grupper(drycker, (d) => (d.region ? [d.region] : [])),
    ...grupper(drycker, (d) => [d.kategori]),
  ];
  return alla.filter((g) => g.antal >= 2 && g.snitt < 55).sort((a, b) => a.snitt - b.snitt);
}

/** Avstånd mellan en dryck och en målprofil (0 = identisk, 1 = motsatt). null om för lite data. */
export function avstand(profil: Partial<Record<SmakKey, number | null>>, mal: Profil, dims: SmakKey[]): number | null {
  let sum = 0;
  let n = 0;
  for (const k of dims) {
    const a = profil[k];
    const b = mal[k];
    if (a == null || b == null) continue;
    sum += ((a - b) / 12) ** 2;
    n++;
  }
  return n >= 2 ? Math.sqrt(sum / n) : null;
}

/**
 * Rekommendationskandidater: katalogdrycker du inte har betygsatt, rankade efter likhet med det du gillar,
 * med bonus för favoritdruvor/-regioner och avdrag för "undvik".
 */
export function kandidater(katalog: KatalogDryck[], betygade: BetygadDryck[], typ: Typ, max = 25) {
  const dims = DIM[typ];
  const egna = betygade.filter((d) => d.typ === typ);
  const gillar = egna.filter((d) => d.snitt >= GILLAR);
  const mal = medelprofil(gillar.length ? gillar : egna, dims);
  const provade = new Set(egna.map((d) => d.dryckId));
  const favDruvor = new Set(grupper(gillar, (d) => d.druvor).slice(0, 5).map((g) => g.namn));
  const favReg = new Set(grupper(gillar, (d) => (d.region ? [d.region] : [])).slice(0, 5).map((g) => g.namn));
  const favKat = new Set(grupper(gillar, (d) => [d.kategori]).slice(0, 2).map((g) => g.namn));
  const undvik = new Set(undvikKandidater(egna).map((g) => g.namn));

  return katalog
    .filter((k) => k.typ === typ && !provade.has(k.id))
    .map((k) => {
      const dist = avstand(k.profil, mal, dims);
      let poang = dist == null ? 0.35 : 1 - dist;
      if (k.druvor.some((d) => favDruvor.has(d))) poang += 0.15;
      if (k.region && favReg.has(k.region)) poang += 0.1;
      if (favKat.has(k.kategori)) poang += 0.1;
      if (k.druvor.some((d) => undvik.has(d)) || (k.region && undvik.has(k.region)) || undvik.has(k.kategori)) poang -= 0.4;
      return { ...k, poang: Math.round(poang * 100) / 100 };
    })
    .sort((a, b) => b.poang - a.poang)
    .slice(0, max);
}

/** Druvor, regioner och kategorier i katalogen som du aldrig har betygsatt. */
export function otestade(katalog: KatalogDryck[], betygade: BetygadDryck[], typ: Typ) {
  const egna = betygade.filter((d) => d.typ === typ);
  const prov = {
    druvor: new Set(egna.flatMap((d) => d.druvor)),
    regioner: new Set(egna.map((d) => d.region).filter(Boolean) as string[]),
    kategorier: new Set(egna.map((d) => d.kategori)),
  };
  const raknare = (f: (k: KatalogDryck) => string[]) => {
    const m = new Map<string, number>();
    for (const k of katalog.filter((x) => x.typ === typ)) for (const v of f(k)) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
  };
  const topp = (m: Map<string, number>, provade: Set<string>, n: number) =>
    [...m.entries()].filter(([v]) => !provade.has(v)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([v]) => v);
  return {
    druvor: topp(raknare((k) => k.druvor), prov.druvor, 8),
    regioner: topp(raknare((k) => (k.region ? [k.region] : [])), prov.regioner, 8),
    kategorier: topp(raknare((k) => [k.kategori]), prov.kategorier, 6),
  };
}
