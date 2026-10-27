import { aiMode, aiModel, aiProvider } from "@/lib/ai/client";
import { geminiModell } from "@/lib/ai/gemini";

/** Snabbkoll för ägaren: är AI påslaget och finns en nyckel? (Visar aldrig själva nyckeln.) */
export function GET() {
  return Response.json({
    lage: aiMode(),
    tjanst: aiProvider(),
    nyckel: Boolean(aiProvider() === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY),
    modell: aiMode() === "live" ? (aiProvider() === "gemini" ? geminiModell() : aiModel()) : null,
    databas: Boolean(process.env.DATABASE_URL),
  });
}
