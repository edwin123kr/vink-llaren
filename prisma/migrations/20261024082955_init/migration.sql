-- Trigramindex för snabb sökning i katalogen ("innehåller").
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateTable
CREATE TABLE "Dryck" (
    "id" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "producent" TEXT,
    "typ" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "druvor" JSONB,
    "land" TEXT,
    "region" TEXT,
    "argang" INTEGER,
    "alkoholhalt" DOUBLE PRECISION,
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
    "skapadAvId" TEXT,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uppdaterad" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dryck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flaska" (
    "id" TEXT NOT NULL,
    "anvandareId" TEXT NOT NULL,
    "dryckId" TEXT NOT NULL,
    "antal" INTEGER NOT NULL DEFAULT 1,
    "inkopspris" INTEGER,
    "inkopsdatum" TIMESTAMP(3),
    "inkopsstalle" TEXT,
    "plats" TEXT,
    "drickFran" INTEGER,
    "drickTill" INTEGER,
    "anteckningar" TEXT,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uppdaterad" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flaska_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Betyg" (
    "id" TEXT NOT NULL,
    "anvandareId" TEXT NOT NULL,
    "dryckId" TEXT NOT NULL,
    "flaskaId" TEXT,
    "provningId" TEXT,
    "betyg" INTEGER NOT NULL,
    "kommentar" TEXT,
    "tillfalle" TEXT,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Betyg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Onskning" (
    "id" TEXT NOT NULL,
    "anvandareId" TEXT NOT NULL,
    "dryckId" TEXT,
    "namn" TEXT NOT NULL,
    "motivering" TEXT,
    "prisCa" INTEGER,
    "kalla" TEXT NOT NULL,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Onskning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provning" (
    "id" TEXT NOT NULL,
    "anvandareId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "datum" TIMESTAMP(3),
    "deltagare" INTEGER NOT NULL,
    "antalViner" INTEGER NOT NULL,
    "budgetPerPerson" INTEGER NOT NULL,
    "tema" TEXT,
    "forslag" JSONB,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Provning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Smakanalys" (
    "id" TEXT NOT NULL,
    "anvandareId" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "antalBetyg" INTEGER NOT NULL,
    "resultat" JSONB NOT NULL,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Smakanalys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bild" (
    "id" TEXT NOT NULL,
    "agareId" TEXT,
    "typ" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anvandare" (
    "id" TEXT NOT NULL,
    "epost" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "losenordHash" TEXT NOT NULL,
    "delaKommentarer" BOOLEAN NOT NULL DEFAULT true,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anvandare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "anvandareId" TEXT NOT NULL,
    "utgar" TIMESTAMP(3) NOT NULL,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnrop" (
    "id" TEXT NOT NULL,
    "anvandareId" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Samtal" (
    "id" TEXT NOT NULL,
    "anvandareId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uppdaterad" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Samtal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meddelande" (
    "id" TEXT NOT NULL,
    "samtalId" TEXT NOT NULL,
    "roll" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "kallor" JSONB,
    "skapad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meddelande_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dryck_namn_idx" ON "Dryck"("namn");

-- CreateIndex
CREATE INDEX "Dryck_kategori_idx" ON "Dryck"("kategori");

-- CreateIndex
CREATE INDEX "Dryck_producent_namn_argang_idx" ON "Dryck"("producent", "namn", "argang");

-- CreateIndex
CREATE INDEX "Dryck_kalla_kallaId_idx" ON "Dryck"("kalla", "kallaId");

-- CreateIndex
CREATE INDEX "Dryck_sok_idx" ON "Dryck" USING GIN ("sok" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Dryck_ean_idx" ON "Dryck"("ean");

-- CreateIndex
CREATE INDEX "Dryck_agareId_idx" ON "Dryck"("agareId");

-- CreateIndex
CREATE INDEX "Flaska_dryckId_idx" ON "Flaska"("dryckId");

-- CreateIndex
CREATE INDEX "Flaska_anvandareId_idx" ON "Flaska"("anvandareId");

-- CreateIndex
CREATE INDEX "Betyg_dryckId_idx" ON "Betyg"("dryckId");

-- CreateIndex
CREATE INDEX "Betyg_anvandareId_datum_idx" ON "Betyg"("anvandareId", "datum");

-- CreateIndex
CREATE INDEX "Onskning_anvandareId_idx" ON "Onskning"("anvandareId");

-- CreateIndex
CREATE INDEX "Provning_anvandareId_idx" ON "Provning"("anvandareId");

-- CreateIndex
CREATE INDEX "Smakanalys_anvandareId_typ_skapad_idx" ON "Smakanalys"("anvandareId", "typ", "skapad");

-- CreateIndex
CREATE UNIQUE INDEX "Anvandare_epost_key" ON "Anvandare"("epost");

-- CreateIndex
CREATE INDEX "Session_anvandareId_idx" ON "Session"("anvandareId");

-- CreateIndex
CREATE INDEX "AiAnrop_anvandareId_skapad_idx" ON "AiAnrop"("anvandareId", "skapad");

-- CreateIndex
CREATE INDEX "Samtal_anvandareId_uppdaterad_idx" ON "Samtal"("anvandareId", "uppdaterad");

-- CreateIndex
CREATE INDEX "Meddelande_samtalId_skapad_idx" ON "Meddelande"("samtalId", "skapad");

-- AddForeignKey
ALTER TABLE "Dryck" ADD CONSTRAINT "Dryck_agareId_fkey" FOREIGN KEY ("agareId") REFERENCES "Anvandare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flaska" ADD CONSTRAINT "Flaska_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flaska" ADD CONSTRAINT "Flaska_dryckId_fkey" FOREIGN KEY ("dryckId") REFERENCES "Dryck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Betyg" ADD CONSTRAINT "Betyg_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Betyg" ADD CONSTRAINT "Betyg_dryckId_fkey" FOREIGN KEY ("dryckId") REFERENCES "Dryck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Betyg" ADD CONSTRAINT "Betyg_flaskaId_fkey" FOREIGN KEY ("flaskaId") REFERENCES "Flaska"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Betyg" ADD CONSTRAINT "Betyg_provningId_fkey" FOREIGN KEY ("provningId") REFERENCES "Provning"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Onskning" ADD CONSTRAINT "Onskning_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Onskning" ADD CONSTRAINT "Onskning_dryckId_fkey" FOREIGN KEY ("dryckId") REFERENCES "Dryck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provning" ADD CONSTRAINT "Provning_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Smakanalys" ADD CONSTRAINT "Smakanalys_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnrop" ADD CONSTRAINT "AiAnrop_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Samtal" ADD CONSTRAINT "Samtal_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meddelande" ADD CONSTRAINT "Meddelande_samtalId_fkey" FOREIGN KEY ("samtalId") REFERENCES "Samtal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
