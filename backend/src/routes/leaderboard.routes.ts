import { Router } from "express";
import { prisma } from "../lib/prisma";

export const leaderboardRouter = Router();

const TOP_N = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getUserWinsRank(
  userId: string,
  stakeCondition: string,
): Promise<number> {
  const results = await prisma.$queryRawUnsafe<[{ rank: bigint }]>(
    `
    SELECT (COUNT(*) + 1)::bigint AS rank
    FROM (
      SELECT "reportedWinnerId", COUNT(*) AS wins
      FROM "Match"
      WHERE status = 'COMPLETED' AND "reportedWinnerId" IS NOT NULL ${stakeCondition}
      GROUP BY "reportedWinnerId"
    ) all_wins
    WHERE wins > (
      SELECT COUNT(*) FROM "Match"
      WHERE status = 'COMPLETED' AND "reportedWinnerId" = $1 ${stakeCondition}
    )
  `,
    userId,
  );
  return Number(results[0]?.rank ?? 999);
}

async function getUserTournamentWinsRank(userId: string): Promise<number> {
  const results = await prisma.$queryRawUnsafe<[{ rank: bigint }]>(
    `
    SELECT (COUNT(*) + 1)::bigint AS rank
    FROM (
      SELECT "reportedWinnerId", COUNT(*) AS wins
      FROM "TournamentMatch"
      WHERE status = 'COMPLETED' AND "reportedWinnerId" IS NOT NULL
      GROUP BY "reportedWinnerId"
    ) all_wins
    WHERE wins > (
      SELECT COUNT(*) FROM "TournamentMatch"
      WHERE status = 'COMPLETED' AND "reportedWinnerId" = $1
    )
  `,
    userId,
  );
  return Number(results[0]?.rank ?? 999);
}

async function getUserEarningsRank(userId: string): Promise<number> {
  const results = await prisma.$queryRawUnsafe<[{ rank: bigint }]>(
    `
    SELECT (COUNT(*) + 1)::bigint AS rank
    FROM (
      SELECT w."userId", SUM(l.amount) AS total
      FROM "LedgerEntry" l
      JOIN "Wallet" w ON l."walletId" = w.id
      WHERE l.type = 'payout'
      GROUP BY w."userId"
    ) all_earnings
    WHERE total > COALESCE((
      SELECT SUM(l.amount) FROM "LedgerEntry" l
      JOIN "Wallet" w ON l."walletId" = w.id
      WHERE l.type = 'payout' AND w."userId" = $1
    ), 0)
  `,
    userId,
  );
  return Number(results[0]?.rank ?? 999);
}

async function getUserTrustRank(userId: string): Promise<number> {
  const results = await prisma.$queryRawUnsafe<[{ rank: bigint }]>(
    `
    SELECT (COUNT(*) + 1)::bigint AS rank
    FROM "Profile"
    WHERE "trustScore" > COALESCE((
      SELECT "trustScore" FROM "Profile" WHERE "userId" = $1
    ), 100)
  `,
    userId,
  );
  return Number(results[0]?.rank ?? 999);
}

async function fetchUserCard(userId: string) {
  return (prisma as any).user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      profileImageUrl: true,
      avatarUrl: true,
      profile: { select: { trustScore: true, country: true } },
    },
  });
}

// ── GET /leaderboard/wins ─────────────────────────────────────────────────────

leaderboardRouter.get("/wins", async (req, res) => {
  try {
    const type = String(req.query.type || "all") as
      | "all"
      | "wager"
      | "scrim"
      | "custom"
      | "tournament";
    const userId = req.query.userId ? String(req.query.userId) : null;

    // ── Tournament wins (different table) ──────────────────────────────────
    if (type === "tournament") {
      const rows = await (prisma as any).tournamentMatch.groupBy({
        by: ["reportedWinnerId"],
        where: { reportedWinnerId: { not: null }, status: "COMPLETED" },
        _count: { reportedWinnerId: true },
        orderBy: { _count: { reportedWinnerId: "desc" } },
        take: TOP_N,
      });

      const topIds = rows.map((r: any) => r.reportedWinnerId).filter(Boolean);
      const users = await (prisma as any).user.findMany({
        where: { id: { in: topIds } },
        select: {
          id: true,
          username: true,
          profileImageUrl: true,
          avatarUrl: true,
          profile: { select: { trustScore: true, country: true } },
        },
      });
      const uMap = Object.fromEntries(users.map((u: any) => [u.id, u]));

      const ranked = rows
        .filter((r: any) => uMap[r.reportedWinnerId])
        .map((r: any, idx: number) => {
          const u = uMap[r.reportedWinnerId];
          return {
            rank: idx + 1,
            userId: u.id,
            username: u.username,
            profileImageUrl: u.profileImageUrl || u.avatarUrl || null,
            wins: r._count.reportedWinnerId,
            losses: 0,
            trustScore: u.profile?.trustScore ?? 87,
            country: u.profile?.country ?? null,
          };
        });

      let currentUser = null;
      if (userId && !ranked.find((e: any) => e.userId === userId)) {
        const userWins = await (prisma as any).tournamentMatch.count({
          where: { reportedWinnerId: userId, status: "COMPLETED" },
        });
        const userCard = await fetchUserCard(userId);
        if (userCard) {
          const rank =
            userWins > 0 ? await getUserTournamentWinsRank(userId) : 999;
          currentUser = {
            rank,
            userId: userCard.id,
            username: userCard.username,
            profileImageUrl:
              userCard.profileImageUrl || userCard.avatarUrl || null,
            wins: userWins,
            losses: 0,
            trustScore: userCard.profile?.trustScore ?? 87,
            country: userCard.profile?.country ?? null,
          };
        }
      }
      return res.json({ entries: ranked, currentUser });
    }

    // ── Match-based wins ───────────────────────────────────────────────────
    const stakeFilter: any =
      type === "wager"
        ? { stake: { gt: 0 } }
        : type === "scrim" || type === "custom"
          ? { stake: 0 }
          : {};
    const stakeCondition =
      type === "wager"
        ? `AND stake > 0`
        : type === "scrim" || type === "custom"
          ? `AND stake = 0`
          : ``;

    const rows = await (prisma as any).match.groupBy({
      by: ["reportedWinnerId"],
      where: {
        status: "COMPLETED",
        reportedWinnerId: { not: null },
        ...stakeFilter,
      },
      _count: { reportedWinnerId: true },
      orderBy: { _count: { reportedWinnerId: "desc" } },
      take: TOP_N,
    });

    const topIds = rows
      .map((r: any) => r.reportedWinnerId)
      .filter(Boolean) as string[];

    if (!topIds.length) {
      let currentUser = null;
      if (userId) {
        const userCard = await fetchUserCard(userId);
        if (userCard) {
          currentUser = {
            rank: 1,
            userId: userCard.id,
            username: userCard.username,
            profileImageUrl:
              userCard.profileImageUrl || userCard.avatarUrl || null,
            wins: 0,
            losses: 0,
            trustScore: userCard.profile?.trustScore ?? 87,
            country: userCard.profile?.country ?? null,
          };
        }
      }
      return res.json({ entries: [], currentUser });
    }

    const users = await (prisma as any).user.findMany({
      where: { id: { in: topIds } },
      select: {
        id: true,
        username: true,
        profileImageUrl: true,
        avatarUrl: true,
        profile: { select: { trustScore: true, country: true } },
      },
    });
    const uMap = Object.fromEntries(users.map((u: any) => [u.id, u]));

    // Accurate losses: fetch all completed matches involving top users and compute per-user
    const involvingMatches = await (prisma as any).match.findMany({
      where: {
        status: "COMPLETED",
        reportedWinnerId: { not: null },
        OR: [{ hostId: { in: topIds } }, { joinerId: { in: topIds } }],
        ...stakeFilter,
      },
      select: { hostId: true, joinerId: true, reportedWinnerId: true },
    });

    const lossMap: Record<string, number> = {};
    for (const m of involvingMatches) {
      for (const uid of [m.hostId, m.joinerId].filter(Boolean)) {
        if (uid !== m.reportedWinnerId && topIds.includes(uid)) {
          lossMap[uid] = (lossMap[uid] || 0) + 1;
        }
      }
    }

    const ranked = rows
      .filter((r: any) => uMap[r.reportedWinnerId])
      .map((r: any, idx: number) => {
        const u = uMap[r.reportedWinnerId];
        return {
          rank: idx + 1,
          userId: u.id,
          username: u.username,
          profileImageUrl: u.profileImageUrl || u.avatarUrl || null,
          wins: r._count.reportedWinnerId,
          losses: lossMap[u.id] || 0,
          trustScore: u.profile?.trustScore ?? 87,
          country: u.profile?.country ?? null,
        };
      });

    let currentUser = null;
    if (userId && !ranked.find((e: any) => e.userId === userId)) {
      const userCard = await fetchUserCard(userId);
      if (userCard) {
        const userWins = await (prisma as any).match.count({
          where: {
            status: "COMPLETED",
            reportedWinnerId: userId,
            ...stakeFilter,
          },
        });
        const userLosses = await (prisma as any).match.count({
          where: {
            status: "COMPLETED",
            reportedWinnerId: { not: userId },
            OR: [{ hostId: userId }, { joinerId: userId }],
            ...stakeFilter,
          },
        });
        const rank = await getUserWinsRank(userId, stakeCondition);
        currentUser = {
          rank,
          userId: userCard.id,
          username: userCard.username,
          profileImageUrl:
            userCard.profileImageUrl || userCard.avatarUrl || null,
          wins: userWins,
          losses: userLosses,
          trustScore: userCard.profile?.trustScore ?? 87,
          country: userCard.profile?.country ?? null,
        };
      }
    }

    return res.json({ entries: ranked, currentUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load wins leaderboard" });
  }
});

// ── GET /leaderboard/earnings ─────────────────────────────────────────────────

leaderboardRouter.get("/earnings", async (req, res) => {
  try {
    const userId = req.query.userId ? String(req.query.userId) : null;

    const payouts = await (prisma as any).ledgerEntry.groupBy({
      by: ["walletId"],
      where: { type: "payout" },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: TOP_N,
    });

    if (!payouts.length) {
      let currentUser = null;
      if (userId) {
        const card = await fetchUserCard(userId);
        if (card)
          currentUser = {
            rank: 1,
            userId: card.id,
            username: card.username,
            profileImageUrl: card.profileImageUrl || card.avatarUrl || null,
            earningsCents: 0,
            trustScore: card.profile?.trustScore ?? 87,
            country: card.profile?.country ?? null,
          };
      }
      return res.json({ entries: [], currentUser });
    }

    const walletIds = payouts.map((p: any) => p.walletId);
    const wallets = await (prisma as any).wallet.findMany({
      where: { id: { in: walletIds } },
      select: { id: true, userId: true },
    });
    const walletUserMap: Record<string, string> = Object.fromEntries(
      wallets.map((w: any) => [w.id, w.userId]),
    );
    const topUserIds = wallets.map((w: any) => w.userId);

    const users = await (prisma as any).user.findMany({
      where: { id: { in: topUserIds } },
      select: {
        id: true,
        username: true,
        profileImageUrl: true,
        avatarUrl: true,
        profile: { select: { trustScore: true, country: true } },
      },
    });
    const uMap = Object.fromEntries(users.map((u: any) => [u.id, u]));

    const ranked = payouts
      .map((p: any, idx: number) => {
        const uid = walletUserMap[p.walletId];
        const u = uMap[uid];
        if (!u) return null;
        return {
          rank: idx + 1,
          userId: u.id,
          username: u.username,
          profileImageUrl: u.profileImageUrl || u.avatarUrl || null,
          earningsCents: p._sum.amount ?? 0,
          trustScore: u.profile?.trustScore ?? 87,
          country: u.profile?.country ?? null,
        };
      })
      .filter(Boolean);

    let currentUser = null;
    if (userId && !ranked.find((e: any) => e?.userId === userId)) {
      const userCard = await fetchUserCard(userId);
      if (userCard) {
        const wallet = await (prisma as any).wallet.findUnique({
          where: { userId },
          select: { id: true },
        });
        const earningsCents = wallet
          ? ((
              await (prisma as any).ledgerEntry.aggregate({
                where: { walletId: wallet.id, type: "payout" },
                _sum: { amount: true },
              })
            )._sum.amount ?? 0)
          : 0;
        const rank = await getUserEarningsRank(userId);
        currentUser = {
          rank,
          userId: userCard.id,
          username: userCard.username,
          profileImageUrl:
            userCard.profileImageUrl || userCard.avatarUrl || null,
          earningsCents,
          trustScore: userCard.profile?.trustScore ?? 87,
          country: userCard.profile?.country ?? null,
        };
      }
    }

    return res.json({ entries: ranked, currentUser });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to load earnings leaderboard" });
  }
});

// ── GET /leaderboard/trust ────────────────────────────────────────────────────

leaderboardRouter.get("/trust", async (req, res) => {
  try {
    const userId = req.query.userId ? String(req.query.userId) : null;

    const profiles = await (prisma as any).profile.findMany({
      where: { trustScore: { gte: 0 } },
      orderBy: { trustScore: "desc" },
      take: TOP_N,
      select: {
        userId: true,
        trustScore: true,
        country: true,
        user: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
            avatarUrl: true,
          },
        },
      },
    });

    const ranked = profiles.map((p: any, idx: number) => ({
      rank: idx + 1,
      userId: p.user.id,
      username: p.user.username,
      profileImageUrl: p.user.profileImageUrl || p.user.avatarUrl || null,
      trustScore: p.trustScore,
      country: p.country ?? null,
    }));

    let currentUser = null;
    if (userId && !ranked.find((e: any) => e.userId === userId)) {
      const userCard = await fetchUserCard(userId);
      if (userCard) {
        const rank = await getUserTrustRank(userId);
        currentUser = {
          rank,
          userId: userCard.id,
          username: userCard.username,
          profileImageUrl:
            userCard.profileImageUrl || userCard.avatarUrl || null,
          trustScore: userCard.profile?.trustScore ?? 87,
          country: userCard.profile?.country ?? null,
        };
      }
    }

    return res.json({ entries: ranked, currentUser });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to load trust leaderboard" });
  }
});
