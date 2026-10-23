# Vinkällaren som container (Railway, Fly.io, Render eller egen server).
# Databasen är en SQLite-fil på en volym monterad på /data.
FROM node:22-bookworm-slim

WORKDIR /app
ENV DATABASE_URL="file:/data/vinkallaren.db" \
    NEXT_TELEMETRY_DISABLED=1

# byggverktyg ifall better-sqlite3 behöver kompileras
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN mkdir -p /data && npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production PORT=3000
EXPOSE 3000
# kör migreringar, fyller en tom katalog och startar
CMD ["npm", "start"]
