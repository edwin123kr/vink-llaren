import { describe, expect, it } from "vitest";
import { csvRader, kategoriId } from "./csvimport";
import { parseCsv } from "../scripts/import/csv";

describe("CSV-import av samling", () => {
  it("känner igen kategorier som namn eller id", () => {
    expect(kategoriId("Rött vin")).toBe("rott");
    expect(kategoriId("rott")).toBe("rott");
    expect(kategoriId("Champagne")).toBe("mousserande");
    expect(kategoriId("okänd")).toBeNull();
  });

  it("läser exportens kolumner med semikolon och decimalkomma", () => {
    const [r] = csvRader("﻿Namn;Kategori;Druvor;Alkoholhalt;Antal;Inköpspris\r\nTest;Vitt vin;Riesling, Silvaner;12,5;3;149\r\n", parseCsv);
    expect(r.dryck).toMatchObject({ namn: "Test", kategori: "vitt", druvor: ["Riesling", "Silvaner"], alkoholhalt: 12.5 });
    expect(r.flaska).toMatchObject({ antal: 3, inkopspris: 149 });
  });

  it("klarar kommatecken som avgränsare och sätter antal 1 som standard", () => {
    const [r] = csvRader("namn,kategori\nGin X,Gin\n", parseCsv);
    expect(r.dryck.kategori).toBe("gin");
    expect(r.flaska.antal).toBe(1);
  });
});
