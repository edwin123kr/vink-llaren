import { lasBild } from "@/lib/bilder";

export async function GET(_req: Request, ctx: RouteContext<"/api/bild/[id]">) {
  const b = await lasBild((await ctx.params).id);
  if (!b) return new Response("Hittades inte", { status: 404 });
  return new Response(b.data as BodyInit, { headers: { "content-type": b.typ, "cache-control": "public, max-age=31536000, immutable" } });
}
