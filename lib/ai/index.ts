import "server-only";
import { aiMode, strukturerat } from "./client";
import { mockDryckForslag } from "./mock";
import { DryckForslag } from "./schemas";

export { aiMode, aiModel, AiError } from "./client";
export type { DryckForslag } from "./schemas";

const SYSTEM_DRYCK = `Du är en kunnig sommelier och spritexpert som hjälper en svensk användare att katalogisera sin vin- och spritsamling.
Svara alltid på svenska. Fyll bara i uppgifter du har god grund för; använd null eller tomma listor hellre än att gissa.
Smakprofilen anges på skalan 0–12 som Systembolagets smakklockor. Rökighet används främst för sprit; strävhet och syra främst för vin.
Pris anges i svenska kronor och bara om du har en rimlig uppfattning om nivån.`;

/** Fyll i uppgifter om en dryck utifrån namn, producent med mera (fas 3 bygger UI:t). */
export async function fyllDryck(beskrivning: string): Promise<DryckForslag & { lage: "mock" | "live" }> {
  if (aiMode() === "mock") return { ...mockDryckForslag(beskrivning), lage: "mock" };
  const svar = await strukturerat({
    schema: DryckForslag,
    system: SYSTEM_DRYCK,
    content: [{ type: "text", text: `Fyll i uppgifter om den här drycken:\n${beskrivning}` }],
  });
  return { ...svar, lage: "live" };
}
