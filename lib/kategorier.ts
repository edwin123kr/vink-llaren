export type Typ = "vin" | "sprit";

export interface Kategori {
  id: string;
  namn: string;
  typ: Typ;
}

export const KATEGORIER: Kategori[] = [
  { id: "rott", namn: "Rött vin", typ: "vin" },
  { id: "vitt", namn: "Vitt vin", typ: "vin" },
  { id: "rose", namn: "Rosévin", typ: "vin" },
  { id: "mousserande", namn: "Mousserande", typ: "vin" },
  { id: "sott", namn: "Sött vin", typ: "vin" },
  { id: "starkvin", namn: "Starkvin", typ: "vin" },
  { id: "whisky", namn: "Whisky", typ: "sprit" },
  { id: "rom", namn: "Rom", typ: "sprit" },
  { id: "tequila", namn: "Tequila", typ: "sprit" },
  { id: "mezcal", namn: "Mezcal", typ: "sprit" },
  { id: "gin", namn: "Gin", typ: "sprit" },
  { id: "cognac", namn: "Cognac", typ: "sprit" },
  { id: "brandy", namn: "Brandy", typ: "sprit" },
  { id: "vodka", namn: "Vodka", typ: "sprit" },
  { id: "akvavit", namn: "Akvavit", typ: "sprit" },
  { id: "likor", namn: "Likör", typ: "sprit" },
  { id: "ovrig-sprit", namn: "Övrig sprit", typ: "sprit" },
];

export const KATEGORI_IDS = KATEGORIER.map((k) => k.id) as [string, ...string[]];

export function kategori(id: string): Kategori | undefined {
  return KATEGORIER.find((k) => k.id === id);
}

export function typFor(kategoriId: string): Typ {
  return kategori(kategoriId)?.typ ?? "vin";
}

/** Smakdimensioner, skala 0–12. Rökighet visas bara för sprit. */
export const SMAK = [
  { key: "fyllighet", namn: "Fyllighet" },
  { key: "sotma", namn: "Sötma" },
  { key: "syra", namn: "Syra" },
  { key: "stravhet", namn: "Strävhet" },
  { key: "rokighet", namn: "Rökighet" },
] as const;
export type SmakKey = (typeof SMAK)[number]["key"];
export const SMAK_MAX = 12;
