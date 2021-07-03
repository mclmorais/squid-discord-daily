/*
  Warnings:

  - You are about to drop the column `scheduleTime` on the `Daily` table. All the data in the column will be lost.
  - Added the required column `isActive` to the `Daily` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Daily" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "scheduleCron" TEXT,
    "guildDiscordId" TEXT,
    "textChannelDiscordId" TEXT NOT NULL,
    "voiceChannelDiscordId" TEXT NOT NULL
);
INSERT INTO "new_Daily" ("guildDiscordId", "id", "textChannelDiscordId", "title", "voiceChannelDiscordId") SELECT "guildDiscordId", "id", "textChannelDiscordId", "title", "voiceChannelDiscordId" FROM "Daily";
DROP TABLE "Daily";
ALTER TABLE "new_Daily" RENAME TO "Daily";
CREATE UNIQUE INDEX "Daily.title_unique" ON "Daily"("title");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
