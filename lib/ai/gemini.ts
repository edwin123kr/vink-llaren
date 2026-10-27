import "server-only";
import { z } from "zod";
import { AiError } from "./client";

/**
 * Google Gemini som gratis alternativ till Claude (AI_PROVIDER=gemini, GEMINI_API_KEY). Anropas med
 * vanlig REST, utan extra paket. Gratisnivån har dagliga gränser och Google får använda
 * indata för att förbättra sina tjänster, så skicka inget känsligt.
 */
const BAS = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";

export const geminiModell = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";

function nyckel() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new AiError("GEMINI_API_KEY saknas.", "config");
  return k;
}

type Del = { text: string } | { inlineData: { mimeType: string; data: string } };

/** Konverterar Anthropic-formade innehållsblock (text och bild) till Gemini-delar. */
export function tillDelar(content: { type: string; text?: string; source?: { media_type: string; data: string } }[]): Del[] {
  return content.flatMap((b): Del[] =>
    b.type === "text" && b.text != null ? [{ text: b.text }] : b.type === "image" && b.source ? [{ inlineData: { mimeType: b.source.media_type, data: b.source.data } }] : [],
  );
}

async function fel(res: Response): Promise<never> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (res.status === 429) throw new AiError("Gratis-AI:ns gräns är nådd för stunden. Försök igen om en stund.", "rate_limit");
  if (res.status === 400 && /API key/i.test(j?.error?.message ?? "")) throw new AiError("AI-nyckeln godkändes inte.", "config");
  if (res.status === 403) throw new AiError("AI-nyckeln saknar behörighet.", "config");
  throw new AiError(`AI-tjänsten svarade med fel (${res.status}).`, "api");
}

export async function geminiStrukturerat<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  content: Parameters<typeof tillDelar>[0];
}): Promise<z.infer<S>> {
  const { $schema: _s, ...schema } = z.toJSONSchema(opts.schema) as Record<string, unknown>;
  void _s;
  let res: Response;
  try {
    res = await fetch(`${BAS}/models/${geminiModell()}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": nyckel() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts: tillDelar(opts.content) }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.3 },
      }),
    });
  } catch {
    throw new AiError("Kunde inte nå AI-tjänsten.", "api");
  }
  if (!res.ok) return fel(res);
  const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
  if (j.promptFeedback?.blockReason) throw new AiError("Frågan kunde inte besvaras.", "refusal");
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  try {
    return opts.schema.parse(JSON.parse(text));
  } catch {
    throw new AiError("Svaret gick inte att tolka. Försök igen.", "parse");
  }
}

export type GeminiHandelse = { typ: "text"; text: string } | { typ: "sok"; fraga: string } | { typ: "kallor"; lista: { titel: string; url: string }[] };

/** Strömmande chatt med Googles sökgrundning (gratis nivå har en daglig gräns för sökningar). */
export async function* geminiStrom(system: string, historik: { roll: "user" | "assistant"; text: string }[], fraga: string): AsyncGenerator<GeminiHandelse> {
  let res: Response;
  try {
    res = await fetch(`${BAS}/models/${geminiModell()}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": nyckel() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [...historik.slice(-20).map((m) => ({ role: m.roll === "user" ? "user" : "model", parts: [{ text: m.text }] })), { role: "user", parts: [{ text: fraga }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.6 },
      }),
    });
  } catch {
    throw new AiError("Kunde inte nå AI-tjänsten.", "api");
  }
  if (!res.ok || !res.body) await fel(res);

  const kallor = new Map<string, { titel: string; url: string }>();
  const sokta = new Set<string>();
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const rader = buf.split(/\r?\n/);
    buf = rader.pop() ?? "";
    for (const r of rader) {
      if (!r.startsWith("data:")) continue;
      let j: { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: { webSearchQueries?: string[]; groundingChunks?: { web?: { uri?: string; title?: string } }[] }; finishReason?: string }[] };
      try {
        j = JSON.parse(r.slice(5));
      } catch {
        continue;
      }
      const c = j.candidates?.[0];
      for (const q of c?.groundingMetadata?.webSearchQueries ?? []) {
        if (sokta.has(q)) continue;
        sokta.add(q);
        yield { typ: "sok", fraga: q };
      }
      for (const g of c?.groundingMetadata?.groundingChunks ?? []) if (g.web?.uri && !kallor.has(g.web.uri)) kallor.set(g.web.uri, { titel: g.web.title || "Källa", url: g.web.uri });
      for (const p of c?.content?.parts ?? []) if (p.text) yield { typ: "text", text: p.text };
      if (c?.finishReason === "SAFETY" || c?.finishReason === "PROHIBITED_CONTENT") throw new AiError("Sommeliern kunde inte svara på den frågan.", "refusal");
    }
  }
  if (kallor.size) yield { typ: "kallor", lista: [...kallor.values()].slice(0, 8) };
}
