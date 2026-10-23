import type { DryckForslag, EtikettSvar } from "./schemas";

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
