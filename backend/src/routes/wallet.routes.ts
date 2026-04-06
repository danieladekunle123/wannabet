import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { createPaymentIntent } from "../services/stripeService";

export const walletRouter = Router();

// POST /wallet/deposit
// Creates a Stripe PaymentIntent. Frontend uses client_secret to confirm payment.
// Wallet balance is credited by the Stripe webhook (or /stripe/confirm-payment in dev).
const DepositSchema = z.object({
  // amount in CENTS — must be integer, 50¢ minimum, $10,000 maximum
  amount: z.number().int().min(50).max(1_000_000),
});

walletRouter.post("/deposit", requireAuth, async (req, res) => {
  try {
    const { amount } = DepositSchema.parse(req.body);
    const userId = req.user!.userId;

    const intent = await createPaymentIntent(userId, amount);
    return res.json({ clientSecret: intent.client_secret, id: intent.id });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// GET /wallet  -> current user's wallet summary
walletRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true, balance: true, escrow: true },
  });

  if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  return res.json({ wallet });
});

// POST /wallet/withdraw
// amount in CENTS — deducted atomically with ledger entry.
const WithdrawSchema = z.object({
  amount: z.number().int().min(1).max(10_000_000),
});

walletRouter.post("/withdraw", requireAuth, async (req, res) => {
  try {
    const { amount } = WithdrawSchema.parse(req.body);
    const userId = req.user!.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, escrow: true },
    });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
        select: { id: true, balance: true, escrow: true },
      });

      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "withdrawal",
          amount: -Math.abs(amount),
        },
      });

      return { updatedWallet, entry };
    });

    return res
      .status(201)
      .json({ wallet: result.updatedWallet, ledgerEntry: result.entry });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

const LockSchema = z.object({
  amount: z.number().int().min(1),
  matchId: z.string().optional(),
  tournamentId: z.string().optional(),
});

const ReleaseSchema = z.object({
  amount: z.number().int().min(1),
  matchId: z.string().optional(),
  tournamentId: z.string().optional(),
});

walletRouter.post("/escrow/lock", requireAuth, async (req, res) => {
  try {
    const { amount, matchId, tournamentId } = LockSchema.parse(req.body);
    const userId = req.user!.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, escrow: true },
    });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          escrow: { increment: amount },
        },
        select: { id: true, balance: true, escrow: true },
      });

      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "escrow_lock",
          amount,
          matchId: matchId ?? null,
          tournamentId: tournamentId ?? null,
        },
      });

      // Create Escrow record tied to the match or tournament
      if (matchId || tournamentId) {
        await tx.escrow.create({
          data: {
            userId,
            amount,
            status: "locked",
            matchId: matchId ?? null,
            tournamentId: tournamentId ?? null,
          },
        });
      }

      return { updatedWallet, entry };
    });

    return res.status(201).json({
      wallet: result.updatedWallet,
      ledgerEntry: result.entry,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// GET /wallet/ledger
walletRouter.get("/ledger", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  const entries = await prisma.ledgerEntry.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return res.json({ entries });
});

walletRouter.post("/escrow/release", requireAuth, async (req, res) => {
  try {
    const { amount, matchId, tournamentId } = ReleaseSchema.parse(req.body);
    const userId = req.user!.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, escrow: true },
    });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    if (wallet.escrow < amount) {
      return res.status(400).json({ message: "Insufficient escrow" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          escrow: { decrement: amount },
          balance: { increment: amount },
        },
        select: { id: true, balance: true, escrow: true },
      });

      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "refund",
          amount,
          matchId: matchId ?? null,
          tournamentId: tournamentId ?? null,
        },
      });

      return { updatedWallet, entry };
    });

    return res.status(201).json({
      wallet: result.updatedWallet,
      ledgerEntry: result.entry,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});
