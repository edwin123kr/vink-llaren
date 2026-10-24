import { AiError, identifieraEtikett, type BildTyp } from "@/lib/ai";
import { sparaBild } from "@/lib/bilder";
import { sokKatalog } from "@/lib/katalog";
import { EJ_INLOGGAD, hamtaAnvandare } from "@/lib/auth";
import { kontrolleraAiKvot } from "@/lib/aikvot";

/** Letar efter vinet i katalogen: först namn + producent, sedan bara namnet, sedan bara producenten. */
async function matcha(anvId: string, namn: string, producent: string | null, argang: number | null) {
  const sett = new Map<string, Awaited<ReturnType<typeof sokKatalog>>[number]>();
  for (const q of [[producent, namn].filter(Boolean).join(" "), namn, producent ?? ""]) {
    if (q.trim().length < 2 || sett.size >= 5) continue;
    for (const t of await sokKatalog(anvId, q, { limit: 5 })) if (!sett.has(t.id)) sett.set(t.id, t);
  }
  // samma årgång först
  return [...sett.values()].sort((a, b) => Number(b.argang === argang) - Number(a.argang === argang)).slice(0, 5);
}

const TILLATNA: BildTyp[] = ["image/jpeg", "image/png", "image/webp"];
const MAX = 6 * 1024 * 1024;

/** Tar emot ett etikettfoto, sparar det och låter Claude identifiera flaskan. Letar också efter en träff i katalogen. */
export async function POST(req: Request) {
  const anv = await hamtaAnvandare();
  if (!anv) return EJ_INLOGGAD();
  const form = await req.formData().catch(() => null);
  const fil = form?.get("bild");
  if (!(fil instanceof File)) return Response.json({ fel: "Ingen bild skickades." }, { status: 400 });
  if (!TILLATNA.includes(fil.type as BildTyp)) return Response.json({ fel: "Använd en JPEG-, PNG- eller WebP-bild." }, { status: 415 });
  if (fil.size > MAX) return Response.json({ fel: "Bilden är för stor (max 6 MB)." }, { status: 413 });

  const data = Buffer.from(await fil.arrayBuffer());
  const bildUrl = await sparaBild(data, fil.type, anv.id);
  try {
    await kontrolleraAiKvot(anv.id, "etikett");
    const svar = await identifieraEtikett(data.toString("base64"), fil.type as BildTyp);
    if (!svar.arDryck) return Response.json({ fel: "Det gick inte att hitta en vin- eller spritetikett på bilden. Prova att fota närmare och rakt framifrån.", bildUrl }, { status: 422 });
    const traffar = svar.lage === "live" ? await matcha(anv.id, svar.namn, svar.producent, svar.argang) : [];
    return Response.json({ ...svar, bildUrl, traffar });
  } catch (e) {
    if (e instanceof AiError) return Response.json({ fel: e.message, typ: e.kind, bildUrl }, { status: e.kind === "rate_limit" ? 429 : 502 });
    throw e;
  }
}
