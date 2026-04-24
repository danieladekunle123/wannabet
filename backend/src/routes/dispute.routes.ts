import { Router } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { env } from "../lib/env";
import { updateTrustScore } from "../lib/trustScore";
import { disputeQueue } from "../jobs/queues";
import logger from "../lib/logger";

export const disputeRouter = Router();

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ─── Scoring model ────────────────────────────────────────────────────────────
interface DisputeFeatures {
  reporterTrustScore: number;
  reportedTrustScore: number;
  reporterDisputeCount: number; // total disputes raised by reporter
  reportedDisputeCount: number; // total disputes raised against reported
  reporterWinRate: number; // 0–100
  reportedWinRate: number;
  bothSubmittedSame: boolean; // did both agree on same winner?
  reporterSubmittedFirst: boolean;
  submissionDelayMinutes: number; // time between first and second submission
  matchStake: number;
}

function computeConfidenceScore(features: DisputeFeatures): {
  score: number;
  suggestReporterId: boolean;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};
  let reporterWeight = 0;
  let reportedWeight = 0;

  // Trust score differential (0–40 pts)
  const trustDiff = features.reporterTrustScore - features.reportedTrustScore;
  const trustScore = Math.max(-40, Math.min(40, trustDiff * 0.4));
  breakdown.trustDifferential = trustScore;
  reporterWeight += trustScore;

  // Dispute history (0–20 pts against reported)
  const historyScore = Math.min(20, features.reportedDisputeCount * 2.5);
  breakdown.reportedDisputeHistory = historyScore;
  reporterWeight += historyScore;

  // Reporter dispute history (negative if reporter files often)
  const reporterHistPenalty = Math.min(15, features.reporterDisputeCount * 1.5);
  breakdown.reporterHistoryPenalty = -reporterHistPenalty;
  reporterWeight -= reporterHistPenalty;

  // Submission speed (0–10 pts — faster = more likely to have real evidence)
  const speedScore = features.reporterSubmittedFirst
    ? Math.max(0, 10 - features.submissionDelayMinutes * 0.5)
    : 0;
  breakdown.submissionSpeed = speedScore;
  reporterWeight += speedScore;

  // Agreement check (if both submitted same winner it's more certain)
  if (features.bothSubmittedSame) {
    breakdown.agreement = 20;
    reporterWeight += 20;
  } else {
    breakdown.agreement = 0;
  }

  // Win rate factor (minor signal, 0–10)
  const winRateDiff = features.reporterWinRate - features.reportedWinRate;
  const winRateScore = Math.max(-5, Math.min(5, winRateDiff * 0.05));
  breakdown.winRateDifferential = winRateScore;
  reporterWeight += winRateScore;

  // Normalise to 0–100 confidence
  const rawConfidence = 50 + reporterWeight;
  const confidence = Math.max(5, Math.min(99, rawConfidence));
  const suggestReporterId = confidence >= 50;

  return { score: confidence, suggestReporterId, breakdown };
}

// ─── GET /disputes ─────────────────────────────────────────────────────────────
// Returns all disputes with relevant context for moderators
disputeRouter.get(
  "/",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    try {
      const statusFilter = (req.query.status as string) || undefined;

      const disputes = await (prisma as any).dispute.findMany({
        where: statusFilter ? { status: statusFilter } : undefined,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          match: {
            select: {
              id: true,
              game: true,
              stake: true,
              status: true,
              hostId: true,
              joinerId: true,
              reportedWinnerId: true,
              reportedById: true,
              host: {
                select: {
                  id: true,
                  username: true,
                  profile: { select: { trustScore: true } },
                },
              },
              joiner: {
                select: {
                  id: true,
                  username: true,
                  profile: { select: { trustScore: true } },
                },
              },
            },
          },
          disputant: {
            select: {
              id: true,
              username: true,
              profile: { select: { trustScore: true } },
            },
          },
          analysis: true,
        },
      });

      return res.json({ disputes });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to load disputes" });
    }
  },
);

// ─── POST /disputes/analyze ────────────────────────────────────────────────────
// Queues dispute analysis as a background job via BullMQ
disputeRouter.post(
  "/analyze",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    const { disputeId } = req.body as { disputeId: string };
    if (!disputeId) {
      return res.status(400).json({ message: "disputeId is required" });
    }

    try {
      const dispute = await (prisma as any).dispute.findUnique({
        where: { id: disputeId },
      });
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }

      // Return cached analysis if already computed
      const existing = await (prisma as any).disputeAnalysis.findUnique({
        where: { disputeId },
      });
      if (existing) {
        return res.json({ analysis: existing });
      }

      // Queue the heavy analysis as a background job
      const job = await disputeQueue.add(
        "analyze",
        { disputeId },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        },
      );

      logger.info("Dispute analysis job queued", { disputeId, jobId: job.id });
      return res.status(202).json({
        message: "Dispute analysis queued",
        jobId: job.id,
        disputeId,
      });
    } catch (err: any) {
      logger.error("Failed to queue dispute analysis", {
        disputeId,
        error: err.message,
      });
      return res
        .status(500)
        .json({ message: err?.message ?? "Analysis failed" });
    }
  },
);

// ─── POST /disputes/:id/resolve ────────────────────────────────────────────────
// Moderator resolves the dispute and records accuracy tracking
disputeRouter.post(
  "/:id/resolve",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    const disputeId = req.params.id;
    const modId = req.user!.userId;
    const { winnerId, outcome } = req.body as {
      winnerId: string;
      outcome: "approved_reporter" | "denied_reporter" | "split";
    };

    if (!winnerId || !outcome) {
      return res
        .status(400)
        .json({ message: "winnerId and outcome are required" });
    }

    try {
      const dispute = await (prisma as any).dispute.findUnique({
        where: { id: disputeId },
        include: {
          match: true,
          analysis: true,
        },
      });

      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }

      if (dispute.status === "resolved") {
        return res.status(400).json({ message: "Dispute already resolved" });
      }

      const now = new Date();

      // Update dispute
      const updated = await (prisma as any).dispute.update({
        where: { id: disputeId },
        data: {
          status: "resolved",
          resolvedWinnerId: winnerId,
          resolvedAt: now,
          resolvedByModId: modId,
        },
      });

      // Update training data with actual outcome
      const training = await (prisma as any).disputeTrainingData.findUnique({
        where: { disputeId },
      });

      if (training) {
        const correctPrediction = training.aiSuggestedWinnerId === winnerId;
        await (prisma as any).disputeTrainingData.update({
          where: { disputeId },
          data: {
            finalWinnerId: winnerId,
            disputeOutcome: outcome,
            correctPrediction,
            resolvedAt: now,
          },
        });
      }

      // Penalise loser trust score and reward winner (non-zero stake only)
      const match = dispute.match;
      if (match.stake > 0) {
        const loserId =
          winnerId === match.hostId ? match.joinerId : match.hostId;
        if (loserId) {
          void updateTrustScore(loserId, "DISPUTE_LOST", match.id);
        }
        void updateTrustScore(winnerId, "DISPUTE_WON", match.id);
      }

      // Update match status to COMPLETED with forced winner
      if (match.status !== "COMPLETED") {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: "COMPLETED",
            reportedWinnerId: winnerId,
          },
        });
      }

      // ── Financial settlement ──────────────────────────────────────────────
      // Winner receives full pot (their stake back + loser's stake).
      // Loser forfeits their escrowed stake to the winner.
      const stake = match.stake;
      if (stake > 0) {
        const loserId =
          winnerId === match.hostId ? match.joinerId : match.hostId;
        if (loserId) {
          await prisma.$transaction(async (tx) => {
            // Idempotency: skip if payout already applied for this match
            const existingPayout = await tx.ledgerEntry.findFirst({
              where: { matchId: match.id, type: "payout" },
            });
            if (existingPayout) return;

            const winnerWallet = await tx.wallet.findUnique({
              where: { userId: winnerId },
            });
            const loserWallet = await tx.wallet.findUnique({
              where: { userId: loserId },
            });

            if (!winnerWallet || !loserWallet) {
              logger.error("Wallet not found during dispute payout", {
                disputeId,
                winnerId,
                loserId,
              });
              return;
            }

            const pot = stake * 2;

            await tx.wallet.update({
              where: { id: winnerWallet.id },
              data: {
                escrow: { decrement: stake },
                balance: { increment: pot },
              },
            });

            await tx.wallet.update({
              where: { id: loserWallet.id },
              data: { escrow: { decrement: stake } },
            });

            await tx.ledgerEntry.createMany({
              data: [
                {
                  walletId: winnerWallet.id,
                  type: "payout",
                  amount: pot,
                  matchId: match.id,
                },
                {
                  walletId: loserWallet.id,
                  type: "payout",
                  amount: -stake,
                  matchId: match.id,
                },
              ],
            });

            await tx.escrow.updateMany({
              where: { matchId: match.id, status: "locked" },
              data: { status: "released" },
            });

            logger.info("Dispute payout executed", {
              disputeId,
              matchId: match.id,
              winnerId,
              loserId,
              pot,
              stake,
            });
          });
        }
      }

      return res.json({ dispute: updated });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to resolve dispute" });
    }
  },
);

// ─── GET /disputes/stats ────────────────────────────────────────────────────────
// AI accuracy stats for moderator dashboard
disputeRouter.get(
  "/stats",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    try {
      const [total, resolved, aiCorrect, open] = await Promise.all([
        (prisma as any).dispute.count(),
        (prisma as any).dispute.count({ where: { status: "resolved" } }),
        (prisma as any).disputeTrainingData.count({
          where: { correctPrediction: true },
        }),
        (prisma as any).dispute.count({ where: { status: "open" } }),
      ]);

      const accuracy =
        resolved > 0 ? Math.round((aiCorrect / resolved) * 100) : null;

      return res.json({ total, resolved, open, aiAccuracy: accuracy });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to load stats" });
    }
  },
);
