ALTER TABLE "Dispute"
ADD COLUMN "claimedWinnerId" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "evidenceUrls" JSONB,
ADD COLUMN "reviewedById" TEXT,
ADD COLUMN "resolutionWinnerId" TEXT,
ADD COLUMN "resolutionNote" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3);

CREATE INDEX "Dispute_matchId_status_idx" ON "Dispute"("matchId", "status");

ALTER TABLE "Dispute"
ADD CONSTRAINT "Dispute_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
