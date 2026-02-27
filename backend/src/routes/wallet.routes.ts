import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const walletRouter = Router();

const DepositSchema = z.object({
  amount: z.number().positive().max(10000),
});

const LockSchema = z.object({
  amount: z.number().positive().max(10000),
});

const ReleaseSchema = z.object({
  amount: z.number().positive().max(10000),
});

// POST /wallet/deposit
walletRouter.post("/deposit", requireAuth, async (req, res) => {
  try {
    const { amount } = DepositSchema.parse(req.body);
    const userId = req.user!.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const { updatedWallet, entry } = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
        select: { id: true, balance: true, escrow: true },
      });

      const entry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount,
        },
      });

      return { updatedWallet, entry };
    });

    return res.status(201).json({ wallet: updatedWallet, ledgerEntry: entry });
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
const WithdrawSchema = z.object({
  amount: z.number().positive().max(100000),
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
          type: "WITHDRAW",
          amount: -Math.abs(amount),
        },
      });

      return { updatedWallet, entry };
    });

    return res.status(201).json({ wallet: result.updatedWallet, ledgerEntry: result.entry });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

walletRouter.post("/escrow/lock", requireAuth, async (req, res) => {
  try {
    const { amount } = LockSchema.parse(req.body);
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
          type: "ESCROW_LOCK",
          amount,
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
    const { amount } = ReleaseSchema.parse(req.body);
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
          type: "ESCROW_RELEASE",
          amount,
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
