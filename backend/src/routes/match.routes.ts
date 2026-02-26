import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const matchRouter = Router();

const CreateMatchSchema = z.object({
  game: z.string().min(2).max(50),
  stake: z.number().positive().max(10000),
});

// POST /matches  (create match + lock escrow)
matchRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { game, stake } = CreateMatchSchema.parse(req.body);
    const userId = req.user!.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, escrow: true },
    });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    if (wallet.balance < stake) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) Create the match
      const match = await tx.match.create({
        data: {
          game,
          stake,
          status: "OPEN",
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
          type: "MATCH_ESCROW_LOCK",
          amount: stake,
        },
      });

      return { match, updatedWallet, entry };
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
      if (match.status !== "OPEN") throw new Error("Match not open");
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

      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: {
          joinerId: userId,
          status: "ACTIVE",
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "ESCROW_LOCK_JOINER",
          amount: match.stake,
        },
      });

      return updatedMatch;
    });

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

    return res.json({ match: updatedMatch });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// POST /matches/:id/confirm
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
            type: "PAYOUT_WIN",
            amount: pot,
          },
          {
            walletId: loserWallet.id,
            type: "PAYOUT_LOSS",
            amount: stake,
          },
        ],
      });

      const completedMatch = await tx.match.update({
        where: { id: matchId },
        data: { status: "COMPLETED" },
      });

      return completedMatch;
    });

    return res.json({ match: result });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});
