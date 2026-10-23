import "server-only";
import { db } from "@/lib/db";
import { AiError, aiMode } from "@/lib/ai";

/**
 * Daglig gräns för AI-anrop per konto (bara i live-läge), så att vänner som testar inte kan
 * dra iväg kostnaden på din API-nyckel. Ändra med AI_GRANS_PER_DAG i .env (0 = ingen gräns).
 */
export async function kontrolleraAiKvot(anvandareId: string, typ: string) {
  if (aiMode() !== "live") return;
  const grans = Number(process.env.AI_GRANS_PER_DAG ?? 40);
  if (grans > 0) {
    const idag = new Date();
    idag.setHours(0, 0, 0, 0);
    const antal = await db.aiAnrop.count({ where: { anvandareId, skapad: { gte: idag } } });
    if (antal >= grans) throw new AiError(`Dagens gräns för AI är nådd (${grans} anrop). Försök igen i morgon.`, "rate_limit");
  }
  await db.aiAnrop.create({ data: { anvandareId, typ } });
}
