import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["lib/**/*.test.ts", "scripts/**/*.test.ts"], exclude: ["node_modules", ".claude", "lib/generated"] },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, ".") } },
});
