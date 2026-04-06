-- Team system expansion: roles, invites, posts, and team chat link
-- Enums
CREATE TYPE "TeamRole" AS ENUM ('commander', 'general', 'colonel');

CREATE TYPE "TeamInviteStatus" AS ENUM ('pending', 'accepted', 'declined');

-- Team table changes
ALTER TABLE "Team"
ADD COLUMN "description" TEXT,
ADD COLUMN "game" TEXT,
ADD COLUMN "ownerId" TEXT;

-- Backfill ownerId/game for existing data
UPDATE "Team"
SET
    "ownerId" = COALESCE(
        "captainId",
        (
            SELECT
                tm."userId"
            FROM
                "TeamMember" tm
            WHERE
                tm."teamId" = "Team"."id"
            ORDER BY
                tm."joinedAt" ASC
            LIMIT
                1
        )
    );

UPDATE "Team"
SET
    "game" = 'unknown'
WHERE
    "game" IS NULL;

ALTER TABLE "Team"
ALTER COLUMN "ownerId"
SET
    NOT NULL,
ALTER COLUMN "game"
SET
    NOT NULL;

ALTER TABLE "Team"
DROP COLUMN "captainId";

-- TeamMember role
ALTER TABLE "TeamMember"
ADD COLUMN "role" "TeamRole" NOT NULL DEFAULT 'colonel';

-- Promote owner to commander role
UPDATE "TeamMember" tm
SET
    "role" = 'commander'
FROM
    "Team" t
WHERE
    tm."teamId" = t."id"
    AND tm."userId" = t."ownerId";

-- New tables
CREATE TABLE
    "TeamPost" (
        "id" TEXT NOT NULL,
        "teamId" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TeamPost_pkey" PRIMARY KEY ("id")
    );

CREATE TABLE
    "TeamInvite" (
        "id" TEXT NOT NULL,
        "teamId" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "receiverId" TEXT NOT NULL,
        "status" "TeamInviteStatus" NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
    );

CREATE TABLE
    "TeamChat" (
        "id" TEXT NOT NULL,
        "teamId" TEXT NOT NULL,
        "chatId" TEXT NOT NULL,
        CONSTRAINT "TeamChat_pkey" PRIMARY KEY ("id")
    );

-- Indexes
CREATE UNIQUE INDEX "TeamInvite_teamId_receiverId_key" ON "TeamInvite" ("teamId", "receiverId");

CREATE UNIQUE INDEX "TeamChat_teamId_key" ON "TeamChat" ("teamId");

CREATE UNIQUE INDEX "TeamChat_chatId_key" ON "TeamChat" ("chatId");

-- Foreign keys
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamPost" ADD CONSTRAINT "TeamPost_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamPost" ADD CONSTRAINT "TeamPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamChat" ADD CONSTRAINT "TeamChat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE;