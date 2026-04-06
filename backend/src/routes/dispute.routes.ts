import { Router } from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { env } from "../lib/env";
import { updateTrustScore } from "../lib/trustScore";

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
// Runs hybrid scoring + OpenAI analysis on a dispute and stores the result
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
      // Load dispute + match + user data
      const dispute = await (prisma as any).dispute.findUnique({
        where: { id: disputeId },
        include: {
          match: {
            include: {
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
        },
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

      const match = dispute.match;
      const reporter = dispute.disputant;
      const reporterId = reporter.id;
      const reportedId =
        match.hostId === reporterId ? match.joinerId : match.hostId;
      const reportedUser =
        match.hostId === reporterId ? match.joiner : match.host;

      // Fetch dispute history counts
      const [reporterDisputeCount, reportedDisputeCount] = await Promise.all([
        (prisma as any).dispute.count({ where: { disputantId: reporterId } }),
        (prisma as any).dispute.count({ where: { disputantId: reportedId } }),
      ]);

      // Fetch win rates from match history
      const [reporterStats, reportedStats] = await Promise.all([
        prisma.match.findMany({
          where: {
            OR: [{ hostId: reporterId }, { joinerId: reporterId }],
            status: "COMPLETED",
          },
          select: { reportedWinnerId: true },
        }),
        prisma.match.findMany({
          where: {
            OR: [{ hostId: reportedId }, { joinerId: reportedId }],
            status: "COMPLETED",
          },
          select: { reportedWinnerId: true },
        }),
      ]);

      const calcWinRate = (
        matches: { reportedWinnerId: string | null }[],
        uid: string,
      ) => {
        if (!matches.length) return 50;
        const wins = matches.filter((m) => m.reportedWinnerId === uid).length;
        return Math.round((wins / matches.length) * 100);
      };

      const reporterTrustScore = reporter.profile?.trustScore ?? 50;
      const reportedTrustScore = reportedUser?.profile?.trustScore ?? 50;

      const features: DisputeFeatures = {
        reporterTrustScore,
        reportedTrustScore,
        reporterDisputeCount,
        reportedDisputeCount,
        reporterWinRate: calcWinRate(reporterStats, reporterId),
        reportedWinRate: calcWinRate(reportedStats, reportedId ?? ""),
        bothSubmittedSame: match.reportedWinnerId === reporterId,
        reporterSubmittedFirst: match.reportedById === reporterId,
        submissionDelayMinutes: 5, // approximation; extend if you track timestamps
        matchStake: match.stake,
      };

      const {
        score: confidence,
        suggestReporterId,
        breakdown,
      } = computeConfidenceScore(features);

      const suggestedWinnerId = suggestReporterId ? reporterId : reportedId;

      // ── OpenAI prompt ──────────────────────────────────────────────────────
      const prompt = `You are an impartial esports dispute analyst for the WannaBet platform.

MATCH CONTEXT:
- Game: ${match.game}
- Stake: $${match.stake / 100}
- Match status: ${match.status}

PLAYERS:
- Reporter (${reporter.username}, ID: ${reporterId}): trust score ${reporterTrustScore.toFixed(1)}, dispute history: ${reporterDisputeCount} filed, win rate ${features.reporterWinRate}%
- Reported player (${reportedUser?.username ?? "Unknown"}, ID: ${reportedId ?? "Unknown"}): trust score ${reportedTrustScore.toFixed(1)}, dispute history: ${reportedDisputeCount} filed, win rate ${features.reportedWinRate}%

DISPUTE DETAILS:
- Reason: ${dispute.reason ?? "Result dispute"}
- Description: ${dispute.description ?? "No description provided"}
- Reporter submitted first: ${features.reporterSubmittedFirst ? "Yes" : "No"}
- Both agreed on same winner: ${features.bothSubmittedSame ? "Yes" : "No"}

SCORING MODEL RESULT:
- Confidence score: ${confidence.toFixed(1)}%
- Suggested winner: ${suggestedWinnerId === reporterId ? reporter.username : (reportedUser?.username ?? "Reported player")}
- Score breakdown: ${JSON.stringify(breakdown)}

Based on the above data, provide:
1. A concise reasoning (2-3 sentences) for who should win this dispute
2. 3-4 key evidence points that support this decision (each as a short string)
3. Any caveats or factors that moderators should verify manually

Respond in JSON format:
{
  "reasoning": "...",
  "evidenceSummary": ["...", "...", "..."],
  "caveats": "..."
}`;

      let aiReasoning = "Analysis based on trust scores and dispute history.";
      let aiEvidence: string[] = [
        `Reporter trust score: ${reporterTrustScore.toFixed(1)}`,
        `Reported player dispute count: ${reportedDisputeCount}`,
        `Confidence score: ${confidence.toFixed(1)}%`,
      ];
      let rawResponse: any = null;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        });
        rawResponse = completion;
        const parsed = JSON.parse(
          completion.choices[0]?.message?.content ?? "{}",
        );
        if (parsed.reasoning) aiReasoning = parsed.reasoning;
        if (Array.isArray(parsed.evidenceSummary))
          aiEvidence = parsed.evidenceSummary;
      } catch (aiErr) {
        console.error("OpenAI call failed, using fallback:", aiErr);
      }

      // Store result
      const analysis = await (prisma as any).disputeAnalysis.create({
        data: {
          disputeId,
          suggestedWinnerId,
          confidence,
          reasoning: aiReasoning,
          evidenceSummary: aiEvidence,
          rawResponse,
        },
      });

      // Store training data snapshot
      await (prisma as any).disputeTrainingData.upsert({
        where: { disputeId },
        create: {
          disputeId,
          matchId: match.id,
          playerAId: reporterId,
          playerBId: reportedId ?? reporterId,
          submittedResults: [
            {
              playerId: match.reportedById,
              reportedWinnerId: match.reportedWinnerId,
            },
          ],
          aiSuggestedWinnerId: suggestedWinnerId,
          aiConfidence: confidence,
        },
        update: {},
      });

      return res.json({ analysis });
    } catch (err: any) {
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
