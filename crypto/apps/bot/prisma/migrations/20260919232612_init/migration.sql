-- CreateTable
CREATE TABLE "State" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "mode" TEXT NOT NULL DEFAULT 'off',
    "dailyHour" INTEGER NOT NULL DEFAULT 9,
    "dailyMinute" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "pendingDraft" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PostHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
