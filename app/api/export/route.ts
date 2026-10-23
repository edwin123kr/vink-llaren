import { db } from "@/lib/db";
import { skapaBackup } from "@/lib/backup";
import { tillCsv } from "@/lib/csv";
import { kategori } from "@/lib/kategorier";
import { lista } from "@/lib/format";
import { EJ_INLOGGAD, hamtaAnvandare } from "@/lib/auth";

const dag = () => new Date().toISOString().slice(0, 10);

export async function GET(req: Request) {
  const anv = await hamtaAnvandare();
  if (!anv) return EJ_INLOGGAD();
  const u = new URL(req.url);
  const format = u.searchParams.get("format") ?? "json";

  if (format === "json") {
    const b = await skapaBackup(anv.id, u.searchParams.get("bilder") !== "0");
    return new Response(JSON.stringify(b, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="vinkallaren-backup-${dag()}.json"` },
    });
  }

  if (format === "csv" && u.searchParams.get("typ") === "historik") {
    const betyg = await db.betyg.findMany({ where: { anvandareId: anv.id }, orderBy: { datum: "desc" }, include: { dryck: true } });
    const csv = tillCsv(
      ["Datum", "Namn", "Producent", "Kategori", "Årgång", "Betyg", "Kommentar", "Tillfälle"],
      betyg.map((b) => [b.datum.toISOString().slice(0, 10), b.dryck.namn, b.dryck.producent, kategori(b.dryck.kategori)?.namn, b.dryck.argang, b.betyg / 10, b.kommentar, b.tillfalle]),
    );
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="vinkallaren-historik-${dag()}.csv"` } });
  }

  if (format === "csv") {
    const flaskor = await db.flaska.findMany({ where: { anvandareId: anv.id }, orderBy: { skapad: "desc" }, include: { dryck: true } });
    const csv = tillCsv(
      ["Namn", "Producent", "Kategori", "Druvor", "Land", "Region", "Årgång", "Alkoholhalt", "Volym (ml)", "Antal", "Inköpspris", "Inköpsdatum", "Inköpsställe", "Förvaringsplats", "Drick från", "Drick till", "EAN", "Systembolaget artikelnr", "Anteckningar"],
      flaskor.map((f) => [
        f.dryck.namn, f.dryck.producent, kategori(f.dryck.kategori)?.namn, lista(f.dryck.druvor), f.dryck.land, f.dryck.region, f.dryck.argang, f.dryck.alkoholhalt, f.dryck.volymMl,
        f.antal, f.inkopspris, f.inkopsdatum?.toISOString().slice(0, 10), f.inkopsstalle, f.plats, f.drickFran, f.drickTill, f.dryck.ean, f.dryck.sbArtikelnr, f.anteckningar,
      ]),
    );
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="vinkallaren-samling-${dag()}.csv"` } });
  }

  return Response.json({ fel: "Okänt format." }, { status: 400 });
}
