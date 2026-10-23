import { describe, expect, it } from "vitest";
import { tokens as t } from "./tokens";

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

describe("kontrast (WCAG AA 4,5:1 för text)", () => {
  const pairs: [string, string, string][] = [
    ["text/bg", t.text, t.bg],
    ["text/surface2", t.text, t.surface2],
    ["muted/bg", t.muted, t.bg],
    ["muted/surface2", t.muted, t.surface2],
    ["onGold/gold", t.onGold, t.gold],
    ["onWine/wine", t.onWine, t.wine],
    ["wineText/surface", t.wineText, t.surface],
    ["gold/surface", t.gold, t.surface],
    ["danger/surface", t.danger, t.surface],
    ["ok/surface", t.ok, t.surface],
  ];
  it.each(pairs)("%s", (_n, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it("kantlinjer syns mot ytan (3:1 för UI-gränser gäller fokus, inte dekorlinjer)", () => {
    expect(ratio(t.gold, t.bg)).toBeGreaterThanOrEqual(3);
  });
});
