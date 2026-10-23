-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uppdaterad" DATETIME NOT NULL
);
INSERT INTO "new_Dryck" ("alkoholhalt", "argang", "aromer", "beskrivning", "bildUrl", "druvor", "ean", "fyllighet", "id", "kalla", "kallaId", "kategori", "land", "licens", "mat", "namn", "prisCa", "prisUppskattat", "producent", "region", "rokighet", "sbArtikelnr", "skapad", "sotma", "stravhet", "syra", "typ", "uppdaterad", "volymMl") SELECT "alkoholhalt", "argang", "aromer", "beskrivning", "bildUrl", "druvor", "ean", "fyllighet", "id", "kalla", "kallaId", "kategori", "land", "licens", "mat", "namn", "prisCa", "prisUppskattat", "producent", "region", "rokighet", "sbArtikelnr", "skapad", "sotma", "stravhet", "syra", "typ", "uppdaterad", "volymMl" FROM "Dryck";
DROP TABLE "Dryck";
ALTER TABLE "new_Dryck" RENAME TO "Dryck";
CREATE UNIQUE INDEX "Dryck_ean_key" ON "Dryck"("ean");
CREATE INDEX "Dryck_namn_idx" ON "Dryck"("namn");
CREATE INDEX "Dryck_kategori_idx" ON "Dryck"("kategori");
CREATE INDEX "Dryck_producent_namn_argang_idx" ON "Dryck"("producent", "namn", "argang");
CREATE INDEX "Dryck_kalla_kallaId_idx" ON "Dryck"("kalla", "kallaId");
CREATE INDEX "Dryck_sok_idx" ON "Dryck"("sok");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
