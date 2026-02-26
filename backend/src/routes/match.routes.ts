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
          playerId: userId,
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
    where: { playerId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return res.json({ matches });
});
