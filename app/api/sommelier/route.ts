import { z } from "zod";
import { db } from "@/lib/db";
import { EJ_INLOGGAD, hamtaAnvandare } from "@/lib/auth";
import { angraAiAnrop, kontrolleraAiKvot } from "@/lib/aikvot";
import { AiError } from "@/lib/ai";
import { fragaSommelier, type Kalla } from "@/lib/ai/sommelier";
import { sommelierKontext } from "@/lib/sommelierkontext";

const Body = z.object({ samtalId: z.string().max(40).nullable().optional(), fraga: z.string().trim().min(1, "Skriv en fråga.").max(2000, "Frågan är för lång.") });

/**
 * Strömmar sommelierns svar som NDJSON: en rad per händelse
 * ({typ:"samtal"}, {typ:"text"}, {typ:"sok"}, {typ:"kallor"}, {typ:"klar"} eller {typ:"fel"}).
 */
export async function POST(req: Request) {
  const anv = await hamtaAnvandare();
  if (!anv) return EJ_INLOGGAD();
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ fel: p.error.issues[0]?.message ?? "Ogiltig fråga." }, { status: 400 });

  let samtal = p.data.samtalId ? await db.samtal.findFirst({ where: { id: p.data.samtalId, anvandareId: anv.id } }) : null;
  const historik = samtal ? await db.meddelande.findMany({ where: { samtalId: samtal.id }, orderBy: { skapad: "asc" }, select: { roll: true, text: true } }) : [];
  let kvot: string | null = null;
  try {
    kvot = await kontrolleraAiKvot(anv.id, "sommelier");
  } catch (e) {
    if (e instanceof AiError) return Response.json({ fel: e.message }, { status: 429 });
    throw e;
  }
  samtal ??= await db.samtal.create({ data: { anvandareId: anv.id, titel: p.data.fraga.slice(0, 80) } });
  await db.meddelande.create({ data: { samtalId: samtal.id, roll: "user", text: p.data.fraga } });
  const kontext = await sommelierKontext(anv);
  const samtalId = samtal.id;

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const skicka = (o: object) => ctrl.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      skicka({ typ: "samtal", id: samtalId });
      let text = "";
      let kallor: Kalla[] = [];
      try {
        for await (const h of fragaSommelier(kontext, historik as { roll: "user" | "assistant"; text: string }[], p.data.fraga)) {
          if (h.typ === "text") text += h.text;
          if (h.typ === "kallor") kallor = h.lista;
          skicka(h);
        }
        if (text.trim()) {
          await db.meddelande.create({ data: { samtalId, roll: "assistant", text, kallor: kallor.length ? kallor : undefined } });
          await db.samtal.update({ where: { id: samtalId }, data: { uppdaterad: new Date() } });
        }
        skicka({ typ: "klar" });
      } catch (e) {
        if (!text.trim()) await angraAiAnrop(kvot);
        if (text.trim()) await db.meddelande.create({ data: { samtalId, roll: "assistant", text: text + "\n\n*(Svaret avbröts.)*" } });
        skicka({ typ: "fel", text: e instanceof AiError ? e.message : "Något gick fel. Försök igen." });
        if (!(e instanceof AiError)) console.error(e);
      } finally {
        ctrl.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
