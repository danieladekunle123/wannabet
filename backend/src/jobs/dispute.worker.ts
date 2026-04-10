import { Worker } from "bullmq";
import OpenAI from "openai";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import logger from "../lib/logger";
import { connection } from "./queues";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface DisputeJobData {
  disputeId: string;
}

interface DisputeFeatures {
  reporterTrustScore: number;
  reportedTrustScore: number;
  reporterDisputeCount: number;
  reportedDisputeCount: number;
  reporterWinRate: number;
  reportedWinRate: number;
  bothSubmittedSame: boolean;
  reporterSubmittedFirst: boolean;
  submissionDelayMinutes: number;
  matchStake: number;
}

function computeConfidenceScore(features: DisputeFeatures) {
  const breakdown: Record<string, number> = {};
  let reporterWeight = 0;

  const trustDiff = features.reporterTrustScore - features.reportedTrustScore;
  const trustScore = Math.max(-40, Math.min(40, trustDiff * 0.4));
  breakdown.trustDifferential = trustScore;
  reporterWeight += trustScore;

  const historyScore = Math.min(20, features.reportedDisputeCount * 2.5);
  breakdown.reportedDisputeHistory = historyScore;
  reporterWeight += historyScore;

  const reporterHistPenalty = Math.min(15, features.reporterDisputeCount * 1.5);
  breakdown.reporterHistoryPenalty = -reporterHistPenalty;
  reporterWeight -= reporterHistPenalty;

  const speedScore = features.reporterSubmittedFirst
    ? Math.max(0, 10 - features.submissionDelayMinutes * 0.5)
    : 0;
  breakdown.submissionSpeed = speedScore;
  reporterWeight += speedScore;

  if (features.bothSubmittedSame) {
    breakdown.agreement = 20;
    reporterWeight += 20;
  } else {
    breakdown.agreement = 0;
  }

  const winRateDiff = features.reporterWinRate - features.reportedWinRate;
  const winRateScore = Math.max(-5, Math.min(5, winRateDiff * 0.05));
  breakdown.winRateDifferential = winRateScore;
  reporterWeight += winRateScore;

  const rawConfidence = 50 + reporterWeight;
  const confidence = Math.max(5, Math.min(99, rawConfidence));
  const suggestReporterId = confidence >= 50;

  return { score: confidence, suggestReporterId, breakdown };
}

function calcWinRate(
  matches: { reportedWinnerId: string | null }[],
  uid: string,
) {
  if (!matches.length) return 50;
  const wins = matches.filter((m) => m.reportedWinnerId === uid).length;
  return Math.round((wins / matches.length) * 100);
}

async function processDispute(disputeId: string) {
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

  if (!dispute) throw new Error(`Dispute ${disputeId} not found`);

  // Skip if already analysed
  const existing = await (prisma as any).disputeAnalysis.findUnique({
    where: { disputeId },
  });
  if (existing) {
    logger.info("Dispute analysis already exists, skipping", { disputeId });
    return existing;
  }

  const match = dispute.match;
  const reporter = dispute.disputant;
  const reporterId = reporter.id;
  const reportedId =
    match.hostId === reporterId ? match.joinerId : match.hostId;
  const reportedUser = match.hostId === reporterId ? match.joiner : match.host;

  const [reporterDisputeCount, reportedDisputeCount] = await Promise.all([
    (prisma as any).dispute.count({ where: { disputantId: reporterId } }),
    (prisma as any).dispute.count({ where: { disputantId: reportedId } }),
  ]);

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
    submissionDelayMinutes: 5,
    matchStake: match.stake,
  };

  const {
    score: confidence,
    suggestReporterId: suggestsReporter,
    breakdown,
  } = computeConfidenceScore(features);

  const suggestedWinnerId = suggestsReporter ? reporterId : reportedId;

  // OpenAI analysis
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
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    if (parsed.reasoning) aiReasoning = parsed.reasoning;
    if (Array.isArray(parsed.evidenceSummary))
      aiEvidence = parsed.evidenceSummary;
  } catch (aiErr) {
    logger.error("OpenAI call failed in dispute worker, using fallback", {
      disputeId,
      error: (aiErr as Error).message,
    });
  }

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

  return analysis;
}

export function startDisputeWorker() {
  const worker = new Worker<DisputeJobData>(
    "dispute-processing",
    async (job) => {
      logger.info("Dispute job started", {
        jobId: job.id,
        disputeId: job.data.disputeId,
      });

      const result = await processDispute(job.data.disputeId);

      logger.info("Dispute job completed", {
        jobId: job.id,
        disputeId: job.data.disputeId,
      });

      return result;
    },
    {
      connection,
      concurrency: 2,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error("Dispute job failed", {
      jobId: job?.id,
      disputeId: job?.data?.disputeId,
      error: err.message,
      attempt: job?.attemptsMade,
    });
  });

  worker.on("error", (err) => {
    logger.error("Dispute worker error", { error: err.message });
  });

  logger.info("Dispute processing worker started");
  return worker;
}
