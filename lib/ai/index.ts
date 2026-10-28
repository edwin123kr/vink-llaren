import "server-only";
import { aiMode, kravLiveIProduktion, strukturerat } from "./client";
import { VINGUIDE } from "./vinguide";
import { mockDryckForslag, mockEtikett, mockProvning, mockSmakanalys } from "./mock";
import { DryckForslag, EtikettSvar, Provningsforslag, Smakanalys } from "./schemas";

export { aiMode, aiModel, AiError } from "./client";
export type { SmakUnderlag, ProvningUnderlag } from "./types";
import type { SmakUnderlag, ProvningUnderlag } from "./types";
export type { DryckForslag, EtikettSvar, Provningsforslag, Smakanalys } from "./schemas";

const SYSTEM_DRYCK = `Du är en kunnig sommelier och spritexpert som hjälper en svensk användare att katalogisera sin vin- och spritsamling.
Svara alltid på svenska. Fyll bara i uppgifter du har god grund för; använd null eller tomma listor hellre än att gissa.
Smakprofilen anges på skalan 0–12 som Systembolagets smakklockor. Rökighet används främst för sprit; strävhet och syra främst för vin.
Pris anges i svenska kronor och bara om du har en rimlig uppfattning om nivån.

${VINGUIDE}`;

/** Fyll i uppgifter om en dryck utifrån namn, producent med mera (fas 3 bygger UI:t). */
export async function fyllDryck(beskrivning: string, underlag?: string): Promise<DryckForslag & { lage: "mock" | "live" }> {
  kravLiveIProduktion();
  if (aiMode() === "mock") return { ...mockDryckForslag(beskrivning), lage: "mock" };
  const svar = await strukturerat({
    schema: DryckForslag,
    system: SYSTEM_DRYCK,
    content: [{ type: "text", text: `Fyll i uppgifter om den här drycken:\n${beskrivning}${underlag ? `\n\nLiknande drycker som redan finns i katalogen (använd dem som stöd, men kopiera inte blint; drycken kan vara en annan årgång eller producent):\n${underlag}` : ""}` }],
  });
  return { ...svar, lage: "live" };
}

export type BildTyp = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/** Läs en etikett från ett foto och fyll i uppgifterna. */
export async function identifieraEtikett(base64: string, mediaType: BildTyp): Promise<EtikettSvar & { lage: "mock" | "live" }> {
  kravLiveIProduktion();
  if (aiMode() === "mock") return { ...mockEtikett(), lage: "mock" };
  const svar = await strukturerat({
    schema: EtikettSvar,
    system: SYSTEM_DRYCK,
    content: [
      { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
      {
        type: "text",
        text: "Identifiera flaskan på bilden. Läs etiketten noga: namn, producent, årgång, alkoholhalt, volym, land och region. Fyll sedan i druva/råvara, smakprofil, dofter och mat utifrån vad du vet om produkten eller stilen. Lista i osakraFalt allt du gissat eller inte kunnat läsa tydligt. Om bilden inte visar en vin- eller spritflaska, sätt arDryck till false.",
      },
    ],
  });
  return { ...svar, lage: "live" };
}


const SYSTEM_SMAK = `Du är en personlig sommelier som analyserar en svensk användares betyg (skala 0–10) på vin eller sprit.
Svara på svenska, i du-form, konkret och utan överdrifter. Bygg bara på underlaget du får.
Smakprofiler anges på skalan 0–12 som Systembolagets smakklockor.
Rekommendationer får ENDAST använda id:n ur kandidatlistan. Hittar du inget passande, välj färre.
Under "utforska" får du föreslå en instegsflaska utifrån din kunskap, men skriv den som en stil eller en välkänd produkt och undvik påhittade namn.
Lista bara något under "undvik" om det finns minst två låga betyg som stöder det.`;

/** Smakanalys. I provläget byggs texten av de lokala siffrorna. */
export async function analyseraSmak(u: SmakUnderlag): Promise<Smakanalys & { lage: "mock" | "live" }> {
  const giltiga = new Set(u.kandidater.map((k) => k.id));
  kravLiveIProduktion();
  if (aiMode() === "mock") return { ...mockSmakanalys(u), lage: "mock" };
  const svar = await strukturerat({
    schema: Smakanalys,
    system: SYSTEM_SMAK,
    content: [{ type: "text", text: `Underlag (JSON):\n${JSON.stringify(u)}` }],
    effort: "medium",
  });
  return { ...svar, rekommendationer: svar.rekommendationer.filter((r) => giltiga.has(r.id)).slice(0, 6), lage: "live" };
}


const SYSTEM_PROVNING = `Du är en erfaren sommelier som planerar vinprovningar för svenska privatpersoner.
Svara på svenska. Föreslå bara vin (ingen sprit). Välj gärna viner som brukar finnas på Systembolaget, men hitta inte på produkter:
föredra välkända producenter och viner, och skriv stilen tydligt så att användaren kan hitta ett likvärdigt alternativ.
Ordna vinerna i provningsordning: mousserande först, sedan vitt före rött, lätt före tungt, och sött eller starkvin sist.
Håll dig inom budgeten: summan av pris × antal flaskor per vin ska helst inte överstiga totalbudgeten.
Om temat är blindprovning: välj viner med tydliga skillnader och skriv vad deltagarna kan gissa på.`;

export async function planeraProvning(u: ProvningUnderlag): Promise<Provningsforslag & { lage: "mock" | "live" }> {
  kravLiveIProduktion();
  if (aiMode() === "mock") return { ...mockProvning(u), lage: "mock" };
  const svar = await strukturerat({
    schema: Provningsforslag,
    system: SYSTEM_PROVNING,
    content: [
      {
        type: "text",
        text: `Planera en vinprovning.\nDeltagare: ${u.deltagare}\nAntal viner: ${u.antalViner}\nBudget per person: ${u.budgetPerPerson} kr (totalt ${u.totalbudget} kr, ungefär ${u.budgetPerFlaska} kr per flaska i snitt)\nFlaskor per vin i ordning: ${u.flaskorPerVin.join(", ")}\nTema: ${u.tema ?? "fritt"}\n${u.favoriter.length ? `Värdens favoritstilar: ${u.favoriter.join(", ")}\n` : ""}Ge exakt ${u.antalViner} viner.`,
      },
    ],
    effort: "medium",
  });
  return { ...svar, viner: svar.viner.slice(0, u.antalViner), lage: "live" };
}
