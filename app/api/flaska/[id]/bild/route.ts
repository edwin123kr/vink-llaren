import { db } from "@/lib/db";
import { EJ_INLOGGAD, hamtaAnvandare } from "@/lib/auth";
import { satBildOmSaknas, sparaBild } from "@/lib/bilder";

const TILLATNA = ["image/jpeg", "image/png", "image/webp"];
const MAX = 6 * 1024 * 1024;

/** Etikettfoto till en flaska. Saknar katalogdrycken bild blir fotot dess bild för alla användare. */
export async function POST(req: Request, ctx: RouteContext<"/api/flaska/[id]/bild">) {
  const anv = await hamtaAnvandare();
  if (!anv) return EJ_INLOGGAD();
  const flaska = await db.flaska.findFirst({ where: { id: (await ctx.params).id, anvandareId: anv.id }, select: { dryckId: true } });
  if (!flaska) return Response.json({ fel: "Flaskan finns inte." }, { status: 404 });
  const fil = (await req.formData().catch(() => null))?.get("bild");
  if (!(fil instanceof File)) return Response.json({ fel: "Ingen bild skickades." }, { status: 400 });
  if (!TILLATNA.includes(fil.type)) return Response.json({ fel: "Använd en JPEG-, PNG- eller WebP-bild." }, { status: 415 });
  if (fil.size > MAX) return Response.json({ fel: "Bilden är för stor (max 6 MB)." }, { status: 413 });
  const url = await sparaBild(Buffer.from(await fil.arrayBuffer()), fil.type, anv.id);
  if (!(await satBildOmSaknas(flaska.dryckId, url, anv.id))) {
    await db.bild.deleteMany({ where: { id: url.split("/").pop() } });
    return Response.json({ fel: "Den här flaskan har redan en bild." }, { status: 409 });
  }
  return Response.json({ ok: true, bildUrl: url });
}
