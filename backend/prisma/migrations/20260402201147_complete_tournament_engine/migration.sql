/*
  Warnings:

  - You are about to drop the column `claimedWinnerId` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `evidenceUrls` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `resolutionNote` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `resolutionWinnerId` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `Dispute` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedById` on the `Dispute` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_reviewedById_fkey";

-- DropIndex
DROP INDEX "Dispute_matchId_status_idx";

-- AlterTable
ALTER TABLE "Dispute" DROP COLUMN "claimedWinnerId",
DROP COLUMN "description",
DROP COLUMN "evidenceUrls",
DROP COLUMN "resolutionNote",
DROP COLUMN "resolutionWinnerId",
DROP COLUMN "resolvedAt",
DROP COLUMN "reviewedById";

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'single_elimination',
ADD COLUMN     "hostId" TEXT,
ADD COLUMN     "maxParticipants" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "teamSize" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'upcoming';

-- CreateTable
CREATE TABLE "TournamentTeam" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "seed" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "scoreDiff" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "matchIndex" INTEGER NOT NULL,
    "teamAId" TEXT,
    "teamBId" TEXT,
    "winnerId" TEXT,
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "nextMatchId" TEXT,
    "nextMatchSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatchSubmission" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "submitterRole" TEXT NOT NULL,
    "claimedWinnerId" TEXT NOT NULL,
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentMatchSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeam_tournamentId_teamId_key" ON "TournamentTeam"("tournamentId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatchSubmission_matchId_submitterRole_key" ON "TournamentMatchSubmission"("matchId", "submitterRole");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "TournamentMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchSubmission" ADD CONSTRAINT "TournamentMatchSubmission_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "TournamentMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchSubmission" ADD CONSTRAINT "TournamentMatchSubmission_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
