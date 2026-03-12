CREATE TABLE
    "BlockedUser" (
        "id" TEXT NOT NULL,
        "blockerId" TEXT NOT NULL,
        "blockedId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX "BlockedUser_blockerId_blockedId_key" ON "BlockedUser" ("blockerId", "blockedId");

ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE
    "Conversation" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "firstUserId" TEXT NOT NULL,
        "secondUserId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX "Conversation_key_key" ON "Conversation" ("key");

CREATE UNIQUE INDEX "Conversation_firstUserId_secondUserId_key" ON "Conversation" ("firstUserId", "secondUserId");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_firstUserId_fkey" FOREIGN KEY ("firstUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_secondUserId_fkey" FOREIGN KEY ("secondUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;