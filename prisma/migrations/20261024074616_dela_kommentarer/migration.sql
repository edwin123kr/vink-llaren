-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Anvandare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "epost" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "losenordHash" TEXT NOT NULL,
    "delaKommentarer" BOOLEAN NOT NULL DEFAULT true,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Anvandare" ("epost", "id", "losenordHash", "namn", "skapad") SELECT "epost", "id", "losenordHash", "namn", "skapad" FROM "Anvandare";
DROP TABLE "Anvandare";
ALTER TABLE "new_Anvandare" RENAME TO "Anvandare";
CREATE UNIQUE INDEX "Anvandare_epost_key" ON "Anvandare"("epost");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
