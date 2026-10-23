/** CSV för svenska Excel: semikolon som avgränsare, decimalkomma och BOM så att åäö visas rätt. */
export function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = typeof v === "number" ? String(v).replace(".", ",") : Array.isArray(v) ? v.join(", ") : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function tillCsv(rubriker: string[], rader: unknown[][]): string {
  return "﻿" + [rubriker, ...rader].map((r) => r.map(csvCell).join(";")).join("\r\n") + "\r\n";
}
