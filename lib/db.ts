import "server-only";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { skapaKlient } from "@/lib/prisma-klient";

/** En enda Prisma-klient per process (överlever hot reload i dev). */
const g = globalThis as unknown as { __db?: PrismaClient };
export const db = g.__db ?? skapaKlient();
if (process.env.NODE_ENV !== "production") g.__db = db;
