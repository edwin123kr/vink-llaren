import { describe, expect, it } from "vitest";
import { inkopslista, kalkyl } from "./provning";

describe("provningskalkyl", () => {
  it("8 deltagare, 4 viner, 300 kr: 4 flaskor, en per vin", () => {
    const k = kalkyl({ deltagare: 8, antalViner: 4, budgetPerPerson: 300 });
    expect(k.flaskorBerakning).toBe(4);
    expect(k.flaskorTotalt).toBe(4);
    expect(k.flaskorPerVin).toEqual([1, 1, 1, 1]);
    expect(k.mlPerGlas).toBe(90); // 375/4 = 93,75 → 90
    expect(k.totalbudget).toBe(2400);
    expect(k.budgetPerFlaska).toBe(600);
  });
  it("udda antal deltagare avrundas uppåt", () => {
    expect(kalkyl({ deltagare: 7, antalViner: 3, budgetPerPerson: 200 }).flaskorBerakning).toBe(4);
  });
  it("minst en flaska per vin även med få deltagare", () => {
    const k = kalkyl({ deltagare: 2, antalViner: 5, budgetPerPerson: 250 });
    expect(k.flaskorBerakning).toBe(1);
    expect(k.flaskorTotalt).toBe(5);
    expect(k.flaskorPerVin).toEqual([1, 1, 1, 1, 1]);
    expect(k.mlPerGlas).toBe(75);
  });
  it("fördelar överskott på de första vinerna", () => {
    const k = kalkyl({ deltagare: 14, antalViner: 3, budgetPerPerson: 300 });
    expect(k.flaskorTotalt).toBe(7);
    expect(k.flaskorPerVin).toEqual([3, 2, 2]);
    expect(k.flaskorPerVin.reduce((a, b) => a + b)).toBe(7);
    expect(k.glasPerVin[0]).toBe(Math.floor((3 * 750) / 125));
  });
  it("ett vin får hela halvflaskan", () => {
    expect(kalkyl({ deltagare: 4, antalViner: 1, budgetPerPerson: 100 }).mlPerGlas).toBe(375);
  });
  it("avvisar ogiltig indata", () => {
    expect(() => kalkyl({ deltagare: 0, antalViner: 3, budgetPerPerson: 100 })).toThrow();
    expect(() => kalkyl({ deltagare: 4, antalViner: 0, budgetPerPerson: 100 })).toThrow();
    expect(() => kalkyl({ deltagare: 4, antalViner: 2, budgetPerPerson: -1 })).toThrow();
  });
});

describe("inköpslista", () => {
  const k = kalkyl({ deltagare: 10, antalViner: 3, budgetPerPerson: 200 });
  it("räknar delsummor, total och per person", () => {
    const l = inkopslista([{ namn: "A", prisCa: 150 }, { namn: "B", prisCa: 200 }, { namn: "C", prisCa: 120 }], k);
    expect(l.rader.map((r) => r.flaskor)).toEqual([2, 2, 1]);
    expect(l.rader.map((r) => r.delsumma)).toEqual([300, 400, 120]);
    expect(l.total).toBe(820);
    expect(l.perPerson).toBe(82);
    expect(l.komplett).toBe(true);
    expect(l.overBudget).toBe(false);
  });
  it("markerar okända priser och överskriden budget", () => {
    const l = inkopslista([{ namn: "A", prisCa: 1500 }, { namn: "B", prisCa: null }, { namn: "C", prisCa: 100 }], k);
    expect(l.komplett).toBe(false);
    expect(l.overBudget).toBe(true);
  });
});
