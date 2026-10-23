import { describe, expect, it } from "vitest";
import { perKategori, prisvardast, samlingsvarde, snittPer, type StatBetyg } from "./statistik";

describe("samlingsvärde", () => {
  it("skiljer på inköpspris, uppskattat pris och saknat pris", () => {
    const v = samlingsvarde([
      { antal: 2, inkopspris: 200, prisCa: 999, kategori: "rott", drickFran: null, drickTill: null },
      { antal: 1, inkopspris: null, prisCa: 150, kategori: "vitt", drickFran: null, drickTill: null },
      { antal: 3, inkopspris: null, prisCa: null, kategori: "rott", drickFran: null, drickTill: null },
    ]);
    expect(v).toEqual({ antal: 6, poster: 3, kant: 400, uppskattat: 150, totalt: 550, utanPris: 3 });
  });
  it("räknar flaskor per kategori", () => {
    expect(perKategori([
      { antal: 2, inkopspris: null, prisCa: null, kategori: "rott", drickFran: null, drickTill: null },
      { antal: 1, inkopspris: null, prisCa: null, kategori: "vitt", drickFran: null, drickTill: null },
      { antal: 3, inkopspris: null, prisCa: null, kategori: "rott", drickFran: null, drickTill: null },
    ])).toEqual([{ kategori: "rott", antal: 5 }, { kategori: "vitt", antal: 1 }]);
  });
});

const b = (dryckId: string, betyg: number, pris: number | null, druvor: string[] = [], land: string | null = null): StatBetyg => ({ dryckId, namn: dryckId, betyg, druvor, land, pris });

describe("betyg", () => {
  const lista = [b("A", 80, 100, ["Syrah"], "Frankrike"), b("A", 90, 100, ["Syrah"], "Frankrike"), b("B", 60, 300, ["Merlot", "Syrah"], "Chile"), b("C", 70, null, ["Merlot"], "Chile")];
  it("snittbetyg per druva och land", () => {
    expect(snittPer(lista, (x) => x.druvor)).toEqual([{ namn: "Syrah", snitt: 77, antal: 3 }, { namn: "Merlot", snitt: 65, antal: 2 }]);
    expect(snittPer(lista, (x) => (x.land ? [x.land] : []))).toEqual([{ namn: "Frankrike", snitt: 85, antal: 2 }, { namn: "Chile", snitt: 65, antal: 2 }]);
    expect(snittPer(lista, (x) => x.druvor, 3).map((g) => g.namn)).toEqual(["Syrah"]);
  });
  it("prisvärdast: betyg per 100 kr, utan pris utesluts", () => {
    const p = prisvardast(lista);
    expect(p.map((x) => x.dryckId)).toEqual(["A", "B"]);
    expect(p[0]).toMatchObject({ snitt: 85, pris: 100, per100kr: 8.5 });
    expect(p[1].per100kr).toBe(2);
  });
});

import { csvCell, tillCsv } from "./csv";
describe("csv", () => {
  it("citerar semikolon, citattecken och radbrytningar", () => {
    expect(csvCell('Rosé; "Brut"')).toBe('"Rosé; ""Brut"""');
    expect(csvCell(13.5)).toBe("13,5");
    expect(csvCell(["Syrah", "Grenache"])).toBe("Syrah, Grenache");
    expect(csvCell(null)).toBe("");
  });
  it("börjar med BOM och använder CRLF", () => {
    expect(tillCsv(["a", "b"], [[1, "x"]])).toBe("﻿a;b\r\n1;x\r\n");
  });
});
