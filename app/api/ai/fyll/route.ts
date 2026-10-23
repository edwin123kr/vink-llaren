import { z } from "zod";
import { AiError, fyllDryck } from "@/lib/ai";
import { EJ_INLOGGAD, hamtaAnvandare } from "@/lib/auth";
import { kontrolleraAiKvot } from "@/lib/aikvot";

const Body = z.object({ beskrivning: z.string().trim().min(2).max(500) });

export async function POST(req: Request) {
  const anv = await hamtaAnvandare();
  if (!anv) return EJ_INLOGGAD();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ fel: "Skriv minst två tecken om drycken." }, { status: 400 });
  try {
    await kontrolleraAiKvot(anv.id, "fyll");
    return Response.json(await fyllDryck(parsed.data.beskrivning));
  } catch (e) {
    if (e instanceof AiError) return Response.json({ fel: e.message, typ: e.kind }, { status: e.kind === "rate_limit" ? 429 : 502 });
    throw e;
  }
}
