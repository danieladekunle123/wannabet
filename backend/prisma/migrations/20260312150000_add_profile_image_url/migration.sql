ALTER TABLE "User"
ADD COLUMN "profileImageUrl" TEXT;

UPDATE "User"
SET "profileImageUrl" = "avatarUrl"
WHERE "profileImageUrl" IS NULL
  AND "avatarUrl" IS NOT NULL;
