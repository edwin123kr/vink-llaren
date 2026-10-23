import "server-only";
import { db } from "@/lib/db";
import { betygText, drickfonster, lista } from "@/lib/format";
import { kategori } from "@/lib/kategorier";
import { GILLAR, GILLAR_MINDRE, grupper } from "@/lib/smak";
import { hamtaBetygade } from "@/lib/smakdata";
import type { Anvandare } from "@/lib/auth";
import type { Kontext } from "@/lib/ai/sommelier";

/** Sammanfattar användarens samling och smak som text till sommeliern (kompakt, högst ~150 flaskor). */
export async function sommelierKontext(anv: Anvandare): Promise<Kontext> {
  const [flaskor, betygade, senaste] = await Promise.all([
    db.flaska.findMany({ where: { anvandareId: anv.id, antal: { gt: 0 } }, include: { dryck: true }, orderBy: { skapad: "desc" }, take: 150 }),
    hamtaBetygade(anv.id),
    db.betyg.findMany({ where: { anvandareId: anv.id }, include: { dryck: { select: { namn: true, argang: true } } }, orderBy: { datum: "desc" }, take: 15 }),
  ]);

  const samling = flaskor
    .map((f) => {
      const d = f.dryck;
      const fonster = drickfonster(f.drickFran, f.drickTill);
      return "- " + [
        d.namn,
        d.producent,
        d.argang ?? "utan årgång",
        kategori(d.kategori)?.namn ?? d.kategori,
        [d.region, d.land].filter(Boolean).join(", "),
        lista(d.druvor).join(", "),
        `${f.antal} st`,
        fonster.status !== "okand" ? `drickfönster ${fonster.text}${fonster.status === "passerat" ? " (passerat)" : fonster.status === "drick-snart" ? " (drick snart)" : ""}` : null,
        f.plats ? `plats: ${f.plats}` : null,
      ].filter(Boolean).join(" | ");
    })
    .join("\n");

  const smak = (["vin", "sprit"] as const)
    .map((typ) => {
      const egna = betygade.filter((d) => d.typ === typ);
      if (!egna.length) return null;
      const druvor = grupper(egna, (d) => d.druvor);
      const regioner = grupper(egna, (d) => (d.region ? [d.region] : d.land ? [d.land] : []));
      const gillar = [...druvor, ...regioner].filter((g) => g.snitt >= GILLAR).slice(0, 6).map((g) => `${g.namn} (${betygText(g.snitt)})`);
      const mindre = [...druvor, ...regioner].filter((g) => g.snitt < GILLAR_MINDRE).slice(0, 4).map((g) => `${g.namn} (${betygText(g.snitt)})`);
      return `${typ === "vin" ? "Vin" : "Sprit"}: ${egna.length} betygsatta. Gillar: ${gillar.join(", ") || "inget tydligt än"}. Gillar mindre: ${mindre.join(", ") || "inget tydligt"}.`;
    })
    .filter(Boolean)
    .join("\n");

  const senasteText = senaste
    .map((b) => `- ${b.dryck.namn}${b.dryck.argang ? ` ${b.dryck.argang}` : ""}: ${betygText(b.betyg)}${b.kommentar ? ` – "${b.kommentar.slice(0, 120)}"` : ""}`)
    .join("\n");

  return { namn: anv.namn, samling, smak, senaste: senasteText };
}
