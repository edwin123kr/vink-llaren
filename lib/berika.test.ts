import { describe, expect, it } from "vitest";
import { berika, hittaSamma, type KatalogDryckFull } from "./berika";

const k = (o: Partial<KatalogDryckFull> = {}): KatalogDryckFull => ({
  id: "1", namn: "Barolo", producent: "Giacomo Conterno", argang: 2016, druvor: ["Nebbiolo"], land: "Italien", region: "Piemonte",
  alkoholhalt: 14, volymMl: 750, fyllighet: 9, sotma: 1, syra: 9, stravhet: 10, rokighet: null, aromer: ["körsbär"], mat: ["vilt"], ...o,
});
const svar = (o = {}) => ({ namn: "BAROLO", producent: "Giacomo Conterno", argang: 2019, druvor: [] as string[], land: null, region: null, alkoholhalt: 13, volymMl: 750, fyllighet: null, osakraFalt: ["druvor", "alkoholhalt"], ...o });

describe("berika", () => {
  it("hittar samma vin oavsett versaler och tolererar saknad producent", () => {
    expect(hittaSamma({ namn: "barolo", producent: "giacomo conterno" }, [k()])?.id).toBe("1");
    expect(hittaSamma({ namn: "Barolo", producent: null }, [k()])?.id).toBe("1");
    expect(hittaSamma({ namn: "Barolo", producent: "Annan" }, [k()])).toBeNull();
    expect(hittaSamma({ namn: "Barbaresco", producent: null }, [k()])).toBeNull();
  });

  it("fyller tomma och osäkra fält men rör aldrig årgång eller namn", () => {
    const { svar: s, fran } = berika(svar(), k());
    expect(s.druvor).toEqual(["Nebbiolo"]);
    expect(s.land).toBe("Italien");
    expect(s.alkoholhalt).toBe(14); // var osäker → ersatt
    expect(s.argang).toBe(2019);
    expect(s.namn).toBe("BAROLO");
    expect(fran).toContain("druvor");
    expect(s.osakraFalt).toEqual([]); // hämtade fält är inte längre osäkra
  });

  it("behåller AI:ns säkra värden och fyller bara luckor", () => {
    const { svar: s } = berika(svar({ alkoholhalt: 13.5, osakraFalt: [], land: "Frankrike" }), k());
    expect(s.alkoholhalt).toBe(13.5);
    expect(s.land).toBe("Frankrike");
  });

  it("gör ingenting utan träff", () => {
    const s = svar();
    expect(berika(s, null)).toEqual({ svar: s, fran: [] });
  });
});
