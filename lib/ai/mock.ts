import type { DryckForslag, EtikettSvar, Provningsforslag, Smakanalys } from "./schemas";
import type { ProvningUnderlag, SmakUnderlag } from "./types";

/**
 * Provläge (AI_MODE=mock): deterministiska svar så att flöden kan byggas och testas utan API-nyckel.
 * Svaren hittar inte på fakta om specifika produkter, och AI-ifyllda drycker från provläget delas inte
 * till den gemensamma katalogen.
 */
export function mockDryckForslag(hint: string): DryckForslag {
  const h = hint.toLowerCase();
  const sprit = /whisky|whiskey|rom|rum|gin|tequila|mezcal|cognac|konjak|vodka|likör|calvados|armagnac/.test(h);
  // Provläget hittar inte på producent, region eller årgång; det föreslår bara typiska drag för stilen.
  if (sprit) {
    const kategori = /gin/.test(h) ? "gin" : /rom|rum/.test(h) ? "rom" : /vodka/.test(h) ? "vodka" : /tequila|mezcal/.test(h) ? "tequila" : /cognac|konjak/.test(h) ? "cognac" : /armagnac|calvados/.test(h) ? "brandy" : "whisky";
    return {
      namn: hint.trim(), producent: null, kategori, druvor: [], land: null, region: null, argang: null, alkoholhalt: 40, volymMl: 700,
      fyllighet: 7, sotma: 3, syra: null, stravhet: null, rokighet: kategori === "whisky" ? 4 : 0,
      aromer: kategori === "gin" ? ["enbär", "citrus"] : ["vanilj", "torkad frukt"], mat: kategori === "gin" ? ["drinkar"] : ["mörk choklad"],
      beskrivning: "", prisCa: null, sakerhet: "lag", osakraFalt: [],
    };
  }
  const kategori = /vit|blanc|riesling|chardonnay|sauvignon/.test(h) ? "vitt" : /rosé|rose/.test(h) ? "rose" : /champagne|cava|prosecco|crémant|mousser/.test(h) ? "mousserande" : "rott";
  const rott = kategori === "rott";
  return {
    namn: hint.trim(), producent: null, kategori, druvor: [], land: null, region: null, argang: null, alkoholhalt: rott ? 13.5 : 12, volymMl: 750,
    fyllighet: rott ? 7 : 5, sotma: 2, syra: rott ? 7 : 8, stravhet: rott ? 7 : 1, rokighet: null,
    aromer: rott ? ["mörka bär", "kryddor"] : ["citrus", "gröna äpplen"], mat: rott ? ["kött", "lagrad ost"] : ["fisk", "skaldjur"],
    beskrivning: "", prisCa: null, sakerhet: "lag", osakraFalt: [],
  };
}

export function mockEtikett(): EtikettSvar {
  return { ...mockDryckForslag("Okänd flaska"), arDryck: true, lastText: "" };
}

const DIMNAMN: Record<string, string> = { fyllighet: "fyllighet", sotma: "sötma", syra: "syra", stravhet: "strävhet", rokighet: "rökighet" };
const niva = (v: number | null) => (v == null ? null : v >= 8 ? "hög" : v >= 5 ? "medel" : "låg");

/** Provlägessvar byggt enbart av de lokala siffrorna (inga påhittade fakta). */
export function mockSmakanalys(u: SmakUnderlag): Smakanalys {
  const drag = Object.entries(u.profilGillar)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${niva(v)} ${DIMNAMN[k]}`);
  const fav = [...u.favoriter.druvor.slice(0, 2), ...u.favoriter.regioner.slice(0, 1)];
  return {
    sammanfattning: `Du har betygsatt ${u.antalBetyg} ${u.typ === "vin" ? "viner" : "spritsorter"}. Det du ger högst betyg har ${drag.join(", ") || "ännu ingen tydlig profil"}${fav.length ? `, och du verkar uppskatta ${fav.join(", ")}` : ""}.`,
    gillar: drag.length ? drag.map((d) => d.charAt(0).toUpperCase() + d.slice(1)) : ["För få betyg för en tydlig profil"],
    mindreForstjust: u.lagaBetyg.slice(0, 3).map((g) => `${g.namn} (snitt ${g.snitt})`),
    rekommendationer: u.kandidater.slice(0, 4).map((k) => ({ id: k.id, motivering: "Smakprofilen liknar det du har gett högt betyg." })),
    utforska: [
      ...u.otestade.druvor.slice(0, 2).map((n) => ({ typ: "druva" as const, namn: n, varfor: "En druva du inte har betygsatt än.", instegsflaska: `Leta efter en prisvärd ${n}`, ungefarligtPris: null })),
      ...u.otestade.regioner.slice(0, 1).map((n) => ({ typ: "region" as const, namn: n, varfor: "En region du inte har testat än.", instegsflaska: `Ett enkelt vin från ${n}`, ungefarligtPris: null })),
    ],
    undvik: u.lagaBetyg.slice(0, 2).map((g) => ({ stil: g.namn, varfor: `Du har gett det i snitt ${g.snitt} på ${g.antal} betyg.` })),
  };
}

const KATNAMN: Record<string, string> = { mousserande: "mousserande", vitt: "vitt", rott: "rött", sott: "sött vin" };

const MOCK_STILAR: Omit<Provningsforslag["viner"][number], "namn" | "prisCa">[] = [
  { producent: null, kategori: "mousserande", druvor: ["Chardonnay"], land: null, region: null, stil: "Torrt och friskt", varfor: "En mousserande start väcker smaklökarna.", doft: ["citrus", "brioche", "grönt äpple"], smak: ["hög syra", "fin mousse", "mineral"], serverTemp: "6–8 °C", mat: "Salta snacks" },
  { producent: null, kategori: "vitt", druvor: ["Riesling"], land: null, region: null, stil: "Lätt och aromatiskt", varfor: "Ett lätt vitt före de tyngre vinerna.", doft: ["lime", "persika", "blommor"], smak: ["frisk syra", "lätt sötma", "lång eftersmak"], serverTemp: "8–10 °C", mat: "Skaldjur" },
  { producent: null, kategori: "vitt", druvor: ["Chardonnay"], land: null, region: null, stil: "Fylligt och fatlagrat", varfor: "Visar hur ek påverkar ett vitt vin.", doft: ["smör", "vanilj", "gul frukt"], smak: ["rund", "krämig", "nötig"], serverTemp: "10–12 °C", mat: "Kyckling i gräddsås" },
  { producent: null, kategori: "rott", druvor: ["Pinot Noir"], land: null, region: null, stil: "Lätt och bärigt", varfor: "Ett lätt rött som brygga mellan vitt och tungt rött.", doft: ["hallon", "körsbär", "jord"], smak: ["mjuka tanniner", "frisk syra", "röda bär"], serverTemp: "14–16 °C", mat: "Anka" },
  { producent: null, kategori: "rott", druvor: ["Cabernet Sauvignon"], land: null, region: null, stil: "Kraftigt och strävt", varfor: "Ett tyngre rött mot slutet.", doft: ["svarta vinbär", "ceder", "tobak"], smak: ["fasta tanniner", "mörk frukt", "lång eftersmak"], serverTemp: "16–18 °C", mat: "Grillat nötkött" },
  { producent: null, kategori: "sott", druvor: ["Sémillon"], land: null, region: null, stil: "Sött och fylligt", varfor: "Sött vin avslutar provningen.", doft: ["honung", "aprikos", "saffran"], smak: ["sötma", "syra som balans", "marmelad"], serverTemp: "8–10 °C", mat: "Blåmögelost" },
];

export function mockProvning(u: ProvningUnderlag): Provningsforslag {
  const n = u.antalViner;
  const index = n >= MOCK_STILAR.length ? MOCK_STILAR.map((_, i) => i) : Array.from({ length: n }, (_, i) => Math.round((i * (MOCK_STILAR.length - 1)) / Math.max(1, n - 1)));
  const viner = Array.from({ length: n }, (_, i) => {
    const s = MOCK_STILAR[index[i] ?? i % MOCK_STILAR.length];
    return { ...s, namn: `${s.stil} ${KATNAMN[s.kategori] ?? "vin"} (${s.druvor[0]})`, prisCa: Math.max(79, Math.round(u.budgetPerFlaska * (0.8 + (i % 3) * 0.1))) };
  });
  return {
    inledning: `Ett upplägg för ${u.deltagare} personer${u.tema ? ` med temat "${u.tema}"` : ""}, från lätt till fylligt. Välj gärna flaskor i respektive stil som finns att köpa nära dig.`,
    ordningMotivering: "Mousserande först, vitt före rött, lätt före tungt och sött sist.",
    viner,
  };
}
