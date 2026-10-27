import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { geminiStrukturerat } from "./gemini";

/**
 * Den enda platsen där Claude anropas. Körs bara på servern; nyckeln når aldrig webbläsaren.
 * AI_MODE=mock (standard) ger provlägessvar, AI_MODE=live anropar API:et.
 */
export type AiMode = "mock" | "live";

export function aiMode(): AiMode {
  return process.env.AI_MODE === "live" ? "live" : "mock";
}

/**
 * På den publicerade sajten (Vercel) ger provläget inga användbara svar, så där stoppas AI-anropen med
 * ett tydligt besked tills AI_MODE=live och ANTHROPIC_API_KEY är satta.
 */
export function kravLiveIProduktion() {
  if (aiMode() === "mock" && process.env.VERCEL) {
    throw new AiError("AI-funktionerna är inte aktiverade ännu. Fyll i uppgifterna själv så länge.", "config");
  }
}

/** Vilken AI-tjänst som används: Gemini (gratis) om AI_PROVIDER=gemini, eller om bara en Gemini-nyckel finns. */
export function aiProvider(): "anthropic" | "gemini" {
  if (process.env.AI_PROVIDER === "gemini") return "gemini";
  if (process.env.AI_PROVIDER === "anthropic") return "anthropic";
  return !process.env.ANTHROPIC_API_KEY && process.env.GEMINI_API_KEY ? "gemini" : "anthropic";
}

export function aiModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
}

export class AiError extends Error {
  constructor(
    message: string,
    public readonly kind: "config" | "refusal" | "parse" | "rate_limit" | "api",
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
export function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiError("ANTHROPIC_API_KEY saknas. Lägg till den i .env eller använd AI_MODE=mock.", "config");
  }
  client ??= new Anthropic();
  return client;
}

export type UserContent = Anthropic.Beta.BetaContentBlockParam[];

/**
 * Strukturerat anrop: Claude svarar med JSON som valideras mot ett Zod-schema.
 * Server-side fallback ("default") tar över om modellen avböjer av säkerhetsskäl.
 */
export async function strukturerat<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  content: UserContent;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<z.infer<S>> {
  if (aiProvider() === "gemini") return geminiStrukturerat(opts as never);
  const c = getClient();
  try {
    const res = await c.beta.messages.parse({
      model: aiModel(),
      max_tokens: opts.maxTokens ?? 16000,
      system: opts.system,
      messages: [{ role: "user", content: opts.content }],
      output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(opts.schema) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    if (res.stop_reason === "refusal") {
      throw new AiError("Vår sommelier kunde inte svara på den här frågan.", "refusal");
    }
    if (res.parsed_output == null) {
      throw new AiError("Svaret gick inte att tolka. Försök igen.", "parse");
    }
    return res.parsed_output as z.infer<S>;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new AiError("För många AI-anrop just nu. Försök igen om en stund.", "rate_limit");
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("API-nyckeln godkändes inte.", "config");
    if (e instanceof Anthropic.APIError) throw new AiError(`AI-tjänsten svarade med fel (${e.status ?? "okänt"}).`, "api");
    throw e;
  }
}
