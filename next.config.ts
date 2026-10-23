import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // native SQLite-drivrutin ska inte bundlas
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
