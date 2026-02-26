-- 1) Rename existing column playerId -> hostId
ALTER TABLE "Match" RENAME COLUMN "playerId" TO "hostId";

-- 2) Add joinerId (nullable)
ALTER TABLE "Match" ADD COLUMN "joinerId" TEXT;

-- 3) Drop old foreign key on playerId (name varies) and recreate for hostId
-- We'll safely drop constraints if Prisma generated names differ:
DO $$
BEGIN
  -- Try dropping the old FK if it exists (common prisma name patterns)
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Match_playerId_fkey') THEN
    ALTER TABLE "Match" DROP CONSTRAINT "Match_playerId_fkey";
  END IF;
EXCEPTION WHEN others THEN
  -- ignore
END $$;

-- Create FK for hostId -> User(id)
ALTER TABLE "Match"
  ADD CONSTRAINT "Match_hostId_fkey"
  FOREIGN KEY ("hostId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create FK for joinerId -> User(id)
ALTER TABLE "Match"
  ADD CONSTRAINT "Match_joinerId_fkey"
  FOREIGN KEY ("joinerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) (Optional but recommended) index joinerId
CREATE INDEX IF NOT EXISTS "Match_joinerId_idx" ON "Match"("joinerId");