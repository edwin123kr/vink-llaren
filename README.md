# Vinkällaren

En mobilanpassad webbapp (PWA) på svenska för att hålla koll på en vin- och spritsamling, med
AI-baserad smakprofil, en AI-sommelier och ett verktyg för vinprovningar. Man skapar konto med
e-post och lösenord; varje konto har sin egen samling, medan vinkatalogen delas.

## Status

| Fas | Innehåll | Status |
| --- | --- | --- |
| 0 | Grund: datamodell, databas, designsystem, appskal, AI-lager med låtsasläge | Klar |
| 1 | Katalog och importskript (X-Wines, Open Food Facts) | Klar |
| 2 | Samlingen: lista, filter, detaljvy, lägga till, "Drack den" + betyg | Klar |
| 3 | AI-ifyllning, etikettfoto, streckkodsskanning | Klar |
| 4 | Smakprofil-AI och önskelista | Klar |
| 5 | Vinprovning | Klar |
| 6 | Statistik, export och import | Klar |
| 7 | PWA/offline och slutputs | Klar |
| 8 | Konton (e-post och lösenord) | Klar |
| 9 | Fråga sommeliern (AI-chatt) | Klar |

## Kom igång

Kräver Node 20+ och en Postgres-databas: antingen samma Neon-databas som appen på nätet använder
(kopiera `DATABASE_URL` och `DATABASE_URL_UNPOOLED` från Vercel), eller en lokal, t.ex. Postgres.app.

```bash
cp .env.example .env   # inställningar (gör detta först), fyll i DATABASE_URL
npm install            # installerar och genererar Prisma-klienten
npx prisma migrate deploy  # skapar tabellerna
npm run import -- xwines data/fixtures/xwines-test-100.csv   # valfritt: 100 viner i katalogen
npm run db:seed        # valfritt: demokonto demo@exempel.se / demo1234 med exempelflaskor
npm run dev            # http://localhost:3000, skapa ett konto eller logga in med demokontot
```

Från mobilen på samma wifi: öppna `http://<datorns-ip>:3000`.

Övriga kommandon:

| Kommando | Gör |
| --- | --- |
| `npm test` | enhetstester (formatering, kontrast, smakprofil, provningskalkyl, statistik, CSV, import) |
| `npm run lint` | ESLint |
| `npm run build` / `npm start` | produktionsbygge (krävs för offline och installation) |
| `npm run db:demo:rensa` | tar bort demokontot och all exempeldata |
| `npm run konto -- lista` | visar alla konton |
| `npm run konto -- losenord <epost> <nytt>` | sätter nytt lösenord (om någon glömt sitt) |
| `npm run konto -- overta <epost>` | flyttar data från före konton till ett konto |
| `npm run db:studio` | bläddra i databasen |

## Funktioner

| Var | Vad |
| --- | --- |
| Samling (`/`) | Alla flaskor med sök och filter (vin/sprit, kategori, land, druva, drickfönster), sortering och kort- eller listvy. |
| Lägg till (`+`) | Sök i katalogen, skanna streckkod, fota etiketten (AI läser av den) eller fyll i själv, med AI-ifyllning av resten. |
| Flaska | Detaljer, smakprofil, drickfönster, betyg. "Drack den" minskar antalet och öppnar betygsrutan (0,0–10,0, kommentar, tillfälle eller "Hoppa över"). |
| Sommelier | Chatta med en AI-sommelier som känner till din samling och dina betyg, söker på nätet när den behöver aktuella uppgifter och visar källor. Samtalen sparas. Varje flaska har knappen "Fråga sommeliern om flaskan". |
| Smakprofil | Separat för vin och sprit: radardiagram, vad du gillar, rekommendationer ur katalogen, "Utforska" och "Undvik". |
| Provning | Antal deltagare, viner och budget ger flaskor (ceil(deltagare × 0,5), minst en per vin), ml per glas och totalbudget. AI föreslår viner i provningsordning, inköpslista, utskrivbart protokoll (även blint) och betygen kan föras in i historiken. |
| Mer | Mitt konto, vinprovning, önskelista, historik, statistik, export/import, källor och licenser. |

I mobilmenyn finns Samling, Smakprofil, "+", Sommelier och Mer (där provningen ligger).

## Konton

- Konto skapas med namn, e-post och lösenord (minst 8 tecken). Lösenorden hashas med scrypt.
- Inloggningen är en databassession i 30 dagar; kakan är `httpOnly`, `SameSite=Lax` och `Secure` över https.
- Efter 8 felaktiga inloggningsförsök på en kvart spärras e-postadressen tillfälligt.
- **Inbjudningskod:** sätt `REGISTRERINGSKOD` så måste man ange den för att skapa konto. Dela koden med
  dina vänner, så kan inte vem som helst registrera sig.
- **AI-gräns:** i live-läge får varje konto högst `AI_GRANS_PER_DAG` AI-anrop per dygn (standard 40),
  eftersom alla använder din API-nyckel.
- Under Mer → Mitt konto kan man logga ut (offlinecachen på enheten töms), byta lösenord och radera kontot.
- **Självlärande katalog:** katalogen delas av alla. När någon lägger till en flaska som inte finns
  hamnar drycken i katalogen, så att nästa person hittar den. Finns den redan (samma streckkod, eller
  samma namn, producent och årgång oavsett stavning med versaler) används den befintliga, och uppgifter
  som saknas där fylls i. Den som lade in en dryck kan rätta den så länge ingen annan använder den;
  annars blir rättelsen en egen kopia. Personliga uppgifter (pris, plats, anteckningar, betyg) delas
  aldrig. Drycker som AI:n fyllt i i provläget delas inte.
- **Etikettbilder:** X-Wines saknar bilder. Har ett vin ingen bild visas knappen "Fota etiketten" på
  flaskan, och fotot blir vinets bild för alla. Ett foto som togs när en flaska identifierades via
  etikettfoto blir också katalogens bild om den saknar en.
- **Gemensamma betyg:** alla betyg räknas anonymt in i ett snittbetyg som syns på flaskan, på vinets
  sida och i katalogsökningen ("Vinkällarens betyg"). Kommentarer visas med förnamn, om användaren inte
  har stängt av det under Mitt konto.
- Det finns ingen återställning av lösenord via e-post. Den som driver appen kan sätta ett nytt med
  `npm run konto -- losenord`.

## Installera som app (PWA)

Kör produktionsbygget (`npm run build && npm start`) och öppna appen i mobilen:

- **iPhone (Safari):** Dela → "Lägg till på hemskärmen".
- **Android (Chrome):** menyn → "Installera app".

Service workern (`public/sw.js`, handskriven) registreras bara i produktionsbygget, så att den inte
stör utvecklingsservern. Den sparar sidorna du besöker, och i bakgrunden även huvudsidorna och alla
flaskor i samlingen, så att samlingen går att bläddra i utan nät. Det som skriver (lägga till, betyg,
AI) kräver anslutning; appen visar en rad överst när den är offline och ett tydligt meddelande om man
försöker spara.

## AI

All AI går via `lib/ai/`, och anropen sker bara på servern. Nyckeln når aldrig webbläsaren.

- `AI_MODE="mock"` (standard): provläge utan nyckel, för utveckling. Svaren är allmänna mallar och hittar
  inte på fakta om specifika produkter, men de är inte märkta i gränssnittet. **Använd live-läge när
  appen används på riktigt.**
- `AI_MODE="live"`: riktiga anrop. Kräver `ANTHROPIC_API_KEY` i `.env`.
- `ANTHROPIC_MODEL` styr modellen (standard `claude-opus-5-5`).

**Gratis alternativ:** sätt `AI_MODE="live"` och `GEMINI_API_KEY` (gratis nyckel från aistudio.google.com),
så används Googles Gemini i stället för Claude (`AI_PROVIDER` styr valet, `GEMINI_MODEL` modellen).
Gratisnivån har dagliga gränser, och Google får använda indatan för att förbättra sina tjänster.

**Etikettläsning:** instruktionerna till AI:n innehåller en vinguide (`lib/ai/vinguide.ts`) om hur etiketter
läses och vilka termer som betyder vad. AI:n anger vilka fält den är osäker på; de markeras med
"Kontrollera" i formuläret tills du ändrar dem. Hittar appen samma vin i katalogen kompletteras tomma
och osäkra uppgifter (druvor, land, region, alkohol, volym, smakprofil) därifrån (`lib/berika.ts`);
årgång och namn ändras aldrig. AI-ifyllning får liknande katalogdrycker som underlag.

Sommeliern (`lib/ai/sommelier.ts`) strömmar svaret och har Claudes webbsökning påslagen (högst fyra
sökningar per fråga, svenska sökresultat prioriteras). Den får en sammanfattning av användarens samling,
smakprofil och senaste betyg (`lib/sommelierkontext.ts`), men aldrig andra användares data.

Svaren från de övriga AI-funktionerna valideras mot Zod-scheman (`lib/ai/schemas.ts`). Server-side fallback är påslaget, så att ett
avböjt anrop tas över av en annan modell i stället för att bara misslyckas.

## Datamodell

`prisma/schema.prisma`:

- **Dryck:** katalogen, oavsett om du äger flaskan. Har källa och licens per rad.
- **Flaska:** en post i samlingen, med pris, antal, plats och drickfönster.
- **Betyg:** historiken.
- **Onskning:** önskelistan.
- **Provning:** sparade vinprovningar.
- **Smakanalys:** sparade AI-analyser.
- **Anvandare, Session:** konton och inloggningar. Flaska, Betyg, Onskning, Provning och Smakanalys
  har `anvandareId`; Dryck har `agareId` (tomt = delad katalog).
- **Samtal, Meddelande:** samtal med sommeliern.
- **AiAnrop:** räknar AI-anrop per konto och dygn.

Konventioner:

- Smakprofilen använder skalan 0–12, som Systembolagets smakklockor.
- Betyg lagras i tiondelar (78 = 7,8) och visas med decimalkomma.
- Listor (druvor, aromer, mat) lagras som JSON.

## Lägga appen på nätet (Vercel + Neon, gratis att börja med)

Appen körs på [Vercel](https://vercel.com) och databasen på [Neon](https://neon.tech) (Postgres).
Båda har gratisnivåer; Vercels gratisplan är för icke-kommersiellt bruk.

1. Logga in på Vercel med ditt GitHub-konto.
2. **Add New → Project**, välj repot och klicka **Deploy**. Det första bygget misslyckas eftersom
   databasen saknas; det är väntat.
3. I projektet: **Storage → Create Database → Neon** (gratisnivån) och koppla den till projektet.
   Då sätts `DATABASE_URL` och `DATABASE_URL_UNPOOLED` automatiskt.
4. **Settings → Environment Variables**: lägg till `REGISTRERINGSKOD` (valfri kod till dina vänner),
   `AI_MODE` = `live` och `ANTHROPIC_API_KEY`. Valfritt: `AI_GRANS_PER_DAG`.
5. **Deployments → … → Redeploy**. Bygget (`npm run vercel-build`) skapar tabellerna och lägger in
   100 viner i katalogen.
6. Öppna adressen (t.ex. `https://vink-llaren.vercel.app`) i mobilen, skapa konto och lägg appen på
   hemskärmen.

**Hela katalogen (100 000 viner):** lägg in samma `DATABASE_URL` i `.env` på din dator och kör
`npm run import -- xwines <sökväg till XWines_Full_100K_wines.csv>`. Det tar några minuter.

Nya versioner driftsätts automatiskt när du pushar till GitHub.

Begränsningar på Vercel: en uppladdning får vara högst 4,5 MB (etikettfoton förminskas i webbläsaren, men
en mycket stor säkerhetskopia behöver delas upp). Neons gratisnivå har 0,5 GB lagring; etikettfoton
sparas i databasen och tar mest plats.

**Annat värdskap (Render, Railway, Fly.io, egen server):** repot har en `Dockerfile`. Skapa en
Postgres-databas (eller använd Neon), sätt `DATABASE_URL` och övriga variabler, och starta containern.
Den kör migreringarna och fyller en tom katalog vid start. Att flytta från Vercel går utan kodändringar:
behåll Neon-adressen, eller flytta datan med `pg_dump`/`pg_restore`.

## Statistik och säkerhetskopior

- **Statistik** (`/statistik`): samlingens värde (inköpspris, annars uppskattat pris), flaskor per
  kategori, snittbetyg per druva och land, mest prisvärda (betygspoäng per 100 kr) och vad som bör drickas snart.
- **Export** (`/mer/backup`): en JSON-säkerhetskopia med allt ditt (flaskor, betyg, önskelista,
  provningar, analyser, foton och de katalogdrycker de pekar på), plus samlingen och historiken som CSV
  (semikolon och decimalkomma, öppnas direkt i svenska Excel).
- **Import:** JSON läses in med "slå ihop" (uppdaterar på id, inga dubbletter) eller "ersätt" (tömmer
  dina egna data först; katalogen behålls). En CSV med samma kolumner som exporten läses in rad för rad,
  och rader som inte går igenom valideringen rapporteras.

## Större katalog

Repot innehåller 100 viner från X-Wines. Ladda ner hela X-Wines (100 000 viner, CC0) via länkarna på
https://github.com/rogerioxavier/X-Wines och lägg filen i `data/katalog/` (gärna komprimerad som
`.csv.gz`). Vid nästa start läses den in automatiskt. Lokalt kan du också köra
`npm run import -- xwines data/katalog/XWines_Full_100K_wines.csv`.

## Katalogimport

```bash
npm run import -- xwines data/fixtures/xwines-test-100.csv     # 100 viner som följer med repot
npm run import -- xwines ~/Downloads/XWines_Full_100K_wines.csv # hela X-Wines (även .csv.gz)
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
