-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userDiscordId" TEXT NOT NULL,
    "guildDiscordId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Daily" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "scheduleTime" DATETIME NOT NULL,
    "guildDiscordId" TEXT NOT NULL,
    "textChannelDiscordId" TEXT NOT NULL,
    "voiceChannelDiscordId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DailyUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dailyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    FOREIGN KEY ("dailyId") REFERENCES "Daily" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
