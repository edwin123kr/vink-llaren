import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { csvObjects, pyList } from "./csv";
import { fromOff, fromXWines, landFranEngelska, landFranIso, volymMl, type OffProduct } from "./normalize";
import { dubblettNyckel } from "../../lib/sok";

describe("csv och listor", () => {
  it("tolkar Python-listor med apostrof i namnet", () => {
    expect(pyList(`['Merlot', "Nero d'Avola"]`)).toEqual(["Merlot", "Nero d'Avola"]);
    expect(pyList("")).toEqual([]);
  });
  it("tolkar citerade fält med kommatecken", () => {
    const rows = [...csvObjects('a,b\n1,"x, y"\n2,"citat ""inne"""\n')];
    expect(rows).toEqual([{ a: "1", b: "x, y" }, { a: "2", b: 'citat "inne"' }]);
  });
});

describe("länder", () => {
  it("översätter till svenska", () => {
    expect(landFranIso("IT")).toBe("Italien");
    expect(landFranIso("BR")).toBe("Brasilien");
    expect(landFranEngelska("en:united-kingdom")).toBe("Storbritannien");
    expect(landFranEngelska("en:france")).toBe("Frankrike");
    expect(landFranEngelska("en:okänt")).toBeNull();
  });
});

describe("X-Wines", () => {
  const rows = [...csvObjects(readFileSync("data/fixtures/xwines-test-100.csv", "utf8"))];
  const mapped = rows.map(fromXWines);
  it("läser alla 100 testviner", () => {
    expect(rows).toHaveLength(100);
    expect(mapped.filter(Boolean)).toHaveLength(100);
  });
  it("normaliserar fält utan att hitta på", () => {
    const d = mapped.find((m) => m?.kallaId === "100062")!;
    expect(d.namn).toBe("Origem Merlot");
    expect(d.producent).toBe("Casa Valduga");
    expect(d.kategori).toBe("rott");
    expect(d.druvor).toEqual(["Merlot"]);
    expect(d.land).toBe("Brasilien");
    expect(d.fyllighet).toBe(9);
    expect(d.syra).toBe(6);
    expect(d.mat).toContain("nötkött");
    expect(d.argang).toBeNull();
    expect(d.ean).toBeNull();
    expect(d.licens).toBe("CC0-1.0");
  });
  it("täcker alla typer i datasetet", () => {
    expect(new Set(mapped.map((m) => m!.kategori))).toEqual(new Set(["rott", "vitt", "rose", "mousserande", "sott", "starkvin"]));
  });
});

describe("Open Food Facts", () => {
  const lines = readFileSync("data/fixtures/off-exempel.jsonl", "utf8").trim().split("\n").map((l) => JSON.parse(l) as OffProduct);
  const mapped = lines.map(fromOff);
  it("tar bara vin och sprit med namn och giltig EAN", () => {
    expect(mapped.map((m) => m?.kategori ?? null)).toEqual(["rott", "whisky", null, null, "mousserande", "rott"]);
  });
  it("läser volym, alkohol, land och producent", () => {
    const [vin, whisky, , , bubbel] = mapped;
    expect(vin).toMatchObject({ volymMl: 750, alkoholhalt: 13.5, land: "Italien", producent: "Testproducent", licens: "ODbL-1.0" });
    expect(whisky).toMatchObject({ namn: "Testwhisky", volymMl: 700, alkoholhalt: 40, land: "Storbritannien", producent: "Testdestilleri" });
    expect(bubbel?.volymMl).toBe(1500);
  });
  it("volymer", () => {
    expect(volymMl("75 cl")).toBe(750);
    expect(volymMl("0.7 L")).toBe(700);
    expect(volymMl("50ml")).toBe(50);
    expect(volymMl("6 x 33cl")).toBe(330);
    expect(volymMl("okänt")).toBeNull();
  });
});

describe("dubblettnyckel", () => {
  it("ignorerar skiftläge, diakritiska tecken och skiljetecken", () => {
    expect(dubblettNyckel({ namn: "Rosé  Brut", producent: "Château X", argang: 2020 })).toBe(dubblettNyckel({ namn: "rose brut", producent: "chateau x", argang: 2020 }));
    expect(dubblettNyckel({ namn: "A", producent: "B", argang: 2020 })).not.toBe(dubblettNyckel({ namn: "A", producent: "B", argang: 2021 }));
  });
});
