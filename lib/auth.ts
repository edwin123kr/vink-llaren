import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

/**
 * Inloggning med databassessioner: kakan innehåller en slumpad token och databasen bara dess SHA-256,
 * så att en läckt databas inte går att använda för att logga in.
 */
export const KAKA = "vk_session";
const DAGAR = 30;

export type Anvandare = { id: string; namn: string; epost: string };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Säker kaka när sidan nås via https (även bakom en proxy), annars inte, så att det fungerar på hemmanätet. */
async function viaHttps() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? (h.get("origin")?.startsWith("https://") ? "https" : "http");
  return proto === "https";
}

export async function skapaSession(anvandareId: string) {
  const token = randomBytes(32).toString("base64url");
  const utgar = new Date(Date.now() + DAGAR * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { id: sha256(token), anvandareId, utgar } });
  (await cookies()).set(KAKA, token, { httpOnly: true, secure: await viaHttps(), sameSite: "lax", path: "/", expires: utgar });
}

export async function avslutaSession() {
  const c = await cookies();
  const token = c.get(KAKA)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  c.delete(KAKA);
}

/** Inloggad användare eller null. Memoiseras per förfrågan. */
export const hamtaAnvandare = cache(async (): Promise<Anvandare | null> => {
  const token = (await cookies()).get(KAKA)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({ where: { id: sha256(token) }, include: { anvandare: { select: { id: true, namn: true, epost: true } } } });
  if (!s || s.utgar < new Date()) return null;
  return s.anvandare;
});

/** För sidor och serveråtgärder: skickar till inloggningen om ingen är inloggad. */
export const kravAnvandare = cache(async (): Promise<Anvandare> => {
  const a = await hamtaAnvandare();
  if (!a) redirect("/logga-in");
  return a;
});

export const EJ_INLOGGAD = () => Response.json({ ok: false, fel: "Du är inte inloggad." }, { status: 401 });

/** Sortering som lägger användarens egna drycker före katalogens (NULL sist i Postgres). */
export const EGNA_FORST = { agareId: { sort: "desc", nulls: "last" } } as const;

/** Drycker som en användare får se: den delade katalogen plus sina egna. */
export const synligaDrycker = (anvandareId: string) => ({ OR: [{ agareId: null }, { agareId: anvandareId }] });

// Enkel spärr mot lösenordsgissning: högst 8 misslyckade försök per e-post och 15 minuter.
const forsok = new Map<string, number[]>();
const FONSTER = 15 * 60 * 1000;
export function arSparrad(epost: string) {
  const nu = Date.now();
  const lista = (forsok.get(epost) ?? []).filter((t) => nu - t < FONSTER);
  forsok.set(epost, lista);
  return lista.length >= 8;
}
export function registreraMisslyckat(epost: string) {
  forsok.set(epost, [...(forsok.get(epost) ?? []), Date.now()]);
}
export function nollstallForsok(epost: string) {
  forsok.delete(epost);
}
