import { aiMode, aiModel } from "@/lib/ai";

export function GET() {
  return Response.json({ lage: aiMode(), modell: aiMode() === "live" ? aiModel() : null });
}
