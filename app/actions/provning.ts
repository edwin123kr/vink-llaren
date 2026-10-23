"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AiError, planeraProvning, type Provningsforslag } from "@/lib/ai";
import { db } from "@/lib/db";
import { kalkyl } from "@/lib/provning";
import { hamtaBetygade } from "@/lib/smakdata";
import { grupper } from "@/lib/smak";
import { sokText, dubblettNyckel } from "@/lib/sok";

const In = z.object({
  titel: z.string().trim().max(120).optional(),
  datum: z.string().trim().optional(),
  deltagare: z.number().int().min(1, "Minst en deltagare.").max(100, "Högst 100 deltagare."),
  antalViner: z.number().int().min(1, "Minst ett vin.").max(12, "Högst 12 viner."),
  budgetPerPerson: z.number().int().min(0, "Budgeten kan inte vara negativ.").max(100000),
  tema: z.string().trim().max(200).optional(),
});

export async function skapaProvning(input: unknown): Promise<{ ok: true; id: string } | { ok: false; fel: Record<string, string> }> {
  const p = In.safeParse(input);
  if (!p.success) return { ok: false, fel: Object.fromEntries(p.error.issues.map((i) => [String(i.path[0] ?? "_"), i.message])) };
  const k = kalkyl(p.data);
  const favoriter = grupper((await hamtaBetygade()).filter((d) => d.typ === "vin" && d.snitt >= 70), (d) => d.druvor).slice(0, 4).map((g) => g.namn);
  try {
    const forslag = await planeraProvning({
      deltagare: k.deltagare,
      antalViner: k.antalViner,
      budgetPerPerson: p.data.budgetPerPerson,
      totalbudget: k.totalbudget,
      budgetPerFlaska: k.budgetPerFlaska,
      flaskorPerVin: k.flaskorPerVin,
      tema: p.data.tema || null,
      favoriter,
    });
    const ny = await db.provning.create({
      data: {
        titel: p.data.titel || (p.data.tema ? `Provning: ${p.data.tema}` : "Vinprovning"),
        datum: p.data.datum ? new Date(p.data.datum) : null,
        deltagare: k.deltagare,
        antalViner: k.antalViner,
        budgetPerPerson: p.data.budgetPerPerson,
        tema: p.data.tema || null,
        forslag,
      },
    });
    revalidatePath("/provning");
    return { ok: true, id: ny.id };
  } catch (e) {
    if (e instanceof AiError) return { ok: false, fel: { _: e.message } };
    throw e;
  }
}

export async function taBortProvning(id: string) {
  await db.provning.delete({ where: { id } }).catch(() => null);
  revalidatePath("/provning");
}

const BetygRad = z.object({ index: z.number().int().min(0).max(11), betyg: z.number().int().min(0).max(100), kommentar: z.string().trim().max(1000).optional() });

/** För in provningens betyg i historiken. Vinerna läggs i katalogen (källa AI) om de inte redan finns. */
export async function sparaProvningsbetyg(provningId: string, rader: unknown): Promise<{ ok: true; antal: number } | { ok: false; fel: string }> {
  const r = z.array(BetygRad).max(12).safeParse(rader);
  if (!r.success) return { ok: false, fel: "Kontrollera betygen (0–10 med en decimal)." };
  const prov = await db.provning.findUnique({ where: { id: provningId } });
  if (!prov) return { ok: false, fel: "Provningen finns inte längre." };
  const viner = (prov.forslag as Provningsforslag | null)?.viner ?? [];
  let antal = 0;
  for (const rad of r.data) {
    const v = viner[rad.index];
    if (!v) continue;
    const nyckel = dubblettNyckel({ namn: v.namn, producent: v.producent, argang: null });
    const kandidater = await db.dryck.findMany({ where: { namn: v.namn }, select: { id: true, namn: true, producent: true, argang: true } });
    let dryck = kandidater.find((d) => dubblettNyckel(d) === nyckel);
    if (!dryck) {
      dryck = await db.dryck.create({
        data: {
          namn: v.namn, producent: v.producent, typ: "vin", kategori: v.kategori, druvor: v.druvor, land: v.land, region: v.region,
          prisCa: v.prisCa, prisUppskattat: v.prisCa != null, aromer: v.doft, mat: [v.mat], beskrivning: v.stil, kalla: "ai",
          sok: sokText({ namn: v.namn, producent: v.producent, region: v.region, land: v.land, druvor: v.druvor }),
        },
        select: { id: true, namn: true, producent: true, argang: true },
      });
    }
    await db.betyg.create({ data: { dryckId: dryck.id, provningId, betyg: rad.betyg, kommentar: rad.kommentar || null, tillfalle: prov.titel, datum: prov.datum ?? new Date() } });
    antal++;
  }
  revalidatePath(`/provning/${provningId}`);
  revalidatePath("/historik");
  revalidatePath("/smakprofil");
  return { ok: true, antal };
}
