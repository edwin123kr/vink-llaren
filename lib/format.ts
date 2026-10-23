/** Svensk formatering. Betyg lagras i tiondelar (78 = 7,8). */

const kronor = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

/** 34900 → "34 900 kr" (med hårt mellanslag så att beloppet aldrig bryts) */
export function kr(n: number | null | undefined): string {
  if (n == null) return "–";
  return `${kronor.format(Math.round(n)).replace(/\s/g, " ")} kr`;
}

/** 78 → "7,8" */
export function betygText(tiondelar: number | null | undefined): string {
  if (tiondelar == null) return "–";
  return (tiondelar / 10).toFixed(1).replace(".", ",");
}

/** "7,8" | "7.8" | "7" → 78. Ogiltigt eller utanför 0–10 → null. */
export function parseBetyg(input: string | number): number | null {
  const s = String(input).trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d)?$/.test(s)) return null;
  const v = Math.round(Number(s) * 10);
  return v >= 0 && v <= 100 ? v : null;
}

/** Decimaltal med svenskt komma: 13.5 → "13,5" */
export function decimal(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "–";
  return new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(n);
}

/** "13,5" → 13.5, tomt → null */
export function parseDecimal(input: string): number | null {
  const s = input.trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

export function procent(n: number | null | undefined): string {
  return n == null ? "–" : `${decimal(n)} %`;
}

export function datum(d: Date | string | null | undefined): string {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

/** Drickfönster som text och status. */
export function drickfonster(fran: number | null | undefined, till: number | null | undefined, nu = new Date().getFullYear()) {
  if (fran == null && till == null) return { text: "–", status: "okand" as const };
  const text = fran != null && till != null ? `${fran}–${till}` : fran != null ? `från ${fran}` : `till ${till}`;
  if (till != null && nu > till) return { text, status: "passerat" as const };
  if (fran != null && nu < fran) return { text, status: "vanta" as const };
  if (till != null && till - nu <= 1) return { text, status: "drick-snart" as const };
  return { text, status: "redo" as const };
}

/** JSON-fält med string[] från databasen → säker array. */
export function lista(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
