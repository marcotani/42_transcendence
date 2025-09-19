/*
  Warnings:

  - You are about to drop the column `elo` on the `UserStat` table. All the data in the column will be lost.
  - You are about to drop the column `losses` on the `UserStat` table. All the data in the column will be lost.
  - You are about to drop the column `wins` on the `UserStat` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "botWins" INTEGER NOT NULL DEFAULT 0,
    "botLosses" INTEGER NOT NULL DEFAULT 0,
    "playerWins" INTEGER NOT NULL DEFAULT 0,
    "playerLosses" INTEGER NOT NULL DEFAULT 0,
    "tournamentWins" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserStat" ("id", "userId") SELECT "id", "userId" FROM "UserStat";
DROP TABLE "UserStat";
ALTER TABLE "new_UserStat" RENAME TO "UserStat";
CREATE UNIQUE INDEX "UserStat_userId_key" ON "UserStat"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
