"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { arSparrad, avslutaSession, kravAnvandare, nollstallForsok, registreraMisslyckat, skapaSession } from "@/lib/auth";
import { hashaLosenord, stammerLosenord } from "@/lib/losenord";

export type KontoState = { fel?: Record<string, string>; varden?: Record<string, string>; ok?: string } | undefined;

const epost = z.string().trim().toLowerCase().max(200).email("Ange en giltig e-postadress.");
const losenord = z.string().min(8, "Lösenordet måste ha minst 8 tecken.").max(200, "Lösenordet är för långt.");

/** Bara interna sökvägar, så att inloggningen inte kan användas för att skicka vidare till en annan sajt. */
function nasta(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/logga-in") && !s.startsWith("/skapa-konto") ? s : "/";
}

function felFran(e: z.ZodError) {
  return Object.fromEntries(e.issues.map((i) => [String(i.path[0] ?? "_"), i.message]));
}

const Registrera = z.object({
  namn: z.string().trim().min(1, "Ange ditt namn.").max(80),
  epost,
  losenord,
  kod: z.string().trim().optional(),
});

export async function skapaKonto(_prev: KontoState, form: FormData): Promise<KontoState> {
  const varden = { namn: String(form.get("namn") ?? ""), epost: String(form.get("epost") ?? "") };
  const p = Registrera.safeParse({ namn: form.get("namn"), epost: form.get("epost"), losenord: form.get("losenord"), kod: form.get("kod") ?? undefined });
  if (!p.success) return { fel: felFran(p.error), varden };
  const kravd = process.env.REGISTRERINGSKOD?.trim();
  if (kravd && p.data.kod !== kravd) return { fel: { kod: "Fel inbjudningskod. Fråga den som bjöd in dig." }, varden };
  if (await db.anvandare.findUnique({ where: { epost: p.data.epost }, select: { id: true } })) {
    return { fel: { epost: "Det finns redan ett konto med den e-postadressen. Logga in i stället." }, varden };
  }
  const a = await db.anvandare.create({ data: { namn: p.data.namn, epost: p.data.epost, losenordHash: await hashaLosenord(p.data.losenord) } });
  await skapaSession(a.id);
  redirect(nasta(form.get("nasta")));
}

export async function loggaIn(_prev: KontoState, form: FormData): Promise<KontoState> {
  const e = epost.safeParse(form.get("epost"));
  const varden = { epost: String(form.get("epost") ?? "") };
  const pw = String(form.get("losenord") ?? "");
  if (!e.success || !pw) return { fel: { _: "Fyll i e-post och lösenord." }, varden };
  if (arSparrad(e.data)) return { fel: { _: "För många försök. Vänta en kvart och försök igen." }, varden };
  const a = await db.anvandare.findUnique({ where: { epost: e.data } });
  // jämför alltid ett lösenord, så att svarstiden inte avslöjar om kontot finns
  const ok = await stammerLosenord(pw, a?.losenordHash ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==");
  if (!a || !ok) {
    registreraMisslyckat(e.data);
    return { fel: { _: "Fel e-post eller lösenord." }, varden };
  }
  nollstallForsok(e.data);
  await skapaSession(a.id);
  redirect(nasta(form.get("nasta")));
}

export async function loggaUt() {
  await avslutaSession();
  redirect("/logga-in");
}

const Byt = z.object({ nuvarande: z.string().min(1, "Ange ditt nuvarande lösenord."), nytt: losenord });

export async function bytLosenord(_prev: KontoState, form: FormData): Promise<KontoState> {
  const anv = await kravAnvandare();
  const p = Byt.safeParse({ nuvarande: form.get("nuvarande"), nytt: form.get("nytt") });
  if (!p.success) return { fel: felFran(p.error) };
  const a = await db.anvandare.findUniqueOrThrow({ where: { id: anv.id } });
  if (!(await stammerLosenord(p.data.nuvarande, a.losenordHash))) return { fel: { nuvarande: "Fel lösenord." } };
  await db.$transaction([
    db.anvandare.update({ where: { id: a.id }, data: { losenordHash: await hashaLosenord(p.data.nytt) } }),
    db.session.deleteMany({ where: { anvandareId: a.id } }), // logga ut andra enheter
  ]);
  await skapaSession(a.id);
  return { ok: "Lösenordet är bytt. Andra enheter har loggats ut." };
}

export async function raderaKonto(_prev: KontoState, form: FormData): Promise<KontoState> {
  const anv = await kravAnvandare();
  const a = await db.anvandare.findUniqueOrThrow({ where: { id: anv.id } });
  if (!(await stammerLosenord(String(form.get("losenord") ?? ""), a.losenordHash))) return { fel: { losenord: "Fel lösenord." } };
  // Allt kopplat till kontot (flaskor, betyg, egna drycker, sessioner …) tas bort via cascade.
  // Drycker som lagts in i den gemensamma katalogen, och deras bilder, finns kvar för andra.
  const idFran = (url: string | null) => url?.match(/^\/api\/bild\/([a-z0-9]+)$/)?.[1];
  const delade = new Set((await db.dryck.findMany({ where: { agareId: null, bildUrl: { startsWith: "/api/bild/" } }, select: { bildUrl: true } })).map((d) => idFran(d.bildUrl)));
  const mina = (await db.bild.findMany({ where: { agareId: a.id }, select: { id: true } })).map((b) => b.id).filter((id) => !delade.has(id));
  await db.$transaction([db.bild.deleteMany({ where: { id: { in: mina } } }), db.anvandare.delete({ where: { id: a.id } })]);
  await avslutaSession();
  redirect("/logga-in?raderat=1");
}

export async function sattDelaKommentarer(dela: boolean) {
  const anv = await kravAnvandare();
  await db.anvandare.update({ where: { id: anv.id }, data: { delaKommentarer: dela } });
}
