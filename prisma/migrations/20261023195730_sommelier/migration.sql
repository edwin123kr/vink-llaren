-- CreateTable
CREATE TABLE "Samtal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anvandareId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uppdaterad" DATETIME NOT NULL,
    CONSTRAINT "Samtal_anvandareId_fkey" FOREIGN KEY ("anvandareId") REFERENCES "Anvandare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meddelande" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "samtalId" TEXT NOT NULL,
    "roll" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "kallor" JSONB,
    "skapad" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meddelande_samtalId_fkey" FOREIGN KEY ("samtalId") REFERENCES "Samtal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Samtal_anvandareId_uppdaterad_idx" ON "Samtal"("anvandareId", "uppdaterad");

-- CreateIndex
CREATE INDEX "Meddelande_samtalId_skapad_idx" ON "Meddelande"("samtalId", "skapad");
