import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["lib/**/*.test.ts", "scripts/**/*.test.ts", "components/**/*.test.tsx"], exclude: ["node_modules", ".claude", "lib/generated"] },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "."), "server-only": path.resolve(import.meta.dirname, "test/server-only-stub.ts") } },
});
