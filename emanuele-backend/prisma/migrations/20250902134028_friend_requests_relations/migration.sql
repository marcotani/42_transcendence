/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `FriendRequest` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FriendRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FriendRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FriendRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FriendRequest" ("createdAt", "fromUserId", "id", "status", "toUserId") SELECT "createdAt", "fromUserId", "id", "status", "toUserId" FROM "FriendRequest";
DROP TABLE "FriendRequest";
ALTER TABLE "new_FriendRequest" RENAME TO "FriendRequest";
CREATE UNIQUE INDEX "FriendRequest_fromUserId_toUserId_status_key" ON "FriendRequest"("fromUserId", "toUserId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
