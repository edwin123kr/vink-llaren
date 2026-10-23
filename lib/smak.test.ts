import { describe, expect, it } from "vitest";
import { avstand, grupper, kandidater, medelprofil, otestade, undvikKandidater, type BetygadDryck, type KatalogDryck } from "./smak";

const b = (namn: string, snitt: number, profil: BetygadDryck["profil"], extra: Partial<BetygadDryck> = {}): BetygadDryck => ({
  dryckId: namn, namn, typ: "vin", kategori: "rott", druvor: [], land: null, region: null, profil, snitt, antal: 1, ...extra,
});

const betyg: BetygadDryck[] = [
  b("Fyllig1", 85, { fyllighet: 10, sotma: 1, syra: 6, stravhet: 9 }, { druvor: ["Syrah"], region: "Rhône" }),
  b("Fyllig2", 80, { fyllighet: 9, sotma: 2, syra: 5, stravhet: 8 }, { druvor: ["Syrah"], region: "Rhône" }),
  b("Syrlig1", 50, { fyllighet: 4, sotma: 2, syra: 11, stravhet: 3 }, { druvor: ["Riesling"], kategori: "vitt" }),
  b("Syrlig2", 45, { fyllighet: 3, sotma: 3, syra: 10, stravhet: 2 }, { druvor: ["Riesling"], kategori: "vitt" }),
];

describe("smakprofil", () => {
  it("medelprofil viktas och avrundas", () => {
    expect(medelprofil(betyg.slice(0, 2), ["fyllighet", "syra"])).toEqual({ fyllighet: 9.5, syra: 5.5 });
  });
  it("tomma dimensioner blir null", () => {
    expect(medelprofil([b("x", 70, {})], ["rokighet"])).toEqual({ rokighet: null });
  });
  it("grupperar per druva med snittbetyg", () => {
    expect(grupper(betyg, (d) => d.druvor)).toEqual([
      { namn: "Syrah", snitt: 83, antal: 2 },
      { namn: "Riesling", snitt: 48, antal: 2 },
    ]);
  });
  it("undvik kräver minst två låga betyg", () => {
    const u = undvikKandidater(betyg).map((g) => g.namn);
    expect(u).toContain("Riesling");
    expect(u).toContain("vitt");
    expect(u).not.toContain("Syrah");
    expect(undvikKandidater([betyg[2]])).toEqual([]);
  });
  it("avstånd kräver minst två gemensamma dimensioner", () => {
    expect(avstand({ fyllighet: 10, syra: 6 }, { fyllighet: 10, syra: 6, sotma: null, stravhet: null, rokighet: null }, ["fyllighet", "syra"])).toBe(0);
    expect(avstand({ fyllighet: 10 }, { fyllighet: 10, syra: 6, sotma: null, stravhet: null, rokighet: null }, ["fyllighet", "syra"])).toBeNull();
  });
});

describe("kandidater och otestat", () => {
  const k = (id: string, profil: KatalogDryck["profil"], extra: Partial<KatalogDryck> = {}): KatalogDryck => ({
    id, namn: id, producent: null, typ: "vin", kategori: "rott", druvor: [], land: null, region: null, profil, prisCa: null, ...extra,
  });
  const katalog = [
    k("Fyllig3", { fyllighet: 10, sotma: 1, syra: 6, stravhet: 9 }, { druvor: ["Syrah"] }),
    k("Lätt", { fyllighet: 3, sotma: 2, syra: 10, stravhet: 2 }, { druvor: ["Riesling"], kategori: "vitt" }),
    k("Fyllig1", { fyllighet: 10, sotma: 1, syra: 6, stravhet: 9 }),
    k("Whisky", { fyllighet: 9, rokighet: 10 }, { typ: "sprit", kategori: "whisky" }),
    k("Okänd", {}, { druvor: ["Nebbiolo"], region: "Piemonte" }),
  ];
  it("rankar liknande först, utesluter provade och annan typ", () => {
    const r = kandidater(katalog, betyg, "vin").map((x) => x.id);
    expect(r[0]).toBe("Fyllig3");
    expect(r).not.toContain("Fyllig1");
    expect(r).not.toContain("Whisky");
    expect(r.indexOf("Lätt")).toBeGreaterThan(r.indexOf("Okänd"));
  });
  it("hittar otestade druvor och regioner", () => {
    const o = otestade(katalog, betyg, "vin");
    expect(o.druvor).toEqual(["Nebbiolo"]);
    expect(o.regioner).toEqual(["Piemonte"]);
  });
});
