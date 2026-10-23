import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * En enda Prisma-klient per process (överlever hot reload i dev).
 * Byte till Postgres: ändra provider i schema.prisma och byt adaptern här mot @prisma/adapter-pg.
 */
function create() {
  const url = process.env.DATABASE_URL ?? "file:./.data/dev.db";
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

const g = globalThis as unknown as { __db?: PrismaClient };
export const db = g.__db ?? create();
if (process.env.NODE_ENV !== "production") g.__db = db;
