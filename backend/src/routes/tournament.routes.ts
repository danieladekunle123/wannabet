import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const tournamentRouter = Router();

const CreateTournamentSchema = z.object({
  name: z.string().min(3).max(200),
  game: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  entryFee: z.number().min(0).optional(),
  startAt: z.string().optional(),
});

// GET /tournaments
tournamentRouter.get("/", async (req, res) => {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return res.json({ tournaments });
});

// GET /tournaments/:id
tournamentRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { participants: { take: 100 } },
  });
  if (!tournament) return res.status(404).json({ message: "Not found" });
  return res.json({ tournament });
});

// POST /tournaments  (create)
tournamentRouter.post("/", requireAuth, async (req, res) => {
  try {
    const payload = CreateTournamentSchema.parse(req.body);
    const t = await prisma.tournament.create({ data: {
      name: payload.name,
      game: payload.game,
      description: payload.description,
      entryFee: payload.entryFee ?? 0,
      startAt: payload.startAt ? new Date(payload.startAt) : null,
      status: 'open',
    }});
    return res.status(201).json({ tournament: t });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? 'Bad request' });
  }
});

// POST /tournaments/:id/join
tournamentRouter.post('/:id/join', requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id;

  try {
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.entryFee > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < tournament.entryFee) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      await prisma.$transaction(async (tx) => {
        // deduct entry fee
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: tournament.entryFee } } });
        await tx.ledgerEntry.create({ data: { walletId: wallet.id, type: 'TOURNAMENT_ENTRY', amount: -tournament.entryFee } });
        await tx.tournamentEntry.create({ data: { tournamentId: id, userId, paid: true } });
      });

      return res.json({ message: 'Joined and paid' });
    } else {
      // free tournament
      await prisma.tournamentEntry.create({ data: { tournamentId: id, userId, paid: false } });
      return res.json({ message: 'Joined' });
    }
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? 'Bad request' });
  }
});
