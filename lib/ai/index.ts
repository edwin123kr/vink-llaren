import "server-only";
import { aiMode, strukturerat } from "./client";
import { mockDryckForslag, mockEtikett } from "./mock";
import { DryckForslag, EtikettSvar } from "./schemas";

export { aiMode, aiModel, AiError } from "./client";
export type { DryckForslag, EtikettSvar } from "./schemas";

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

export type BildTyp = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/** Läs en etikett från ett foto och fyll i uppgifterna. */
export async function identifieraEtikett(base64: string, mediaType: BildTyp): Promise<EtikettSvar & { lage: "mock" | "live" }> {
  if (aiMode() === "mock") return { ...mockEtikett(), lage: "mock" };
  const svar = await strukturerat({
    schema: EtikettSvar,
    system: SYSTEM_DRYCK,
    content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
      {
        type: "text",
        text: "Identifiera flaskan på bilden. Läs etiketten noga: namn, producent, årgång, alkoholhalt, volym, land och region. Fyll sedan i druva/råvara, smakprofil, dofter och mat utifrån vad du vet om produkten eller stilen. Om bilden inte visar en vin- eller spritflaska, sätt arDryck till false.",
      },
    ],
  });
  return { ...svar, lage: "live" };
}
