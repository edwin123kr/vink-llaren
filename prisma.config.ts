import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Migreringar körs helst utan anslutningspool (Neon/Vercel sätter DATABASE_URL_UNPOOLED).
  // Standardvärdet gör att `npm install` (prisma generate) fungerar även innan .env finns.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "postgresql://localhost:5432/vinkallaren" },
});
