# Vinkällaren som container (Render, Railway, Fly.io eller egen server).
# Ange DATABASE_URL (Postgres) som miljövariabel när containern startar.
FROM node:22-bookworm-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production PORT=3000
EXPOSE 3000
# kör migreringar, fyller en tom katalog och startar
CMD ["npm", "start"]
