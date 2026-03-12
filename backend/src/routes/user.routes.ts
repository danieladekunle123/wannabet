import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { FriendRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

export const userRouter = Router();

const getSortedUserPair = (firstId: string, secondId: string) => {
  return [firstId, secondId].sort() as [string, string];
};

const findBlockBetweenUsers = async (firstId: string, secondId: string) => {
  return prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: firstId, blockedId: secondId },
        { blockerId: secondId, blockedId: firstId },
      ],
    },
    select: { id: true, blockerId: true, blockedId: true },
  });
};

const profileUploadDir = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

const allowedProfileImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const mimeToExtension: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, profileUploadDir),
    filename: (_req, file, cb) => {
      const originalExt = path.extname(file.originalname || "").toLowerCase();
      const mimeExt = mimeToExtension[file.mimetype] || "";
      const safeExt = originalExt || mimeExt || ".jpg";
      const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      cb(null, `${baseName}${safeExt}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedProfileImageMimeTypes.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }

    cb(null, true);
  },
});

userRouter.get("/me", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      profileImageUrl: true,
      hasCompletedOnboarding: true,
      createdAt: true,
      wallet: {
        select: {
          id: true,
          balance: true,
          escrow: true,
        },
      },
      profile: {
        select: {
          displayName: true,
          bio: true,
          country: true,
          level: true,
          trustScore: true,
        },
      },
      role: true,
      playerGames: { take: 10, orderBy: { isPrimary: "desc" } },
    },
  });

  res.json({ user });
});

userRouter.patch("/me/onboarding", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        profileImageUrl: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            bio: true,
            country: true,
            level: true,
            trustScore: true,
          },
        },
        wallet: { select: { id: true, balance: true, escrow: true } },
        role: true,
      },
    });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to update onboarding status" });
  }
});

userRouter.post("/me/profile-image/upload", requireAuth, (req, res) => {
  profileUpload.single("file")(req, res, async (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "Profile image must be 15MB or smaller" });
      }
      return res
        .status(400)
        .json({ message: err?.message || "Invalid upload" });
    }

    const userId = req.user!.userId;

    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const normalizedPath = file.path.replace(/\\/g, "/");
      const uploadsIndex = normalizedPath.indexOf("/uploads/");
      const relativePath =
        uploadsIndex >= 0
          ? normalizedPath.slice(uploadsIndex + 1)
          : `uploads/profiles/${file.filename}`;
      const profileImageUrl = `/${relativePath}`;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { profileImageUrl, avatarUrl: profileImageUrl },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          profileImageUrl: true,
          createdAt: true,
          profile: {
            select: {
              displayName: true,
              bio: true,
              country: true,
              level: true,
              trustScore: true,
            },
          },
          wallet: { select: { id: true, balance: true, escrow: true } },
          role: true,
        },
      });

      return res.json({ user, profileImageUrl });
    } catch (uploadErr) {
      console.error(uploadErr);
      return res
        .status(500)
        .json({ message: "Failed to upload profile image" });
    }
  });
});

userRouter.patch("/me/profile-image", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { profileImageUrl } = req.body as { profileImageUrl?: string | null };

  if (profileImageUrl !== null && typeof profileImageUrl !== "string") {
    return res
      .status(400)
      .json({ message: "profileImageUrl must be a string or null" });
  }

  const trimmed =
    typeof profileImageUrl === "string" ? profileImageUrl.trim() : null;
  const finalUrl = trimmed || null;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: finalUrl, avatarUrl: finalUrl },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        profileImageUrl: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            bio: true,
            country: true,
            level: true,
            trustScore: true,
          },
        },
        wallet: { select: { id: true, balance: true, escrow: true } },
        role: true,
      },
    });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update profile image" });
  }
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
userRouter.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 100));
  const skip = (page - 1) * limit;

  const users = await prisma.user.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
      profileImageUrl: true,
      profile: { select: { displayName: true } },
    },
  });

  const total = await prisma.user.count();

  return res.json({ users, meta: { total, page, limit } });
});

// Stats for admin/moderator dashboards
userRouter.get(
  "/stats",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    try {
      const totalUsers = await prisma.user.count();

      // Match counts by status
      const matchesByStatus = await prisma.match.groupBy({
        by: ["status"],
        _count: { status: true },
      });

      // Wallet aggregates
      const escrowAgg = await prisma.wallet.aggregate({
        _sum: { escrow: true },
      });
      const balanceAgg = await prisma.wallet.aggregate({
        _sum: { balance: true },
      });

      return res.json({
        totalUsers,
        matchesByStatus,
        totalEscrow: escrowAgg._sum?.escrow || 0,
        totalWalletBalance: balanceAgg._sum?.balance || 0,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to compute stats" });
    }
  },
);

// Friend endpoints
userRouter.post("/:id/friends", requireAuth, async (req, res) => {
  const targetId = String(req.params.id || "");
  const userId = req.user!.userId;
  if (!targetId)
    return res.status(400).json({ message: "Missing target user" });
  if (targetId === userId)
    return res.status(400).json({ message: "Cannot friend yourself" });

  try {
    const targetExists = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!targetExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const block = await findBlockBetweenUsers(userId, targetId);
    if (block) {
      return res.status(403).json({
        message:
          block.blockerId === userId
            ? "Unblock this user before adding them as a friend"
            : "This user has blocked you",
      });
    }

    await prisma.friend
      .create({ data: { userId, friendId: targetId } })
      .catch(() => null);
    await prisma.friend
      .create({ data: { userId: targetId, friendId: userId } })
      .catch(() => null);

    await prisma.playerLog
      .create({
        data: {
          userId,
          actorId: userId,
          type: "FRIEND_ADDED",
          message: `Added friend ${targetId}`,
          meta: { friendId: targetId },
        },
      })
      .catch(() => null);

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to add friend" });
  }
});

userRouter.delete("/:id/friends", requireAuth, async (req, res) => {
  const targetId = String(req.params.id || "");
  const userId = req.user!.userId;
  if (!targetId)
    return res.status(400).json({ message: "Missing target user" });
  if (targetId === userId)
    return res.status(400).json({ message: "Cannot remove yourself" });

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const forward = await tx.friend.deleteMany({
        where: { userId, friendId: targetId },
      });
      const reverse = await tx.friend.deleteMany({
        where: { userId: targetId, friendId: userId },
      });
      return forward.count + reverse.count;
    });

    return res.json({ ok: true, removed: deleted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to remove friend" });
  }
});

userRouter.get("/:id/friendship-status", requireAuth, async (req, res) => {
  const targetUserId = String(req.params.id || "");
  const userId = req.user!.userId;

  if (!targetUserId)
    return res.status(400).json({ message: "Missing target user" });
  if (targetUserId === userId) {
    return res.json({
      isFriend: false,
      outgoingRequest: false,
      incomingRequest: false,
      blockedByYou: false,
      blockedYou: false,
      requestId: null,
    });
  }

  const [friend, outgoing, incoming, block] = await Promise.all([
    prisma.friend.findFirst({
      where: { userId, friendId: targetUserId },
      select: { id: true },
    }),
    prisma.friendRequest.findFirst({
      where: {
        senderId: userId,
        recipientId: targetUserId,
        status: FriendRequestStatus.pending,
      },
      select: { id: true },
    }),
    prisma.friendRequest.findFirst({
      where: {
        senderId: targetUserId,
        recipientId: userId,
        status: FriendRequestStatus.pending,
      },
      select: { id: true },
    }),
    findBlockBetweenUsers(userId, targetUserId),
  ]);

  return res.json({
    isFriend: Boolean(friend),
    outgoingRequest: Boolean(outgoing),
    incomingRequest: Boolean(incoming),
    blockedByYou: block?.blockerId === userId,
    blockedYou: block?.blockerId === targetUserId,
    requestId: outgoing?.id || incoming?.id || null,
  });
});

userRouter.post("/:id/friend-requests", requireAuth, async (req, res) => {
  const recipientId = String(req.params.id || "");
  const senderId = req.user!.userId;

  if (!recipientId)
    return res.status(400).json({ message: "Missing recipient" });
  if (recipientId === senderId) {
    return res
      .status(400)
      .json({ message: "Cannot send friend request to yourself" });
  }

  try {
    const recipientExists = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });
    if (!recipientExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const block = await findBlockBetweenUsers(senderId, recipientId);
    if (block) {
      return res.status(403).json({
        message:
          block.blockerId === senderId
            ? "Unblock this user before sending a friend request"
            : "This user has blocked you",
      });
    }

    const existingFriend = await prisma.friend.findFirst({
      where: { userId: senderId, friendId: recipientId },
      select: { id: true },
    });
    if (existingFriend) {
      return res.status(409).json({ message: "You are already friends" });
    }

    const incomingPending = await prisma.friendRequest.findFirst({
      where: {
        senderId: recipientId,
        recipientId: senderId,
        status: FriendRequestStatus.pending,
      },
      select: { id: true },
    });

    if (incomingPending) {
      return res
        .status(409)
        .json({
          message:
            "This user already sent you a request. Accept it from Requests.",
        });
    }

    const request = await prisma.friendRequest.upsert({
      where: { senderId_recipientId: { senderId, recipientId } },
      create: { senderId, recipientId, status: FriendRequestStatus.pending },
      update: { status: FriendRequestStatus.pending },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ request });
  } catch (err) {
    console.error(err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003") {
        return res.status(400).json({ message: "Invalid recipient user" });
      }
    }
    return res.status(500).json({ message: "Failed to send friend request" });
  }
});

userRouter.delete("/:id/friend-requests", requireAuth, async (req, res) => {
  const recipientId = String(req.params.id || "");
  const senderId = req.user!.userId;

  if (!recipientId)
    return res.status(400).json({ message: "Missing recipient" });

  try {
    const deleted = await prisma.friendRequest.deleteMany({
      where: {
        senderId,
        recipientId,
        status: FriendRequestStatus.pending,
      },
    });

    return res.json({ ok: true, removed: deleted.count });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to retract friend request" });
  }
});

userRouter.get(
  "/me/friend-requests/incoming",
  requireAuth,
  async (req, res) => {
    const userId = req.user!.userId;

    try {
      const requests = await prisma.friendRequest.findMany({
        where: { recipientId: userId, status: FriendRequestStatus.pending },
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              profileImageUrl: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      });

      return res.json({ requests });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Failed to load incoming requests" });
    }
  },
);

userRouter.get(
  "/me/friend-requests/outgoing",
  requireAuth,
  async (req, res) => {
    const userId = req.user!.userId;

    try {
      const requests = await prisma.friendRequest.findMany({
        where: { senderId: userId, status: FriendRequestStatus.pending },
        orderBy: { createdAt: "desc" },
        include: {
          recipient: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              profileImageUrl: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      });

      return res.json({ requests });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Failed to load outgoing requests" });
    }
  },
);

userRouter.patch("/me/friend-requests/:id", requireAuth, async (req, res) => {
  const requestId = String(req.params.id || "");
  const recipientId = req.user!.userId;
  const action = String(req.body?.action || "").toLowerCase();

  if (!requestId)
    return res.status(400).json({ message: "Missing request id" });
  if (!["accept", "decline"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.recipientId !== recipientId) {
      return res
        .status(403)
        .json({ message: "You cannot update this request" });
    }
    if (request.status !== FriendRequestStatus.pending) {
      return res.status(409).json({ message: "Request is no longer pending" });
    }

    const block = await findBlockBetweenUsers(
      request.senderId,
      request.recipientId,
    );
    if (block) {
      return res.status(409).json({
        message: "Cannot accept a request while one user is blocked",
      });
    }

    if (action === "accept") {
      await prisma.$transaction(async (tx) => {
        await tx.friendRequest.update({
          where: { id: requestId },
          data: { status: FriendRequestStatus.accepted },
        });

        await tx.friend
          .create({
            data: { userId: request.senderId, friendId: request.recipientId },
          })
          .catch(() => null);
        await tx.friend
          .create({
            data: { userId: request.recipientId, friendId: request.senderId },
          })
          .catch(() => null);
      });

      return res.json({ ok: true, status: "accepted" });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: FriendRequestStatus.declined },
    });

    return res.json({ ok: true, status: "declined" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update friend request" });
  }
});

userRouter.get("/me/friends", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    const friends = await prisma.friend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            profileImageUrl: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });
    return res.json({ friends: friends.map((f) => f.friend) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to list friends" });
  }
});

userRouter.get("/me/blocked", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    const blocked = await prisma.blockedUser.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            profileImageUrl: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    return res.json({ blocked });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to list blocked users" });
  }
});

userRouter.post("/:id/block", requireAuth, async (req, res) => {
  const blockedId = String(req.params.id || "");
  const blockerId = req.user!.userId;
  if (!blockedId)
    return res.status(400).json({ message: "Missing target user" });
  if (blockedId === blockerId)
    return res.status(400).json({ message: "Cannot block yourself" });

  try {
    const targetExists = await prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });
    if (!targetExists) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.blockedUser.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
      });

      await tx.friend.deleteMany({
        where: {
          OR: [
            { userId: blockerId, friendId: blockedId },
            { userId: blockedId, friendId: blockerId },
          ],
        },
      });

      await tx.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: blockerId, recipientId: blockedId },
            { senderId: blockedId, recipientId: blockerId },
          ],
        },
      });
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to block user" });
  }
});

userRouter.delete("/:id/block", requireAuth, async (req, res) => {
  const blockedId = String(req.params.id || "");
  const blockerId = req.user!.userId;
  if (!blockedId)
    return res.status(400).json({ message: "Missing target user" });

  try {
    const removed = await prisma.blockedUser.deleteMany({
      where: { blockerId, blockedId },
    });
    return res.json({ ok: true, removed: removed.count });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to unblock user" });
  }
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
      profileImageUrl: true,
      createdAt: true,
      profile: {
        select: {
          displayName: true,
          bio: true,
          country: true,
          level: true,
          trustScore: true,
        },
      },
      playerGames: { take: 3, orderBy: { isPrimary: "desc" } },
    },
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({ user });
});

// Public lookup by username: GET /users/by-username/:username
userRouter.get("/by-username/:username", async (req, res) => {
  const username = req.params.username;
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        profileImageUrl: true,
        profile: { select: { displayName: true } },
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lookup failed" });
  }
});

// Player logs
userRouter.get(
  "/:id/logs",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    const targetId = req.params.id;
    try {
      const logs = await prisma.playerLog.findMany({
        where: { userId: targetId },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      return res.json({ logs });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch logs" });
    }
  },
);

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

  const pg = await prisma.playerGame.updateMany({
    where: { id, userId },
    data,
  });
  if (pg.count === 0)
    return res.status(404).json({ message: "Game not found" });
  const updated = await prisma.playerGame.findUnique({ where: { id } });
  return res.json({ game: updated });
});

userRouter.delete("/me/games/:id", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id;
  const pg = await prisma.playerGame.deleteMany({ where: { id, userId } });
  if (pg.count === 0)
    return res.status(404).json({ message: "Game not found" });
  return res.json({ ok: true });
});

// PATCH /users/me -> update username and profile.displayName
userRouter.patch("/me", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { username, displayName, profileImageUrl } = req.body as {
    username?: string;
    displayName?: string;
    profileImageUrl?: string | null;
  };

  if (!username && displayName === undefined && profileImageUrl === undefined) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  try {
    let updatedUser: any = null;

    if (username) {
      // update username on user table
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { username },
      });
    }

    if (profileImageUrl !== undefined) {
      const normalizedImageUrl =
        typeof profileImageUrl === "string"
          ? profileImageUrl.trim() || null
          : null;
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          profileImageUrl: normalizedImageUrl,
          avatarUrl: normalizedImageUrl,
        },
      });
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
        profileImageUrl: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            bio: true,
            country: true,
            level: true,
            trustScore: true,
          },
        },
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
userRouter.patch(
  "/:id/role",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const id = req.params.id;
    const { role } = req.body as { role?: string };

    if (!role || !["PLAYER", "MODERATOR", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: { role: role as any },
      });
      return res.json({
        user: {
          id: updated.id,
          username: updated.username,
          role: updated.role,
        },
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: "Failed to update role" });
    }
  },
);

// Moderator/Admin: ban a user
userRouter.post(
  "/:id/ban",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    const targetId = req.params.id;
    const moderatorId = req.user!.userId;
    const { reason, expiresAt } = req.body as {
      reason?: string;
      expiresAt?: string | null;
    };

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
      return res.status(500).json({ message: "Failed to create ban" });
    }
  },
);

// Moderator/Admin: unban a user (deactivate active bans)
userRouter.post(
  "/:id/unban",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    const targetId = req.params.id;
    try {
      const updated = await prisma.ban.updateMany({
        where: { userId: targetId, active: true },
        data: { active: false },
      });
      return res.json({ ok: true, updated: updated.count });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to unban user" });
    }
  },
);

// Moderator/Admin: list bans for a user
userRouter.get(
  "/:id/bans",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    const targetId = req.params.id;
    try {
      const bans = await prisma.ban.findMany({
        where: { userId: targetId },
        orderBy: { createdAt: "desc" },
      });
      return res.json({ bans });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to list bans" });
    }
  },
);
