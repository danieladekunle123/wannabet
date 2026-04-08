import http from "http";
import path from "path";
import express from "express";
import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import app from "./app";
import { env } from "./lib/env";
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
import {
  setUserOnline,
  setUserOffline,
  setUserStatus,
  isUserOnline,
  setLastSeen,
  getLastSeen,
  setTyping,
  getOnlineUsers,
  publishPresence,
  subscribePresence,
  redis,
} from "./services/redis";

const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  },
});

// Socket.io JWT auth middleware
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) return next(new Error("Authentication error"));
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    (socket as any).data = { userId: decoded.userId };
    return next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);
  const userId = (socket as any).data.userId as string | undefined;
  console.log("[Socket] userId:", userId);

  if (userId) {
    // join personal room
    socket.join(`user:${userId}`);

    // Redis presence: mark online with 5-min TTL
    console.log("[Redis] setUserOnline:", userId);
    setUserOnline(userId).catch(() => {});
    console.log("[Socket] user online broadcast:", userId);
    publishPresence({ type: "online", userId, status: "online" }).catch(
      () => {},
    );

    // Load persisted manualStatus from DB (fire-and-forget)
    prisma.profile
      .findUnique({ where: { userId }, select: { manualStatus: true } })
      .then((p) => {
        const manual = p?.manualStatus ?? null;
        setPresence(userId, socket.id, manual);
        // Broadcast to everyone that this user is online/dnd
        io.emit("user:online", { userId });
        io.emit("user:status_change", {
          userId,
          status: getUserStatus(userId),
        });
      })
      .catch(() => {
        setPresence(userId, socket.id, null);
        io.emit("user:online", { userId });
        io.emit("user:status_change", { userId, status: "online" });
      });
  }

  // Activity heartbeat
  socket.on("activity_ping", () => {
    if (userId) updateActivity(userId);
  });

  // Redis heartbeat: refresh 5-min TTL
  socket.on("heartbeat", () => {
    if (userId) {
      console.log("[Heartbeat] refreshing:", userId);
      setUserOnline(userId).catch(() => {});
    }
  });

  // Manual status change
  socket.on("set_status", ({ status }: { status: string }) => {
    if (!userId) return;
    const allowed = ["online", "idle", "dnd", "offline"];
    if (!allowed.includes(status)) return;

    const manual = status === "online" || status === "idle" ? null : status;
    setManualStatus(userId, manual);

    // Sync to Redis
    if (status === "dnd") {
      setUserStatus(userId, "dnd").catch(() => {});
    } else if (status === "idle") {
      setUserStatus(userId, "away").catch(() => {});
    } else if (status === "online") {
      setUserOnline(userId).catch(() => {});
    }

    const resolved = getUserStatus(userId);
    io.emit("user:status_change", { userId, status: resolved });
    publishPresence({
      type: "status_change",
      userId,
      status: resolved as any,
    }).catch(() => {});

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

  // Typing indicator: stores in Redis with 3s TTL, broadcasts to chat room
  socket.on("typing", ({ chatId }: { chatId: string }) => {
    if (!userId || !chatId) return;
    setTyping(chatId, userId).catch(() => {});
    socket.to(chatId).emit("user:typing", { userId, chatId });
  });

  socket.on("disconnect", () => {
    console.log("[Socket] disconnected:", userId);
    if (!userId) return;
    removePresence(userId);

    // Store last seen in Redis
    setLastSeen(userId).catch(() => {});

    // Update lastSeen in DB (fire-and-forget)
    prisma.profile
      .upsert({
        where: { userId },
        update: { lastSeen: new Date() },
        create: { userId, lastSeen: new Date() },
      })
      .catch(() => {});

    // Online status controlled solely by Redis TTL + heartbeat.
    // The periodic offline checker will emit user:offline once the key expires.
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

// ── Redis Pub/Sub: sync presence across multiple servers ─────────────────────
subscribePresence((msg) => {
  switch (msg.type) {
    case "online":
      io.emit("user:online", { userId: msg.userId });
      io.emit("user:status_change", {
        userId: msg.userId,
        status: msg.status || "online",
      });
      break;
    case "offline":
      io.emit("user:offline", { userId: msg.userId });
      io.emit("user:status_change", { userId: msg.userId, status: "offline" });
      break;
    case "status_change":
      io.emit("user:status_change", {
        userId: msg.userId,
        status: msg.status || "offline",
      });
      break;
  }
});

// ── Periodic Redis offline check: every 30 s ─────────────────────────────────
const knownOnlineUsers = new Set<string>();

setInterval(async () => {
  try {
    const allUserIds = Array.from(getAllPresence().keys());
    // Also include users we previously knew as online
    const checkIds = Array.from(new Set([...allUserIds, ...knownOnlineUsers]));
    if (!checkIds.length) return;

    const onlineMap = await getOnlineUsers(checkIds);

    for (const uid of checkIds) {
      if (onlineMap[uid] !== "offline") {
        knownOnlineUsers.add(uid);
      } else if (knownOnlineUsers.has(uid)) {
        knownOnlineUsers.delete(uid);
        console.log("[Socket] user offline broadcast:", uid);
        io.emit("user:offline", { userId: uid });
        io.emit("user:status_change", { userId: uid, status: "offline" });
      }
    }
  } catch (err) {
    console.error("[OfflineCheck] error:", err);
  }
}, 30_000);

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

// Serve frontend static files (production)
const frontendDist = path.join(process.cwd(), "public");
app.use(express.static(frontendDist));
app.use((_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

if (process.env.NODE_ENV !== "test") {
  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}
