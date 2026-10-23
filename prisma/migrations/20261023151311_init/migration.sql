-- CreateTable
CREATE TABLE "Dryck" (
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
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uppdaterad" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Flaska" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Flaska_dryckId_fkey" FOREIGN KEY ("dryckId") REFERENCES "Dryck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Betyg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dryckId" TEXT NOT NULL,
    "flaskaId" TEXT,
    "provningId" TEXT,
    "betyg" INTEGER NOT NULL,
    "kommentar" TEXT,
    "tillfalle" TEXT,
    "datum" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Betyg_dryckId_fkey" FOREIGN KEY ("dryckId") REFERENCES "Dryck" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Betyg_flaskaId_fkey" FOREIGN KEY ("flaskaId") REFERENCES "Flaska" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Betyg_provningId_fkey" FOREIGN KEY ("provningId") REFERENCES "Provning" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Onskning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dryckId" TEXT,
    "namn" TEXT NOT NULL,
    "motivering" TEXT,
    "prisCa" INTEGER,
    "kalla" TEXT NOT NULL,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Onskning_dryckId_fkey" FOREIGN KEY ("dryckId") REFERENCES "Dryck" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Provning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "datum" DATETIME,
    "deltagare" INTEGER NOT NULL,
    "antalViner" INTEGER NOT NULL,
    "budgetPerPerson" INTEGER NOT NULL,
    "tema" TEXT,
    "forslag" JSONB,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Smakanalys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typ" TEXT NOT NULL,
    "antalBetyg" INTEGER NOT NULL,
    "resultat" JSONB NOT NULL,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Dryck_ean_key" ON "Dryck"("ean");

-- CreateIndex
CREATE INDEX "Dryck_namn_idx" ON "Dryck"("namn");

-- CreateIndex
CREATE INDEX "Dryck_kategori_idx" ON "Dryck"("kategori");

-- CreateIndex
CREATE INDEX "Dryck_producent_namn_argang_idx" ON "Dryck"("producent", "namn", "argang");

-- CreateIndex
CREATE INDEX "Dryck_kalla_kallaId_idx" ON "Dryck"("kalla", "kallaId");

-- CreateIndex
CREATE INDEX "Flaska_dryckId_idx" ON "Flaska"("dryckId");

-- CreateIndex
CREATE INDEX "Betyg_dryckId_idx" ON "Betyg"("dryckId");

-- CreateIndex
CREATE INDEX "Betyg_datum_idx" ON "Betyg"("datum");

-- CreateIndex
CREATE INDEX "Smakanalys_typ_skapad_idx" ON "Smakanalys"("typ", "skapad");
