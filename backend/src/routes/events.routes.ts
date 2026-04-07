import { Router, type Request } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { requireAuth, requireRole } from "../middleware/auth";
import { updateTrustScore } from "../lib/trustScore";
import { getIo, emitEventUpdate } from "../lib/socket";
import {
  cacheGet,
  cacheSet,
  CACHE_KEYS,
  invalidateAllLobbyCaches,
} from "../services/redis";

// ─── Dispute evidence file upload ────────────────────────────────────────────
const disputeUploadDir = path.join(process.cwd(), "uploads", "disputes");
if (!fs.existsSync(disputeUploadDir)) {
  fs.mkdirSync(disputeUploadDir, { recursive: true });
}

const allowedDisputeMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const disputeMimeToExt: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const disputeUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, disputeUploadDir),
    filename: (_req, file, cb) => {
      const ext =
        disputeMimeToExt[file.mimetype] ||
        path.extname(file.originalname || "").toLowerCase() ||
        ".jpg";
      const base = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      cb(null, `${base}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!allowedDisputeMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG and WebP images are allowed"));
    }
    cb(null, true);
  },
});

export const eventsRouter = Router();

type EventType = "tournament" | "scrim" | "wager" | "custom";

type EventParticipant = {
  id: string;
  username: string;
};

type EventDTO = {
  id: string;
  sourceId: string;
  sourceType: "tournament" | "match";
  type: EventType;
  title: string;
  game: string;
  status:
    | "upcoming"
    | "ongoing"
    | "completed"
    | "cancelled"
    | "disputed"
    | "archived";
  hostId: string | null;
  participants: EventParticipant[];
  maxParticipants: number;
  date: string | null;
  time: string | null;
  region: string | null;
  teamSize: number | null;
  entryFee: number;
  prizePool: number;
  wagerAmount: number;
  format: string | null;
  platform: string;
  createdAt: string;
  startTime: string | null;
  endTime: string | null;
  description?: string | null;
  joinDeadline: string | null;
  isPrivate?: boolean;
  reportedWinnerId?: string | null;
  canReportResult?: boolean;
  canVerifyResult?: boolean;
};

const EditEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  startTime: z.never().optional(),
  entryFee: z.never().optional(),
  status: z.never().optional(),
  game: z.never().optional(),
  wagerAmount: z.never().optional(),
});

const ReportResultSchema = z.object({
  winnerId: z.string().min(1),
});

const VerifyResultSchema = z.object({
  agree: z.boolean().default(true),
});

const CreateMatchRequestSchema = z.object({
  recipientId: z.string().min(1),
  game: z.string().min(2).max(80),
  matchType: z.enum(["casual", "wager", "scrim"]),
  description: z.string().max(250).optional(),
  rounds: z.number().int().min(1).max(10),
  region: z.string().max(64).optional(),
  scheduledDate: z.string().max(32).optional(),
  scheduledTime: z.string().max(16).optional(),
  scheduledAt: z.string().max(64).optional(),
  wagerAmount: z.number().min(0).max(10000).optional(),
  message: z.string().max(200).optional(),
});

const UpdateMatchRequestSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function deriveJoinDeadline(startAt: Date | null): Date | null {
  if (!startAt) return null;
  return new Date(startAt.getTime() - 10 * 60 * 1000);
}

function isJoinWindowClosed(startAt: Date | null, joinDeadline: Date | null) {
  const now = Date.now();
  if (joinDeadline && now > joinDeadline.getTime()) return true;
  if (startAt && now >= startAt.getTime()) return true;
  return false;
}

async function releaseEscrowToBalance(
  tx: Prisma.TransactionClient,
  userId: string,
  requestedAmount: number,
  ledgerType: string,
) {
  const amount = Math.max(0, requestedAmount);
  if (amount <= 0) return 0;

  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) return 0;

  const releasable = Math.min(wallet.escrow, amount);
  if (releasable <= 0) return 0;

  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      escrow: { decrement: releasable },
      balance: { increment: releasable },
    },
  });
  await tx.ledgerEntry.create({
    data: {
      walletId: wallet.id,
      type: ledgerType,
      amount: releasable,
    },
  });

  return releasable;
}

async function settleWagerPayout(
  tx: Prisma.TransactionClient,
  match: { id: string; stake: number; hostId: string; joinerId: string | null },
  winnerId: string,
  payoutType: string,
) {
  const participantIds = [match.hostId, match.joinerId].filter(
    (id): id is string => !!id,
  );
  const uniqueParticipantIds = [...new Set(participantIds)];

  let pot = 0;
  for (const participantId of uniqueParticipantIds) {
    const wallet = await tx.wallet.findUnique({
      where: { userId: participantId },
    });
    if (!wallet) continue;
    const locked = Math.min(wallet.escrow, match.stake);
    if (locked <= 0) continue;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { escrow: { decrement: locked } },
    });
    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type: "MATCH_ESCROW_RELEASE",
        amount: -locked,
      },
    });
    pot += locked;
  }

  if (pot <= 0) return 0;

  const winnerWallet = await tx.wallet.upsert({
    where: { userId: winnerId },
    create: { userId: winnerId, balance: 0, escrow: 0 },
    update: {},
  });

  await tx.wallet.update({
    where: { id: winnerWallet.id },
    data: { balance: { increment: pot } },
  });
  await tx.ledgerEntry.create({
    data: {
      walletId: winnerWallet.id,
      type: payoutType,
      amount: pot,
    },
  });

  return pot;
}

function normalizeStatus(
  storedStatus: string | null | undefined,
  startTime: Date | null,
  endTime: Date | null,
):
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "disputed"
  | "archived" {
  const status = (storedStatus || "").toLowerCase();
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("disput")) return "disputed";
  if (status.includes("archiv")) return "archived";
  if (
    status.includes("complete") ||
    status.includes("finished") ||
    status.includes("closed") ||
    status.includes("result_confirmed")
  ) {
    return "completed";
  }
  if (status.includes("result_reported")) {
    return "completed";
  }
  if (
    status.includes("ongoing") ||
    status.includes("active") ||
    status.includes("live")
  ) {
    return "ongoing";
  }

  // If the DB status is explicitly "upcoming" or "open", trust it —
  // never let time-based logic override an unstarted match.
  if (status.includes("upcoming") || status.includes("open")) {
    return "upcoming";
  }

  const now = Date.now();
  const start = startTime?.getTime();
  const end = endTime?.getTime();

  if (start && now < start) return "upcoming";
  if (start && now >= start) return "ongoing";
  if (end && now > end) return "completed";

  return "upcoming";
}

function asDateAndTime(iso: string | null): {
  date: string | null;
  time: string | null;
} {
  if (!iso) return { date: null, time: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: null, time: null };
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toISOString().slice(11, 16),
  };
}

function isPendingMatchRequest(meta: unknown): meta is Record<string, unknown> {
  if (!meta || typeof meta !== "object") return false;
  const status = (meta as Record<string, unknown>).status;
  return typeof status === "string" && status.toLowerCase() === "pending";
}

function getOptionalUserIdFromRequest(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId?: string };
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

function canViewPrivateMatch(event: EventDTO, viewerUserId?: string | null) {
  if (!event.isPrivate) return true;
  if (!viewerUserId) return false;
  if (event.hostId === viewerUserId) return true;
  return event.participants.some(
    (participant) => participant.id === viewerUserId,
  );
}

function normalizeRequestMatchType(value: unknown): EventType {
  const raw = typeof value === "string" ? value.toLowerCase() : "";
  if (raw === "wager") return "wager";
  if (raw === "scrim") return "scrim";
  return "custom";
}

async function getMatchMetaMap(matchIds: string[]): Promise<
  Map<
    string,
    {
      type: EventType;
      participantCount: number;
      startAt: string | null;
      title: string | null;
      description: string | null;
      region: string | null;
      teamSize: number | null;
      format: string | null;
      joinDeadlineAt: string | null;
      privateMatch: boolean;
    }
  >
> {
  const map = new Map<
    string,
    {
      type: EventType;
      participantCount: number;
      startAt: string | null;
      title: string | null;
      description: string | null;
      region: string | null;
      teamSize: number | null;
      format: string | null;
      joinDeadlineAt: string | null;
      privateMatch: boolean;
    }
  >();
  if (matchIds.length === 0) return map;

  const requested = new Set(matchIds);
  const logs = await prisma.playerLog.findMany({
    where: { type: "MATCH_CREATED" },
    select: { meta: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  for (const log of logs) {
    const meta = (log.meta || {}) as Record<string, unknown>;
    const matchId = typeof meta.matchId === "string" ? meta.matchId : null;
    if (!matchId || !requested.has(matchId) || map.has(matchId)) continue;

    const rawType = typeof meta.matchType === "string" ? meta.matchType : "";
    const type: EventType =
      rawType === "tournament" ||
      rawType === "scrim" ||
      rawType === "wager" ||
      rawType === "custom"
        ? rawType
        : "custom";

    const participantCount =
      typeof meta.participantCount === "number"
        ? Math.max(2, Math.floor(meta.participantCount))
        : 2;

    const startAt = typeof meta.startAt === "string" ? meta.startAt : null;

    map.set(matchId, {
      type,
      participantCount,
      startAt,
      title: typeof meta.title === "string" ? meta.title : null,
      description:
        typeof meta.description === "string" ? meta.description : null,
      region: typeof meta.region === "string" ? meta.region : null,
      teamSize:
        typeof meta.teamSize === "number"
          ? Math.max(1, Math.floor(meta.teamSize))
          : null,
      format:
        typeof meta.tournamentFormat === "string"
          ? meta.tournamentFormat
          : null,
      joinDeadlineAt:
        typeof meta.joinDeadlineAt === "string" ? meta.joinDeadlineAt : null,
      privateMatch: Boolean(meta.privateMatch),
    });
  }

  return map;
}

async function getTournamentMetaMap(tournamentIds: string[]): Promise<
  Map<
    string,
    {
      hostId: string;
      participantCount: number;
      region: string | null;
      teamSize: number | null;
      format: string | null;
      joinDeadlineAt: string | null;
    }
  >
> {
  const map = new Map<
    string,
    {
      hostId: string;
      participantCount: number;
      region: string | null;
      teamSize: number | null;
      format: string | null;
      joinDeadlineAt: string | null;
    }
  >();
  if (tournamentIds.length === 0) return map;

  const requested = new Set(tournamentIds);
  const logs = await prisma.playerLog.findMany({
    where: { type: "TOURNAMENT_CREATED" },
    select: { userId: true, meta: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  for (const log of logs) {
    const meta = (log.meta || {}) as Record<string, unknown>;
    const tournamentId =
      typeof meta.tournamentId === "string" ? meta.tournamentId : null;
    if (
      !tournamentId ||
      !requested.has(tournamentId) ||
      map.has(tournamentId)
    ) {
      continue;
    }

    const participantCount =
      typeof meta.participantCount === "number"
        ? Math.max(1, Math.floor(meta.participantCount))
        : 32;

    map.set(tournamentId, {
      hostId: log.userId,
      participantCount,
      region: typeof meta.region === "string" ? meta.region : null,
      teamSize:
        typeof meta.teamSize === "number"
          ? Math.max(1, Math.floor(meta.teamSize))
          : null,
      format:
        typeof meta.tournamentFormat === "string"
          ? meta.tournamentFormat
          : null,
      joinDeadlineAt:
        typeof meta.joinDeadlineAt === "string" ? meta.joinDeadlineAt : null,
    });
  }

  return map;
}

function mapMatchToEvent(
  match: {
    id: string;
    game: string;
    stake: number;
    status: string;
    createdAt: Date;
    hostId: string;
    host: { id: string; username: string };
    joinerId: string | null;
    joiner: { id: string; username: string } | null;
    reportedWinnerId: string | null;
  },
  matchMetaMap: Map<
    string,
    {
      type: EventType;
      participantCount: number;
      startAt: string | null;
      title: string | null;
      description: string | null;
      region: string | null;
      teamSize: number | null;
      format: string | null;
      joinDeadlineAt: string | null;
      privateMatch: boolean;
    }
  >,
): EventDTO {
  const meta = matchMetaMap.get(match.id);
  const inferredType: EventType =
    meta?.type || (match.stake > 0 ? "wager" : "scrim");

  const participants: EventParticipant[] = [
    { id: match.host.id, username: match.host.username },
  ];
  if (match.joiner) {
    participants.push({ id: match.joiner.id, username: match.joiner.username });
  }

  const startTime = meta?.startAt ? new Date(meta.startAt) : null;
  const joinDeadline =
    parseIsoDate(meta?.joinDeadlineAt) || deriveJoinDeadline(startTime);
  const endTime = null;
  const normalizedStatus = normalizeStatus(match.status, startTime, endTime);
  const { date, time } = asDateAndTime(startTime?.toISOString() || null);

  const maxParticipants = meta?.participantCount ?? 2;

  return {
    id: `match-${match.id}`,
    sourceId: match.id,
    sourceType: "match",
    type: inferredType,
    title:
      meta?.title ||
      `${match.game} ${
        inferredType === "wager"
          ? "Wager"
          : inferredType === "scrim"
            ? "Scrim"
            : "Match"
      }`,
    game: match.game,
    status: normalizedStatus,
    hostId: match.hostId,
    participants,
    maxParticipants,
    date,
    time,
    region: meta?.region ?? null,
    teamSize: meta?.teamSize ?? null,
    entryFee: match.stake,
    prizePool: match.stake * Math.max(1, participants.length),
    wagerAmount: match.stake,
    format: meta?.format ?? null,
    platform: "WannaBet",
    createdAt: match.createdAt.toISOString(),
    startTime: startTime?.toISOString() || null,
    endTime: null,
    description: meta?.description ?? null,
    joinDeadline: joinDeadline?.toISOString() || null,
    isPrivate: meta?.privateMatch ?? false,
    reportedWinnerId: match.reportedWinnerId,
    canReportResult: !!match.joinerId && match.status === "ONGOING",
    canVerifyResult: match.status === "RESULT_REPORTED",
  };
}

function mapTournamentToEvent(
  tournament: {
    id: string;
    name: string;
    description: string | null;
    game: string;
    entryFee: number;
    status: string;
    startAt: Date | null;
    createdAt: Date;
    participants: Array<{ user: { id: string; username: string } }>;
  },
  tournamentMetaMap: Map<
    string,
    {
      hostId: string;
      participantCount: number;
      region: string | null;
      teamSize: number | null;
      format: string | null;
      joinDeadlineAt: string | null;
    }
  >,
): EventDTO {
  const participants: EventParticipant[] = tournament.participants.map(
    (entry) => ({
      id: entry.user.id,
      username: entry.user.username,
    }),
  );

  const startTime = tournament.startAt ?? null;
  const endTime = null;
  const normalizedStatus = normalizeStatus(
    tournament.status,
    startTime,
    endTime,
  );
  const { date, time } = asDateAndTime(startTime?.toISOString() || null);

  const meta = tournamentMetaMap.get(tournament.id);
  const hostId = meta?.hostId || null;
  const maxParticipants = meta?.participantCount ?? 32;
  const joinDeadline =
    parseIsoDate(meta?.joinDeadlineAt) || deriveJoinDeadline(startTime);

  return {
    id: `tournament-${tournament.id}`,
    sourceId: tournament.id,
    sourceType: "tournament",
    type: "tournament",
    title: tournament.name,
    game: tournament.game,
    status: normalizedStatus,
    hostId,
    participants,
    maxParticipants,
    date,
    time,
    region: meta?.region ?? null,
    teamSize: meta?.teamSize ?? null,
    entryFee: tournament.entryFee,
    prizePool: tournament.entryFee * participants.length,
    wagerAmount: 0,
    format: meta?.format ?? null,
    platform: "WannaBet",
    createdAt: tournament.createdAt.toISOString(),
    startTime: startTime?.toISOString() || null,
    endTime: null,
    description: tournament.description,
    joinDeadline: joinDeadline?.toISOString() || null,
    isPrivate: false,
    reportedWinnerId: null,
    canReportResult: false,
    canVerifyResult: false,
  };
}

async function buildUnifiedEvents(userId?: string): Promise<EventDTO[]> {
  await promoteStartedTournamentsToOngoing();

  const matchQuery: Parameters<typeof prisma.match.findMany>[0] = {
    include: {
      host: { select: { id: true, username: true } },
      joiner: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  };
  if (userId) {
    matchQuery.where = { OR: [{ hostId: userId }, { joinerId: userId }] };
  }

  const tournamentQuery: Parameters<typeof prisma.tournament.findMany>[0] = {
    include: {
      participants: {
        include: { user: { select: { id: true, username: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  };

  const [matches, tournaments] = await Promise.all([
    prisma.match.findMany(matchQuery),
    prisma.tournament.findMany(tournamentQuery),
  ]);

  const [matchMetaMap, tournamentMetaMap] = await Promise.all([
    getMatchMetaMap(matches.map((m) => m.id)),
    getTournamentMetaMap(tournaments.map((t) => t.id)),
  ]);

  const matchEvents = (
    matches as unknown as Array<Parameters<typeof mapMatchToEvent>[0]>
  ).map((match) => mapMatchToEvent(match, matchMetaMap));
  const tournamentEvents = (
    tournaments as unknown as Array<Parameters<typeof mapTournamentToEvent>[0]>
  ).map((tournament) => mapTournamentToEvent(tournament, tournamentMetaMap));

  return [...matchEvents, ...tournamentEvents]
    .filter((event) => {
      if (!userId) return true;
      if (event.hostId === userId) return true;
      return event.participants.some((p) => p.id === userId);
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function byType(type: EventType) {
  return (event: EventDTO) => event.type === type;
}

function isActiveEventStatus(status: EventDTO["status"]) {
  return (
    status !== "completed" && status !== "cancelled" && status !== "archived"
  );
}

async function promoteStartedTournamentsToOngoing() {
  const now = new Date();
  await prisma.tournament.updateMany({
    where: {
      startAt: { lte: now },
      status: { in: ["upcoming", "open"] },
    },
    data: { status: "ongoing" },
  });
}

// Cached version of buildUnifiedEvents() for public endpoints
async function getCachedPublicEvents(): Promise<EventDTO[]> {
  const cached = await cacheGet<EventDTO[]>(CACHE_KEYS.allPublic);
  if (cached) return cached;
  const events = await buildUnifiedEvents();
  await cacheSet(CACHE_KEYS.allPublic, events, 30);
  return events;
}

eventsRouter.get("/my", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const events = await buildUnifiedEvents(userId);
    return res.json({ events });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message ?? "Failed to load events" });
  }
});

eventsRouter.get("/tournaments", async (_req, res) => {
  try {
    const viewerUserId = getOptionalUserIdFromRequest(_req);
    const events = await getCachedPublicEvents();
    return res.json({
      events: events
        .filter(byType("tournament"))
        .filter((event) => isActiveEventStatus(event.status))
        .filter((event) => canViewPrivateMatch(event, viewerUserId)),
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message ?? "Failed to load tournaments" });
  }
});

eventsRouter.get("/scrims", async (_req, res) => {
  try {
    const viewerUserId = getOptionalUserIdFromRequest(_req);
    const events = await getCachedPublicEvents();
    return res.json({
      events: events
        .filter(byType("scrim"))
        .filter((event) => isActiveEventStatus(event.status))
        .filter((event) => canViewPrivateMatch(event, viewerUserId)),
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message ?? "Failed to load scrims" });
  }
});

eventsRouter.get("/wagers", async (_req, res) => {
  try {
    const viewerUserId = getOptionalUserIdFromRequest(_req);
    const events = await getCachedPublicEvents();
    return res.json({
      events: events
        .filter(byType("wager"))
        .filter((event) => isActiveEventStatus(event.status))
        .filter((event) => canViewPrivateMatch(event, viewerUserId)),
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message ?? "Failed to load wagers" });
  }
});

eventsRouter.get("/custom", async (_req, res) => {
  try {
    const viewerUserId = getOptionalUserIdFromRequest(_req);
    const events = await getCachedPublicEvents();
    return res.json({
      events: events
        .filter(byType("custom"))
        .filter((event) => isActiveEventStatus(event.status))
        .filter((event) => canViewPrivateMatch(event, viewerUserId)),
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message ?? "Failed to load custom events" });
  }
});

// GET /events/active -> all public non-completed/non-cancelled events
eventsRouter.get("/active", async (_req, res) => {
  try {
    const viewerUserId = getOptionalUserIdFromRequest(_req);
    const events = await getCachedPublicEvents();
    return res.json({
      events: events
        .filter((event) => isActiveEventStatus(event.status))
        .filter((event) => canViewPrivateMatch(event, viewerUserId)),
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message ?? "Failed to load active events" });
  }
});

// ─── Recommendation helpers ───────────────────────────────────────────────────

type UserActivityProfile = {
  preferredGames: string[];
  preferredRegions: string[];
  preferredTypes: string[];
  avgWager: number;
  activityFrequency: number;
  totalMatches: number;
};

async function buildUserProfile(userId: string): Promise<UserActivityProfile> {
  const [matches, tournamentEntries] = await Promise.all([
    prisma.match.findMany({
      where: {
        OR: [{ hostId: userId }, { joinerId: userId }],
        status: { not: "OPEN" },
      },
      select: { id: true, game: true, stake: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.tournamentEntry.findMany({
      where: { userId },
      include: { tournament: { select: { game: true } } },
    }),
  ]);

  const matchIds = matches.map((m) => m.id);
  const metaMap =
    matchIds.length > 0 ? await getMatchMetaMap(matchIds) : new Map();

  const gameCounts: Record<string, number> = {};
  const regionCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  let totalWager = 0;
  let wagerCount = 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  let recentCount = 0;

  for (const m of matches) {
    gameCounts[m.game] = (gameCounts[m.game] ?? 0) + 1;
    const meta = metaMap.get(m.id);
    if (meta?.region)
      regionCounts[meta.region] = (regionCounts[meta.region] ?? 0) + 1;
    const type: string = meta?.type ?? (m.stake > 0 ? "wager" : "scrim");
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    if (m.stake > 0) {
      totalWager += m.stake;
      wagerCount++;
    }
    if (m.createdAt >= thirtyDaysAgo) recentCount++;
  }

  for (const entry of tournamentEntries) {
    const g = entry.tournament.game;
    gameCounts[g] = (gameCounts[g] ?? 0) + 1;
    typeCounts["tournament"] = (typeCounts["tournament"] ?? 0) + 1;
  }

  const sortBy = (obj: Record<string, number>) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

  return {
    preferredGames: sortBy(gameCounts).slice(0, 5),
    preferredRegions: sortBy(regionCounts).slice(0, 3),
    preferredTypes: sortBy(typeCounts).slice(0, 3),
    avgWager: wagerCount > 0 ? Math.round(totalWager / wagerCount) : 0,
    activityFrequency: recentCount,
    totalMatches: matches.length,
  };
}

function scoreEvent(
  event: EventDTO,
  profile: UserActivityProfile,
): { score: number; reason: string } {
  let score = 0;
  let topReason = "Trending now";
  let topContrib = 0;

  // Game match: 0–40 pts
  const gameIdx = profile.preferredGames.indexOf(event.game);
  const gameScore =
    gameIdx === 0
      ? 40
      : gameIdx === 1
        ? 32
        : gameIdx === 2
          ? 24
          : gameIdx >= 3
            ? 16
            : 0;
  score += gameScore;
  if (gameScore > topContrib) {
    topContrib = gameScore;
    topReason = gameIdx === 0 ? "Your top game" : "Preferred game";
  }

  // Region match: 0–20 pts
  const regionIdx = profile.preferredRegions.indexOf(event.region ?? "");
  const regionScore =
    regionIdx === 0 ? 20 : regionIdx === 1 ? 14 : regionIdx >= 2 ? 9 : 0;
  score += regionScore;
  if (regionScore > topContrib) {
    topContrib = regionScore;
    topReason = "Your region";
  }

  // Type preference: 0–25 pts
  const typeIdx = profile.preferredTypes.indexOf(event.type);
  const typeScore =
    typeIdx === 0 ? 25 : typeIdx === 1 ? 18 : typeIdx >= 2 ? 12 : 0;
  score += typeScore;
  if (typeScore > topContrib) {
    topContrib = typeScore;
    topReason =
      event.type === "wager"
        ? "Preferred: wager"
        : event.type === "tournament"
          ? "Love tournaments"
          : "Great scrim";
  }

  // Entry fee compatibility: 0–10 pts
  if (profile.avgWager > 0) {
    const diff = Math.abs(event.entryFee - profile.avgWager) / profile.avgWager;
    const feeScore = diff < 0.3 ? 10 : diff < 0.6 ? 6 : diff < 1.0 ? 3 : 0;
    score += feeScore;
    if (feeScore >= 9 && feeScore > topContrib) {
      topContrib = feeScore;
      topReason = "Matches your stakes";
    }
  }

  // Activity bonus: active users get 5 pts
  if (profile.activityFrequency >= 5) score += 5;

  return { score: Math.min(100, score), reason: topReason };
}

// GET /events/recommended – personalised event suggestions
eventsRouter.get("/recommended", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [profile, allEvents] = await Promise.all([
      buildUserProfile(userId),
      buildUnifiedEvents(),
    ]);

    const candidates = allEvents
      .filter((e) => isActiveEventStatus(e.status))
      .filter((e) => canViewPrivateMatch(e, userId))
      .filter((e) => e.hostId !== userId)
      .filter((e) => !e.participants.some((p) => p.id === userId));

    const scored = candidates
      .map((e) => {
        const { score, reason } = scoreEvent(e, profile);
        return { ...e, matchScore: score, reason };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return res.json({ events: scored, userProfile: profile });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err?.message ?? "Failed to load recommendations" });
  }
});

// GET /events/source/:id -> single event lookup by source id
eventsRouter.get("/source/:id", async (req, res) => {
  try {
    const sourceId = String(req.params.id || "");
    if (!sourceId) {
      return res.status(400).json({ message: "Missing event source id" });
    }

    const events = await buildUnifiedEvents();
    const event = events.find((row) => row.sourceId === sourceId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const viewerUserId = getOptionalUserIdFromRequest(req);
    if (!canViewPrivateMatch(event, viewerUserId)) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.json({ event });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message ?? "Failed to load event" });
  }
});

// PATCH /events/:sourceType/:id
eventsRouter.patch("/:sourceType/:id", requireAuth, async (req, res) => {
  try {
    const sourceType = String(req.params.sourceType || "");
    const id = String(req.params.id || "");
    const userId = req.user!.userId;
    const payload = EditEventSchema.parse(req.body);

    if (sourceType === "match") {
      const match = await prisma.match.findUnique({ where: { id } });
      if (!match) return res.status(404).json({ message: "Event not found" });
      if (match.hostId !== userId) {
        return res
          .status(403)
          .json({ message: "Only host can edit this event" });
      }
      if (match.joinerId) {
        return res.status(400).json({
          message:
            "This event is locked because at least one participant has joined.",
        });
      }
      if (!["UPCOMING", "OPEN"].includes(match.status)) {
        return res
          .status(400)
          .json({ message: "Only upcoming/open events can be edited" });
      }
      if (!payload.title && !payload.description) {
        return res.status(400).json({
          message: "Only title and description can be edited for matches",
        });
      }

      await prisma.playerLog.create({
        data: {
          userId,
          actorId: userId,
          type: "MATCH_EDITED",
          message: `Edited match ${id}`,
          meta: {
            matchId: id,
            title: payload.title,
            description: payload.description,
          },
        },
      });

      await invalidateAllLobbyCaches();
      return res.json({ ok: true });
    }

    if (sourceType === "tournament") {
      const metaMap = await getTournamentMetaMap([id]);
      const hostId = metaMap.get(id)?.hostId || null;
      if (hostId !== userId) {
        return res
          .status(403)
          .json({ message: "Only host can edit this event" });
      }

      const existing = await prisma.tournament.findUnique({
        where: { id },
        include: { participants: { select: { id: true } } },
      });
      if (!existing)
        return res.status(404).json({ message: "Event not found" });
      if (existing.participants.length > 0) {
        return res.status(400).json({
          message:
            "This event is locked because at least one participant has joined.",
        });
      }
      if (
        !["upcoming", "open"].includes((existing.status || "").toLowerCase())
      ) {
        return res
          .status(400)
          .json({ message: "Only upcoming/open events can be edited" });
      }

      const data: Record<string, unknown> = {};
      if (payload.title !== undefined) data.name = payload.title;
      if (payload.description !== undefined)
        data.description = payload.description;
      if (!Object.keys(data).length) {
        return res
          .status(400)
          .json({ message: "Only title and description can be edited" });
      }

      const updated = await prisma.tournament.update({ where: { id }, data });
      await invalidateAllLobbyCaches();
      return res.json({ event: updated });
    }

    return res.status(400).json({ message: "Invalid source type" });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err.message ?? "Failed to edit event" });
  }
});

// POST /events/:sourceType/:id/join
eventsRouter.post("/:sourceType/:id/join", requireAuth, async (req, res) => {
  try {
    const sourceType = String(req.params.sourceType || "");
    const id = String(req.params.id || "");
    const userId = req.user!.userId;

    if (sourceType === "match") {
      const result = await prisma.$transaction(async (tx) => {
        const match = await tx.match.findUnique({ where: { id } });
        if (!match) throw new Error("Match not found");
        if (match.hostId === userId) {
          throw new Error("Host cannot join their own event");
        }
        if (!["UPCOMING", "OPEN"].includes(match.status)) {
          throw new Error("Match is not open for joining");
        }

        const metaMap = await getMatchMetaMap([id]);
        const meta = metaMap.get(id);
        const startAt = parseIsoDate(meta?.startAt);
        const joinDeadline =
          parseIsoDate(meta?.joinDeadlineAt) || deriveJoinDeadline(startAt);
        if (isJoinWindowClosed(startAt, joinDeadline)) {
          throw new Error("Join window has closed for this event");
        }

        const maxParticipants = meta?.participantCount ?? 2;
        const currentParticipants = match.joinerId ? 1 : 0;
        if (currentParticipants >= maxParticipants || !!match.joinerId) {
          throw new Error("Match Full");
        }

        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet || wallet.balance < match.stake) {
          throw new Error("Insufficient wallet balance to join this match.");
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: match.stake },
            escrow: { increment: match.stake },
          },
        });

        const updated = await tx.match.update({
          where: { id },
          data: { joinerId: userId, status: "UPCOMING" },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: "ESCROW_LOCK_JOINER",
            amount: match.stake,
          },
        });

        await tx.playerLog.create({
          data: {
            userId,
            actorId: userId,
            type: "MATCH_JOINED",
            message: `Joined match ${id}`,
            meta: { matchId: id },
          },
        });

        return updated;
      });

      await invalidateAllLobbyCaches();
      return res.json({ event: result });
    }

    if (sourceType === "tournament") {
      const metaMap = await getTournamentMetaMap([id]);
      const maxParticipants = metaMap.get(id)?.participantCount ?? 32;

      await prisma.$transaction(async (tx) => {
        // 1) Fetch event
        const tournament = await tx.tournament.findUnique({ where: { id } });
        if (!tournament) {
          throw new Error("Tournament not found");
        }

        // lifecycle gate: only upcoming/open tournaments can be joined
        if (
          !["upcoming", "open"].includes(
            (tournament.status || "").toLowerCase(),
          )
        ) {
          throw new Error("Tournament is not open for joining");
        }

        const startAt = tournament.startAt;
        const joinDeadline =
          parseIsoDate(metaMap.get(id)?.joinDeadlineAt) ||
          deriveJoinDeadline(startAt);
        if (isJoinWindowClosed(startAt, joinDeadline)) {
          throw new Error("Join window has closed for this event");
        }

        // Duplicate join guard
        const alreadyJoined = await tx.tournamentEntry.findUnique({
          where: {
            tournamentId_userId: {
              tournamentId: id,
              userId,
            },
          },
        });
        if (alreadyJoined) {
          throw new Error("User already joined this event");
        }

        const currentParticipants = await tx.tournamentEntry.count({
          where: { tournamentId: id },
        });
        if (currentParticipants >= maxParticipants) {
          throw new Error("Match Full");
        }

        // 2) Fetch wallet
        let wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId, balance: 0, escrow: 0 },
          });
        }

        // 3) Validate and deduct
        if (tournament.entryFee > 0) {
          if (wallet.balance < tournament.entryFee) {
            throw new Error(
              "Insufficient wallet balance to join this tournament.",
            );
          }

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
              type: "TOURNAMENT_ESCROW_LOCK",
              amount: tournament.entryFee,
            },
          });
        }

        // 4) Add participant
        await tx.tournamentEntry.create({
          data: {
            tournamentId: id,
            userId,
            paid: tournament.entryFee > 0,
          },
        });
      });

      await invalidateAllLobbyCaches();
      return res.json({ ok: true });
    }

    return res.status(400).json({ message: "Invalid source type" });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err.message ?? "Failed to join event" });
  }
});

// POST /events/:sourceType/:id/start
eventsRouter.post("/:sourceType/:id/start", requireAuth, async (req, res) => {
  try {
    const sourceType = String(req.params.sourceType || "");
    const id = String(req.params.id || "");
    const userId = req.user!.userId;

    if (sourceType === "match") {
      const match = await prisma.match.findUnique({ where: { id } });
      if (!match) return res.status(404).json({ message: "Event not found" });
      if (match.hostId !== userId) {
        return res
          .status(403)
          .json({ message: "Only host can start this event" });
      }
      if (!match.joinerId) {
        return res
          .status(400)
          .json({ message: "Cannot start event before an opponent joins" });
      }
      const updated = await prisma.match.update({
        where: { id },
        data: { status: "ONGOING" },
      });
      await invalidateAllLobbyCaches();
      return res.json({ event: updated });
    }

    if (sourceType === "tournament") {
      const metaMap = await getTournamentMetaMap([id]);
      const hostId = metaMap.get(id)?.hostId || null;
      if (hostId !== userId) {
        return res
          .status(403)
          .json({ message: "Only host can start this event" });
      }
      const updated = await prisma.tournament.update({
        where: { id },
        data: { status: "ongoing" },
      });
      await invalidateAllLobbyCaches();
      return res.json({ event: updated });
    }

    return res.status(400).json({ message: "Invalid source type" });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err.message ?? "Failed to start event" });
  }
});

// PATCH /events/:id/start (match-only alias)
eventsRouter.patch("/:id/start", requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const userId = req.user!.userId;

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ message: "Event not found" });
    if (match.hostId !== userId) {
      return res
        .status(403)
        .json({ message: "Only host can start this event" });
    }
    if (!match.joinerId) {
      return res
        .status(400)
        .json({ message: "Cannot start event before an opponent joins" });
    }

    const updated = await prisma.match.update({
      where: { id },
      data: { status: "ONGOING" },
    });

    await invalidateAllLobbyCaches();
    return res.json({ event: updated });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err.message ?? "Failed to start event" });
  }
});

const SubmitResultSchema = z.object({
  winnerId: z.string().min(1),
  score: z.string().trim().max(80).optional().default(""),
});

const UploadEvidenceSchema = z.object({
  evidenceUrl: z.string().min(1, "Evidence text is required"),
});

// POST /events/:id/submit-result
eventsRouter.post("/:id/submit-result", requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const userId = req.user!.userId;
    const { winnerId, score } = SubmitResultSchema.parse(req.body || {});

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ message: "Event not found" });
    if (match.status !== "ONGOING") {
      return res.status(400).json({ message: "Match is not ongoing" });
    }

    const participantIds = [match.hostId, match.joinerId].filter(
      (entry): entry is string => !!entry,
    );
    if (!participantIds.includes(userId)) {
      return res.status(403).json({ message: "Not a match participant" });
    }
    if (!participantIds.includes(winnerId)) {
      return res
        .status(400)
        .json({ message: "winnerId must be a participant" });
    }

    await prisma.playerLog.create({
      data: {
        userId,
        actorId: userId,
        type: "MATCH_RESULT_SUBMISSION",
        message: `Submitted result for match ${id}`,
        meta: {
          matchId: id,
          winnerId,
          score,
          submittedAt: new Date().toISOString(),
        },
      },
    });

    const recentLogs = await prisma.playerLog.findMany({
      where: {
        type: "MATCH_RESULT_SUBMISSION",
        userId: { in: participantIds },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const latestByUser = new Map<
      string,
      { winnerId: string; score: string; submittedAt: string }
    >();

    for (const log of recentLogs) {
      const meta = (log.meta || {}) as Record<string, unknown>;
      const logMatchId = typeof meta.matchId === "string" ? meta.matchId : "";
      if (logMatchId !== id) continue;
      if (latestByUser.has(log.userId)) continue;

      latestByUser.set(log.userId, {
        winnerId: typeof meta.winnerId === "string" ? meta.winnerId : "",
        score: typeof meta.score === "string" ? meta.score : "",
        submittedAt:
          typeof meta.submittedAt === "string"
            ? meta.submittedAt
            : log.createdAt.toISOString(),
      });
    }

    const submissions = participantIds
      .map((participantId) => {
        const item = latestByUser.get(participantId);
        if (!item) return null;
        return {
          userId: participantId,
          winnerId: item.winnerId,
          score: item.score,
          submittedAt: item.submittedAt,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => !!entry);

    if (submissions.length < participantIds.length) {
      return res.json({
        ok: true,
        status: "pending",
        submissions,
      });
    }

    const firstSubmission = submissions[0];
    if (!firstSubmission) {
      return res.status(400).json({ message: "No valid submissions found" });
    }

    const allSameWinner = submissions.every(
      (entry) => entry.winnerId === firstSubmission.winnerId,
    );

    if (!allSameWinner) {
      await prisma.$transaction(async (tx) => {
        await tx.match.update({
          where: { id },
          data: { status: "DISPUTED" },
        });

        const existingDispute = await tx.dispute.findFirst({
          where: { matchId: id },
        });
        if (!existingDispute) {
          await tx.dispute.create({
            data: {
              matchId: id,
              disputantId: userId,
              evidence: "",
              status: "open",
            },
          });
        }
      });

      return res.json({
        ok: true,
        status: "disputed",
        submissions,
      });
    }

    const resolvedWinnerId = firstSubmission.winnerId;

    await prisma.$transaction(async (tx) => {
      const liveMatch = await tx.match.findUnique({ where: { id } });
      if (!liveMatch) throw new Error("Event not found");

      if (liveMatch.stake > 0) {
        await settleWagerPayout(
          tx,
          {
            id: liveMatch.id,
            stake: liveMatch.stake,
            hostId: liveMatch.hostId,
            joinerId: liveMatch.joinerId,
          },
          resolvedWinnerId,
          "MATCH_WIN_PAYOUT",
        );
      }

      await tx.match.update({
        where: { id },
        data: {
          status: "COMPLETED",
          reportedWinnerId: resolvedWinnerId,
          reportedById: userId,
        },
      });
    });

    await invalidateAllLobbyCaches();
    return res.json({
      ok: true,
      status: "completed",
      winnerId: resolvedWinnerId,
      submissions,
    });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message ?? "Failed to submit result" });
  }
});

// POST /events/:id/upload-evidence
eventsRouter.post("/:id/upload-evidence", requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const userId = req.user!.userId;
    const { evidenceUrl } = UploadEvidenceSchema.parse(req.body || {});

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ message: "Event not found" });

    const participantIds = [match.hostId, match.joinerId].filter(
      (entry): entry is string => !!entry,
    );
    if (!participantIds.includes(userId)) {
      return res.status(403).json({ message: "Not a match participant" });
    }
    if (match.status !== "DISPUTED") {
      return res.status(400).json({ message: "Match is not disputed" });
    }

    const existing = await prisma.dispute.findFirst({
      where: { matchId: id, disputantId: userId },
    });

    const evidenceValue = existing?.evidence
      ? `${existing.evidence}\n${evidenceUrl}`
      : evidenceUrl;

    if (existing) {
      await prisma.dispute.update({
        where: { id: existing.id },
        data: { evidence: evidenceValue, status: "open" },
      });
    } else {
      await prisma.dispute.create({
        data: {
          matchId: id,
          disputantId: userId,
          evidence: evidenceValue,
          status: "open",
        },
      });
    }

    return res.json({ ok: true });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message ?? "Failed to upload evidence" });
  }
});

// POST /events/:id/upload-evidence-image
// Accepts multipart/form-data with field "file" (JPEG / PNG / WebP, max 10 MB).
// Saves the image to uploads/disputes/ and appends the public URL to the dispute record.
eventsRouter.post(
  "/:id/upload-evidence-image",
  requireAuth,
  (req, res, next) => {
    disputeUpload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "Image must be 10 MB or smaller" });
      }
      if (err)
        return res
          .status(400)
          .json({ message: err.message || "Upload failed" });
      next();
    });
  },
  async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const userId = req.user!.userId;
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const match = await prisma.match.findUnique({ where: { id } });
      if (!match) return res.status(404).json({ message: "Event not found" });

      const participantIds = [match.hostId, match.joinerId].filter(
        (entry): entry is string => !!entry,
      );
      if (!participantIds.includes(userId)) {
        return res.status(403).json({ message: "Not a match participant" });
      }
      if (match.status !== "DISPUTED") {
        return res.status(400).json({ message: "Match is not disputed" });
      }

      // Build a server-relative URL (served by the /uploads static middleware)
      const normalizedPath = file.path.replace(/\\/g, "/");
      const uploadsIndex = normalizedPath.indexOf("/uploads/");
      const relativePath =
        uploadsIndex >= 0
          ? normalizedPath.slice(uploadsIndex)
          : `/uploads/disputes/${file.filename}`;
      const fileUrl = `http://localhost:4000${relativePath}`;

      // Append URL to dispute evidence
      const existing = await prisma.dispute.findFirst({
        where: { matchId: id, disputantId: userId },
      });
      const evidenceValue = existing?.evidence
        ? `${existing.evidence}\n${fileUrl}`
        : fileUrl;

      if (existing) {
        await prisma.dispute.update({
          where: { id: existing.id },
          data: { evidence: evidenceValue, status: "open" },
        });
      } else {
        await prisma.dispute.create({
          data: {
            matchId: id,
            disputantId: userId,
            evidence: evidenceValue,
            status: "open",
          },
        });
      }

      return res.json({ ok: true, url: fileUrl });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to upload evidence image" });
    }
  },
);
eventsRouter.post("/match/:id/report", requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const reporterId = req.user!.userId;
    const { winnerId } = ReportResultSchema.parse(req.body);

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ message: "Event not found" });
    if (match.status !== "ONGOING") {
      return res.status(400).json({ message: "Match is not ongoing" });
    }
    if (reporterId !== match.hostId && reporterId !== match.joinerId) {
      return res.status(403).json({ message: "Not a match participant" });
    }
    if (winnerId !== match.hostId && winnerId !== match.joinerId) {
      return res.status(400).json({ message: "Invalid winnerId" });
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        status: "RESULT_REPORTED",
        reportedById: reporterId,
        reportedWinnerId: winnerId,
      },
    });

    await prisma.playerLog.create({
      data: {
        userId: reporterId,
        actorId: reporterId,
        type: "MATCH_RESULT_REPORTED",
        message: `Reported winner for match ${id}`,
        meta: { matchId: id, winnerId },
      },
    });

    await invalidateAllLobbyCaches();
    return res.json({ event: updated });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Failed to report" });
  }
});

// POST /events/match/:id/verify
eventsRouter.post("/match/:id/verify", requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    const verifierId = req.user!.userId;
    const { agree } = VerifyResultSchema.parse(req.body || {});

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ message: "Event not found" });
    if (match.status !== "RESULT_REPORTED") {
      return res.status(400).json({ message: "No reported result to verify" });
    }
    if (verifierId !== match.hostId && verifierId !== match.joinerId) {
      return res.status(403).json({ message: "Not a match participant" });
    }
    if (verifierId === match.reportedById) {
      return res.status(400).json({ message: "Reporter cannot self-verify" });
    }

    const status = agree ? "RESULT_VERIFIED" : "DISPUTED";
    const updated = await prisma.match.update({
      where: { id },
      data: { status },
    });

    await prisma.playerLog.create({
      data: {
        userId: verifierId,
        actorId: verifierId,
        type: "MATCH_RESULT_VERIFIED",
        message: `${agree ? "Verified" : "Disputed"} result for match ${id}`,
        meta: { matchId: id, agree },
      },
    });

    await invalidateAllLobbyCaches();
    return res.json({ event: updated });
  } catch (err: any) {
    return res.status(400).json({ message: err.message ?? "Failed to verify" });
  }
});

// POST /events/:sourceType/:id/complete
eventsRouter.post(
  "/:sourceType/:id/complete",
  requireAuth,
  async (req, res) => {
    try {
      const sourceType = String(req.params.sourceType || "");
      const id = String(req.params.id || "");
      const userId = req.user!.userId;

      if (sourceType === "match") {
        const match = await prisma.match.findUnique({ where: { id } });
        if (!match) return res.status(404).json({ message: "Event not found" });
        if (match.hostId !== userId) {
          return res
            .status(403)
            .json({ message: "Only host can complete this event" });
        }

        const updated = await prisma.$transaction(async (tx) => {
          const liveMatch = await tx.match.findUnique({ where: { id } });
          if (!liveMatch) throw new Error("Event not found");

          if (liveMatch.stake > 0) {
            if (!liveMatch.reportedWinnerId) {
              throw new Error("Winner must be reported before completion");
            }
            if (
              !["RESULT_VERIFIED", "RESULT_REPORTED"].includes(liveMatch.status)
            ) {
              throw new Error("Result must be reported before completion");
            }

            await settleWagerPayout(
              tx,
              {
                id: liveMatch.id,
                stake: liveMatch.stake,
                hostId: liveMatch.hostId,
                joinerId: liveMatch.joinerId,
              },
              liveMatch.reportedWinnerId,
              "MATCH_WIN_PAYOUT",
            );
          }

          return tx.match.update({
            where: { id },
            data: { status: "COMPLETED" },
          });
        });

        await invalidateAllLobbyCaches();
        return res.json({ event: updated });
      }

      if (sourceType === "tournament") {
        const metaMap = await getTournamentMetaMap([id]);
        const hostId = metaMap.get(id)?.hostId || null;
        if (hostId !== userId) {
          return res
            .status(403)
            .json({ message: "Only host can complete this event" });
        }
        const updated = await prisma.tournament.update({
          where: { id },
          data: { status: "completed" },
        });
        await invalidateAllLobbyCaches();
        return res.json({ event: updated });
      }

      return res.status(400).json({ message: "Invalid source type" });
    } catch (err: any) {
      return res
        .status(400)
        .json({ message: err.message ?? "Failed to complete event" });
    }
  },
);

// POST /events/:sourceType/:id/cancel
eventsRouter.post("/:sourceType/:id/cancel", requireAuth, async (req, res) => {
  try {
    const sourceType = String(req.params.sourceType || "");
    const id = String(req.params.id || "");
    const userId = req.user!.userId;

    if (sourceType === "match") {
      const match = await prisma.match.findUnique({ where: { id } });
      if (!match) return res.status(404).json({ message: "Event not found" });
      if (match.hostId !== userId) {
        return res
          .status(403)
          .json({ message: "Only host can cancel this event" });
      }

      const updated = await prisma.$transaction(async (tx) => {
        await releaseEscrowToBalance(
          tx,
          match.hostId,
          match.stake,
          "MATCH_CANCEL_REFUND",
        );
        if (match.joinerId) {
          await releaseEscrowToBalance(
            tx,
            match.joinerId,
            match.stake,
            "MATCH_CANCEL_REFUND",
          );
        }

        return tx.match.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
      });

      await invalidateAllLobbyCaches();
      return res.json({ event: updated });
    }

    if (sourceType === "tournament") {
      const metaMap = await getTournamentMetaMap([id]);
      const hostId = metaMap.get(id)?.hostId || null;
      if (hostId !== userId) {
        return res
          .status(403)
          .json({ message: "Only host can cancel this event" });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const tournament = await tx.tournament.findUnique({ where: { id } });
        if (!tournament) throw new Error("Event not found");

        if (tournament.entryFee > 0) {
          const paidEntries = await tx.tournamentEntry.findMany({
            where: { tournamentId: id, paid: true },
            select: { userId: true },
          });
          for (const entry of paidEntries) {
            await releaseEscrowToBalance(
              tx,
              entry.userId,
              tournament.entryFee,
              "TOURNAMENT_CANCEL_REFUND",
            );
          }
        }

        return tx.tournament.update({
          where: { id },
          data: { status: "cancelled" },
        });
      });

      await invalidateAllLobbyCaches();
      return res.json({ event: updated });
    }

    return res.status(400).json({ message: "Invalid source type" });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err.message ?? "Failed to cancel event" });
  }
});

// POST /events/:sourceType/:id/leave
eventsRouter.post("/:sourceType/:id/leave", requireAuth, async (req, res) => {
  try {
    const sourceType = String(req.params.sourceType || "");
    const id = String(req.params.id || "");
    const userId = req.user!.userId;

    if (sourceType === "tournament") {
      const metaMap = await getTournamentMetaMap([id]);
      const hostId = metaMap.get(id)?.hostId || null;
      if (hostId === userId) {
        return res
          .status(400)
          .json({ message: "Host cannot leave event. Cancel it instead." });
      }

      const tournament = await prisma.tournament.findUnique({ where: { id } });
      if (!tournament)
        return res.status(404).json({ message: "Event not found" });
      if (
        !["upcoming", "open"].includes((tournament.status || "").toLowerCase())
      ) {
        return res
          .status(400)
          .json({ message: "Cannot leave an ongoing/completed event" });
      }

      await prisma.$transaction(async (tx) => {
        const entry = await tx.tournamentEntry.findUnique({
          where: { tournamentId_userId: { tournamentId: id, userId } },
        });
        if (!entry) {
          throw new Error("You are not a participant in this event");
        }

        const joinDeadline = deriveJoinDeadline(tournament.startAt ?? null);
        const deadlinePassed = joinDeadline
          ? Date.now() > joinDeadline.getTime()
          : false;

        if (entry.paid && tournament.entryFee > 0) {
          const refund = deadlinePassed
            ? tournament.entryFee * 0.9
            : tournament.entryFee;
          await releaseEscrowToBalance(
            tx,
            userId,
            refund,
            deadlinePassed
              ? "TOURNAMENT_LEAVE_REFUND_PARTIAL"
              : "TOURNAMENT_LEAVE_REFUND",
          );
        }

        await tx.tournamentEntry.delete({
          where: { tournamentId_userId: { tournamentId: id, userId } },
        });
      });

      await invalidateAllLobbyCaches();
      return res.json({ ok: true });
    }

    if (sourceType === "match") {
      const match = await prisma.match.findUnique({ where: { id } });
      if (!match) return res.status(404).json({ message: "Event not found" });
      if (match.hostId === userId) {
        return res
          .status(400)
          .json({ message: "Host cannot leave event. Cancel it instead." });
      }
      if (match.joinerId !== userId) {
        return res
          .status(400)
          .json({ message: "You are not a participant in this event" });
      }

      const metaMap = await getMatchMetaMap([id]);
      const meta = metaMap.get(id);
      const startAt = parseIsoDate(meta?.startAt);
      const joinDeadline =
        parseIsoDate(meta?.joinDeadlineAt) || deriveJoinDeadline(startAt);

      if (["UPCOMING", "OPEN"].includes(match.status)) {
        const deadlinePassed = joinDeadline
          ? Date.now() > joinDeadline.getTime()
          : false;

        await prisma.$transaction(async (tx) => {
          if (deadlinePassed && match.stake > 0) {
            const penalty = match.stake * 0.25;
            const refundable = Math.max(0, match.stake - penalty);
            await releaseEscrowToBalance(
              tx,
              userId,
              refundable,
              "MATCH_LEAVE_REFUND_PARTIAL",
            );

            const hostWallet = await tx.wallet.upsert({
              where: { userId: match.hostId },
              create: { userId: match.hostId, balance: 0, escrow: 0 },
              update: {},
            });
            await tx.wallet.update({
              where: { id: hostWallet.id },
              data: { balance: { increment: penalty } },
            });
            await tx.ledgerEntry.create({
              data: {
                walletId: hostWallet.id,
                type: "MATCH_LEAVE_PENALTY_CREDIT",
                amount: penalty,
              },
            });
          } else {
            await releaseEscrowToBalance(
              tx,
              userId,
              match.stake,
              "MATCH_LEAVE_REFUND",
            );
          }

          await tx.match.update({
            where: { id },
            data: {
              joinerId: null,
              status: "UPCOMING",
              reportedById: null,
              reportedWinnerId: null,
            },
          });
        });

        await invalidateAllLobbyCaches();
        return res.json({ ok: true });
      }

      if (match.status === "ONGOING") {
        const updated = await prisma.$transaction(async (tx) => {
          await settleWagerPayout(
            tx,
            {
              id: match.id,
              stake: match.stake,
              hostId: match.hostId,
              joinerId: match.joinerId,
            },
            match.hostId,
            "MATCH_FORFEIT_PAYOUT",
          );

          return tx.match.update({
            where: { id },
            data: {
              status: "COMPLETED",
              reportedById: match.hostId,
              reportedWinnerId: match.hostId,
            },
          });
        });

        await invalidateAllLobbyCaches();
        return res.json({
          event: updated,
          message: "You forfeited this match.",
        });
      }

      if (!["UPCOMING", "OPEN"].includes(match.status)) {
        return res
          .status(400)
          .json({ message: "Cannot leave an ongoing/completed match" });
      }

      return res.status(400).json({ message: "Unable to leave this event" });
    }

    return res.status(400).json({ message: "Invalid source type" });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err.message ?? "Failed to leave event" });
  }
});

// POST /events/requests/match
eventsRouter.post("/requests/match", requireAuth, async (req, res) => {
  try {
    const payload = CreateMatchRequestSchema.parse(req.body || {});
    const senderId = req.user!.userId;

    if (payload.recipientId === senderId) {
      return res
        .status(400)
        .json({ message: "Cannot send a match request to yourself" });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: payload.recipientId },
      select: { id: true },
    });
    if (!recipient)
      return res.status(404).json({ message: "Recipient not found" });

    const existing = await prisma.playerLog.findFirst({
      where: {
        userId: payload.recipientId,
        type: "MATCH_REQUEST",
      },
      orderBy: { createdAt: "desc" },
    });
    const existingMeta = (existing?.meta || {}) as Record<string, unknown>;
    if (
      existing &&
      isPendingMatchRequest(existingMeta) &&
      existingMeta.senderId === senderId
    ) {
      return res.status(409).json({
        message: "You already have a pending request to this user",
      });
    }

    const created = await prisma.playerLog.create({
      data: {
        userId: payload.recipientId,
        actorId: senderId,
        type: "MATCH_REQUEST",
        message: `Match request for ${payload.game}`,
        meta: {
          senderId,
          recipientId: payload.recipientId,
          game: payload.game,
          matchType: payload.matchType,
          description: payload.description || "",
          rounds: payload.rounds,
          region: payload.region || "Global",
          scheduledDate: payload.scheduledDate || "",
          scheduledTime: payload.scheduledTime || "",
          scheduledAt: payload.scheduledAt || "",
          wagerAmount: payload.wagerAmount || 0,
          challengeMessage: payload.message || "",
          status: "pending",
        },
      },
      select: { id: true, createdAt: true, meta: true },
    });

    await prisma.playerLog.create({
      data: {
        userId: senderId,
        actorId: senderId,
        type: "MATCH_REQUEST_SENT",
        message: `Sent match request to ${payload.recipientId}`,
        meta: {
          requestId: created.id,
          recipientId: payload.recipientId,
          game: payload.game,
          status: "pending",
        },
      },
    });

    // Notify recipient in real-time
    try {
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { username: true },
      });
      const io = getIo();
      io.to(`user:${payload.recipientId}`).emit("notification:new", {
        id: created.id,
        type: "match-request",
        title: "Match Request",
        body: `${sender?.username ?? "Someone"} challenged you to a ${payload.game} ${payload.matchType} match`,
        timestamp: created.createdAt.toISOString(),
        data: {
          requestId: created.id,
          game: payload.game,
          matchType: payload.matchType,
          senderId,
        },
      });
    } catch {
      // socket emit failure is non-fatal
    }

    await invalidateAllLobbyCaches();
    return res.status(201).json({ request: created });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message ?? "Failed to create match request" });
  }
});

// GET /events/requests/match/incoming
eventsRouter.get("/requests/match/incoming", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const logs = await prisma.playerLog.findMany({
      where: {
        userId,
        type: "MATCH_REQUEST",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const pending = logs.filter((log) => isPendingMatchRequest(log.meta));
    const senderIds = Array.from(
      new Set(
        pending
          .map((log) => (log.meta as Record<string, unknown>).senderId)
          .filter((value): value is string => typeof value === "string"),
      ),
    );

    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        profileImageUrl: true,
        profile: { select: { displayName: true } },
      },
    });
    const senderMap = new Map(senders.map((sender) => [sender.id, sender]));

    const requests = pending.map((log) => {
      const meta = (log.meta || {}) as Record<string, unknown>;
      const senderId = typeof meta.senderId === "string" ? meta.senderId : "";
      return {
        id: log.id,
        createdAt: log.createdAt,
        senderId,
        sender: senderMap.get(senderId) || null,
        game: typeof meta.game === "string" ? meta.game : "Unknown",
        matchType:
          typeof meta.matchType === "string" ? meta.matchType : "casual",
        description:
          typeof meta.description === "string" ? meta.description : "",
        rounds: typeof meta.rounds === "number" ? meta.rounds : 1,
        region: typeof meta.region === "string" ? meta.region : "Global",
        scheduledDate:
          typeof meta.scheduledDate === "string" ? meta.scheduledDate : "",
        scheduledTime:
          typeof meta.scheduledTime === "string" ? meta.scheduledTime : "",
        scheduledAt:
          typeof meta.scheduledAt === "string" ? meta.scheduledAt : "",
        wagerAmount:
          typeof meta.wagerAmount === "number" ? meta.wagerAmount : 0,
        challengeMessage:
          typeof meta.challengeMessage === "string"
            ? meta.challengeMessage
            : "",
        status: "pending",
      };
    });

    return res.json({ requests });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err?.message ?? "Failed to load match requests" });
  }
});

// PATCH /events/requests/match/:id
eventsRouter.patch("/requests/match/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const requestId = String(req.params.id || "");
    const { action } = UpdateMatchRequestSchema.parse(req.body || {});

    if (!requestId)
      return res.status(400).json({ message: "Missing request id" });

    const requestLog = await prisma.playerLog.findUnique({
      where: { id: requestId },
    });
    if (
      !requestLog ||
      requestLog.userId !== userId ||
      requestLog.type !== "MATCH_REQUEST"
    ) {
      return res.status(404).json({ message: "Match request not found" });
    }

    const meta = (requestLog.meta || {}) as Record<string, unknown>;
    if (!isPendingMatchRequest(meta)) {
      return res.status(409).json({ message: "Request is no longer pending" });
    }

    const senderId = typeof meta.senderId === "string" ? meta.senderId : null;
    const nextStatus = action === "accept" ? "accepted" : "declined";

    let createdMatchId: string | null = null;

    if (action === "accept") {
      if (!senderId) {
        return res.status(400).json({ message: "Invalid request sender" });
      }

      const game = typeof meta.game === "string" ? meta.game.trim() : "";
      if (game.length < 2) {
        return res.status(400).json({ message: "Invalid game in request" });
      }

      const rounds =
        typeof meta.rounds === "number" && Number.isFinite(meta.rounds)
          ? Math.max(1, Math.min(10, Math.floor(meta.rounds)))
          : 1;
      const region = typeof meta.region === "string" ? meta.region : "Global";
      const description =
        typeof meta.description === "string" ? meta.description : "";
      const startAtIso =
        typeof meta.scheduledAt === "string" ? meta.scheduledAt : "";
      const startAt = parseIsoDate(startAtIso);
      const joinDeadline = deriveJoinDeadline(startAt);
      const matchType = normalizeRequestMatchType(meta.matchType);
      const wagerAmount =
        typeof meta.wagerAmount === "number" &&
        Number.isFinite(meta.wagerAmount)
          ? Math.max(0, meta.wagerAmount)
          : 0;
      const stake = matchType === "wager" ? wagerAmount : 0;

      const createdMatch = await prisma.$transaction(async (tx) => {
        if (stake > 0) {
          const [senderWallet, recipientWallet] = await Promise.all([
            tx.wallet.upsert({
              where: { userId: senderId },
              create: { userId: senderId, balance: 0, escrow: 0 },
              update: {},
              select: { id: true, balance: true },
            }),
            tx.wallet.upsert({
              where: { userId },
              create: { userId, balance: 0, escrow: 0 },
              update: {},
              select: { id: true, balance: true },
            }),
          ]);

          if (senderWallet.balance < stake || recipientWallet.balance < stake) {
            throw new Error("Both players need enough balance for this wager");
          }

          await Promise.all([
            tx.wallet.update({
              where: { id: senderWallet.id },
              data: {
                balance: { decrement: stake },
                escrow: { increment: stake },
              },
            }),
            tx.wallet.update({
              where: { id: recipientWallet.id },
              data: {
                balance: { decrement: stake },
                escrow: { increment: stake },
              },
            }),
          ]);

          await tx.ledgerEntry.createMany({
            data: [
              {
                walletId: senderWallet.id,
                type: "MATCH_ESCROW_LOCK",
                amount: stake,
              },
              {
                walletId: recipientWallet.id,
                type: "ESCROW_LOCK_JOINER",
                amount: stake,
              },
            ],
          });
        }

        const match = await tx.match.create({
          data: {
            game,
            stake,
            status: "UPCOMING",
            hostId: senderId,
            joinerId: userId,
          },
          select: { id: true },
        });

        await tx.playerLog.create({
          data: {
            userId: senderId,
            actorId: senderId,
            type: "MATCH_CREATED",
            message: `Created private ${matchType} match ${match.id}`,
            meta: {
              matchId: match.id,
              game,
              stake,
              matchType,
              participantCount: 2,
              title: `${game} Challenge`,
              description,
              region,
              teamSize: 1,
              tournamentFormat: `Best of ${rounds}`,
              startAt: startAt?.toISOString() || null,
              joinDeadlineAt: joinDeadline?.toISOString() || null,
              privateMatch: true,
              requestId,
            },
          },
        });

        await tx.playerLog.create({
          data: {
            userId,
            actorId: senderId,
            type: "MATCH_JOINED",
            message: `Accepted and joined private ${matchType} match ${match.id}`,
            meta: { matchId: match.id, requestId },
          },
        });

        await tx.playerLog.update({
          where: { id: requestId },
          data: {
            meta: {
              ...meta,
              status: nextStatus,
              respondedAt: new Date().toISOString(),
              respondedBy: userId,
              matchId: match.id,
            },
            message: `Match request ${nextStatus}`,
          },
        });

        return match;
      });

      createdMatchId = createdMatch.id;
    } else {
      await prisma.playerLog.update({
        where: { id: requestId },
        data: {
          meta: {
            ...meta,
            status: nextStatus,
            respondedAt: new Date().toISOString(),
            respondedBy: userId,
          },
          message: `Match request ${nextStatus}`,
        },
      });
    }

    if (senderId) {
      await prisma.playerLog.create({
        data: {
          userId: senderId,
          actorId: userId,
          type: "MATCH_REQUEST_RESPONSE",
          message: `Your match request was ${nextStatus}`,
          meta: {
            requestId,
            status: nextStatus,
            responderId: userId,
          },
        },
      });
    }

    await invalidateAllLobbyCaches();
    return res.json({ ok: true, status: nextStatus, matchId: createdMatchId });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message ?? "Failed to update match request" });
  }
});

// ─── Moderator dispute routes ─────────────────────────────────────────────────

// GET /events/disputes?status=all|open|reviewing|resolved
eventsRouter.get(
  "/disputes",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    try {
      const filter = String(req.query.status || "all");

      const disputes = await prisma.dispute.findMany({
        where:
          filter === "all"
            ? undefined
            : filter === "resolved"
              ? { status: "resolved" }
              : filter === "reviewing"
                ? { status: "reviewing" }
                : { status: "open" },
        orderBy: { createdAt: "desc" },
        include: {
          disputant: { select: { id: true, username: true } },
          match: {
            select: {
              id: true,
              game: true,
              stake: true,
              status: true,
              createdAt: true,
              hostId: true,
              joinerId: true,
              host: { select: { id: true, username: true } },
              joiner: { select: { id: true, username: true } },
            },
          },
        },
      });

      // Group by matchId → one ModeratorDisputeCase per match
      const caseMap = new Map<string, any>();

      for (const d of disputes) {
        const matchId = d.matchId;
        if (!caseMap.has(matchId)) {
          const m = d.match;
          const participants: Array<{ id: string; username: string }> = [];
          if (m.host) participants.push(m.host);
          if (m.joiner) participants.push(m.joiner);

          caseMap.set(matchId, {
            id: matchId,
            matchId,
            game: m.game,
            wagerAmount: m.stake,
            matchStatus: m.status.toLowerCase(),
            createdAt: m.createdAt.toISOString(),
            participants,
            reports: [],
          });
        }

        const evidenceUrls = d.evidence
          ? d.evidence
              .split(/\n+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        caseMap.get(matchId)!.reports.push({
          id: d.id,
          status: d.status,
          disputantId: d.disputantId,
          disputantUsername: d.disputant.username,
          description: "",
          claimedWinnerId: null,
          evidenceUrls,
          createdAt: d.createdAt.toISOString(),
          reviewedById: null,
          reviewedByUsername: null,
          resolutionWinnerId: null,
          resolutionNote: null,
          resolvedAt: null,
        });
      }

      return res.json({ disputes: Array.from(caseMap.values()) });
    } catch (err: any) {
      console.error("[disputes]", err);
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to fetch disputes" });
    }
  },
);

// POST /events/disputes/:matchId/resolve
eventsRouter.post(
  "/disputes/:matchId/resolve",
  requireAuth,
  requireRole("MODERATOR"),
  async (req, res) => {
    try {
      const matchId = String(req.params.matchId || "");
      const { winnerId, resolutionNote } = req.body as {
        winnerId: string;
        resolutionNote?: string;
      };

      if (!winnerId) {
        return res.status(400).json({ message: "winnerId is required" });
      }

      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (!match) return res.status(404).json({ message: "Match not found" });

      // Mark match as completed with the moderator-chosen winner
      await prisma.$transaction([
        prisma.match.update({
          where: { id: matchId },
          data: { status: "COMPLETED", reportedWinnerId: winnerId },
        }),
        prisma.dispute.updateMany({
          where: { matchId },
          data: { status: "resolved" },
        }),
      ]);

      // Update trust scores based on who was right vs wrong
      // Reporter = who originally submitted the result
      // Disputant = who filed the dispute (disagreed)
      if (match.reportedById) {
        const reporterWasCorrect = match.reportedWinnerId === winnerId;
        void updateTrustScore(
          match.reportedById,
          reporterWasCorrect ? "DISPUTE_WON" : "DISPUTE_LOST",
          matchId,
        );
      }

      const dispute = await prisma.dispute.findFirst({
        where: { matchId },
        select: { disputantId: true },
      });
      if (dispute) {
        const reporterWasCorrect = match.reportedWinnerId === winnerId;
        // Disputant had the opposite view of the reporter
        void updateTrustScore(
          dispute.disputantId,
          reporterWasCorrect ? "DISPUTE_LOST" : "DISPUTE_WON",
          matchId,
        );
      }

      await invalidateAllLobbyCaches();
      return res.json({ ok: true });
    } catch (err: any) {
      console.error("[disputes/resolve]", err);
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to resolve dispute" });
    }
  },
);
