import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

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
userRouter.get("/:id", async (req, res) => {
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
