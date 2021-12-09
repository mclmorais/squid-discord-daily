-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dailyId" INTEGER NOT NULL,
    "userDiscordId" TEXT NOT NULL,
    "guildDiscordId" TEXT,
    CONSTRAINT "DailyUser_dailyId_fkey" FOREIGN KEY ("dailyId") REFERENCES "Daily" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DailyUser" ("dailyId", "guildDiscordId", "id", "userDiscordId") SELECT "dailyId", "guildDiscordId", "id", "userDiscordId" FROM "DailyUser";
DROP TABLE "DailyUser";
ALTER TABLE "new_DailyUser" RENAME TO "DailyUser";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- RedefineIndex
DROP INDEX "Daily.title_unique";
CREATE UNIQUE INDEX "Daily_title_key" ON "Daily"("title");
