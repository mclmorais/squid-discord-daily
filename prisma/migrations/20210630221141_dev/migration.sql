/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `userId` on the `DailyUser` table. All the data in the column will be lost.
  - Added the required column `userDiscordId` to the `DailyUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Daily" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "scheduleTime" DATETIME,
    "guildDiscordId" TEXT,
    "textChannelDiscordId" TEXT NOT NULL,
    "voiceChannelDiscordId" TEXT NOT NULL
);
INSERT INTO "new_Daily" ("guildDiscordId", "id", "scheduleTime", "textChannelDiscordId", "title", "voiceChannelDiscordId") SELECT "guildDiscordId", "id", "scheduleTime", "textChannelDiscordId", "title", "voiceChannelDiscordId" FROM "Daily";
DROP TABLE "Daily";
ALTER TABLE "new_Daily" RENAME TO "Daily";
CREATE UNIQUE INDEX "Daily.title_unique" ON "Daily"("title");
CREATE TABLE "new_DailyUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dailyId" INTEGER NOT NULL,
    "userDiscordId" TEXT NOT NULL,
    "guildDiscordId" TEXT,
    FOREIGN KEY ("dailyId") REFERENCES "Daily" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyUser" ("dailyId", "id") SELECT "dailyId", "id" FROM "DailyUser";
DROP TABLE "DailyUser";
ALTER TABLE "new_DailyUser" RENAME TO "DailyUser";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
