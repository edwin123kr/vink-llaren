import { z } from "zod";
import { KATEGORI_IDS } from "@/lib/kategorier";

const text = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s === "" ? null : s))
    .nullable()
    .optional();
const heltal = (min: number, max: number) => z.number().int().min(min).max(max).nullable().optional();
const smak = heltal(0, 12);
const lista = z.array(z.string().trim().min(1).max(60)).max(20).default([]);
const ar = new Date().getFullYear();

/** En dryck i katalogen, som formuläret skickar den. */
export const DryckIn = z.object({
  namn: z.string().trim().min(1, "Ange ett namn.").max(200),
  producent: text(),
  kategori: z.enum(KATEGORI_IDS, { message: "Välj en kategori." }),
  druvor: lista,
  land: text(80),
  region: text(120),
  argang: heltal(1800, ar + 1).refine((v) => v == null || v <= ar + 1, "Årgången kan inte ligga i framtiden."),
  alkoholhalt: z.number().min(0).max(96).nullable().optional(),
  volymMl: heltal(20, 20000),
  fyllighet: smak,
  sotma: smak,
  syra: smak,
  stravhet: smak,
  rokighet: smak,
  aromer: lista,
  mat: lista,
  beskrivning: text(2000),
  bildUrl: text(500),
  ean: z
    .string()
    .trim()
    .transform((s) => (s === "" ? null : s))
    .refine((s) => s == null || /^\d{8,14}$/.test(s), "En streckkod har 8–14 siffror.")
    .nullable()
    .optional(),
  sbArtikelnr: text(20),
  prisCa: heltal(0, 1_000_000),
  prisUppskattat: z.boolean().optional(),
});
export type DryckIn = z.input<typeof DryckIn>;

/** En post i samlingen. */
export const FlaskaIn = z
  .object({
    antal: z.number().int().min(1, "Minst en flaska.").max(999),
    inkopspris: heltal(0, 1_000_000),
    inkopsdatum: z
      .string()
      .trim()
      .transform((s) => (s === "" ? null : s))
      .refine((s) => s == null || !Number.isNaN(Date.parse(s)), "Ogiltigt datum.")
      .nullable()
      .optional(),
    inkopsstalle: text(120),
    plats: text(120),
    drickFran: heltal(1900, 2200),
    drickTill: heltal(1900, 2200),
    anteckningar: text(2000),
  })
  .refine((f) => f.drickFran == null || f.drickTill == null || f.drickFran <= f.drickTill, {
    message: "Drick från måste vara före drick till.",
    path: ["drickTill"],
  });
export type FlaskaIn = z.input<typeof FlaskaIn>;

export const BetygIn = z.object({
  betyg: z.number().int().min(0).max(100),
  kommentar: text(1000),
  tillfalle: text(200),
});

export type FaltFel = Record<string, string>;

/** Zod-fel → { fält: första felmeddelandet } */
export function faltFel(e: z.ZodError): FaltFel {
  const out: FaltFel = {};
  for (const i of e.issues) {
    const k = i.path.join(".") || "_";
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
