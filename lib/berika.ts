import { normalisera } from "@/lib/sok";

/** De fält på en katalogdryck som kan komplettera ett AI-svar. */
export type KatalogDryckFull = {
  id: string;
  namn: string;
  producent: string | null;
  argang: number | null;
  druvor: unknown;
  land: string | null;
  region: string | null;
  alkoholhalt: number | null;
  volymMl: number | null;
  fyllighet: number | null;
  sotma: number | null;
  syra: number | null;
  stravhet: number | null;
  rokighet: number | null;
  aromer: unknown;
  mat: unknown;
};

type AiSvar = Record<string, unknown> & { namn: string; producent: string | null; osakraFalt: string[] };

const tom = (v: unknown) => v == null || v === "" || (Array.isArray(v) && v.length === 0);
const lika = (a: string | null | undefined, b: string | null | undefined) => normalisera(a) === normalisera(b);

/** Hittar katalogvinet som är samma som AI:n läste av: samma namn, och samma producent om båda har en. */
export function hittaSamma(svar: Pick<AiSvar, "namn" | "producent">, kandidater: KatalogDryckFull[]) {
  return kandidater.find((k) => lika(k.namn, svar.namn) && (!svar.producent || !k.producent || lika(k.producent, svar.producent))) ?? null;
}

const FALT = ["druvor", "land", "region", "alkoholhalt", "volymMl", "fyllighet", "sotma", "syra", "stravhet", "rokighet", "aromer", "mat"] as const;
const OSAKERBARA = new Set(["druvor", "land", "region", "alkoholhalt", "volymMl"]);

/**
 * Kompletterar AI-svaret med uppgifter från ett katalogvin som är samma: tomma fält fylls i, och fält som AI:n
 * markerat som osäkra (druvor, land, region, alkohol, volym) ersätts. Årgång och namn ändras aldrig.
 * Returnerar de fält som hämtades från katalogen.
 */
export function berika<T extends AiSvar>(svar: T, katalog: KatalogDryckFull | null): { svar: T; fran: string[] } {
  if (!katalog) return { svar, fran: [] };
  const ut: Record<string, unknown> = { ...svar };
  const fran: string[] = [];
  for (const f of FALT) {
    const ny = katalog[f];
    if (tom(ny)) continue;
    if (tom(svar[f]) || (OSAKERBARA.has(f) && svar.osakraFalt.includes(f))) {
      ut[f] = ny;
      fran.push(f);
    }
  }
  ut.osakraFalt = svar.osakraFalt.filter((f) => !fran.includes(f));
  // namnet matchar redan, så en saknad producent kan tas från katalogen
  if (!svar.producent && katalog.producent) {
    ut.producent = katalog.producent;
    fran.push("producent");
  }
  return { svar: ut as T, fran };
}
