import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AiError, aiMode, aiModel, getClient } from "./client";

/**
 * AI-sommeliern: ett strömmande samtal. Claude får veta vad som finns i användarens samling och hur
 * smakprofilen ser ut, och kan söka på webben när en fråga kräver aktuella eller exakta uppgifter.
 */
const SYSTEM = `Du är Vinkällarens sommelier: en erfaren, certifierad sommelier med kunskap motsvarande WSET Diploma och Court of Master Sommeliers. Du kan druvor, regioner och appellationer, vinifikation, årgångar, lagring och drickfönster, servering (temperatur, glas, dekantering), mat och dryck, samt sprit (whisky, rom, gin, konjak, calvados med mera).

Så här arbetar du:
- Svara alltid på svenska, varmt och konkret, som en sommelier vid bordet. Börja med svaret och motivera kort. Håll det kort om inte användaren vill ha fördjupning.
- Utgå från användarens egen samling och smakprofil (nedan) när det passar. Föreslå i första hand flaskor de redan har, med exakt namn, och säg varför. Föreslå annars en stil, druva eller region och gärna ett par konkreta exempel.
- Använd webbsökningen när frågan gäller något som ändras eller som du inte är säker på: en specifik producent eller produkt, en årgångs kvalitet, priser, utmärkelser eller nyheter. Hitta aldrig på fakta, priser, poäng eller årgångsomdömen. Är du osäker, säg det.
- Du kan inte se Systembolagets lager. Föreslå att användaren söker på systembolaget.se om de vill köpa något.
- Priser anges i svenska kronor och bara när du har grund för dem.
- Formatering: korta stycken, punktlistor med "- " och **fetstil** för vinnamn. Inga tabeller och inga rubriker större än ###.
- Håll dig till vin, sprit, öl, mat och dryck, servering och samlande. Andra frågor besvarar du kort och vänligt leder tillbaka.
- Uppmuntra måttfullhet utan att moralisera. Ge inga råd om alkohol till minderåriga eller om att köra efter att ha druckit.`;

export type Kontext = { namn: string; samling: string; smak: string; senaste: string };
export type Historik = { roll: "user" | "assistant"; text: string }[];
export type Kalla = { titel: string; url: string };
export type SommelierHandelse = { typ: "text"; text: string } | { typ: "sok"; fraga: string } | { typ: "kallor"; lista: Kalla[] };

function kontextText(k: Kontext) {
  return `Användaren heter ${k.namn}.

## Samlingen (flaskor som finns hemma)
${k.samling || "Samlingen är tom."}

## Smakprofil
${k.smak || "Inga betyg än."}

## Senaste betyg (0–10)
${k.senaste || "Inga betyg än."}`;
}

export async function* fragaSommelier(kontext: Kontext, historik: Historik, fraga: string): AsyncGenerator<SommelierHandelse> {
  if (aiMode() === "mock") {
    yield* mockSvar(kontext, fraga);
    return;
  }
  const c = getClient();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...historik.slice(-20).map((m) => ({ role: m.roll, content: m.text })),
    { role: "user" as const, content: fraga },
  ];
  const kallor = new Map<string, Kalla>();
  try {
    // en server-sökning kan pausa turen (pause_turn); då skickas den tillbaka för att fortsätta
    for (let varv = 0; varv < 4; varv++) {
      const stream = c.beta.messages.stream({
        model: aiModel(),
        max_tokens: 8000,
        system: [
          { type: "text", text: SYSTEM },
          { type: "text", text: kontextText(kontext), cache_control: { type: "ephemeral" } },
        ],
        messages,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4, user_location: { type: "approximate", country: "SE", timezone: "Europe/Stockholm" } }],
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
      for await (const h of stream) {
        if (h.type === "content_block_delta") {
          if (h.delta.type === "text_delta") yield { typ: "text", text: h.delta.text };
          else if (h.delta.type === "citations_delta" && h.delta.citation.type === "web_search_result_location") {
            const ci = h.delta.citation;
            if (!kallor.has(ci.url)) kallor.set(ci.url, { titel: ci.title || new URL(ci.url).hostname, url: ci.url });
          }
        } else if (h.type === "content_block_start" && h.content_block.type === "server_tool_use") {
          yield { typ: "sok", fraga: "" };
        }
      }
      const svar = await stream.finalMessage();
      for (const b of svar.content) {
        if (b.type === "server_tool_use" && b.name === "web_search") {
          const q = (b.input as { query?: string })?.query;
          if (q) yield { typ: "sok", fraga: q };
        }
      }
      if (svar.stop_reason === "refusal") throw new AiError("Sommeliern kunde inte svara på den frågan.", "refusal");
      if (svar.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: svar.content as Anthropic.Beta.BetaContentBlockParam[] });
    }
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new AiError("För många AI-anrop just nu. Försök igen om en stund.", "rate_limit");
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("API-nyckeln godkändes inte.", "config");
    if (e instanceof Anthropic.APIError) throw new AiError(`AI-tjänsten svarade med fel (${e.status ?? "okänt"}).`, "api");
    throw e;
  }
  if (kallor.size) yield { typ: "kallor", lista: [...kallor.values()].slice(0, 8) };
}

/** Provläge (AI_MODE=mock): ett allmänt svar som strömmas ut ord för ord, så att gränssnittet fungerar utan nyckel. */
async function* mockSvar(k: Kontext, fraga: string): AsyncGenerator<SommelierHandelse> {
  const forsta = k.samling.split("\n").find((r) => r.startsWith("- "))?.replace(/^- /, "").split(" | ")[0];
  void fraga;
  const text = `Några tumregler att utgå från:
- **Matcha intensitet:** lätt mat med lätta viner, kraftig mat med fylligare viner.
- **Syra är din vän:** ett vin med frisk syra lyfter feta och salta rätter.
- **Tanniner och protein:** strävare röda viner passar bäst till rött kött.
- **Sötma mot hetta:** en aning sötma tämjer stark mat.
${forsta ? `\nUr din samling skulle jag titta på **${forsta}**.` : "\nLägg till några flaskor i samlingen, så kan jag föreslå ur den."}`;
  for (const ord of text.split(/(\s+)/)) {
    await new Promise((r) => setTimeout(r, 12));
    yield { typ: "text", text: ord };
  }
}
