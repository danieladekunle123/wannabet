CREATE TYPE "FriendRequestStatus" AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE
    "FriendRequest" (
        "id" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "recipientId" TEXT NOT NULL,
        "status" "FriendRequestStatus" NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
    );

CREATE UNIQUE INDEX "FriendRequest_senderId_recipientId_key" ON "FriendRequest" ("senderId", "recipientId");

ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;