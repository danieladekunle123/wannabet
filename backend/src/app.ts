import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./lib/env";
import { getConfig } from "./lib/platformConfig";
import {
  setUserOnline,
  isUserOnline,
  getLastSeen,
  getOnlineUsers,
  publishPresence,
  subscribePresence,
  setTyping,
  setLastSeen,
  redis,
} from "./services/redis";
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
import { uploadRouter } from "./routes/upload.routes";
import { prisma } from "./lib/prisma";

const app = express();

app.set("trust proxy", true);
const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    (req as any).rawBody = req.body;
    next();
  },
);
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(async (req, res, next) => {
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
  } catch {}
  return next();
});
app.use("/stripe", stripeRouter);
app.use("/wallet", walletRouter);
app.use("/matches", matchRouter);
app.use("/disputes", disputeRouter);
app.use("/tournaments", tournamentRouter);
app.use("/events", eventsRouter);
app.use("/leaderboard", leaderboardRouter);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
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
    const onlinePlayers = [...getOnlineUsers().values()].filter(
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
app.use("/api", uploadRouter);
app.get("/debug/redis", async (_req, res) => {
  try {
    await setUserOnline("user1");
    await setUserOnline("user2");
    const results = await getOnlineUsers(["user1", "user2", "user3"]);
    return res.json({ results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
app.get("/debug/lastseen/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [online, lastSeen] = await Promise.all([
      isUserOnline(userId),
      getLastSeen(userId),
    ]);
    return res.json({ online, lastSeen });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
export default app;
