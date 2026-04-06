import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { setIo } from "./lib/socket";
import { prisma } from "./lib/prisma";
import {
  setPresence,
  removePresence,
  updateActivity,
  setManualStatus,
  getUserStatus,
  getAllPresence,
} from "./lib/presence";
import { env } from "./lib/env";
import { getConfig } from "./lib/platformConfig";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { walletRouter } from "./routes/wallet.routes";
import { messagesRouter } from "./routes/messages.routes";
import { matchRouter } from "./routes/match.routes";
import { tournamentRouter } from "./routes/tournament.routes";
import { eventsRouter } from "./routes/events.routes";
import { searchRouter } from "./routes/search.routes";
import { regionRouter } from "./routes/region.routes";
import { regionsRouter } from "./routes/regions.routes";
import { esportsRouter } from "./routes/esports.routes";
import { teamsRouter } from "./routes/teams.routes";
import { stripeRouter } from "./routes/stripe.routes";
import { leaderboardRouter } from "./routes/leaderboard.routes";
import { disputeRouter } from "./routes/dispute.routes";

const app = express();
const server = http.createServer(app);

// Required for accurate client IP extraction when behind reverse proxies/CDNs.
app.set("trust proxy", true);

app.use(
  cors({
    origin: [
      "http://localhost:3000", // React dev server
      "http://localhost:5173", // Vite (optional / legacy)
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Stripe webhook must receive raw body — mount before express.json()
app.use(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    // Expose rawBody for webhook signature verification
    (req as any).rawBody = req.body;
    next();
  },
);

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Maintenance mode — blocks all routes except /health and /users/admin/*
app.use(async (req, res, next) => {
  // Always allow health checks, admin routes, and stripe webhooks
  if (
    req.path === "/health" ||
    req.path.startsWith("/users/admin") ||
    req.path.startsWith("/users/config") ||
    req.path.startsWith("/stripe")
  ) {
    return next();
  }
  try {
    const config = await getConfig();
    if (config.maintenanceMode) {
      return res.status(503).json({
        message:
          "Platform is currently under maintenance. Please check back soon.",
      });
    }
  } catch {
    // Config fetch failure should not block requests
  }
  return next();
});

app.use("/stripe", stripeRouter);
app.use("/wallet", walletRouter);
app.use("/matches", matchRouter);
app.use("/disputes", disputeRouter);
app.use("/tournaments", tournamentRouter);
app.use("/events", eventsRouter);
app.use("/leaderboard", leaderboardRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

// GET /stats — public, real-time platform statistics
app.get("/stats", async (_req, res) => {
  try {
    const [
      totalAccounts,
      completedMatches,
      activeMatchCount,
      payoutAggregate,
      escrowAggregate,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.match.count({
        where: {
          status: { in: ["COMPLETED", "completed", "finished", "FINISHED"] },
        },
      }),
      prisma.match.count({
        where: { status: { in: ["OPEN", "UPCOMING", "ACTIVE"] } },
      }),
      prisma.ledgerEntry.aggregate({
        _sum: { amount: true },
        where: { type: "payout" },
      }),
      prisma.escrow.aggregate({
        _sum: { amount: true },
        where: { status: "locked" },
      }),
    ]);

    const onlinePlayers = [...getAllPresence().values()].filter(
      (e) => e.lastActive >= new Date(Date.now() - 5 * 60 * 1000),
    ).length;

    res.json({
      totalAccounts,
      completedMatches,
      activeMatches: activeMatchCount,
      totalPaidOutCents: payoutAggregate._sum.amount ?? 0,
      inPlayCents: escrowAggregate._sum.amount ?? 0,
      onlinePlayers,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/messages", messagesRouter);
app.use("/teams", teamsRouter);
app.use("/api/teams", teamsRouter);
app.use("/search", searchRouter);
app.use("/api/region", regionRouter);
app.use("/api/regions", regionsRouter);
app.use("/api/esports", esportsRouter);

app.get("/", (_req, res) => {
  res.send("WannaBet API is running. Try GET /health");
});

const io = new IOServer(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002"],
    credentials: true,
  },
});

// socket auth middleware
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization
        ?.toString()
        .replace(/^Bearer\s+/i, "");
    if (!token) return next(new Error("Authentication error"));
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    (socket as any).data.userId = payload.userId;
    return next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);
  const userId = (socket as any).data.userId as string | undefined;

  if (userId) {
    // join personal room
    socket.join(`user:${userId}`);

    // Load persisted manualStatus from DB (fire-and-forget)
    prisma.profile
      .findUnique({ where: { userId }, select: { manualStatus: true } })
      .then((p) => {
        const manual = p?.manualStatus ?? null;
        setPresence(userId, socket.id, manual);
        // Broadcast to everyone that this user is online/dnd
        io.emit("user:status_change", {
          userId,
          status: getUserStatus(userId),
        });
      })
      .catch(() => {
        setPresence(userId, socket.id, null);
        io.emit("user:status_change", { userId, status: "online" });
      });
  }

  // Activity heartbeat
  socket.on("activity_ping", () => {
    if (userId) updateActivity(userId);
  });

  // Manual status change
  socket.on("set_status", ({ status }: { status: string }) => {
    if (!userId) return;
    const allowed = ["online", "idle", "dnd", "offline"];
    if (!allowed.includes(status)) return;

    const manual = status === "online" || status === "idle" ? null : status;
    setManualStatus(userId, manual);

    const resolved = getUserStatus(userId);
    io.emit("user:status_change", { userId, status: resolved });

    // Persist to DB (fire-and-forget)
    prisma.profile
      .upsert({
        where: { userId },
        update: { manualStatus: manual },
        create: { userId, manualStatus: manual },
      })
      .catch(() => {});
  });

  socket.on("join", (room: string) => {
    socket.join(room);
  });

  socket.on("leave", (room: string) => {
    socket.leave(room);
  });

  socket.on("message", (payload) => {
    // payload: {room, message}
    if (payload?.room) {
      io.to(payload.room).emit("message", payload.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
    if (!userId) return;
    removePresence(userId);

    // Update lastSeen in DB (fire-and-forget)
    prisma.profile
      .upsert({
        where: { userId },
        update: { lastSeen: new Date() },
        create: { userId, lastSeen: new Date() },
      })
      .catch(() => {});

    io.emit("user:offline", { userId });
    io.emit("user:status_change", { userId, status: "offline" });
  });
});

// ── Idle checker: every 60 s mark users idle if inactive > 5 min ─────────────
setInterval(() => {
  const now = Date.now();
  const fiveMin = 5 * 60 * 1000;
  getAllPresence().forEach((entry, uid) => {
    if (entry.manualStatus === "dnd") return;
    const wasOnline = now - entry.lastActive.getTime() < fiveMin;
    const status = getUserStatus(uid);
    io.emit("user:status_change", { userId: uid, status });
    void wasOnline; // suppress lint
  });
}, 60_000);

setIo(io);

// ── Event-start reminder scheduler ───────────────────────────────────────────
// Runs every 60 seconds. Emits notification:new to tournament participants
// when their tournament is ~1 hour away or is just starting.
function startEventScheduler() {
  const WINDOW = 90_000; // ±90 s tolerance window
  const alerted1h = new Set<string>();
  const alertedStart = new Set<string>();

  setInterval(async () => {
    try {
      const now = new Date();
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);

      const db = prisma;

      const upcoming = await db.tournament.findMany({
        where: {
          startAt: { not: null },
          status: { in: ["upcoming", "UPCOMING"] },
        },
        select: {
          id: true,
          name: true,
          game: true,
          startAt: true,
          participants: { select: { userId: true } },
        },
      });

      for (const t of upcoming) {
        if (!t.startAt) continue;
        const startMs = t.startAt.getTime();
        const diffToNow = startMs - now.getTime();
        const diffTo1h = Math.abs(startMs - in1h.getTime());

        // ~1 hour warning (within ±90s window, not already sent)
        if (diffTo1h < WINDOW && !alerted1h.has(t.id)) {
          alerted1h.add(t.id);
          const notif = {
            id: `event-1h-${t.id}`,
            type: "event-starting",
            title: "Event starting in 1 hour",
            body: `${t.name} (${t.game}) starts in about 1 hour`,
            timestamp: new Date().toISOString(),
            data: { tournamentId: t.id, game: t.game },
          };
          for (const p of t.participants) {
            io.to(`user:${p.userId}`).emit("notification:new", notif);
          }
        }

        // Just started (within ±90s window of start time, not already sent)
        if (Math.abs(diffToNow) < WINDOW && !alertedStart.has(t.id)) {
          alertedStart.add(t.id);
          const notif = {
            id: `event-start-${t.id}`,
            type: "event-started",
            title: "Event has started",
            body: `${t.name} (${t.game}) is now live!`,
            timestamp: new Date().toISOString(),
            data: { tournamentId: t.id, game: t.game },
          };
          for (const p of t.participants) {
            io.to(`user:${p.userId}`).emit("notification:new", notif);
          }
        }
      }
    } catch (err) {
      console.error("[scheduler] event reminder error:", err);
    }
  }, 60_000);
}

startEventScheduler();

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
