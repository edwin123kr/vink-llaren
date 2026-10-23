import { db } from "@/lib/db";
import { slaUppOff } from "@/lib/openfoodfacts";
import { EJ_INLOGGAD, hamtaAnvandare, synligaDrycker } from "@/lib/auth";

/**
 * 1) Finns streckkoden i katalogen? → dryckId
 * 2) Annars: slå upp i Open Food Facts, och om det är vin eller sprit läggs den in i katalogen (källa och licens loggas).
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/streckkod/[ean]">) {
  const anv = await hamtaAnvandare();
  if (!anv) return EJ_INLOGGAD();
  const ean = (await ctx.params).ean.replace(/\D/g, "");
  if (!/^\d{8,14}$/.test(ean)) return Response.json({ status: "ogiltig", meddelande: "En streckkod har 8–14 siffror." }, { status: 400 });

  // egna drycker först, sedan den delade katalogen
  const finns = await db.dryck.findFirst({ where: { ean, ...synligaDrycker(anv.id) }, orderBy: { agareId: "desc" }, select: { id: true, namn: true } });
  if (finns) return Response.json({ status: "katalog", dryckId: finns.id, namn: finns.namn });

  const off = await slaUppOff(ean);
  if (off.status === "hittad") {
    const ny = await db.dryck.create({ data: off.dryck });
    return Response.json({ status: "openfoodfacts", dryckId: ny.id, namn: ny.namn });
  }
  return Response.json({ ...off, ean });
}
