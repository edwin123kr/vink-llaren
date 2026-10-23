import { lasBild } from "@/lib/bilder";
import { EJ_INLOGGAD, hamtaAnvandare } from "@/lib/auth";

export async function GET(_req: Request, ctx: RouteContext<"/api/bild/[id]">) {
  if (!(await hamtaAnvandare())) return EJ_INLOGGAD();
  const b = await lasBild((await ctx.params).id);
  if (!b) return new Response("Hittades inte", { status: 404 });
  return new Response(b.data as BodyInit, { headers: { "content-type": b.typ, "cache-control": "private, max-age=31536000, immutable" } });
}
