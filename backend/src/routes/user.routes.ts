import { Router } from "express";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import multer from "multer";
import { FriendRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { getUserRegion } from "../services/ipinfoService";
import { resolveClientIp } from "../lib/clientIp";
import { getIo } from "../lib/socket";
import { getConfig, invalidateConfigCache } from "../lib/platformConfig";
import { getUserStatus } from "../lib/presence";

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

const bugReportUploadDir = path.join(process.cwd(), "uploads", "bug-reports");
if (!fs.existsSync(bugReportUploadDir)) {
  fs.mkdirSync(bugReportUploadDir, { recursive: true });
}

const bugReportUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, bugReportUploadDir),
    filename: (_req, file, cb) => {
      const originalExt = path.extname(file.originalname || "").toLowerCase();
      const mimeExt = mimeToExtension[file.mimetype] || "";
      const safeExt = originalExt || mimeExt || ".jpg";
      const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      cb(null, `${baseName}${safeExt}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedProfileImageMimeTypes.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});

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

  // Backfill geo fields for existing users created before IP-based detection rollout.
  try {
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { region: true },
    });

    if (!existingProfile?.region) {
      const detection = await getUserRegion(resolveClientIp(req).ip);
      await prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          country: detection.country,
          region: detection.region || detection.matchmakingRegion,
          continent: detection.continent,
        } as any,
        update: {
          country: detection.country,
          region: detection.region || detection.matchmakingRegion,
          continent: detection.continent,
        } as any,
      });
    }
  } catch {
    // Ignore detection failures so profile fetch remains resilient.
  }

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
          region: true,
          continent: true,
          level: true,
          trustScore: true,
        } as any,
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
            region: true,
            continent: true,
            level: true,
            trustScore: true,
          } as any,
        },
        wallet: { select: { id: true, balance: true, escrow: true } },
        role: true,
      },
    });

    return res.json({ user });
  } catch (err: any) {
    console.error("[onboarding]", err?.code, err?.message ?? err);
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
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
              region: true,
              continent: true,
              level: true,
              trustScore: true,
            } as any,
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
            region: true,
            continent: true,
            level: true,
            trustScore: true,
          } as any,
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

// PATCH /users/me/profile -> update profile preferences (bio/country/region/etc)
// NOTE: trustScore is NOT editable by users — it is managed automatically by the system
userRouter.patch("/me/profile", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { bio, country, region, continent, level } = req.body as {
    bio?: string;
    country?: string | null;
    region?: string | null;
    continent?: string | null;
    level?: number;
  };

  // Upsert profile so users without an existing Profile get one created
  const upserted = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      bio: bio ?? "",
      country: country ?? null,
      region: region ?? null,
      continent: continent ?? null,
      level: level ?? 1,
      trustScore: 87,
      displayName: undefined,
    } as any,
    update: { bio, country, region, continent, level } as any,
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

// Public: read platform config (frontend can use siteName etc.)
userRouter.get("/config", async (_req, res) => {
  try {
    const config = await getConfig();
    return res.json(config);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to read config" });
  }
});

// Admin: read full platform config
userRouter.get(
  "/admin/config",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    try {
      const config = await getConfig();
      return res.json(config);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to read config" });
    }
  },
);

// Admin: update platform config
userRouter.patch(
  "/admin/config",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const {
        siteName,
        maintenanceMode,
        registrationEnabled,
        trustScoreThreshold,
        minWagerAmount,
        maxWagerAmount,
        maxActiveMatchesPerUser,
      } = req.body as Partial<{
        siteName: string;
        maintenanceMode: boolean;
        registrationEnabled: boolean;
        trustScoreThreshold: number;
        minWagerAmount: number;
        maxWagerAmount: number;
        maxActiveMatchesPerUser: number;
      }>;

      const updated = await prisma.platformConfig.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          siteName: siteName ?? "WannaBet?",
          maintenanceMode: maintenanceMode ?? false,
          registrationEnabled: registrationEnabled ?? true,
          trustScoreThreshold: trustScoreThreshold ?? 0,
          minWagerAmount: minWagerAmount ?? 5,
          maxWagerAmount: maxWagerAmount ?? 10000,
          maxActiveMatchesPerUser: maxActiveMatchesPerUser ?? 10,
          updatedAt: new Date(),
        },
        update: {
          ...(siteName !== undefined && { siteName }),
          ...(maintenanceMode !== undefined && { maintenanceMode }),
          ...(registrationEnabled !== undefined && { registrationEnabled }),
          ...(trustScoreThreshold !== undefined && { trustScoreThreshold }),
          ...(minWagerAmount !== undefined && { minWagerAmount }),
          ...(maxWagerAmount !== undefined && { maxWagerAmount }),
          ...(maxActiveMatchesPerUser !== undefined && {
            maxActiveMatchesPerUser,
          }),
        },
      });

      invalidateConfigCache();
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to update config" });
    }
  },
);

// Submit a bug report (authenticated users)
userRouter.post(
  "/bug-reports",
  requireAuth,
  bugReportUpload.single("screenshot"),
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      const { title, category, severity, description, steps } = req.body as {
        title: string;
        category: string;
        severity: string;
        description: string;
        steps?: string;
      };

      if (!title || !category || !severity || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const imageUrl = req.file
        ? `/uploads/bug-reports/${req.file.filename}`
        : null;

      const report = await prisma.bugReport.create({
        data: {
          userId,
          title,
          category,
          severity,
          description,
          steps: steps || null,
          imageUrl,
          status: "open",
        },
        select: {
          id: true,
          title: true,
          category: true,
          severity: true,
          status: true,
          createdAt: true,
        },
      });

      return res.status(201).json(report);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to submit bug report" });
    }
  },
);

// Get current user's own bug reports
userRouter.get("/bug-reports/mine", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const reports = await prisma.bugReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        category: true,
        severity: true,
        status: true,
        imageUrl: true,
        adminNote: true,
        createdAt: true,
      },
    });
    return res.json(reports);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch bug reports" });
  }
});

// Admin: list all bug reports
userRouter.get(
  "/admin/bug-reports",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const { status } = req.query as { status?: string };
      const reports = await prisma.bugReport.findMany({
        where: status && status !== "all" ? { status } : {},
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      });
      return res.json(reports);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch bug reports" });
    }
  },
);

// Admin: update bug report status / add note
userRouter.patch(
  "/admin/bug-reports/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body as {
        status?: string;
        adminNote?: string;
      };

      const validStatuses = ["open", "investigating", "fixed", "closed"];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await prisma.bugReport.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(adminNote !== undefined && { adminNote }),
        },
        include: {
          user: { select: { id: true, username: true } },
        },
      });

      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to update bug report" });
    }
  },
);

// Admin: real-time health/status endpoint
userRouter.get(
  "/admin/health",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    try {
      const dbStart = Date.now();
      const [totalUsers, activeMatchCount, openDisputeCount] =
        await Promise.all([
          prisma.user.count(),
          prisma.match.count({
            where: {
              status: { notIn: ["finished", "completed", "cancelled"] },
            },
          }),
          prisma.dispute.count({ where: { status: { not: "resolved" } } }),
        ]);
      const dbLatencyMs = Date.now() - dbStart;

      const uptimeSecs = Math.floor(process.uptime());
      const mem = process.memoryUsage();

      let connectedClients = 0;
      try {
        connectedClients = getIo().engine.clientsCount;
      } catch {
        // socket not initialized yet
      }

      return res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptimeSecs,
        db: { status: "ok", latencyMs: dbLatencyMs },
        memory: {
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
          rssMb: Math.round(mem.rss / 1024 / 1024),
        },
        connectedClients,
        totalUsers,
        activeMatches: activeMatchCount,
        openDisputes: openDisputeCount,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch health data" });
    }
  },
);

// Admin: revenue overview — real deposits, withdrawals, fees, escrow
userRouter.get(
  "/admin/revenue",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Deposit totals (Stripe payments credited to wallets)
      const [depositAll, depositMonth] = await Promise.all([
        prisma.ledgerEntry.aggregate({
          where: { type: "deposit" },
          _sum: { amount: true },
        }),
        prisma.ledgerEntry.aggregate({
          where: { type: "deposit", createdAt: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
      ]);

      // Withdrawal totals (amounts stored as negative in ledger)
      const [withdrawalAll, withdrawalMonth] = await Promise.all([
        prisma.ledgerEntry.aggregate({
          where: { type: "withdrawal" },
          _sum: { amount: true },
        }),
        prisma.ledgerEntry.aggregate({
          where: { type: "withdrawal", createdAt: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
      ]);

      // Completed match volume (sum of stakes; each match has 2 stakes = pot)
      const completedMatches = await prisma.match.findMany({
        where: {
          status: {
            in: ["COMPLETED", "completed", "finished", "RESULT_CONFIRMED"],
          },
        },
        select: { stake: true, createdAt: true },
      });
      const matchVolumeAll = completedMatches.reduce(
        (sum, m) => sum + m.stake * 2,
        0,
      );
      const matchVolumeMonth = completedMatches
        .filter((m) => m.createdAt >= startOfMonth)
        .reduce((sum, m) => sum + m.stake * 2, 0);

      // Tournament entry fee revenue (sum of entry fees × participants)
      const tournaments = await prisma.tournament.findMany({
        select: {
          entryFee: true,
          participants: { select: { id: true, paid: true } },
        },
      });
      const tournamentRevenueAll = tournaments.reduce(
        (sum, t) =>
          sum +
          t.entryFee * t.participants.filter((p) => p.paid === true).length,
        0,
      );

      // Current escrow across all wallets
      const escrowAgg = await prisma.wallet.aggregate({
        _sum: { escrow: true },
      });

      // Platform fee rate (5% configured in admin settings)
      const PLATFORM_FEE_RATE = 0.05;
      const WITHDRAWAL_FEE_RATE = 0.02;

      const totalDepositsCents = depositAll._sum?.amount ?? 0;
      const totalDepositsMonthCents = depositMonth._sum?.amount ?? 0;

      // Withdrawals are stored as negative amounts
      const totalWithdrawalsCents = Math.abs(withdrawalAll._sum?.amount ?? 0);
      const totalWithdrawalsMonthCents = Math.abs(
        withdrawalMonth._sum?.amount ?? 0,
      );

      const totalEscrowCents = escrowAgg._sum?.escrow ?? 0;

      // Fees computed from actual activity
      const matchFees = Math.round(matchVolumeAll * PLATFORM_FEE_RATE);
      const matchFeesMonth = Math.round(matchVolumeMonth * PLATFORM_FEE_RATE);
      const withdrawalFees = Math.round(
        totalWithdrawalsCents * WITHDRAWAL_FEE_RATE,
      );
      const withdrawalFeesMonth = Math.round(
        totalWithdrawalsMonthCents * WITHDRAWAL_FEE_RATE,
      );
      const totalFees = matchFees + withdrawalFees + tournamentRevenueAll;
      const totalFeesMonth = matchFeesMonth + withdrawalFeesMonth;

      return res.json({
        // All-time (in cents)
        totalDepositsCents,
        totalWithdrawalsCents,
        totalEscrowCents,
        matchVolumeCents: matchVolumeAll,
        tournamentRevenueCents: tournamentRevenueAll,
        matchFeesCents: matchFees,
        withdrawalFeesCents: withdrawalFees,
        totalFeesCents: totalFees,
        // This month (in cents)
        monthDepositsCents: totalDepositsMonthCents,
        monthWithdrawalsCents: totalWithdrawalsMonthCents,
        monthMatchVolumeCents: matchVolumeMonth,
        monthFeesCents: totalFeesMonth,
      });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Failed to compute revenue data" });
    }
  },
);

// Admin: stream a pg_dump SQL backup as a file download
userRouter.get(
  "/admin/db-backup",
  requireAuth,
  requireRole("ADMIN"),
  (req, res) => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return res.status(500).json({ message: "DATABASE_URL not configured" });
    }
    const filename = `wannabet-backup-${new Date().toISOString().slice(0, 10)}.sql`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    const child = spawn("pg_dump", [`--dbname=${dbUrl}`], {
      env: { ...process.env },
    });

    child.stdout.pipe(res);
    child.stderr.on("data", (d) => console.error("[pg_dump]", String(d)));
    child.on("error", (err) => {
      console.error("[pg_dump] failed to start:", err);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ message: "pg_dump not available: " + err.message });
      }
    });
  },
);

// Admin: run VACUUM ANALYZE to reclaim space and refresh planner stats
userRouter.post(
  "/admin/db-optimize",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    try {
      await prisma.$executeRawUnsafe("VACUUM ANALYZE");
      return res.json({
        ok: true,
        message: "VACUUM ANALYZE completed successfully",
      });
    } catch (err: any) {
      console.error(err);
      return res
        .status(500)
        .json({ message: err?.message || "VACUUM ANALYZE failed" });
    }
  },
);

// Admin: recent activity log — bans and warnings merged
userRouter.get(
  "/admin/activity-log",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    try {
      // Fetch recent ban records
      const bans = await prisma.ban.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          moderator: { select: { username: true } },
          user: { select: { username: true } },
        },
      });

      // Fetch recent MOD_WARNING PlayerLog entries (actor-triggered only)
      const warns = await prisma.playerLog.findMany({
        where: { type: "MOD_WARNING", actorId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Bulk-lookup actor and target usernames for warns
      const actorIds = [...new Set(warns.map((w) => w.actorId!))];
      const targetIds = [...new Set(warns.map((w) => w.userId))];
      const [actors, targets] = await Promise.all([
        actorIds.length
          ? prisma.user.findMany({
              where: { id: { in: actorIds } },
              select: { id: true, username: true },
            })
          : Promise.resolve([]),
        targetIds.length
          ? prisma.user.findMany({
              where: { id: { in: targetIds } },
              select: { id: true, username: true },
            })
          : Promise.resolve([]),
      ]);
      const actorMap = Object.fromEntries(
        actors.map((u) => [u.id, u.username]),
      );
      const targetMap = Object.fromEntries(
        targets.map((u) => [u.id, u.username]),
      );

      // Normalize ban records
      const banEntries = bans.map((b) => ({
        id: `ban-${b.id}`,
        actorName: b.moderator.username,
        action: b.expiresAt
          ? `Suspended user: ${b.user.username}${b.reason ? ` — ${b.reason}` : ""}`
          : `Banned user: ${b.user.username}${b.reason ? ` — ${b.reason}` : ""}`,
        type: "moderation",
        createdAt: b.createdAt.toISOString(),
      }));

      // Normalize warn records
      const warnEntries = warns.map((w) => ({
        id: `warn-${w.id}`,
        actorName: actorMap[w.actorId!] ?? "Unknown",
        action: `Warned user: ${targetMap[w.userId] ?? "Unknown"}${w.message ? ` — ${w.message}` : ""}`,
        type: "moderation",
        createdAt: w.createdAt.toISOString(),
      }));

      // Merge, sort descending by date, cap at 50
      const logs = [...banEntries, ...warnEntries]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 50);

      return res.json({ logs });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch activity log" });
    }
  },
);

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

      const now = new Date();

      // Permanently banned: active ban with no expiry
      const permanentBanUsers = await prisma.ban.findMany({
        where: { active: true, expiresAt: null },
        select: { userId: true },
        distinct: ["userId"],
      });
      const bannedUserIds = new Set(permanentBanUsers.map((b) => b.userId));

      // Suspended: active ban with future expiry, not permanently banned
      const tempBanUsers = await prisma.ban.findMany({
        where: { active: true, expiresAt: { gt: now } },
        select: { userId: true },
        distinct: ["userId"],
      });
      const suspendedCount = tempBanUsers.filter(
        (b) => !bannedUserIds.has(b.userId),
      ).length;
      const suspendedUserIds = new Set(
        tempBanUsers
          .map((b) => b.userId)
          .filter((id) => !bannedUserIds.has(id)),
      );

      // Warned: has at least one warn/report/flag log, not banned or suspended
      const warnLogUsers = await prisma.playerLog.findMany({
        where: {
          OR: [
            { type: { contains: "warn", mode: "insensitive" } },
            { type: { contains: "report", mode: "insensitive" } },
            { type: { contains: "flag", mode: "insensitive" } },
          ],
        },
        select: { userId: true },
        distinct: ["userId"],
      });
      const warnedCount = warnLogUsers.filter(
        (u) => !bannedUserIds.has(u.userId) && !suspendedUserIds.has(u.userId),
      ).length;

      return res.json({
        totalUsers,
        matchesByStatus,
        totalEscrow: escrowAgg._sum?.escrow || 0,
        totalWalletBalance: balanceAgg._sum?.balance || 0,
        bannedCount: bannedUserIds.size,
        suspendedCount,
        warnedCount,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to compute stats" });
    }
  },
);

// Moderator: platform activity for last 7 days (matches created + disputes created)
userRouter.get(
  "/moderation/activity",
  requireAuth,
  requireRole("MODERATOR"),
  async (_req, res) => {
    try {
      const now = new Date();
      const days: { day: string; date: Date }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        days.push({
          day: d.toLocaleDateString("en-US", { weekday: "short" }),
          date: d,
        });
      }

      const since = days[0]!.date;

      const [matches, disputes] = await Promise.all([
        prisma.match.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        prisma.dispute.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true },
        }),
      ]);

      const result = days.map(({ day, date }) => {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        return {
          day,
          matches: matches.filter(
            (m) => m.createdAt >= date && m.createdAt < next,
          ).length,
          disputes: disputes.filter(
            (d) => d.createdAt >= date && d.createdAt < next,
          ).length,
        };
      });

      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch activity data" });
    }
  },
);

// Moderator: player list for moderation panel
userRouter.get(
  "/moderation/players",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 10));

      const users = await prisma.user.findMany({
        where: {
          role: "PLAYER",
          ...(q
            ? {
                OR: [
                  { username: { contains: q, mode: "insensitive" } },
                  {
                    profile: {
                      displayName: { contains: q, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          username: true,
          createdAt: true,
          avatarUrl: true,
          profileImageUrl: true,
          profile: { select: { trustScore: true } },
          playerGames: { select: { wins: true, losses: true } },
          hostedMatches: { select: { id: true } },
          joinedMatches: { select: { id: true } },
          bans: {
            where: { active: true },
            select: { expiresAt: true },
          },
          playerLogs: {
            where: {
              OR: [
                { type: { contains: "report", mode: "insensitive" } },
                { type: { contains: "flag", mode: "insensitive" } },
              ],
            },
            select: { id: true },
          },
        },
      });

      const now = new Date();
      const players = users.map((u) => {
        const wins = u.playerGames.reduce((sum, g) => sum + g.wins, 0);
        const losses = u.playerGames.reduce((sum, g) => sum + g.losses, 0);
        const matchCount = u.hostedMatches.length + u.joinedMatches.length;
        const totalMatches = matchCount > 0 ? matchCount : wins + losses;

        const hasPermanentBan = u.bans.some((b) => !b.expiresAt);
        const hasActiveSuspension = u.bans.some(
          (b) => b.expiresAt && new Date(b.expiresAt) > now,
        );

        const status = hasPermanentBan
          ? "banned"
          : hasActiveSuspension
            ? "suspended"
            : u.playerLogs.length > 0
              ? "warned"
              : "active";

        return {
          id: u.id,
          username: u.username,
          trustScore: Number(u.profile?.trustScore ?? 100),
          totalMatches,
          wins,
          losses,
          totalEarnings: 0,
          mmr: 0,
          accountCreated: u.createdAt,
          lastActive: u.createdAt,
          status,
          reports: u.playerLogs.length,
          avatarUrl: u.profileImageUrl || u.avatarUrl || null,
        };
      });

      return res.json({ players });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Failed to list moderation players" });
    }
  },
);

// Moderator: single player details for moderation panel
userRouter.get(
  "/moderation/players/:id",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      if (!id) {
        return res.status(400).json({ message: "Missing player id" });
      }

      const user = await prisma.user.findFirst({
        where: { id, role: "PLAYER" },
        select: {
          id: true,
          username: true,
          createdAt: true,
          avatarUrl: true,
          profileImageUrl: true,
          profile: { select: { trustScore: true } },
          wallet: {
            select: {
              balance: true,
              escrow: true,
            },
          },
          playerGames: {
            select: {
              game: true,
              isPrimary: true,
              wins: true,
              losses: true,
              hours: true,
            },
          },
          _count: {
            select: {
              hostedMatches: true,
              joinedMatches: true,
            },
          },
          hostedMatches: {
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          joinedMatches: {
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          bans: {
            where: { active: true },
            select: { expiresAt: true },
          },
          playerLogs: {
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!user) {
        return res.status(404).json({ message: "Player not found" });
      }

      const reportCount = await prisma.playerLog.count({
        where: {
          userId: user.id,
          OR: [
            { type: { contains: "report", mode: "insensitive" } },
            { type: { contains: "flag", mode: "insensitive" } },
          ],
        },
      });

      const wins = user.playerGames.reduce((sum, g) => sum + g.wins, 0);
      const losses = user.playerGames.reduce((sum, g) => sum + g.losses, 0);
      const totalHours = user.playerGames.reduce((sum, g) => sum + g.hours, 0);
      const totalMatches =
        user._count.hostedMatches + user._count.joinedMatches > 0
          ? user._count.hostedMatches + user._count.joinedMatches
          : wins + losses;

      const now = new Date();
      const hasPermanentBan = user.bans.some((b) => !b.expiresAt);
      const hasActiveSuspension = user.bans.some(
        (b) => b.expiresAt && new Date(b.expiresAt) > now,
      );

      const status = hasPermanentBan
        ? "banned"
        : hasActiveSuspension
          ? "suspended"
          : reportCount > 0
            ? "warned"
            : "active";

      const lastActivityCandidates = [
        user.createdAt,
        user.playerLogs[0]?.createdAt,
        user.hostedMatches[0]?.createdAt,
        user.joinedMatches[0]?.createdAt,
      ].filter(Boolean) as Date[];
      const lastActive = new Date(
        Math.max(...lastActivityCandidates.map((d) => new Date(d).getTime())),
      );

      const player = {
        id: user.id,
        username: user.username,
        trustScore: Number(user.profile?.trustScore ?? 100),
        totalMatches,
        wins,
        losses,
        totalHours,
        totalEarnings: Number(user.wallet?.balance || 0),
        walletBalance: Number(user.wallet?.balance || 0),
        escrowBalance: Number(user.wallet?.escrow || 0),
        mmr: 0,
        accountCreated: user.createdAt,
        lastActive,
        status,
        reports: reportCount,
        avatarUrl: user.profileImageUrl || user.avatarUrl || null,
      };

      return res.json({ player });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Failed to fetch moderation player" });
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
      return res.status(409).json({
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
            profile: { select: { displayName: true, trustScore: true } },
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

// ── GET /users/me/stats-timeseries?period=7d|30d|3mo|6mo|1y|all ─────────────
// Returns bucketed win/loss, earnings, and game distribution for the charts.
userRouter.get("/me/stats-timeseries", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const period = String(req.query.period || "30d") as
      | "7d"
      | "30d"
      | "3mo"
      | "6mo"
      | "1y"
      | "all";

    const now = new Date();
    let since: Date | null = null;

    switch (period) {
      case "7d":
        since = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        break;
      case "30d":
        since = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        break;
      case "3mo":
        since = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
        break;
      case "6mo":
        since = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
        break;
      case "1y":
        since = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
        break;
      case "all":
        since = null;
        break;
    }

    const matchWhere: any = {
      status: "COMPLETED",
      OR: [{ hostId: userId }, { joinerId: userId }],
    };
    if (since) matchWhere.createdAt = { gte: since };

    const matches = (await prisma.match.findMany({
      where: matchWhere,
      select: {
        id: true,
        game: true,
        stake: true,
        createdAt: true,
        reportedWinnerId: true,
      },
      orderBy: { createdAt: "asc" },
    })) as any[];

    // ── Wallet + ledger entries ────────────────────────────────────────────
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    const ledgerWhere: any = { type: "payout" };
    if (wallet) ledgerWhere.walletId = wallet.id;
    if (since) ledgerWhere.createdAt = { gte: since };

    const ledgerEntries = wallet
      ? await (prisma.ledgerEntry as any).findMany({
          where: ledgerWhere,
          select: { amount: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : [];

    // ── Bucketing helpers ─────────────────────────────────────────────────
    const DAY_MS = 24 * 3600 * 1000;
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    type WLBucket = { period: string; wins: number; losses: number };
    type EBucket = { period: string; earnings: number };

    let winLossData: WLBucket[] = [];
    let earningsData: EBucket[] = [];

    if (period === "7d") {
      // One bucket per day; last 7 days in order
      const buckets: Record<string, WLBucket> = {};
      const eBuckets: Record<string, EBucket> = {};
      for (let d = 6; d >= 0; d--) {
        const dt = new Date(now.getTime() - d * DAY_MS);
        const key = DAYS[dt.getDay()] ?? "Unknown";
        buckets[key] = { period: key, wins: 0, losses: 0 };
        eBuckets[key] = { period: key, earnings: 0 };
      }
      for (const m of matches) {
        const key = DAYS[new Date(m.createdAt).getDay()] ?? "Unknown";
        if (!buckets[key]) continue;
        (buckets[key] as WLBucket).wins +=
          m.reportedWinnerId === userId ? 1 : 0;
        (buckets[key] as WLBucket).losses +=
          m.reportedWinnerId && m.reportedWinnerId !== userId ? 1 : 0;
      }
      for (const e of ledgerEntries) {
        const key = DAYS[new Date(e.createdAt).getDay()] ?? "Unknown";
        if (eBuckets[key])
          (eBuckets[key] as EBucket).earnings += Math.round(e.amount / 100);
      }
      winLossData = Object.values(buckets);
      earningsData = Object.values(eBuckets);
    } else if (period === "30d") {
      // 4 weekly buckets
      const weekBuckets: WLBucket[] = Array.from({ length: 4 }, (_, i) => ({
        period: `Week ${i + 1}`,
        wins: 0,
        losses: 0,
      }));
      const weekEBuckets: EBucket[] = Array.from({ length: 4 }, (_, i) => ({
        period: `Week ${i + 1}`,
        earnings: 0,
      }));
      for (const m of matches) {
        const daysAgo =
          (now.getTime() - new Date(m.createdAt).getTime()) / DAY_MS;
        const weekIdx = Math.min(3, Math.floor(daysAgo / 7));
        const bucket = weekBuckets[3 - weekIdx];
        if (!bucket) continue;
        if (m.reportedWinnerId === userId) bucket.wins++;
        else if (m.reportedWinnerId) bucket.losses++;
      }
      for (const e of ledgerEntries) {
        const daysAgo =
          (now.getTime() - new Date(e.createdAt).getTime()) / DAY_MS;
        const weekIdx = Math.min(3, Math.floor(daysAgo / 7));
        const bucket = weekEBuckets[3 - weekIdx];
        if (bucket) bucket.earnings += Math.round(e.amount / 100);
      }
      winLossData = weekBuckets;
      earningsData = weekEBuckets;
    } else if (period === "3mo") {
      const mBuckets: WLBucket[] = Array.from({ length: 3 }, (_, i) => ({
        period: `Month ${i + 1}`,
        wins: 0,
        losses: 0,
      }));
      const mEBuckets: EBucket[] = Array.from({ length: 3 }, (_, i) => ({
        period: `Month ${i + 1}`,
        earnings: 0,
      }));
      for (const m of matches) {
        const daysAgo =
          (now.getTime() - new Date(m.createdAt).getTime()) / DAY_MS;
        const monthIdx = Math.min(2, Math.floor(daysAgo / 30));
        const bucket = mBuckets[2 - monthIdx];
        if (!bucket) continue;
        if (m.reportedWinnerId === userId) bucket.wins++;
        else if (m.reportedWinnerId) bucket.losses++;
      }
      for (const e of ledgerEntries) {
        const daysAgo =
          (now.getTime() - new Date(e.createdAt).getTime()) / DAY_MS;
        const monthIdx = Math.min(2, Math.floor(daysAgo / 30));
        const bucket = mEBuckets[2 - monthIdx];
        if (bucket) bucket.earnings += Math.round(e.amount / 100);
      }
      winLossData = mBuckets;
      earningsData = mEBuckets;
    } else if (period === "6mo" || period === "1y") {
      const numMonths = period === "6mo" ? 6 : 12;
      const monthBuckets: Record<string, WLBucket> = {};
      const monthEBuckets: Record<string, EBucket> = {};
      for (let m = numMonths - 1; m >= 0; m--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const key = MONTHS[dt.getMonth()] ?? "Unknown";
        monthBuckets[key] = { period: key, wins: 0, losses: 0 };
        monthEBuckets[key] = { period: key, earnings: 0 };
      }
      for (const m of matches) {
        const key = MONTHS[new Date(m.createdAt).getMonth()] ?? "Unknown";
        if (!monthBuckets[key]) continue;
        (monthBuckets[key] as WLBucket).wins +=
          m.reportedWinnerId === userId ? 1 : 0;
        (monthBuckets[key] as WLBucket).losses +=
          m.reportedWinnerId && m.reportedWinnerId !== userId ? 1 : 0;
      }
      for (const e of ledgerEntries) {
        const key = MONTHS[new Date(e.createdAt).getMonth()] ?? "Unknown";
        if (monthEBuckets[key])
          (monthEBuckets[key] as EBucket).earnings += Math.round(
            e.amount / 100,
          );
      }
      winLossData = Object.values(monthBuckets);
      earningsData = Object.values(monthEBuckets);
    } else {
      // all time — quarterly buckets
      const qBuckets: Record<string, WLBucket> = {};
      const qEBuckets: Record<string, EBucket> = {};
      for (const m of matches) {
        const d = new Date(m.createdAt);
        const key = `${d.getFullYear()} Q${Math.floor(d.getMonth() / 3) + 1}`;
        if (!qBuckets[key]) {
          qBuckets[key] = { period: key, wins: 0, losses: 0 };
          qEBuckets[key] = { period: key, earnings: 0 };
        }
        if (m.reportedWinnerId === userId) qBuckets[key].wins++;
        else if (m.reportedWinnerId) qBuckets[key].losses++;
      }
      for (const e of ledgerEntries) {
        const d = new Date(e.createdAt);
        const key = `${d.getFullYear()} Q${Math.floor(d.getMonth() / 3) + 1}`;
        if (qEBuckets[key])
          qEBuckets[key].earnings += Math.round(e.amount / 100);
      }
      winLossData = Object.values(qBuckets);
      earningsData = Object.values(qEBuckets);
    }

    // ── Game distribution (all time, from match history) ──────────────────
    const allMatches = (await prisma.match.findMany({
      where: {
        status: "COMPLETED",
        OR: [{ hostId: userId }, { joinerId: userId }],
      },
      select: { game: true },
    })) as any[];

    const gameCounts: Record<string, number> = {};
    for (const m of allMatches) {
      gameCounts[m.game] = (gameCounts[m.game] || 0) + 1;
    }
    const total = Object.values(gameCounts).reduce((a, b) => a + b, 0) || 1;
    const COLORS = [
      "#E50914",
      "#F59E0B",
      "#3B82F6",
      "#8B5CF6",
      "#10B981",
      "#EC4899",
      "#14B8A6",
      "#F97316",
    ];
    const gameDistribution = Object.entries(gameCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        value: Math.round((count / total) * 100),
        color: COLORS[i % COLORS.length],
      }));

    return res.json({ winLossData, earningsData, gameDistribution });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load stats timeseries" });
  }
});

// ── GET /users/presence?userIds=id1,id2,... ───────────────────────────────────
// Returns real-time status + lastSeen for a list of user IDs (no auth required)
// Must be registered BEFORE /:id to avoid the wildcard swallowing this route.
userRouter.get("/presence", async (req, res) => {
  try {
    const raw = String(req.query.userIds || "").trim();
    if (!raw) return res.json({ presence: {} });

    const userIds = raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 100); // max 100

    const profiles = await prisma.profile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, lastSeen: true },
    });
    const lastSeenMap: Record<string, string | null> = Object.fromEntries(
      profiles.map((p) => [
        p.userId,
        p.lastSeen ? p.lastSeen.toISOString() : null,
      ]),
    );

    const presence: Record<
      string,
      { status: "online" | "idle" | "dnd" | "offline"; lastSeen: string | null }
    > = {};

    for (const uid of userIds) {
      presence[uid] = {
        status: getUserStatus(uid),
        lastSeen: lastSeenMap[uid] ?? null,
      };
    }

    return res.json({ presence });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch presence" });
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
          region: true,
          continent: true,
          level: true,
          trustScore: true,
        } as any,
      },
      playerGames: { take: 3, orderBy: { isPrimary: "desc" } },
    },
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  // Compute real stats from completed matches
  const completedMatches = await (prisma.match as any).findMany({
    where: {
      status: "COMPLETED",
      OR: [{ hostId: id }, { joinerId: id }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      game: true,
      stake: true,
      createdAt: true,
      hostId: true,
      joinerId: true,
      reportedWinnerId: true,
      host: { select: { id: true, username: true } },
      joiner: { select: { id: true, username: true } },
    },
  });

  const wins = completedMatches.filter(
    (m: any) => m.reportedWinnerId === id,
  ).length;
  const losses = completedMatches.filter(
    (m: any) => m.reportedWinnerId != null && m.reportedWinnerId !== id,
  ).length;
  const totalMatches = completedMatches.length;

  // Win/loss streak from newest → oldest
  let currentStreak = 0;
  let longestWinStreak = 0;
  let tempStreak = 0;
  let stillCurrent = true;
  for (const m of completedMatches) {
    const isWin = m.reportedWinnerId === id;
    const isLoss = m.reportedWinnerId != null && m.reportedWinnerId !== id;
    if (isWin) {
      tempStreak++;
      if (stillCurrent) currentStreak++;
    } else if (isLoss) {
      stillCurrent = false;
      longestWinStreak = Math.max(longestWinStreak, tempStreak);
      tempStreak = 0;
    }
    // unresolved (no reportedWinnerId) doesn't break streak but doesn't count
  }
  longestWinStreak = Math.max(longestWinStreak, tempStreak);

  // Total earnings from payout ledger entries
  const wallet = await prisma.wallet.findUnique({
    where: { userId: id },
    select: { id: true },
  });
  let totalEarningsCents = 0;
  if (wallet) {
    const agg = await (prisma.ledgerEntry as any).aggregate({
      where: { walletId: wallet.id, type: "payout" },
      _sum: { amount: true },
    });
    totalEarningsCents = agg._sum?.amount ?? 0;
  }

  // Recent match history (up to 20)
  const recentMatches = completedMatches.slice(0, 20).map((m: any) => {
    const isWin = m.reportedWinnerId === id;
    const isLoss = m.reportedWinnerId != null && m.reportedWinnerId !== id;
    const opponent = m.hostId === id ? m.joiner : m.host;
    return {
      id: m.id,
      game: m.game,
      result: isWin ? "Win" : isLoss ? "Loss" : "Draw",
      stake: m.stake,
      earnedCents: isWin ? m.stake : isLoss ? -m.stake : 0,
      date: m.createdAt,
      opponentUsername: opponent?.username ?? "Unknown",
      opponentId: opponent?.id ?? null,
    };
  });

  const statsData = {
    totalMatches,
    wins,
    losses,
    totalEarningsCents,
    avgMatchEarningsCents:
      totalMatches > 0 ? Math.round(totalEarningsCents / totalMatches) : 0,
    currentStreak,
    longestWinStreak,
    winRate:
      wins + losses > 0
        ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1))
        : 0,
  };

  return res.json({ user, stats: statsData, recentMatches });
});

// Public lookup by username: GET /users/by-username/:username
userRouter.get("/by-username/:username", async (req, res) => {
  const username = String(req.params.username || "").trim();
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
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
            region: true,
            continent: true,
            level: true,
            trustScore: true,
          } as any,
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
  "/:id/warn",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    const targetId = req.params.id;
    const moderatorId = req.user!.userId;
    const { reason } = req.body as { reason?: string };

    try {
      const log = await prisma.playerLog.create({
        data: {
          userId: targetId,
          actorId: moderatorId,
          type: "MOD_WARNING",
          message: reason?.trim() || "Warned by moderator",
        },
      });
      return res.json({ ok: true, log });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to warn user" });
    }
  },
);

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

// ── POST /users/me/deactivate ─────────────────────────────────────────────────
// Sets isDeactivated=true on the current user's account. Token remains valid
// but the user is treated as inactive. Logging back in clears the flag.
userRouter.post("/me/deactivate", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isDeactivated: true },
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to deactivate account" });
  }
});

// ── DELETE /users/me ──────────────────────────────────────────────────────────
// Permanently deletes the authenticated user's account and all related data.
// Must confirm with "DELETE MY ACCOUNT" in request body.
userRouter.delete("/me", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { confirmation } = req.body as { confirmation?: string };
  if (confirmation !== "DELETE MY ACCOUNT") {
    return res
      .status(400)
      .json({ message: "Confirmation phrase does not match" });
  }
  try {
    // Delete in dependency order to avoid FK constraint violations
    await prisma.$transaction([
      prisma.friendRequest.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      }),
      prisma.friend.deleteMany({
        where: { OR: [{ userId }, { friendId: userId }] },
      }),
      prisma.blockedUser.deleteMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      }),
      prisma.message.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      }),
      prisma.conversation.deleteMany({
        where: { OR: [{ firstUserId: userId }, { secondUserId: userId }] },
      }),
      prisma.tournamentEntry.deleteMany({ where: { userId } }),
      prisma.teamMember.deleteMany({ where: { userId } }),
      prisma.playerGame.deleteMany({ where: { userId } }),
      prisma.playerLog.deleteMany({ where: { userId } }),
      prisma.escrow.deleteMany({ where: { userId } }),
      prisma.bugReport.deleteMany({ where: { userId } }),
      prisma.profile.deleteMany({ where: { userId } }),
      prisma.wallet.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete account" });
  }
});
