import { z } from "zod";
import { KATEGORI_IDS } from "@/lib/kategorier";

const smak = z.number().int().min(0).max(12).nullable().describe("0–12, som Systembolagets smakklockor. null om okänt.");

/** Det Claude fyller i om en dryck (vid AI-ifyllning och etikettfoto). */
export const DryckForslag = z.object({
  namn: z.string().describe("Produktnamn utan producent"),
  producent: z.string().nullable(),
  kategori: z.enum(KATEGORI_IDS),
  druvor: z.array(z.string()).describe("Druvor för vin, råvara för sprit (t.ex. 'mältat korn', 'blå agave')"),
  land: z.string().nullable().describe("På svenska, t.ex. 'Italien'"),
  region: z.string().nullable(),
  argang: z.number().int().nullable(),
  alkoholhalt: z.number().nullable().describe("Procent"),
  volymMl: z.number().int().nullable(),
  fyllighet: smak,
  sotma: smak,
  syra: smak,
  stravhet: smak,
  rokighet: smak,
  aromer: z.array(z.string()).describe("3–8 dofter/aromer på svenska"),
  mat: z.array(z.string()).describe("2–5 matrekommendationer på svenska"),
  beskrivning: z.string().describe("2–3 meningar på svenska"),
  prisCa: z.number().int().nullable().describe("Ungefärligt pris i svenska kronor, eller null om du inte vet"),
  sakerhet: z.enum(["hog", "medel", "lag"]).describe("Hur säker identifieringen och uppgifterna är"),
});
export type DryckForslag = z.infer<typeof DryckForslag>;

/** Svar på ett etikettfoto. */
export const EtikettSvar = DryckForslag.extend({
  arDryck: z.boolean().describe("false om bilden inte visar en vin- eller spritflaska/etikett"),
  lastText: z.string().describe("Den text du kan läsa på etiketten, ordagrant och kort"),
});
export type EtikettSvar = z.infer<typeof EtikettSvar>;

/** Smakanalys för vin eller sprit. Rekommendationer pekar bara på id:n ur den skickade kandidatlistan. */
export const Smakanalys = z.object({
  sammanfattning: z.string().describe("3–5 meningar på svenska, i du-form, om vad användaren gillar och inte gillar"),
  gillar: z.array(z.string()).describe("2–5 korta punkter om stilar/egenskaper användaren uppskattar"),
  mindreForstjust: z.array(z.string()).describe("0–4 korta punkter om det användaren uppskattar mindre"),
  rekommendationer: z
    .array(z.object({ id: z.string().describe("id ur kandidatlistan"), motivering: z.string().describe("1–2 meningar: varför den passar just den här smaken") }))
    .describe("3–6 rekommendationer, endast id:n ur kandidatlistan"),
  utforska: z
    .array(
      z.object({
        typ: z.enum(["druva", "region", "spritsort"]),
        namn: z.string(),
        varfor: z.string().describe("1–2 meningar om varför det kan passa"),
        instegsflaska: z.string().describe("En konkret, lättillgänglig flaska eller stil att börja med"),
        ungefarligtPris: z.number().int().nullable().describe("Ungefärligt pris i kronor, eller null"),
      }),
    )
    .describe("3–5 saker användaren aldrig testat, helst bland de otestade som skickades"),
  undvik: z.array(z.object({ stil: z.string(), varfor: z.string() })).describe("0–3 stilar med konsekvent låga betyg; tom lista om underlaget saknas"),
});
export type Smakanalys = z.infer<typeof Smakanalys>;

/** Förslag till vinprovning, i provningsordning. */
export const Provningsforslag = z.object({
  inledning: z.string().describe("2–3 meningar om provningens upplägg och tema"),
  ordningMotivering: z.string().describe("1–2 meningar om varför ordningen är som den är"),
  viner: z
    .array(
      z.object({
        namn: z.string().describe("Konkret vin, gärna ett som brukar finnas på Systembolaget"),
        producent: z.string().nullable(),
        kategori: z.enum(["rott", "vitt", "rose", "mousserande", "sott", "starkvin"]),
        druvor: z.array(z.string()),
        land: z.string().nullable(),
        region: z.string().nullable(),
        prisCa: z.number().int().nullable().describe("Ungefärligt pris per flaska i kronor"),
        stil: z.string().describe("Kort stilbeskrivning, t.ex. 'lätt och friskt'"),
        varfor: z.string().describe("Varför vinet passar i provningen"),
        doft: z.array(z.string()).describe("3–5 saker att dofta efter"),
        smak: z.array(z.string()).describe("3–5 saker att smaka efter"),
        serverTemp: z.string().describe("T.ex. '8–10 °C'"),
        mat: z.string().describe("En konkret matmatchning"),
      }),
    )
    .describe("Exakt det antal viner som efterfrågas, i provningsordning"),
});
export type Provningsforslag = z.infer<typeof Provningsforslag>;
