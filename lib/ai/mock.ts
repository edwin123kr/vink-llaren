import type { DryckForslag, EtikettSvar, Smakanalys } from "./schemas";
import type { SmakUnderlag } from "./index";

/**
 * Låtsasläge: deterministiska svar så att flöden kan byggas och testas utan API-nyckel.
 * Svaren är tydligt märkta och ska aldrig sparas som riktig katalogdata utan granskning.
 */
export function mockDryckForslag(hint: string): DryckForslag {
  const h = hint.toLowerCase();
  const sprit = /whisky|rom|gin|tequila|mezcal|cognac|vodka|likör/.test(h);
  if (sprit) {
    return {
      namn: hint.trim() || "Låtsas-whisky",
      producent: "Låtsasdestilleri (AI-låtsasläge)",
      kategori: "whisky",
      druvor: ["mältat korn"],
      land: "Skottland",
      region: "Islay",
      argang: null,
      alkoholhalt: 46,
      volymMl: 700,
      fyllighet: 9,
      sotma: 3,
      syra: null,
      stravhet: null,
      rokighet: 10,
      aromer: ["torvrök", "jod", "vanilj", "citrusskal"],
      mat: ["rökt lax", "blåmögelost"],
      beskrivning: "Det här är ett låtsassvar från AI-låtsasläget. Byt till AI_MODE=live för riktiga uppgifter.",
      prisCa: null,
      sakerhet: "lag",
    };
  }
  return {
    namn: hint.trim() || "Låtsasvin",
    producent: "Låtsasproducent (AI-låtsasläge)",
    kategori: "rott",
    druvor: ["Nebbiolo"],
    land: "Italien",
    region: "Piemonte",
    argang: 2019,
    alkoholhalt: 14,
    volymMl: 750,
    fyllighet: 9,
    sotma: 1,
    syra: 9,
    stravhet: 10,
    rokighet: null,
    aromer: ["körsbär", "ros", "tjära", "lakrits"],
    mat: ["vilt", "svamprisotto", "lagrad ost"],
    beskrivning: "Det här är ett låtsassvar från AI-låtsasläget. Byt till AI_MODE=live för riktiga uppgifter.",
    prisCa: null,
    sakerhet: "lag",
  };
}

export function mockEtikett(): EtikettSvar {
  return { ...mockDryckForslag("Låtsasetikett"), arDryck: true, lastText: "(låtsasläge: ingen bild har lästs)" };
}

const DIMNAMN: Record<string, string> = { fyllighet: "fyllighet", sotma: "sötma", syra: "syra", stravhet: "strävhet", rokighet: "rökighet" };
const niva = (v: number | null) => (v == null ? null : v >= 8 ? "hög" : v >= 5 ? "medel" : "låg");

/** Låtsassvar byggt enbart av de lokala siffrorna (inga påhittade fakta). */
export function mockSmakanalys(u: SmakUnderlag): Smakanalys {
  const drag = Object.entries(u.profilGillar)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${niva(v)} ${DIMNAMN[k]}`);
  const fav = [...u.favoriter.druvor.slice(0, 2), ...u.favoriter.regioner.slice(0, 1)];
  return {
    sammanfattning: `Låtsasläge: den här texten är byggd av dina siffror, inte skriven av Claude. Du har betygsatt ${u.antalBetyg} ${u.typ === "vin" ? "viner" : "spritsorter"}. Det du ger högst betyg har ${drag.join(", ") || "ännu ingen tydlig profil"}${fav.length ? `, och du verkar uppskatta ${fav.join(", ")}` : ""}.`,
    gillar: drag.length ? drag.map((d) => d.charAt(0).toUpperCase() + d.slice(1)) : ["För få betyg för en tydlig profil"],
    mindreForstjust: u.lagaBetyg.slice(0, 3).map((g) => `${g.namn} (snitt ${g.snitt})`),
    rekommendationer: u.kandidater.slice(0, 4).map((k) => ({ id: k.id, motivering: "Låtsasläge: vald för att smakprofilen liknar det du gett högt betyg." })),
    utforska: [
      ...u.otestade.druvor.slice(0, 2).map((n) => ({ typ: "druva" as const, namn: n, varfor: "Låtsasläge: en druva du inte har betygsatt än.", instegsflaska: `Leta efter en prisvärd ${n}`, ungefarligtPris: null })),
      ...u.otestade.regioner.slice(0, 1).map((n) => ({ typ: "region" as const, namn: n, varfor: "Låtsasläge: en region du inte har testat.", instegsflaska: `Ett enkelt vin från ${n}`, ungefarligtPris: null })),
    ],
    undvik: u.lagaBetyg.slice(0, 2).map((g) => ({ stil: g.namn, varfor: `Du har gett det i snitt ${g.snitt} på ${g.antal} betyg.` })),
  };
}
