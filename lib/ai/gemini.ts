import "server-only";
import { z } from "zod";
import { AiError } from "./client";

/**
 * Google Gemini som gratis alternativ till Claude (AI_PROVIDER=gemini, GEMINI_API_KEY). Anropas med
 * vanlig REST, utan extra paket. Gratisnivån har dagliga gränser och Google får använda
 * indata för att förbättra sina tjänster, så skicka inget känsligt.
 */
const BAS = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";

let vald: string | null = null;
export const geminiModell = () => vald || process.env.GEMINI_MODEL || "gemini-2.5-flash";

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

/** Modeller som nyckeln får använda, bästa först: Flash (nyast först), sedan Flash-Lite. */
async function modeller(): Promise<string[]> {
  const res = await fetch(`${BAS}/models?pageSize=200`, { headers: { "x-goog-api-key": nyckel() } }).catch(() => null);
  if (!res?.ok) return [];
  const j = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const namn = (j.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => m.name.replace("models/", ""))
    .filter((n) => /^gemini-[\d.]+-flash(-lite)?$/.test(n));
  const ver = (n: string) => parseFloat(n.split("-")[1]);
  const sortera = (l: string[]) => l.sort((x, y) => ver(y) - ver(x));
  return [...sortera(namn.filter((n) => !n.endsWith("-lite"))), ...sortera(namn.filter((n) => n.endsWith("-lite")))];
}

/**
 * Anropar Gemini. Finns inte modellen (404) eller är dess gratisgräns nådd (429) provas nästa tillgängliga
 * modell, och en modell som fungerar kommer ihåg till nästa anrop. `utanSok` används som sista utväg
 * om sökgrundningens egen gräns är slut.
 */
async function anropa(metod: string, query: string, body: Record<string, unknown>): Promise<Response> {
  const skicka = (modell: string, b = body) =>
    fetch(`${BAS}/models/${modell}:${metod}${query}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": nyckel() },
      body: JSON.stringify(b),
    });
  // 404 = modellen finns inte, 429 = gratisgränsen nådd, 500/503 = Google är överbelastat just nu
  const provaNasta = (s: number) => s === 404 || s === 429 || s === 500 || s === 503;
  let res = await skicka(geminiModell());
  if (res.ok || !provaNasta(res.status)) return res;
  const forsta = res.status;
  for (const m of (await modeller()).filter((x) => x !== geminiModell()).slice(0, 5)) {
    const r = await skicka(m);
    if (r.ok) {
      vald = m;
      return r;
    }
    if (!provaNasta(r.status)) return r;
    res = r;
  }
  // överbelastning går ofta över på någon sekund: en sista omgång på den förvalda modellen
  if (forsta === 503 || forsta === 500) {
    await new Promise((r) => setTimeout(r, 1500));
    const r = await skicka(geminiModell());
    if (r.ok || !provaNasta(r.status)) return r;
  }
  // sökgrundningen har egen kvot: försök en sista gång utan den
  if (forsta === 429 && body.tools) {
    const { tools: _t, ...utan } = body;
    void _t;
    const r = await skicka(geminiModell(), utan);
    if (r.ok) return r;
  }
  return res;
}

async function fel(res: Response): Promise<never> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  console.error("Gemini-fel", res.status, j?.error?.message);
  if (res.status === 404) throw new AiError("Hittade ingen AI-modell som nyckeln får använda. Kontrollera nyckeln på aistudio.google.com.", "config");
  if (res.status === 503 || res.status === 500) throw new AiError("Googles AI är överbelastad just nu. Försök igen om en stund.", "rate_limit");
  if (res.status === 429) throw new AiError("Gratis-AI:ns gräns är nådd för stunden. Försök igen om en stund.", "rate_limit");
  if (res.status === 400 && /API key/i.test(j?.error?.message ?? "")) throw new AiError("AI-nyckeln godkändes inte.", "config");
  if (res.status === 403) throw new AiError("AI-nyckeln saknar behörighet.", "config");
  throw new AiError(`AI-tjänsten svarade med fel (${res.status}).`, "api");
}

/** Diagnos för ägaren: ett minimalt anrop och Googles egna svar (utan nyckeln). */
export async function provaGemini() {
  const res = await anropa("generateContent", "", { contents: [{ role: "user", parts: [{ text: "Svara med ordet ok." }] }] }).catch(() => null);
  if (!res) return { ok: false, status: 0, modell: geminiModell(), meddelande: "Kunde inte nå Google." };
  const j = (await res.json().catch(() => null)) as { error?: { message?: string; status?: string; details?: { violations?: { quotaMetric?: string; quotaId?: string }[]; retryDelay?: string }[] } } | null;
  const violations = j?.error?.details?.flatMap((d) => d.violations ?? []) ?? [];
  return {
    ok: res.ok,
    status: res.status,
    modell: geminiModell(),
    meddelande: res.ok ? "Fungerar" : (j?.error?.message ?? "").slice(0, 600),
    kvoter: violations.map((v) => v.quotaId || v.quotaMetric).filter(Boolean),
    vantaSek: j?.error?.details?.find((d) => d.retryDelay)?.retryDelay,
  };
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
    res = await anropa("generateContent", "", {
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: tillDelar(opts.content) }],
      generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.3 },
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
    res = await anropa("streamGenerateContent", "?alt=sse", {
      systemInstruction: { parts: [{ text: system }] },
      contents: [...historik.slice(-20).map((m) => ({ role: m.roll === "user" ? "user" : "model", parts: [{ text: m.text }] })), { role: "user", parts: [{ text: fraga }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.6 },
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
