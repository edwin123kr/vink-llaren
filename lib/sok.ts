/**
 * Söktext utan skiftläge och diakritiska tecken, så att "rose", "Rosé" och "ROSÉ" matchar,
 * liksom "kallaren" och "Källaren". SQLite:s LIKE hanterar bara ASCII, därför lagras en färdig kolumn.
 */
export function normalisera(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function sokText(d: { namn: string; producent?: string | null; region?: string | null; land?: string | null; druvor?: unknown }): string {
  const druvor = Array.isArray(d.druvor) ? d.druvor.join(" ") : "";
  return normalisera([d.namn, d.producent, d.region, d.land, druvor].filter(Boolean).join(" "));
}

/** Nyckel för dubblettkontroll: namn + producent + årgång. */
export function dubblettNyckel(d: { namn: string; producent?: string | null; argang?: number | null }): string {
  return `${normalisera(d.namn)}|${normalisera(d.producent)}|${d.argang ?? ""}`;
}
