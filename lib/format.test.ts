import { describe, expect, it } from "vitest";
import { betygText, decimal, drickfonster, kr, parseBetyg, parseDecimal } from "./format";

describe("betyg", () => {
  it("visar tiondelar med decimalkomma", () => {
    expect(betygText(78)).toBe("7,8");
    expect(betygText(100)).toBe("10,0");
    expect(betygText(0)).toBe("0,0");
    expect(betygText(null)).toBe("–");
  });
  it("tolkar svensk och engelsk inmatning", () => {
    expect(parseBetyg("7,8")).toBe(78);
    expect(parseBetyg("7.8")).toBe(78);
    expect(parseBetyg("7")).toBe(70);
    expect(parseBetyg(9.5)).toBe(95);
  });
  it("avvisar ogiltiga värden", () => {
    expect(parseBetyg("10,5")).toBeNull();
    expect(parseBetyg("7,85")).toBeNull();
    expect(parseBetyg("abc")).toBeNull();
    expect(parseBetyg("-1")).toBeNull();
  });
});

describe("tal och pengar", () => {
  it("formaterar kronor med hårda mellanslag", () => {
    expect(kr(34900)).toBe("34 900 kr");
    expect(kr(null)).toBe("–");
  });
  it("decimalkomma", () => {
    expect(decimal(13.5)).toBe("13,5");
    expect(parseDecimal("13,5")).toBe(13.5);
    expect(parseDecimal("")).toBeNull();
  });
});

describe("drickfönster", () => {
  it("räknar status mot aktuellt år", () => {
    expect(drickfonster(2024, 2030, 2026).status).toBe("redo");
    expect(drickfonster(2028, 2035, 2026).status).toBe("vanta");
    expect(drickfonster(2020, 2025, 2026).status).toBe("passerat");
    expect(drickfonster(2020, 2027, 2026).status).toBe("drick-snart");
    expect(drickfonster(null, null).status).toBe("okand");
  });
});
