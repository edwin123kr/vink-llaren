/**
 * Normalisering av externa källor till katalogens format.
 * Ingenting hittas på: fält som saknas i källan lämnas tomma (null).
 */
import { normalisera, sokText } from "../../lib/sok";
import { typFor } from "../../lib/kategorier";
import { pyList } from "./csv";

export interface DryckInput {
  namn: string;
  producent: string | null;
  typ: "vin" | "sprit";
  kategori: string;
  druvor: string[];
  land: string | null;
  region: string | null;
  argang: number | null;
  alkoholhalt: number | null;
  volymMl: number | null;
  fyllighet: number | null;
  syra: number | null;
  mat: string[];
  bildUrl: string | null;
  ean: string | null;
  kalla: "xwines" | "openfoodfacts";
  kallaId: string;
  licens: string;
  sok: string;
}

/* ---------- länder ---------- */
const svRegion = new Intl.DisplayNames(["sv"], { type: "region" });
const enRegion = new Intl.DisplayNames(["en"], { type: "region" });
const ISO2: string[] = [];
for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) ISO2.push(String.fromCharCode(a, b));

const enToIso = new Map<string, string>();
for (const code of ISO2) {
  try {
    const n = enRegion.of(code);
    if (n && n !== code) enToIso.set(normalisera(n), code);
  } catch {
    /* ogiltig kod */
  }
}
enToIso.set("england", "GB").set("scotland", "GB").set("wales", "GB").set("usa", "US").set("united states of america", "US");

export function landFranIso(code: string | null | undefined): string | null {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  try {
    const n = svRegion.of(code.toUpperCase());
    return n && n !== code.toUpperCase() ? n : null;
  } catch {
    return null;
  }
}

/** "en:united-kingdom" eller "Italy" → "Storbritannien" / "Italien" */
export function landFranEngelska(s: string | null | undefined): string | null {
  if (!s) return null;
  const key = normalisera(s.replace(/^[a-z]{2}:/, "").replace(/-/g, " "));
  const iso = enToIso.get(key);
  return iso ? landFranIso(iso) : null;
}

/* ---------- X-Wines ---------- */
const XW_TYP: Record<string, string> = {
  red: "rott",
  white: "vitt",
  "rosé": "rose",
  rose: "rose",
  sparkling: "mousserande",
  dessert: "sott",
  "dessert/port": "starkvin",
};
const XW_KROPP: Record<string, number> = {
  "very light-bodied": 2,
  "light-bodied": 4,
  "medium-bodied": 6,
  "full-bodied": 9,
  "very full-bodied": 11,
};
const XW_SYRA: Record<string, number> = { low: 3, medium: 6, high: 9 };

/** Vanliga matkategorier i X-Wines (engelska) → svenska. Okända behålls som de är. */
const MAT_SV: Record<string, string> = {
  beef: "nötkött", lamb: "lamm", veal: "kalv", pork: "fläsk", poultry: "fågel", "game meat": "vilt",
  "cured meat": "chark", "rich fish": "fet fisk", "lean fish": "mager fisk", fish: "fisk", shellfish: "skaldjur",
  seafood: "skaldjur", pasta: "pasta", pizza: "pizza", risotto: "risotto", grilled: "grillat", barbecue: "grillat",
  vegetarian: "vegetariskt", mushrooms: "svamp", "spicy food": "kryddstark mat", "maturated cheese": "lagrad ost",
  "hard cheese": "hårdost", "soft cheese": "mjuk ost", "blue cheese": "blåmögelost", "goat cheese": "getost",
  cheese: "ost", "mild cheese": "mild ost", appetizer: "förrätt", snack: "tilltugg", dessert: "dessert",
  "sweet dessert": "söt dessert", "fruit dessert": "fruktdessert", chocolate: "choklad", aperitif: "aperitif",
  "cake": "tårta", "french fries": "pommes frites", tomato: "tomat", chestnut: "kastanj", sushi: "sushi",
};
export function matSv(items: string[]): string[] {
  return [...new Set(items.map((m) => MAT_SV[m.toLowerCase()] ?? m))];
}

function num(s: string | undefined): number | null {
  if (s == null || s.trim() === "") return null;
  const v = Number(s.replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

export function fromXWines(r: Record<string, string>): DryckInput | null {
  const namn = r.WineName?.trim();
  const kategori = XW_TYP[(r.Type ?? "").trim().toLowerCase()];
  if (!namn || !kategori) return null;
  const d = {
    namn,
    producent: r.WineryName?.trim() || null,
    typ: typFor(kategori),
    kategori,
    druvor: pyList(r.Grapes),
    land: landFranIso(r.Code) ?? (r.Country?.trim() || null),
    region: r.RegionName?.trim() || null,
    argang: null, // X-Wines listar tillgängliga årgångar; katalograden gäller vinet, inte en årgång
    alkoholhalt: num(r.ABV),
    volymMl: null,
    fyllighet: XW_KROPP[(r.Body ?? "").trim().toLowerCase()] ?? null,
    syra: XW_SYRA[(r.Acidity ?? "").trim().toLowerCase()] ?? null,
    mat: matSv(pyList(r.Harmonize)),
    bildUrl: null,
    ean: null,
    kalla: "xwines" as const,
    kallaId: String(r.WineID ?? "").trim(),
    licens: "CC0-1.0",
  };
  return { ...d, sok: sokText(d) };
}

/* ---------- Open Food Facts ---------- */
/** Ordning spelar roll: mest specifik kategori först. */
const OFF_KAT: [string, string][] = [
  ["en:champagnes", "mousserande"], ["en:sparkling-wines", "mousserande"], ["en:proseccos", "mousserande"], ["en:cavas", "mousserande"],
  ["en:rose-wines", "rose"], ["en:red-wines", "rott"], ["en:white-wines", "vitt"],
  ["en:ports", "starkvin"], ["en:fortified-wines", "starkvin"], ["en:sherries", "starkvin"], ["en:madeiras", "starkvin"],
  ["en:dessert-wines", "sott"], ["en:sweet-wines", "sott"],
  ["en:mezcals", "mezcal"], ["en:tequilas", "tequila"], ["en:whiskies", "whisky"], ["en:whisky", "whisky"],
  ["en:rums", "rom"], ["en:gins", "gin"], ["en:cognacs", "cognac"], ["en:armagnacs", "brandy"], ["en:brandies", "brandy"],
  ["en:vodkas", "vodka"], ["en:aquavits", "akvavit"], ["en:akvavits", "akvavit"], ["en:liqueurs", "likor"],
  ["en:spirits", "ovrig-sprit"], ["en:distilled-spirits", "ovrig-sprit"],
];

/** "75 cl" | "750ml" | "1,5 l" | "0.7 L" → milliliter */
export function volymMl(q: string | undefined | null): number | null {
  if (!q) return null;
  const m = q.toLowerCase().replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(ml|cl|dl|l)\b/);
  if (!m) return null;
  const v = Number(m[1]) * { ml: 1, cl: 10, dl: 100, l: 1000 }[m[2] as "ml" | "cl" | "dl" | "l"];
  return v > 0 && v <= 20000 ? Math.round(v) : null;
}

export interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_sv?: string;
  product_name_en?: string;
  brands?: string;
  categories_tags?: string[] | string;
  origins_tags?: string[] | string;
  quantity?: string;
  nutriments?: { alcohol_100g?: number | string; alcohol?: number | string };
  alcohol_100g?: number | string;
  image_front_url?: string;
  image_url?: string;
}

function tags(v: string[] | string | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean);
}

export function offKategori(p: OffProduct): string | null {
  const t = new Set(tags(p.categories_tags));
  for (const [tag, kat] of OFF_KAT) if (t.has(tag)) return kat;
  if (t.has("en:wines")) return null; // vin utan färg: hoppa hellre över än gissa
  return null;
}

export function fromOff(p: OffProduct): DryckInput | null {
  const ean = (p.code ?? "").trim();
  if (!/^\d{8,14}$/.test(ean)) return null;
  const kategori = offKategori(p);
  if (!kategori) return null;
  const namn = (p.product_name_sv || p.product_name || p.product_name_en || "").trim();
  if (!namn) return null;
  const alk = Number(String(p.nutriments?.alcohol_100g ?? p.nutriments?.alcohol ?? p.alcohol_100g ?? "").replace(",", "."));
  const d = {
    namn,
    producent: (p.brands ?? "").split(",")[0]?.trim() || null,
    typ: typFor(kategori),
    kategori,
    druvor: [],
    land: landFranEngelska(tags(p.origins_tags)[0]),
    region: null,
    argang: null,
    alkoholhalt: Number.isFinite(alk) && alk > 0 && alk <= 96 ? alk : null,
    volymMl: volymMl(p.quantity),
    fyllighet: null,
    syra: null,
    mat: [],
    bildUrl: p.image_front_url || p.image_url || null,
    ean,
    kalla: "openfoodfacts" as const,
    kallaId: ean,
    licens: "ODbL-1.0",
  };
  return { ...d, sok: sokText(d) };
}
