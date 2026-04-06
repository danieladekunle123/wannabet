/*
  Warnings:

  - You are about to alter the column `amount` on the `LedgerEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `stake` on the `Match` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `entryFee` on the `Tournament` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `balance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `escrow` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "TournamentMatchSubmission" DROP CONSTRAINT "TournamentMatchSubmission_submittedBy_fkey";

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "description" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedByModId" TEXT,
ADD COLUMN     "resolvedWinnerId" TEXT;

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "matchId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "tournamentId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "stake" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "lastSeen" TIMESTAMP(3),
ADD COLUMN     "manualStatus" TEXT;

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "entryFee" SET DEFAULT 0,
ALTER COLUMN "entryFee" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDeactivated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "balance" SET DEFAULT 0,
ALTER COLUMN "balance" SET DATA TYPE INTEGER,
ALTER COLUMN "escrow" SET DEFAULT 0,
ALTER COLUMN "escrow" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "matchId" TEXT,
    "tournamentId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeAnalysis" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "suggestedWinnerId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "evidenceSummary" JSONB NOT NULL,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeTrainingData" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerAId" TEXT NOT NULL,
    "playerBId" TEXT NOT NULL,
    "submittedResults" JSONB NOT NULL,
    "finalWinnerId" TEXT,
    "disputeOutcome" TEXT,
    "aiSuggestedWinnerId" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "correctPrediction" BOOLEAN,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeTrainingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "siteName" TEXT NOT NULL DEFAULT 'WannaBet?',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "trustScoreThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minWagerAmount" INTEGER NOT NULL DEFAULT 5,
    "maxWagerAmount" INTEGER NOT NULL DEFAULT 10000,
    "maxActiveMatchesPerUser" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DisputeAnalysis_disputeId_key" ON "DisputeAnalysis"("disputeId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeTrainingData_disputeId_key" ON "DisputeTrainingData"("disputeId");

-- AddForeignKey
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatchSubmission" ADD CONSTRAINT "TournamentMatchSubmission_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeAnalysis" ADD CONSTRAINT "DisputeAnalysis_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeTrainingData" ADD CONSTRAINT "DisputeTrainingData_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
