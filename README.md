# Vinkällaren

En mobilanpassad webbapp (PWA) på svenska för att hålla koll på en vin- och spritsamling, med
AI-baserad smakprofil och ett verktyg för vinprovningar. Ingen inloggning: appen är byggd för en
person och körs lokalt.

## Status

| Fas | Innehåll | Status |
| --- | --- | --- |
| 0 | Grund: datamodell, databas, designsystem, appskal, AI-lager med låtsasläge | Klar |
| 1 | Katalog och importskript (X-Wines, Open Food Facts) | Klar |
| 2 | Samlingen: lista, filter, detaljvy, lägga till, "Drack den" + betyg | Klar |
| 3 | AI-ifyllning, etikettfoto, streckkodsskanning | Klar |
| 4 | Smakprofil-AI och önskelista | Klar |
| 5 | Vinprovning | |
| 6 | Statistik, export och import | |
| 7 | PWA/offline och slutputs | |

## Kom igång

Kräver Node 20+.

```bash
npm install            # installerar och genererar Prisma-klienten
cp .env.example .env   # om .env saknas
npm run db:migrate     # skapar SQLite-databasen (.data/dev.db)
npm run db:seed        # valfritt: exempeldata, märkt "Exempeldata"
npm run dev            # http://localhost:3000
```

Från mobilen på samma wifi: öppna `http://<datorns-ip>:3000`.

Övriga kommandon:

| Kommando | Gör |
| --- | --- |
| `npm test` | enhetstester (formatering, kontrast) |
| `npm run lint` | ESLint |
| `npm run build` / `npm start` | produktionsbygge |
| `npm run db:demo:rensa` | tar bort all exempeldata |
| `npm run db:studio` | bläddra i databasen |

## AI

All AI går via `lib/ai/`, och anropen sker bara på servern. Nyckeln når aldrig webbläsaren.

- `AI_MODE="mock"` (standard): låtsasläge utan nyckel. Svaren är deterministiska och tydligt märkta.
- `AI_MODE="live"`: riktiga anrop. Kräver `ANTHROPIC_API_KEY` i `.env`.
- `ANTHROPIC_MODEL` styr modellen (standard `claude-opus-5-5`).

Svaren valideras mot Zod-scheman (`lib/ai/schemas.ts`). Server-side fallback är påslaget, så att ett
avböjt anrop tas över av en annan modell i stället för att bara misslyckas.

## Datamodell

`prisma/schema.prisma`:

- **Dryck:** katalogen, oavsett om du äger flaskan. Har källa och licens per rad.
- **Flaska:** en post i samlingen, med pris, antal, plats och drickfönster.
- **Betyg:** historiken.
- **Onskning:** önskelistan.
- **Provning:** sparade vinprovningar.
- **Smakanalys:** sparade AI-analyser.

Konventioner:

- Smakprofilen använder skalan 0–12, som Systembolagets smakklockor.
- Betyg lagras i tiondelar (78 = 7,8) och visas med decimalkomma.
- Listor (druvor, aromer, mat) lagras som JSON.

**Byta till Postgres** (t.ex. Supabase eller Neon):
1. Sätt `provider = "postgresql"` i `schema.prisma`.
2. Byt adaptern i `lib/db.ts` mot `@prisma/adapter-pg`.
3. Peka `DATABASE_URL` mot den nya databasen.
4. Kör `npm run db:migrate`.

## Katalogimport

```bash
npm run import -- xwines data/fixtures/xwines-test-100.csv     # 100 viner som följer med repot
npm run import -- xwines ~/Downloads/XWines_Full_100K_wines.csv # hela X-Wines (ladda ner från deras Google Drive)
npm run import -- off ~/Downloads/openfoodfacts-products.jsonl.gz
npm run import -- off ~/Downloads/en.openfoodfacts.org.products.csv.gz
```

Flaggor: `--limit N` och `--dry-run`. Dubbletter kontrolleras först på EAN och sedan på namn,
producent och årgång. En dubblett skapar ingen ny rad, men tomma fält på den befintliga raden fylls i.
Varje rad sparar källa, id i källan och licens, och en logg skrivs till `data/import-logs/`.
Från Open Food Facts tas bara vin och sprit med namn, giltig EAN och tydlig kategori.

## Katalogkällor

- **X-Wines** (CC0-1.0). Artikeln citeras: de Azambuja, Morais & Filipe (2023), *X-Wines: A Wine
  Dataset for Recommender Systems and Machine Learning*, Big Data Cogn. Comput. 7(1), 20.
- **Open Food Facts** (ODbL-1.0). Kräver attribution, och en härledd databas delas under samma licens.
- **Systembolaget:** inget officiellt öppet API, så deras data importeras eller skrapas inte.
  Artikelnummer fylls i manuellt.

## Design

En mörk "vinkällare" med guld som signalfärg. Kontrasten testas automatiskt mot WCAG AA
(`lib/tokens.test.ts`). Mobilen först: bottenmenyn har en alltid synlig "+"-knapp, och alla
knappar är minst 48 px höga.
