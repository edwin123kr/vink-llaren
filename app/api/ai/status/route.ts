import { aiMode, aiModel } from "@/lib/ai";

/** Snabbkoll för ägaren: är AI påslaget och finns en nyckel? (Visar aldrig själva nyckeln.) */
export function GET() {
  return Response.json({
    lage: aiMode(),
    nyckel: Boolean(process.env.ANTHROPIC_API_KEY),
    modell: aiMode() === "live" ? aiModel() : null,
    databas: Boolean(process.env.DATABASE_URL),
  });
}
