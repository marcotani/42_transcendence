-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT NOT NULL DEFAULT '/static/default_avatar.png',
    "alias" TEXT,
    "skinColor" TEXT DEFAULT '#FFFFFF',
    "gdpr" BOOLEAN NOT NULL DEFAULT false,
    "emailVisible" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("alias", "avatarUrl", "bio", "gdpr", "id", "skinColor", "userId") SELECT "alias", "avatarUrl", "bio", "gdpr", "id", "skinColor", "userId" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
