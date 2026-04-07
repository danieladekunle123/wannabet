import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import {
  cacheGet,
  cacheSet,
  CACHE_KEYS,
  invalidateAllLobbyCaches,
} from "../services/redis";

export const tournamentRouter = Router();

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n >= 4 && (n & (n - 1)) === 0;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRoundName(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber + 1;
  if (fromEnd === 1) return "Grand Final";
  if (fromEnd === 2) return "Semi Finals";
  if (fromEnd === 3) return "Quarter Finals";
  return `Round of ${Math.pow(2, fromEnd)}`;
}

interface MatchBlueprint {
  id: string;
  tournamentId: string;
  roundNumber: number;
  matchIndex: number;
  teamAId: string | null;
  teamBId: string | null;
  status: string;
  nextMatchId: string | null;
  nextMatchSlot: string | null;
}

/** Build bracket from LAST round backwards so nextMatchId can be resolved inline */
function buildSingleElimBracket(
  tTeamIds: string[],
  tournamentId: string,
): MatchBlueprint[] {
  const n = tTeamIds.length;
  const totalRounds = Math.log2(n);
  const matchMap = new Map<number, Map<number, MatchBlueprint>>();
  const allMatches: MatchBlueprint[] = [];

  for (let round = totalRounds; round >= 1; round--) {
    const matchesInRound = Math.round(n / Math.pow(2, round));
    const roundMap = new Map<number, MatchBlueprint>();
    matchMap.set(round, roundMap);

    for (let idx = 0; idx < matchesInRound; idx++) {
      let nextMatchId: string | null = null;
      let nextMatchSlot: string | null = null;
      if (round < totalRounds) {
        const parentRound = round + 1;
        const parentIdx = Math.floor(idx / 2);
        const parentMatch = matchMap.get(parentRound)?.get(parentIdx);
        if (parentMatch) {
          nextMatchId = parentMatch.id;
          nextMatchSlot = idx % 2 === 0 ? "A" : "B";
        }
      }
      const match: MatchBlueprint = {
        id: crypto.randomUUID(),
        tournamentId,
        roundNumber: round,
        matchIndex: idx,
        teamAId: round === 1 ? (tTeamIds[idx * 2] ?? null) : null,
        teamBId: round === 1 ? (tTeamIds[idx * 2 + 1] ?? null) : null,
        status: "pending",
        nextMatchId,
        nextMatchSlot,
      };
      roundMap.set(idx, match);
      allMatches.push(match);
    }
  }
  return allMatches;
}

/** Standard round-robin (circle method) */
function buildRoundRobinBracket(
  tTeamIds: string[],
  tournamentId: string,
): MatchBlueprint[] {
  const teams = [...tTeamIds];
  if (teams.length % 2 !== 0) teams.push("bye");
  const size = teams.length;
  const numRounds = size - 1;
  const allMatches: MatchBlueprint[] = [];

  for (let round = 0; round < numRounds; round++) {
    let matchIdx = 0;
    for (let i = 0; i < size / 2; i++) {
      const teamA = teams[i];
      const teamB = teams[size - 1 - i];
      if (teamA !== "bye" && teamB !== "bye") {
        allMatches.push({
          id: crypto.randomUUID(),
          tournamentId,
          roundNumber: round + 1,
          matchIndex: matchIdx++,
          teamAId: teamA,
          teamBId: teamB,
          status: "pending",
          nextMatchId: null,
          nextMatchSlot: null,
        });
      }
    }
    const last = teams.splice(size - 1, 1)[0];
    teams.splice(1, 0, last);
  }
  return allMatches;
}

// ─── Confirm match + progress winner ─────────────────────────────────────────

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function confirmMatchTx(
  tx: PrismaTx,
  matchId: string,
  winnerId: string,
  scoreA: number | null,
  scoreB: number | null,
) {
  const match = await tx.tournamentMatch.update({
    where: { id: matchId },
    data: { status: "completed", winnerId, scoreA, scoreB },
    select: {
      tournamentId: true,
      nextMatchId: true,
      nextMatchSlot: true,
      teamAId: true,
      teamBId: true,
    },
  });

  // Update round-robin stats
  const t = await tx.tournament.findUnique({
    where: { id: match.tournamentId },
    select: { format: true },
  });
  if (t?.format === "round_robin") {
    const loserId = match.teamAId === winnerId ? match.teamBId : match.teamAId;
    if (loserId) {
      const dA = scoreA ?? 0;
      const dB = scoreB ?? 0;
      const winnerDiff = match.teamAId === winnerId ? dA - dB : dB - dA;
      await tx.tournamentTeam.update({
        where: { id: winnerId },
        data: { wins: { increment: 1 }, scoreDiff: { increment: winnerDiff } },
      });
      await tx.tournamentTeam.update({
        where: { id: loserId },
        data: {
          losses: { increment: 1 },
          scoreDiff: { increment: -winnerDiff },
        },
      });
    }
  }

  // Advance winner
  if (match.nextMatchId) {
    const slot =
      match.nextMatchSlot === "A"
        ? { teamAId: winnerId }
        : { teamBId: winnerId };
    await tx.tournamentMatch.update({
      where: { id: match.nextMatchId },
      data: slot,
    });
    return;
  }

  // No more matches — check if tournament is fully done
  if (t?.format === "round_robin") {
    const rem = await tx.tournamentMatch.count({
      where: { tournamentId: match.tournamentId, status: { not: "completed" } },
    });
    if (rem > 0) return;
  }

  await tx.tournament.update({
    where: { id: match.tournamentId },
    data: { status: "completed" },
  });
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const CreateTournamentSchema = z.object({
  name: z.string().min(3).max(200),
  game: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  entryFee: z.number().min(0).optional(),
  startAt: z.string().optional(),
  format: z
    .enum(["single_elimination", "double_elimination", "round_robin"])
    .optional(),
  teamSize: z.number().int().min(1).optional(),
  maxParticipants: z.number().int().optional(),
  participantCount: z.number().int().optional(),
  region: z.string().max(100).optional(),
  tournamentFormat: z.string().max(50).optional(),
  joinDeadlineAt: z.string().optional(),
});

const SubmitResultSchema = z.object({
  claimedWinnerId: z.string().min(1),
  scoreA: z.number().int().min(0).optional(),
  scoreB: z.number().int().min(0).optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /tournaments
tournamentRouter.get("/", async (_req, res) => {
  try {
    const cached = await cacheGet<any>(CACHE_KEYS.tournaments);
    if (cached) return res.json(cached);

    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        game: true,
        format: true,
        teamSize: true,
        maxParticipants: true,
        entryFee: true,
        status: true,
        startAt: true,
        createdAt: true,
        hostId: true,
        _count: { select: { teamParticipants: true } },
      },
    });
    const result = { tournaments };
    await cacheSet(CACHE_KEYS.tournaments, result, 30);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ message: err.message ?? "Server error" });
  }
});

// GET /tournaments/:id
tournamentRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teamParticipants: {
          include: {
            team: { select: { id: true, name: true, profileImageUrl: true } },
          },
          orderBy: { seed: "asc" },
        },
      },
    });
    if (!tournament) return res.status(404).json({ message: "Not found" });
    return res.json({ tournament });
  } catch (err: any) {
    return res.status(500).json({ message: err.message ?? "Server error" });
  }
});

// GET /tournaments/:id/bracket
tournamentRouter.get("/:id/bracket", async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        game: true,
        format: true,
        teamSize: true,
        maxParticipants: true,
        status: true,
        entryFee: true,
        hostId: true,
        startAt: true,
        createdAt: true,
        teamParticipants: {
          include: {
            team: { select: { id: true, name: true, profileImageUrl: true } },
          },
          orderBy: { seed: "asc" },
        },
        tMatches: {
          orderBy: [{ roundNumber: "asc" }, { matchIndex: "asc" }],
          include: {
            teamA: { include: { team: { select: { id: true, name: true } } } },
            teamB: { include: { team: { select: { id: true, name: true } } } },
            winner: { include: { team: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    if (!tournament) return res.status(404).json({ message: "Not found" });

    const totalRounds =
      tournament.format === "round_robin"
        ? Math.max(...tournament.tMatches.map((m) => m.roundNumber), 0)
        : Math.round(Math.log2(Math.max(tournament.maxParticipants, 2)));

    const roundMap = new Map<
      number,
      {
        roundNumber: number;
        roundName: string;
        matches: typeof tournament.tMatches;
      }
    >();
    for (const match of tournament.tMatches) {
      if (!roundMap.has(match.roundNumber)) {
        roundMap.set(match.roundNumber, {
          roundNumber: match.roundNumber,
          roundName:
            tournament.format === "round_robin"
              ? `Round ${match.roundNumber}`
              : getRoundName(match.roundNumber, totalRounds),
          matches: [],
        });
      }
      roundMap.get(match.roundNumber)!.matches.push(match);
    }

    const rounds = Array.from(roundMap.values()).sort(
      (a, b) => a.roundNumber - b.roundNumber,
    );

    const leaderboard =
      tournament.format === "round_robin"
        ? [...tournament.teamParticipants]
            .sort((a, b) =>
              b.wins !== a.wins ? b.wins - a.wins : b.scoreDiff - a.scoreDiff,
            )
            .map((tp) => ({
              id: tp.id,
              teamId: tp.teamId,
              teamName: tp.team.name,
              wins: tp.wins,
              losses: tp.losses,
              scoreDiff: tp.scoreDiff,
            }))
        : [];

    return res.json({ tournament, rounds, leaderboard });
  } catch (err: any) {
    return res.status(500).json({ message: err.message ?? "Server error" });
  }
});

// POST /tournaments
tournamentRouter.post("/", requireAuth, async (req, res) => {
  try {
    const payload = CreateTournamentSchema.parse(req.body);
    const userId = req.user!.userId;

    const formatMap: Record<string, string> = {
      "single-elim": "single_elimination",
      single_elimination: "single_elimination",
      "double-elim": "double_elimination",
      double_elimination: "double_elimination",
      "round-robin": "round_robin",
      round_robin: "round_robin",
    };
    const format =
      formatMap[payload.format ?? payload.tournamentFormat ?? ""] ??
      "single_elimination";
    const teamSize = payload.teamSize ?? 1;
    const maxParticipants =
      payload.maxParticipants ?? payload.participantCount ?? 8;

    if (!isPowerOfTwo(maxParticipants)) {
      return res
        .status(400)
        .json({ message: "maxParticipants must be a power of 2 (min 4)" });
    }
    if (teamSize < 1) {
      return res.status(400).json({ message: "teamSize must be at least 1" });
    }

    const t = await prisma.tournament.create({
      data: {
        name: payload.name,
        game: payload.game,
        description: payload.description,
        entryFee: payload.entryFee ?? 0,
        startAt: payload.startAt ? new Date(payload.startAt) : null,
        format,
        teamSize,
        maxParticipants,
        hostId: userId,
        status: "upcoming",
      },
    });

    await prisma.playerLog.create({
      data: {
        userId,
        actorId: userId,
        type: "TOURNAMENT_CREATED",
        message: `Created tournament ${t.id}`,
        meta: {
          tournamentId: t.id,
          participantCount: maxParticipants,
          teamSize,
          tournamentFormat: format,
          region: payload.region ?? null,
          joinDeadlineAt: payload.joinDeadlineAt ?? null,
        },
      },
    });

    await invalidateAllLobbyCaches();
    return res.status(201).json({ tournament: t });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// POST /tournaments/:id/teams
tournamentRouter.post("/:id/teams", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { teamId } = z.object({ teamId: z.string().min(1) }).parse(req.body);

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    if (!["upcoming", "open"].includes(tournament.status)) {
      return res
        .status(400)
        .json({ message: "Tournament is not open for registration" });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const isMember =
      team.ownerId === userId || team.members.some((m) => m.userId === userId);
    if (!isMember)
      return res.status(403).json({ message: "Not a member of this team" });

    const ownerInMembers = team.members.some((m) => m.userId === team.ownerId);
    const totalMembers = ownerInMembers
      ? team.members.length
      : team.members.length + 1;
    if (totalMembers < tournament.teamSize) {
      return res.status(400).json({
        message: `Team needs at least ${tournament.teamSize} members (has ${totalMembers})`,
      });
    }

    const currentCount = await prisma.tournamentTeam.count({
      where: { tournamentId: id },
    });
    if (currentCount >= tournament.maxParticipants) {
      return res.status(400).json({ message: "Tournament is full" });
    }

    const entry = await prisma.tournamentTeam.create({
      data: { tournamentId: id, teamId, seed: currentCount + 1 },
      include: { team: { select: { id: true, name: true } } },
    });
    await invalidateAllLobbyCaches();
    return res.status(201).json({ entry });
  } catch (err: any) {
    if ((err as any).code === "P2002")
      return res.status(400).json({ message: "Team is already registered" });
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// DELETE /tournaments/:id/teams/:teamId
tournamentRouter.delete("/:id/teams/:teamId", requireAuth, async (req, res) => {
  try {
    const { id, teamId } = req.params;
    const userId = req.user!.userId;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    if (!["upcoming", "open"].includes(tournament.status)) {
      return res
        .status(400)
        .json({ message: "Cannot leave an ongoing or completed tournament" });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const isTeamMember =
      team.ownerId === userId || team.members.some((m) => m.userId === userId);
    if (!isTeamMember && tournament.hostId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await prisma.tournamentTeam.delete({
      where: { tournamentId_teamId: { tournamentId: id, teamId } },
    });
    await invalidateAllLobbyCaches();
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// POST /tournaments/:id/start
tournamentRouter.post("/:id/start", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { teamParticipants: true },
    });
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    if (tournament.hostId !== userId) {
      return res
        .status(403)
        .json({ message: "Only the host can start the tournament" });
    }
    if (!["upcoming", "open"].includes(tournament.status)) {
      return res
        .status(400)
        .json({ message: "Tournament already started or completed" });
    }
    if (tournament.teamParticipants.length !== tournament.maxParticipants) {
      return res.status(400).json({
        message: `Need exactly ${tournament.maxParticipants} teams (have ${tournament.teamParticipants.length})`,
      });
    }

    const tTeamIds = shuffleArray(
      tournament.teamParticipants.map((tp) => tp.id),
    );
    const matches =
      tournament.format === "round_robin"
        ? buildRoundRobinBracket(tTeamIds, id)
        : buildSingleElimBracket(tTeamIds, id);

    await prisma.$transaction(async (tx) => {
      await tx.tournament.update({
        where: { id },
        data: { status: "ongoing" },
      });
      await tx.tournamentMatch.createMany({ data: matches });
    });

    const updated = await prisma.tournament.findUnique({
      where: { id },
      include: {
        tMatches: { orderBy: [{ roundNumber: "asc" }, { matchIndex: "asc" }] },
      },
    });
    await invalidateAllLobbyCaches();
    return res.json({ tournament: updated });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// POST /tournaments/:id/matches/:matchId/start
tournamentRouter.post(
  "/:id/matches/:matchId/start",
  requireAuth,
  async (req, res) => {
    try {
      const { id, matchId } = req.params;
      const userId = req.user!.userId;

      const match = await prisma.tournamentMatch.findFirst({
        where: { id: matchId, tournamentId: id },
        include: {
          teamA: { include: { team: { include: { members: true } } } },
          teamB: { include: { team: { include: { members: true } } } },
        },
      });
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status !== "pending")
        return res.status(400).json({ message: "Match is not pending" });
      if (!match.teamAId || !match.teamBId) {
        return res
          .status(400)
          .json({ message: "Match participants not yet determined" });
      }

      const tournament = await prisma.tournament.findUnique({ where: { id } });
      const isHost = tournament?.hostId === userId;
      const isTeamA =
        match.teamA?.team.ownerId === userId ||
        match.teamA?.team.members.some((m) => m.userId === userId);
      const isTeamB =
        match.teamB?.team.ownerId === userId ||
        match.teamB?.team.members.some((m) => m.userId === userId);

      if (!isHost && !isTeamA && !isTeamB) {
        return res
          .status(403)
          .json({ message: "Not authorized to start this match" });
      }

      const updated = await prisma.tournamentMatch.update({
        where: { id: matchId },
        data: { status: "ongoing" },
      });
      return res.json({ match: updated });
    } catch (err: any) {
      return res.status(400).json({ message: err.message ?? "Bad request" });
    }
  },
);

// POST /tournaments/:id/matches/:matchId/submit
tournamentRouter.post(
  "/:id/matches/:matchId/submit",
  requireAuth,
  async (req, res) => {
    try {
      const { id, matchId } = req.params;
      const userId = req.user!.userId;
      const payload = SubmitResultSchema.parse(req.body);

      const match = await prisma.tournamentMatch.findFirst({
        where: { id: matchId, tournamentId: id },
        include: {
          teamA: { include: { team: { include: { members: true } } } },
          teamB: { include: { team: { include: { members: true } } } },
        },
      });
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (!["pending", "ongoing"].includes(match.status)) {
        return res
          .status(400)
          .json({ message: "Match is not in a playable state" });
      }
      if (!match.teamAId || !match.teamBId) {
        return res
          .status(400)
          .json({ message: "Match participants not yet determined" });
      }
      if (![match.teamAId, match.teamBId].includes(payload.claimedWinnerId)) {
        return res
          .status(400)
          .json({ message: "claimedWinnerId must be one of the match teams" });
      }

      const tournament = await prisma.tournament.findUnique({ where: { id } });
      const isHost = tournament?.hostId === userId;
      const isTeamA =
        match.teamA?.team.ownerId === userId ||
        match.teamA?.team.members.some((m) => m.userId === userId);
      const isTeamB =
        match.teamB?.team.ownerId === userId ||
        match.teamB?.team.members.some((m) => m.userId === userId);

      if (!isHost && !isTeamA && !isTeamB) {
        return res
          .status(403)
          .json({ message: "Not authorized to submit result" });
      }

      const submitterRole = isHost ? "host" : isTeamA ? "teamA" : "teamB";

      await prisma.tournamentMatchSubmission.upsert({
        where: { matchId_submitterRole: { matchId, submitterRole } },
        create: {
          matchId,
          submittedBy: userId,
          submitterRole,
          claimedWinnerId: payload.claimedWinnerId,
          scoreA: payload.scoreA ?? null,
          scoreB: payload.scoreB ?? null,
        },
        update: {
          submittedBy: userId,
          claimedWinnerId: payload.claimedWinnerId,
          scoreA: payload.scoreA ?? null,
          scoreB: payload.scoreB ?? null,
        },
      });

      if (match.status === "pending") {
        await prisma.tournamentMatch.update({
          where: { id: matchId },
          data: { status: "ongoing" },
        });
      }

      if (isHost) {
        await prisma.$transaction((tx) =>
          confirmMatchTx(
            tx,
            matchId,
            payload.claimedWinnerId,
            payload.scoreA ?? null,
            payload.scoreB ?? null,
          ),
        );
        await invalidateAllLobbyCaches();
        return res.json({
          status: "completed",
          winnerId: payload.claimedWinnerId,
        });
      }

      const submissions = await prisma.tournamentMatchSubmission.findMany({
        where: { matchId, submitterRole: { in: ["teamA", "teamB"] } },
      });

      if (submissions.length >= 2) {
        const a = submissions.find((s) => s.submitterRole === "teamA");
        const b = submissions.find((s) => s.submitterRole === "teamB");

        if (a?.claimedWinnerId === b?.claimedWinnerId) {
          await prisma.$transaction((tx) =>
            confirmMatchTx(
              tx,
              matchId,
              a!.claimedWinnerId,
              a!.scoreA,
              a!.scoreB,
            ),
          );
          await invalidateAllLobbyCaches();
          return res.json({
            status: "completed",
            winnerId: a!.claimedWinnerId,
          });
        }

        await prisma.tournamentMatch.update({
          where: { id: matchId },
          data: { status: "disputed" },
        });
        await invalidateAllLobbyCaches();
        return res.json({ status: "disputed" });
      }

      return res.json({ status: "pending_opponent_submission" });
    } catch (err: any) {
      return res.status(400).json({ message: err.message ?? "Bad request" });
    }
  },
);

// POST /tournaments/:id/matches/:matchId/resolve  (host dispute resolution)
tournamentRouter.post(
  "/:id/matches/:matchId/resolve",
  requireAuth,
  async (req, res) => {
    try {
      const { id, matchId } = req.params;
      const userId = req.user!.userId;
      const { winnerId } = z
        .object({ winnerId: z.string().min(1) })
        .parse(req.body);

      const tournament = await prisma.tournament.findUnique({ where: { id } });
      if (!tournament)
        return res.status(404).json({ message: "Tournament not found" });
      if (tournament.hostId !== userId)
        return res
          .status(403)
          .json({ message: "Only the host can resolve disputes" });

      const match = await prisma.tournamentMatch.findFirst({
        where: { id: matchId, tournamentId: id },
      });
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status !== "disputed")
        return res.status(400).json({ message: "Match is not disputed" });
      if (![match.teamAId, match.teamBId].includes(winnerId)) {
        return res.status(400).json({ message: "Invalid winnerId" });
      }

      await prisma.$transaction((tx) =>
        confirmMatchTx(tx, matchId, winnerId, match.scoreA, match.scoreB),
      );
      await invalidateAllLobbyCaches();
      return res.json({ ok: true, winnerId });
    } catch (err: any) {
      return res.status(400).json({ message: err.message ?? "Bad request" });
    }
  },
);

// POST /tournaments/:id/matches/:matchId/forfeit
tournamentRouter.post(
  "/:id/matches/:matchId/forfeit",
  requireAuth,
  async (req, res) => {
    try {
      const { id, matchId } = req.params;
      const userId = req.user!.userId;

      const match = await prisma.tournamentMatch.findFirst({
        where: { id: matchId, tournamentId: id },
        include: {
          teamA: { include: { team: { include: { members: true } } } },
          teamB: { include: { team: { include: { members: true } } } },
        },
      });
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (!["pending", "ongoing"].includes(match.status)) {
        return res
          .status(400)
          .json({ message: "Cannot forfeit a completed match" });
      }

      const isTeamA =
        match.teamA?.team.ownerId === userId ||
        match.teamA?.team.members.some((m) => m.userId === userId);
      const isTeamB =
        match.teamB?.team.ownerId === userId ||
        match.teamB?.team.members.some((m) => m.userId === userId);

      if (!isTeamA && !isTeamB)
        return res
          .status(403)
          .json({ message: "Not a participant in this match" });

      const winnerId = isTeamA ? match.teamBId : match.teamAId;
      if (!winnerId)
        return res
          .status(400)
          .json({ message: "Opponent slot not yet filled" });

      await prisma.$transaction((tx) =>
        confirmMatchTx(tx, matchId, winnerId, null, null),
      );
      await invalidateAllLobbyCaches();
      return res.json({ ok: true, winnerId });
    } catch (err: any) {
      return res.status(400).json({ message: err.message ?? "Bad request" });
    }
  },
);

// GET /tournaments/:id/leaderboard  (round-robin standings)
tournamentRouter.get("/:id/leaderboard", async (req, res) => {
  try {
    const { id } = req.params;
    const teams = await prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      include: {
        team: { select: { id: true, name: true, profileImageUrl: true } },
      },
      orderBy: [{ wins: "desc" }, { scoreDiff: "desc" }],
    });
    return res.json({ leaderboard: teams });
  } catch (err: any) {
    return res.status(500).json({ message: err.message ?? "Server error" });
  }
});

// PATCH /tournaments/:id  — edit name / startAt (host only, no participants yet)
tournamentRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const payload = z
      .object({
        name: z.string().min(3).max(200).optional(),
        startAt: z.string().nullable().optional(),
      })
      .parse(req.body);

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { teamParticipants: true } } },
    });
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    if (tournament.hostId !== userId)
      return res
        .status(403)
        .json({ message: "Only the host can edit this tournament" });
    if (!["upcoming", "open"].includes(tournament.status))
      return res
        .status(400)
        .json({ message: "Cannot edit an ongoing or completed tournament" });
    if (tournament._count.teamParticipants > 0)
      return res
        .status(400)
        .json({ message: "Cannot edit after participants have joined" });

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.startAt !== undefined && {
          startAt: payload.startAt ? new Date(payload.startAt) : null,
        }),
      },
    });
    await invalidateAllLobbyCaches();
    return res.json({ tournament: updated });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// DELETE /tournaments/:id  — cancel tournament (host only)
// Always allowed when 0 participants; otherwise must still be upcoming/open
tournamentRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { teamParticipants: true } } },
    });
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    if (tournament.hostId !== userId)
      return res
        .status(403)
        .json({ message: "Only the host can cancel this tournament" });
    if (["completed", "cancelled"].includes(tournament.status))
      return res
        .status(400)
        .json({ message: "Tournament is already completed or cancelled" });
    if (
      tournament._count.teamParticipants > 0 &&
      !["upcoming", "open"].includes(tournament.status)
    )
      return res.status(400).json({
        message:
          "Cannot cancel an in-progress tournament that has participants",
      });

    await prisma.tournament.update({
      where: { id },
      data: { status: "cancelled" },
    });
    await invalidateAllLobbyCaches();
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});

// Legacy join (individual user) — kept for backward compat
tournamentRouter.post("/:id/join", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  try {
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    if (tournament.entryFee > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < tournament.entryFee) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: tournament.entryFee },
            escrow: { increment: tournament.entryFee },
          },
        });
        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: "escrow_lock",
            amount: tournament.entryFee,
            tournamentId: id,
          },
        });
        await tx.escrow.create({
          data: {
            userId,
            tournamentId: id,
            amount: tournament.entryFee,
            status: "locked",
          },
        });
        await tx.tournamentEntry.create({
          data: { tournamentId: id, userId, paid: true },
        });
      });
    } else {
      await prisma.tournamentEntry.create({
        data: { tournamentId: id, userId, paid: false },
      });
    }
    await invalidateAllLobbyCaches();
    return res.json({ message: "Joined" });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Bad request" });
  }
});
