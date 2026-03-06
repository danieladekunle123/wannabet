import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const userRouter = Router();

userRouter.get("/me", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      wallet: {
        select: {
          id: true,
          balance: true,
          escrow: true,
        },
      },
      profile: { select: { displayName: true, bio: true, country: true, level: true, trustScore: true } },
      role: true,
      playerGames: { take: 10, orderBy: { isPrimary: "desc" } },
    },
  });

  res.json({ user });
});

// PATCH /users/me/profile -> update bio/country/level
userRouter.patch("/me/profile", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { bio, country, level, trustScore } = req.body as {
    bio?: string;
    country?: string | null;
    level?: number;
    trustScore?: number;
  };

  // Upsert profile so users without an existing Profile get one created
  const upserted = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      bio: bio ?? "",
      country: country ?? null,
      level: level ?? 1,
      trustScore: trustScore ?? 100,
      displayName: undefined,
    },
    update: { bio, country, level, trustScore },
  });

  return res.json({ profile: upserted });
});

// Public profile: GET /users/:id
// Admin: list users (admin-only)
userRouter.get("/", requireAuth, requireRole('ADMIN'), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 100));
  const skip = (page - 1) * limit;

  const users = await prisma.user.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
      profile: { select: { displayName: true } },
    },
  });

  const total = await prisma.user.count();

  return res.json({ users, meta: { total, page, limit } });
});

// Stats for admin/moderator dashboards
userRouter.get('/stats', requireAuth, requireRole('MODERATOR'), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();

    // Match counts by status
    const matchesByStatus = await prisma.match.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Wallet aggregates
    const escrowAgg = await prisma.wallet.aggregate({ _sum: { escrow: true } });
    const balanceAgg = await prisma.wallet.aggregate({ _sum: { balance: true } });

    return res.json({
      totalUsers,
      matchesByStatus,
      totalEscrow: escrowAgg._sum?.escrow || 0,
      totalWalletBalance: balanceAgg._sum?.balance || 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to compute stats' });
  }
});

// Public profile: GET /users/:id
userRouter.get('/:id', async (req, res) => {
  const id = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      profile: { select: { displayName: true, bio: true, country: true, level: true, trustScore: true } },
      playerGames: { take: 3, orderBy: { isPrimary: "desc" } },
    },
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({ user });
});

// Public lookup by username: GET /users/by-username/:username
userRouter.get('/by-username/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const user = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true, avatarUrl: true, profile: { select: { displayName: true } } } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Lookup failed' });
  }
});

// Friend endpoints
userRouter.post('/:id/friends', requireAuth, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user!.userId;
  if (targetId === userId) return res.status(400).json({ message: 'Cannot friend yourself' });

  try {
    // create mutual friendship (both directions)
    await prisma.friend.create({ data: { userId, friendId: targetId } }).catch(() => null);
    await prisma.friend.create({ data: { userId: targetId, friendId: userId } }).catch(() => null);

    // log friend action
    await prisma.playerLog.create({ data: { userId, actorId: userId, type: 'FRIEND_ADDED', message: `Added friend ${targetId}`, meta: { friendId: targetId } } }).catch(() => null);

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to add friend' });
  }
});

userRouter.get('/me/friends', requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    const friends = await prisma.friend.findMany({ where: { userId }, include: { friend: { select: { id: true, username: true, avatarUrl: true } } } });
    return res.json({ friends: friends.map(f => f.friend) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to list friends' });
  }
});

// Player logs
userRouter.get('/:id/logs', requireAuth, requireRole('MODERATOR'), async (req, res) => {
  const targetId = req.params.id;
  try {
    const logs = await prisma.playerLog.findMany({ where: { userId: targetId }, orderBy: { createdAt: 'desc' }, take: 200 });
    return res.json({ logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

// PlayerGames management for current user
userRouter.get("/me/games", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const games = await prisma.playerGame.findMany({ where: { userId } });
  return res.json({ games });
});

userRouter.post("/me/games", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { game, wins = 0, losses = 0, hours = 0, isPrimary = false } = req.body;

  // upsert by unique(userId, game)
  const pg = await prisma.playerGame.upsert({
    where: { userId_game: { userId, game } },
    update: { wins, losses, hours, isPrimary },
    create: { userId, game, wins, losses, hours, isPrimary },
  });

  return res.status(201).json({ game: pg });
});

userRouter.put("/me/games/:id", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id;
  const data = req.body;

  const pg = await prisma.playerGame.updateMany({ where: { id, userId }, data });
  if (pg.count === 0) return res.status(404).json({ message: "Game not found" });
  const updated = await prisma.playerGame.findUnique({ where: { id } });
  return res.json({ game: updated });
});

userRouter.delete("/me/games/:id", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id;
  const pg = await prisma.playerGame.deleteMany({ where: { id, userId } });
  if (pg.count === 0) return res.status(404).json({ message: "Game not found" });
  return res.json({ ok: true });
});

// PATCH /users/me -> update username and profile.displayName
userRouter.patch("/me", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { username, displayName } = req.body as { username?: string; displayName?: string };

  if (!username && displayName === undefined) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  try {
    let updatedUser: any = null;

    if (username) {
      // update username on user table
      updatedUser = await prisma.user.update({ where: { id: userId }, data: { username } });
    }

    if (displayName !== undefined) {
      // upsert displayName on profile (create profile if missing)
      await prisma.profile.upsert({
        where: { userId },
        create: { userId, displayName },
        update: { displayName },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        profile: { select: { displayName: true, bio: true, country: true, level: true, trustScore: true } },
      },
    });

    return res.json({ user });
  } catch (err: any) {
    // Unique constraint on username
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Username already taken" });
    }
    console.error(err);
    return res.status(500).json({ message: "Failed to update account" });
  }
});

// Admin: change a user's role (grant/revoke admin/moderator)
userRouter.patch("/:id/role", requireAuth, requireRole('ADMIN'), async (req, res) => {
  const id = req.params.id;
  const { role } = req.body as { role?: string };

  if (!role || !['PLAYER', 'MODERATOR', 'ADMIN'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const updated = await prisma.user.update({ where: { id }, data: { role: role as any } });
    return res.json({ user: { id: updated.id, username: updated.username, role: updated.role } });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update role' });
  }
});

// Moderator/Admin: ban a user
userRouter.post('/:id/ban', requireAuth, requireRole('MODERATOR'), async (req, res) => {
  const targetId = req.params.id;
  const moderatorId = req.user!.userId;
  const { reason, expiresAt } = req.body as { reason?: string; expiresAt?: string | null };

  try {
    // create ban record
    const ban = await prisma.ban.create({
      data: {
        userId: targetId,
        moderatorId,
        reason: reason ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      },
    });

    return res.json({ ban });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to create ban' });
  }
});

// Moderator/Admin: unban a user (deactivate active bans)
userRouter.post('/:id/unban', requireAuth, requireRole('MODERATOR'), async (req, res) => {
  const targetId = req.params.id;
  try {
    const updated = await prisma.ban.updateMany({ where: { userId: targetId, active: true }, data: { active: false } });
    return res.json({ ok: true, updated: updated.count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to unban user' });
  }
});

// Moderator/Admin: list bans for a user
userRouter.get('/:id/bans', requireAuth, requireRole('MODERATOR'), async (req, res) => {
  const targetId = req.params.id;
  try {
    const bans = await prisma.ban.findMany({ where: { userId: targetId }, orderBy: { createdAt: 'desc' } });
    return res.json({ bans });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to list bans' });
  }
});
