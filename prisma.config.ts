import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // standardvärde så att `npm install` (prisma generate) fungerar även innan .env finns
  datasource: { url: process.env.DATABASE_URL ?? "file:./.data/dev.db" },
});
