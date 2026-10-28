import { aiMode, aiModel, aiProvider } from "@/lib/ai/client";
import { geminiModell, provaGemini } from "@/lib/ai/gemini";
import { hamtaAnvandare } from "@/lib/auth";

/** Snabbkoll för ägaren: är AI påslaget och finns en nyckel? (Visar aldrig själva nyckeln.) */
export async function GET(req: Request) {
  // ?test=1 (kräver inloggning): gör ett minimalt anrop och visar Googles svar, för felsökning
  if (new URL(req.url).searchParams.get("test") === "1") {
    if (!(await hamtaAnvandare())) return Response.json({ fel: "Logga in först." }, { status: 401 });
    if (aiMode() !== "live" || aiProvider() !== "gemini") return Response.json({ fel: "Gemini är inte aktivt." });
    return Response.json(await provaGemini());
  }
  return Response.json({
    lage: aiMode(),
    tjanst: aiProvider(),
    nyckel: Boolean(aiProvider() === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY),
    modell: aiMode() === "live" ? (aiProvider() === "gemini" ? geminiModell() : aiModel()) : null,
    databas: Boolean(process.env.DATABASE_URL),
  });
}
