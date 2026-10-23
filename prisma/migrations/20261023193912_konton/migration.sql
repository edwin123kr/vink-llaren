/*
  Konton. Finns det redan egna data (från tiden före konton) läggs de på ett platshållarkonto,
  "lokal", som inte går att logga in på. Flytta dem till ditt konto med:
    npm run konto:overta -- din@epost.se
*/
-- AlterTable
ALTER TABLE "Bild" ADD COLUMN "agareId" TEXT;

-- CreateTable
CREATE TABLE "Anvandare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "epost" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "losenordHash" TEXT NOT NULL,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Anvandare" ("id", "epost", "namn", "losenordHash")
SELECT 'lokal', 'lokal@vinkallaren.invalid', 'Lokal data', '!'
WHERE EXISTS (SELECT 1 FROM "Flaska") OR EXISTS (SELECT 1 FROM "Betyg") OR EXISTS (SELECT 1 FROM "Onskning")
   OR EXISTS (SELECT 1 FROM "Provning") OR EXISTS (SELECT 1 FROM "Smakanalys")
   OR EXISTS (SELECT 1 FROM "Dryck" WHERE "kalla" IN ('manuell', 'ai', 'demo'));

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anvandareId" TEXT NOT NULL,
    "utgar" DATETIME NOT NULL,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiAnrop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anvandareId" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiAnrop_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Betyg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anvandareId" TEXT NOT NULL,
    "dryckId" TEXT NOT NULL,
    "flaskaId" TEXT,
    "provningId" TEXT,
    "betyg" INTEGER NOT NULL,
    "kommentar" TEXT,
    "tillfalle" TEXT,
    "datum" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Betyg_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Betyg_dryckId_fkey" FOREIGN KEY ("dryckId") REFERENCES "Dryck" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Betyg_flaskaId_fkey" FOREIGN KEY ("flaskaId") REFERENCES "Flaska" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Betyg_provningId_fkey" FOREIGN KEY ("provningId") REFERENCES "Provning" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Betyg" ("betyg", "datum", "dryckId", "flaskaId", "id", "kommentar", "provningId", "tillfalle", "anvandareId") SELECT "betyg", "datum", "dryckId", "flaskaId", "id", "kommentar", "provningId", "tillfalle", 'lokal' FROM "Betyg";
DROP TABLE "Betyg";
ALTER TABLE "new_Betyg" RENAME TO "Betyg";
CREATE INDEX "Betyg_dryckId_idx" ON "Betyg"("dryckId");
CREATE INDEX "Betyg_anvandareId_datum_idx" ON "Betyg"("anvandareId", "datum");
CREATE TABLE "new_Dryck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namn" TEXT NOT NULL,
    "producent" TEXT,
    "typ" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "druvor" JSONB,
    "land" TEXT,
    "region" TEXT,
    "argang" INTEGER,
    "alkoholhalt" REAL,
    "volymMl" INTEGER,
    "fyllighet" INTEGER,
    "sotma" INTEGER,
    "syra" INTEGER,
    "stravhet" INTEGER,
    "rokighet" INTEGER,
    "aromer" JSONB,
    "mat" JSONB,
    "beskrivning" TEXT,
    "bildUrl" TEXT,
    "ean" TEXT,
    "sbArtikelnr" TEXT,
    "prisCa" INTEGER,
    "prisUppskattat" BOOLEAN NOT NULL DEFAULT false,
    "kalla" TEXT NOT NULL,
    "kallaId" TEXT,
    "licens" TEXT,
    "sok" TEXT NOT NULL DEFAULT '',
    "agareId" TEXT,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uppdaterad" DATETIME NOT NULL,
    CONSTRAINT "Dryck_agareId_fkey" FOREIGN KEY ("agareId") REFERENCES "Anvandare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Dryck" ("alkoholhalt", "argang", "aromer", "beskrivning", "bildUrl", "druvor", "ean", "fyllighet", "id", "kalla", "kallaId", "kategori", "land", "licens", "mat", "namn", "prisCa", "prisUppskattat", "producent", "region", "rokighet", "sbArtikelnr", "skapad", "sok", "sotma", "stravhet", "syra", "typ", "uppdaterad", "volymMl", "agareId") SELECT "alkoholhalt", "argang", "aromer", "beskrivning", "bildUrl", "druvor", "ean", "fyllighet", "id", "kalla", "kallaId", "kategori", "land", "licens", "mat", "namn", "prisCa", "prisUppskattat", "producent", "region", "rokighet", "sbArtikelnr", "skapad", "sok", "sotma", "stravhet", "syra", "typ", "uppdaterad", "volymMl", CASE WHEN "kalla" IN ('manuell', 'ai', 'demo') THEN 'lokal' END FROM "Dryck";
DROP TABLE "Dryck";
ALTER TABLE "new_Dryck" RENAME TO "Dryck";
CREATE INDEX "Dryck_namn_idx" ON "Dryck"("namn");
CREATE INDEX "Dryck_kategori_idx" ON "Dryck"("kategori");
CREATE INDEX "Dryck_producent_namn_argang_idx" ON "Dryck"("producent", "namn", "argang");
CREATE INDEX "Dryck_kalla_kallaId_idx" ON "Dryck"("kalla", "kallaId");
CREATE INDEX "Dryck_sok_idx" ON "Dryck"("sok");
CREATE INDEX "Dryck_ean_idx" ON "Dryck"("ean");
CREATE INDEX "Dryck_agareId_idx" ON "Dryck"("agareId");
CREATE TABLE "new_Flaska" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anvandareId" TEXT NOT NULL,
    "dryckId" TEXT NOT NULL,
    "antal" INTEGER NOT NULL DEFAULT 1,
    "inkopspris" INTEGER,
    "inkopsdatum" DATETIME,
    "inkopsstalle" TEXT,
    "plats" TEXT,
    "drickFran" INTEGER,
    "drickTill" INTEGER,
    "anteckningar" TEXT,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uppdaterad" DATETIME NOT NULL,
    CONSTRAINT "Flaska_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Flaska_dryckId_fkey" FOREIGN KEY ("dryckId") REFERENCES "Dryck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Flaska" ("antal", "anteckningar", "drickFran", "drickTill", "dryckId", "id", "inkopsdatum", "inkopspris", "inkopsstalle", "plats", "skapad", "uppdaterad", "anvandareId") SELECT "antal", "anteckningar", "drickFran", "drickTill", "dryckId", "id", "inkopsdatum", "inkopspris", "inkopsstalle", "plats", "skapad", "uppdaterad", 'lokal' FROM "Flaska";
DROP TABLE "Flaska";
ALTER TABLE "new_Flaska" RENAME TO "Flaska";
CREATE INDEX "Flaska_dryckId_idx" ON "Flaska"("dryckId");
CREATE INDEX "Flaska_anvandareId_idx" ON "Flaska"("anvandareId");
CREATE TABLE "new_Onskning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anvandareId" TEXT NOT NULL,
    "dryckId" TEXT,
    "namn" TEXT NOT NULL,
    "motivering" TEXT,
    "prisCa" INTEGER,
    "kalla" TEXT NOT NULL,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Onskning_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Onskning_dryckId_fkey" FOREIGN KEY ("dryckId") REFERENCES "Dryck" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Onskning" ("dryckId", "id", "kalla", "motivering", "namn", "prisCa", "skapad", "anvandareId") SELECT "dryckId", "id", "kalla", "motivering", "namn", "prisCa", "skapad", 'lokal' FROM "Onskning";
DROP TABLE "Onskning";
ALTER TABLE "new_Onskning" RENAME TO "Onskning";
CREATE INDEX "Onskning_anvandareId_idx" ON "Onskning"("anvandareId");
CREATE TABLE "new_Provning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anvandareId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "datum" DATETIME,
    "deltagare" INTEGER NOT NULL,
    "antalViner" INTEGER NOT NULL,
    "budgetPerPerson" INTEGER NOT NULL,
    "tema" TEXT,
    "forslag" JSONB,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Provning_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Provning" ("antalViner", "budgetPerPerson", "datum", "deltagare", "forslag", "id", "skapad", "tema", "titel", "anvandareId") SELECT "antalViner", "budgetPerPerson", "datum", "deltagare", "forslag", "id", "skapad", "tema", "titel", 'lokal' FROM "Provning";
DROP TABLE "Provning";
ALTER TABLE "new_Provning" RENAME TO "Provning";
CREATE INDEX "Provning_anvandareId_idx" ON "Provning"("anvandareId");
CREATE TABLE "new_Smakanalys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anvandareId" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "antalBetyg" INTEGER NOT NULL,
    "resultat" JSONB NOT NULL,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Smakanalys_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Smakanalys" ("antalBetyg", "id", "resultat", "skapad", "typ", "anvandareId") SELECT "antalBetyg", "id", "resultat", "skapad", "typ", 'lokal' FROM "Smakanalys";
DROP TABLE "Smakanalys";
ALTER TABLE "new_Smakanalys" RENAME TO "Smakanalys";
CREATE INDEX "Smakanalys_anvandareId_typ_skapad_idx" ON "Smakanalys"("anvandareId", "typ", "skapad");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Anvandare_epost_key" ON "Anvandare"("epost");

-- CreateIndex
CREATE INDEX "Session_anvandareId_idx" ON "Session"("anvandareId");

-- CreateIndex
CREATE INDEX "AiAnrop_anvandareId_skapad_idx" ON "AiAnrop"("anvandareId", "skapad");
