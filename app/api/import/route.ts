import { revalidatePath } from "next/cache";
import { lasInBackup } from "@/lib/backup";
import { csvRader } from "@/lib/csvimport";
import { parseCsv } from "@/scripts/import/csv";
import { db } from "@/lib/db";
import { EJ_INLOGGAD, hamtaAnvandare } from "@/lib/auth";
import { typFor } from "@/lib/kategorier";
import { sokText } from "@/lib/sok";
import { DryckIn, FlaskaIn } from "@/lib/validering";

const MAX = 50 * 1024 * 1024;

export async function POST(req: Request) {
  const anv = await hamtaAnvandare();
  if (!anv) return EJ_INLOGGAD();
  const form = await req.formData().catch(() => null);
  const fil = form?.get("fil");
  const lage = form?.get("lage") === "ersatt" ? "ersatt" : "slaihop";
  if (!(fil instanceof File)) return Response.json({ ok: false, fel: "Välj en fil." }, { status: 400 });
  if (fil.size > MAX) return Response.json({ ok: false, fel: "Filen är för stor (max 50 MB)." }, { status: 413 });
  const text = await fil.text();

  if (fil.name.toLowerCase().endsWith(".json") || text.trimStart().startsWith("{")) {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return Response.json({ ok: false, fel: "Filen innehåller inte giltig JSON." }, { status: 400 });
    }
    const r = await lasInBackup(anv.id, data, lage);
    if (r.ok) revalidatePath("/", "layout");
    return Response.json(r, { status: r.ok ? 200 : 400 });
  }

  // CSV: varje rad blir en dryck (manuell) + en flaska
  const rader = csvRader(text, parseCsv);
  const fel: string[] = [];
  let skapade = 0;
  for (const r of rader) {
    const d = DryckIn.safeParse(r.dryck);
    const f = FlaskaIn.safeParse(r.flaska);
    if (!d.success || !f.success) {
      fel.push(`Rad ${r.rad}: ${(d.success ? f.error?.issues[0]?.message : d.error.issues[0]?.message) ?? "ogiltig"}`);
      continue;
    }
    const finns = d.data.ean ? await db.dryck.findFirst({ where: { ean: d.data.ean, OR: [{ agareId: null }, { agareId: anv.id }] }, orderBy: { agareId: "desc" }, select: { id: true } }) : null;
    const dryckId = finns?.id ?? (await db.dryck.create({ data: { ...d.data, typ: typFor(d.data.kategori), sok: sokText(d.data), kalla: "manuell", agareId: anv.id } })).id;
    await db.flaska.create({ data: { ...f.data, inkopsdatum: f.data.inkopsdatum ? new Date(f.data.inkopsdatum) : null, dryckId, anvandareId: anv.id } });
    skapade++;
  }
  if (skapade) revalidatePath("/", "layout");
  return Response.json({ ok: true, antal: { flaskor: skapade }, fel: fel.slice(0, 20), antalFel: fel.length });
}
