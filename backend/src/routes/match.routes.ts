import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { getConfig } from "../lib/platformConfig";
import { updateTrustScore } from "../lib/trustScore";
import { getIo } from "../lib/socket";
import {
  cacheGet,
  cacheSet,
  CACHE_KEYS,
  invalidateAllLobbyCaches,
  checkRateLimit,
} from "../services/redis";
import logger from "../lib/logger";
import { notificationQueue } from "../jobs/queues";

export const matchRouter = Router();

const CreateMatchSchema = z.object({
  game: z.string().min(2).max(50),
  stake: z.number().min(0).max(10000),
  matchType: z.enum(["scrim", "wager", "custom"]).optional(),
  title: z.string().min(1).max(140).optional(),
  description: z.string().max(2000).optional(),
  participantCount: z.number().int().min(2).max(128).optional(),
  teamSize: z.number().int().min(1).max(20).optional(),
  region: z.string().max(120).optional(),
  tournamentFormat: z.string().max(120).optional(),
  startAt: z.string().optional(),
  joinDeadlineAt: z.string().optional(),
  privateMatch: z.boolean().optional(),
});

// POST /matches  (create match + lock escrow)
matchRouter.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { allowed } = await checkRateLimit(`rate:match:${userId}`, 10);
    if (!allowed) {
      res.setHeader("Retry-After", "60");
      return res
        .status(429)
        .json({ message: "Too many match creations. Try again later." });
    }

    const {
      game,
      stake,
      matchType,
      title,
      description,
      participantCount,
      teamSize,
      region,
      tournamentFormat,
      startAt,
      joinDeadlineAt,
      privateMatch,
    } = CreateMatchSchema.parse(req.body);

    const parsedStartAt = startAt ? new Date(startAt) : null;
    const parsedJoinDeadlineAt = joinDeadlineAt
      ? new Date(joinDeadlineAt)
      : null;
    const normalizedStartAt =
      parsedStartAt && !Number.isNaN(parsedStartAt.getTime())
        ? parsedStartAt.toISOString()
        : null;
    const normalizedJoinDeadlineAt =
      parsedJoinDeadlineAt && !Number.isNaN(parsedJoinDeadlineAt.getTime())
        ? parsedJoinDeadlineAt.toISOString()
        : null;
    const normalizedMatchType = matchType || (stake > 0 ? "wager" : "scrim");

    // Enforce platform config rules
    const config = await getConfig();

    if (stake > 0 && stake < config.minWagerAmount) {
      return res.status(400).json({
        message: `Minimum wager amount is $${config.minWagerAmount}`,
      });
    }
    if (stake > config.maxWagerAmount) {
      return res.status(400).json({
        message: `Maximum wager amount is $${config.maxWagerAmount}`,
      });
    }

    // Trust score check
    if (config.trustScoreThreshold > 0) {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { trustScore: true },
      });
      if ((profile?.trustScore ?? 87) < config.trustScoreThreshold) {
        return res.status(403).json({
          message: `Your trust score is too low to create matches. Minimum required: ${config.trustScoreThreshold}%`,
        });
      }
    }

    // Max active matches check
    const activeMatchCount = await prisma.match.count({
      where: {
        hostId: userId,
        status: {
          notIn: [
            "finished",
            "completed",
            "cancelled",
            "COMPLETED",
            "CANCELLED",
          ],
        },
      },
    });
    if (activeMatchCount >= config.maxActiveMatchesPerUser) {
      return res.status(400).json({
        message: `You have reached the maximum of ${config.maxActiveMatchesPerUser} active matches`,
      });
    }
    const wallet = await prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: 0, escrow: 0 },
      update: {},
      select: { id: true, balance: true, escrow: true },
    });

    if (wallet.balance < stake) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) Create the match
      const match = await tx.match.create({
        data: {
          game,
          stake,
          status: "UPCOMING",
          hostId: userId,
        },
        select: {
          id: true,
          game: true,
          stake: true,
          status: true,
          createdAt: true,
        },
      });

      // 2) Lock stake into escrow
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: stake },
          escrow: { increment: stake },
        },
        select: { id: true, balance: true, escrow: true },
      });

      // 3) Ledger entry
      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "escrow_lock",
          amount: stake,
          matchId: match.id,
        },
      });

      // 4) Escrow record
      if (stake > 0) {
        await tx.escrow.create({
          data: {
            userId,
            matchId: match.id,
            amount: stake,
            status: "locked",
          },
        });
      }

      return { match, updatedWallet, entry };
    });

    // create player log for host
    try {
      await prisma.playerLog.create({
        data: {
          userId: userId,
          actorId: userId,
          type: "MATCH_CREATED",
          message: `Created ${normalizedMatchType} match ${result.match.id} (${game}) for $${stake}`,
          meta: {
            matchId: result.match.id,
            game,
            stake,
            matchType: normalizedMatchType,
            title: title || `${game} Match`,
            description: description || "",
            participantCount: participantCount || 2,
            teamSize: teamSize || 1,
            region: region || "Global",
            tournamentFormat: tournamentFormat || null,
            startAt: normalizedStartAt,
            joinDeadlineAt: normalizedJoinDeadlineAt,
            privateMatch: Boolean(privateMatch),
          },
        },
      });
    } catch (err) {
      console.error("failed to create player log", err);
    }

    await invalidateAllLobbyCaches();
    logger.info("Match created", {
      userId,
      matchId: result.match.id,
      game,
      stake,
      matchType: normalizedMatchType,
    });
    return res.status(201).json({
      match: result.match,
      wallet: result.updatedWallet,
      ledgerEntry: result.entry,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// GET /matches/featured  (most popular open match by stake — public)
matchRouter.get("/featured", async (_req, res) => {
  try {
    const cached = await cacheGet<any>(CACHE_KEYS.matchFeatured);
    if (cached) return res.json(cached);

    const match = await prisma.match.findFirst({
      where: { status: { in: ["OPEN", "UPCOMING"] }, joinerId: null },
      orderBy: { stake: "desc" },
      select: {
        id: true,
        game: true,
        stake: true,
        status: true,
        createdAt: true,
        host: { select: { username: true } },
      },
    });
    const result = { match: match ?? null };
    await cacheSet(CACHE_KEYS.matchFeatured, result, 30);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ message: err.message ?? "Server error" });
  }
});

// GET /matches/mine  (my matches)
matchRouter.get("/mine", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const matches = await prisma.match.findMany({
    where: { OR: [{ hostId: userId }, { joinerId: userId }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return res.json({ matches });
});

// POST /matches/:id/join
matchRouter.post("/:id/join", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const matchId = req.params.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
      });

      if (!match) throw new Error("Match not found");
      if (!["OPEN", "UPCOMING"].includes(match.status)) {
        throw new Error("Match not open");
      }
      if (match.hostId === userId)
        throw new Error("Host cannot join own match");
      if (match.joinerId) throw new Error("Match already has a joiner");

      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet || wallet.balance < match.stake) {
        throw new Error("Insufficient balance");
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: match.stake },
          escrow: { increment: match.stake },
        },
      });

      // create player log for joiner inside transaction
      await tx.playerLog.create({
        data: {
          userId: userId,
          actorId: userId,
          type: "MATCH_JOINED",
          message: `Joined match ${matchId}`,
          meta: { matchId },
        },
      });

      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          joinerId: userId,
          status: "UPCOMING",
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "escrow_lock",
          amount: match.stake,
          matchId,
        },
      });

      // Escrow record for joiner
      if (match.stake > 0) {
        await tx.escrow.create({
          data: {
            userId,
            matchId,
            amount: match.stake,
            status: "locked",
          },
        });
      }

      return updatedMatch;
    });

    // Notify the host that someone joined their match
    try {
      const joiner = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      await notificationQueue.add(
        "match-joined",
        {
          userId: result.hostId,
          notification: {
            id: `match-join-${result.id}-${Date.now()}`,
            type: "match-joined",
            title: "Someone joined your match",
            body: `${joiner?.username ?? "A player"} joined your ${result.game} match`,
            timestamp: new Date().toISOString(),
            data: { matchId: result.id, game: result.game },
          },
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        },
      );
    } catch {
      // notification queue failure is non-fatal
    }

    await invalidateAllLobbyCaches();
    res.status(200).json({ match: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// POST /matches/:id/report
matchRouter.post("/:id/report", requireAuth, async (req, res) => {
  try {
    const matchId = req.params.id;
    const reporterId = req.user!.userId;
    const { winnerId } = req.body as { winnerId: string };

    if (!winnerId) {
      return res.status(400).json({ message: "winnerId is required" });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    if (match.status !== "ACTIVE") {
      return res.status(400).json({ message: "Match is not active" });
    }

    if (reporterId !== match.hostId && reporterId !== match.joinerId) {
      return res.status(403).json({ message: "Not a match participant" });
    }

    if (winnerId !== match.hostId && winnerId !== match.joinerId) {
      return res.status(400).json({ message: "Invalid winnerId" });
    }

    if (match.reportedById) {
      return res.status(400).json({ message: "Result already reported" });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        reportedWinnerId: winnerId,
        reportedById: reporterId,
        status: "RESULT_REPORTED",
      },
      select: {
        id: true,
        status: true,
        reportedWinnerId: true,
        reportedById: true,
      },
    });

    // log report action for reporter
    try {
      await prisma.playerLog.create({
        data: {
          userId: reporterId,
          actorId: reporterId,
          type: "MATCH_REPORTED",
          message: `Reported result for match ${matchId}; reported winner ${winnerId}`,
          meta: { matchId, reportedWinnerId: winnerId },
        },
      });
    } catch (err) {
      console.error("failed to create player log", err);
    }

    await invalidateAllLobbyCaches();
    logger.info("Match result reported", {
      userId: reporterId,
      matchId,
      reportedWinnerId: winnerId,
    });
    return res.json({ match: updatedMatch });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// POST /matches/:id/confirm
// DELETE /matches/:id  — cancel match (host only, no joiner, refunds escrow)
matchRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.user!.userId;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.hostId !== userId)
      return res
        .status(403)
        .json({ message: "Only the host can cancel this match" });
    if (match.joinerId)
      return res.status(400).json({
        message: "Cannot cancel a match that already has a participant",
      });
    if (
      ["COMPLETED", "CANCELLED", "completed", "cancelled"].includes(
        match.status,
      )
    )
      return res
        .status(400)
        .json({ message: "Match is already completed or cancelled" });

    await prisma.$transaction(async (tx) => {
      // Refund host escrow back to balance
      if (match.stake > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              escrow: { decrement: match.stake },
              balance: { increment: match.stake },
            },
          });
          await tx.ledgerEntry.create({
            data: {
              walletId: wallet.id,
              type: "escrow_refund",
              amount: match.stake,
              matchId,
            },
          });
        }
        await tx.escrow.updateMany({
          where: { matchId, status: "locked" },
          data: { status: "refunded" },
        });
      }
      await tx.match.update({
        where: { id: matchId },
        data: { status: "CANCELLED" },
      });
    });

    await invalidateAllLobbyCaches();
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

matchRouter.post("/:id/confirm", requireAuth, async (req, res) => {
  try {
    const matchId = req.params.id;
    const confirmerId = req.user!.userId;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    if (match.status !== "RESULT_REPORTED") {
      return res
        .status(400)
        .json({ message: "Match not awaiting confirmation" });
    }

    if (confirmerId !== match.hostId && confirmerId !== match.joinerId) {
      return res.status(403).json({ message: "Not a match participant" });
    }

    if (confirmerId === match.reportedById) {
      return res
        .status(400)
        .json({ message: "Reporter cannot confirm result" });
    }

    const winnerId = match.reportedWinnerId!;
    const loserId = winnerId === match.hostId ? match.joinerId! : match.hostId;

    const stake = match.stake;
    const pot = stake * 2;

    const result = await prisma.$transaction(async (tx) => {
      const winnerWallet = await tx.wallet.findUnique({
        where: { userId: winnerId },
      });

      const loserWallet = await tx.wallet.findUnique({
        where: { userId: loserId },
      });

      if (!winnerWallet || !loserWallet) {
        throw new Error("Wallet not found");
      }

      // Winner payout
      await tx.wallet.update({
        where: { id: winnerWallet.id },
        data: {
          escrow: { decrement: stake },
          balance: { increment: pot },
        },
      });

      // Loser escrow release
      await tx.wallet.update({
        where: { id: loserWallet.id },
        data: {
          escrow: { decrement: stake },
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            walletId: winnerWallet.id,
            type: "payout",
            amount: pot,
            matchId,
          },
          {
            walletId: loserWallet.id,
            type: "payout",
            amount: -stake,
            matchId,
          },
        ],
      });

      // Release all escrow rows for this match
      await tx.escrow.updateMany({
        where: { matchId, status: "locked" },
        data: { status: "released" },
      });

      const completedMatch = await tx.match.update({
        where: { id: matchId },
        data: { status: "COMPLETED" },
      });

      // log completion and payout for winner and loser
      await tx.playerLog.createMany({
        data: [
          {
            userId: winnerId,
            actorId: confirmerId,
            type: "MATCH_WON",
            message: `Won match ${matchId} and received $${pot}`,
            meta: { matchId, amount: pot },
          },
          {
            userId: loserId,
            actorId: confirmerId,
            type: "MATCH_LOST",
            message: `Lost match ${matchId}`,
            meta: { matchId, amount: stake },
          },
        ],
      });

      return completedMatch;
    });

    // Both the reporter and the confirmer agreed on the correct result → reward honesty
    // Fire-and-forget; failures are logged internally but must not affect the response
    // Zero-stake (scrim/free) matches do not award trust — only penalise on disputes
    const reporterId = match.reportedById!;
    if (match.stake > 0) {
      void Promise.all([
        updateTrustScore(reporterId, "CORRECT_SUBMISSION", matchId),
        updateTrustScore(confirmerId, "CORRECT_SUBMISSION", matchId),
      ]);
    }

    await invalidateAllLobbyCaches();
    logger.info("Match confirmed & completed", {
      userId: confirmerId,
      matchId,
      winnerId,
      loserId,
      payout: pot,
    });
    return res.json({ match: result });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});
