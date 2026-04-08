import Redis from "ioredis";

import { emitEventUpdate } from "../lib/socket";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl);
const pub = new Redis(redisUrl);
const sub = new Redis(redisUrl);

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err));
pub.on("error", (err) => console.error("Redis pub error:", err));
sub.on("error", (err) => console.error("Redis sub error:", err));

const PRESENCE_CHANNEL = "user:presence";

type RedisUserStatus = "online" | "away" | "dnd";

async function setUserOnline(userId: string) {
  await redis.set(`user:${userId}:status`, "online", "EX", 300);
}

async function setUserStatus(userId: string, status: RedisUserStatus) {
  await redis.set(`user:${userId}:status`, status, "EX", 300);
}

async function setUserOffline(userId: string) {
  await redis.del(`user:${userId}:status`);
}

async function isUserOnline(
  userId: string,
): Promise<{ status: RedisUserStatus | "offline"; lastSeen: number | null }> {
  const val = await redis.get(`user:${userId}:status`);
  if (val === "online" || val === "away" || val === "dnd") {
    return { status: val, lastSeen: null };
  }
  const ts = await redis.get(`user:${userId}:lastSeen`);
  return { status: "offline", lastSeen: ts ? Number(ts) : null };
}

async function setLastSeen(userId: string) {
  await redis.set(`user:${userId}:lastSeen`, Date.now().toString());
}

async function getLastSeen(userId: string): Promise<number | null> {
  const ts = await redis.get(`user:${userId}:lastSeen`);
  return ts ? Number(ts) : null;
}

async function getOnlineUsers(
  userIds: string[],
): Promise<Record<string, RedisUserStatus | "offline">> {
  if (!userIds.length) return {};
  const pipeline = redis.pipeline();
  for (const id of userIds) {
    pipeline.get(`user:${id}:status`);
  }
  const results = await pipeline.exec();
  const map: Record<string, RedisUserStatus | "offline"> = {};
  userIds.forEach((id, i) => {
    const [err, val] = results![i];
    if (!err && (val === "online" || val === "away" || val === "dnd")) {
      map[id] = val;
    } else {
      map[id] = "offline";
    }
  });
  return map;
}

async function setTyping(chatId: string, userId: string) {
  await redis.set(`typing:${chatId}:${userId}`, "true", "EX", 3);
}

async function isTyping(chatId: string, userId: string): Promise<boolean> {
  const val = await redis.get(`typing:${chatId}:${userId}`);
  return val === "true";
}

async function setMessageRead(messageId: string, userId: string) {
  await redis.set(`read:${messageId}:${userId}`, "true");
}

async function isMessageRead(
  messageId: string,
  userId: string,
): Promise<boolean> {
  const val = await redis.get(`read:${messageId}:${userId}`);
  return val === "true";
}

async function getReadMessages(
  messageIds: string[],
  userId: string,
): Promise<Record<string, boolean>> {
  if (!messageIds.length) return {};
  const pipeline = redis.pipeline();
  for (const id of messageIds) {
    pipeline.get(`read:${id}:${userId}`);
  }
  const results = await pipeline.exec();
  const map: Record<string, boolean> = {};
  messageIds.forEach((id, i) => {
    const [err, val] = results![i];
    map[id] = !err && val === "true";
  });
  return map;
}

type PresenceMessage = {
  type: "online" | "offline" | "status_change";
  userId: string;
  status?: RedisUserStatus | "offline";
};

async function publishPresence(msg: PresenceMessage) {
  await pub.publish(PRESENCE_CHANNEL, JSON.stringify(msg));
}

function subscribePresence(handler: (msg: PresenceMessage) => void) {
  sub
    .subscribe(PRESENCE_CHANNEL)
    .catch((err) => console.error("Redis subscribe error:", err));
  sub.on("message", (channel, message) => {
    if (channel !== PRESENCE_CHANNEL) return;
    try {
      handler(JSON.parse(message));
    } catch {
      // ignore malformed messages
    }
  });
}

// ── Generic cache helpers ────────────────────────────────────────────────────
async function cacheGet<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  if (!val) return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

async function cacheSet(key: string, data: unknown, ttl = 60) {
  await redis.set(key, JSON.stringify(data), "EX", ttl);
}

async function cacheInvalidate(...keys: string[]) {
  if (keys.length) await redis.del(...keys);
}

// Lobby/event cache keys
const CACHE_KEYS = {
  allPublic: "lobbies:allPublic",
  tournaments: "lobbies:tournaments",
  scrims: "lobbies:scrims",
  wagers: "lobbies:wagers",
  custom: "lobbies:custom",
  active: "lobbies:active",
  matchFeatured: "lobbies:match:featured",
} as const;

async function invalidateAllLobbyCaches() {
  await cacheInvalidate(...Object.values(CACHE_KEYS));
  emitEventUpdate("lobby");
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
async function checkRateLimit(
  key: string,
  limit: number,
  windowSecs = 60,
): Promise<{ allowed: boolean; current: number; remaining: number }> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSecs);
  }
  return {
    allowed: current <= limit,
    current,
    remaining: Math.max(0, limit - current),
  };
}

export {
  redis,
  pub,
  sub,
  setUserOnline,
  setUserStatus,
  setUserOffline,
  isUserOnline,
  setLastSeen,
  getLastSeen,
  getOnlineUsers,
  setTyping,
  isTyping,
  setMessageRead,
  isMessageRead,
  getReadMessages,
  publishPresence,
  subscribePresence,
  cacheGet,
  cacheSet,
  cacheInvalidate,
  CACHE_KEYS,
  invalidateAllLobbyCaches,
  checkRateLimit,
};
export type { RedisUserStatus, PresenceMessage };
