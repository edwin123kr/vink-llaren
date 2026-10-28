"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AiError, analyseraSmak } from "@/lib/ai";
import { db } from "@/lib/db";
import { kravAnvandare, synligaDrycker } from "@/lib/auth";
import { angraAiAnrop, kontrolleraAiKvot } from "@/lib/aikvot";
import { smakdata } from "@/lib/smakdata";

export async function korSmakanalys(typ: "vin" | "sprit"): Promise<{ ok: true } | { ok: false; fel: string }> {
  const anv = await kravAnvandare();
  const data = await smakdata(anv.id, typ);
  if (data.antalBetyg < 3) return { ok: false, fel: "Betygsätt minst tre flaskor först." };
  let kvot: string | null = null;
  try {
    kvot = await kontrolleraAiKvot(anv.id, "smakanalys");
    const resultat = await analyseraSmak(data.underlag);
    await db.smakanalys.create({ data: { typ, antalBetyg: data.antalBetyg, resultat, anvandareId: anv.id } });
    revalidatePath("/smakprofil");
    return { ok: true };
  } catch (e) {
    await angraAiAnrop(kvot);
    if (e instanceof AiError) return { ok: false, fel: e.message };
    throw e;
  }
}

const Onskning = z.object({
  namn: z.string().trim().min(1, "Ange ett namn.").max(200),
  motivering: z.string().trim().max(1000).optional().nullable(),
  prisCa: z.number().int().min(0).max(1_000_000).nullable().optional(),
  dryckId: z.string().max(40).nullable().optional(),
  kalla: z.enum(["ai-rekommendation", "manuell"]).default("manuell"),
});

export async function sparaOnskning(input: unknown): Promise<{ ok: true; id: string } | { ok: false; fel: string }> {
  const o = Onskning.safeParse(input);
  if (!o.success) return { ok: false, fel: o.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  const anv = await kravAnvandare();
  if (o.data.dryckId && !(await db.dryck.findFirst({ where: { id: o.data.dryckId, ...synligaDrycker(anv.id) }, select: { id: true } }))) {
    return { ok: false, fel: "Drycken finns inte i katalogen." };
  }
  const finns = await db.onskning.findFirst({ where: { anvandareId: anv.id, ...(o.data.dryckId ? { dryckId: o.data.dryckId } : { namn: o.data.namn }) } });
  if (finns) return { ok: true, id: finns.id };
  const ny = await db.onskning.create({ data: { ...o.data, motivering: o.data.motivering || null, anvandareId: anv.id } });
  revalidatePath("/onskelista");
  revalidatePath("/smakprofil");
  return { ok: true, id: ny.id };
}

export async function taBortOnskning(id: string) {
  const anv = await kravAnvandare();
  await db.onskning.deleteMany({ where: { id, anvandareId: anv.id } });
  revalidatePath("/onskelista");
  revalidatePath("/smakprofil");
}
