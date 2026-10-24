import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

/**
 * Skapar en Prisma-klient mot Postgres (Neon, Supabase, Render, lokal …). Används av appen (lib/db.ts)
 * och av skripten. DATABASE_URL får gärna vara en poolad adress; migreringarna använder
 * DATABASE_URL_UNPOOLED om den finns (se prisma.config.ts).
 */
export function skapaKlient(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL saknas. Lägg till den i .env (se .env.example).");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: process.env.VERCEL ? 3 : 10 }) });
}
