import { sokKatalog } from "@/lib/katalog";
import { EJ_INLOGGAD, hamtaAnvandare } from "@/lib/auth";

export async function GET(req: Request) {
  const anv = await hamtaAnvandare();
  if (!anv) return EJ_INLOGGAD();
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").slice(0, 100);
  if (q.trim().length < 2) return Response.json({ traffar: [] });
  const traffar = await sokKatalog(anv.id, q, {
    kategori: u.searchParams.get("kategori") ?? undefined,
    typ: u.searchParams.get("typ") ?? undefined,
    limit: Number(u.searchParams.get("limit")) || 20,
  });
  return Response.json({ traffar });
}
