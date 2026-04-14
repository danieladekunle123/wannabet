import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { checkRateLimit } from "../services/redis";
import { resolveClientIp } from "../lib/clientIp";
import { env } from "../lib/env";
import logger from "../lib/logger";

const GLOBAL_LIMIT = 300; // requests
const GLOBAL_WINDOW = 900; // seconds (15 min)

/**
 * Try to extract userId from the Authorization header without
 * running the full auth middleware. Used only for rate-limit keying
 * so authenticated users behind the same proxy don't share a bucket.
 */
function peekUserId(req: Request): string | null {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return null;
    const token = header.slice(7).trim();
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId?: string };
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Global API rate limiter — 300 requests per 15 minutes.
 * Uses authenticated userId when available, falls back to client IP.
 * This avoids the shared-IP-bucket problem behind reverse proxies (e.g. Render).
 * Skips health, docs, webhook, and static asset endpoints.
 */
export function globalRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (process.env.NODE_ENV === "test") return next();

  const skip =
    req.path === "/health" ||
    req.path === "/metrics" ||
    req.path.startsWith("/api/docs") ||
    req.path.startsWith("/stripe/webhook") ||
    req.path === "/favicon.ico" ||
    req.path.startsWith("/assets/");

  if (skip) return next();

  // Prefer authenticated userId so users behind the same proxy don't share a bucket
  const userId = peekUserId(req);
  const ip = resolveClientIp(req).ip;
  const identity = userId ? `user:${userId}` : ip;
  const key = `rate:global:${identity}`;

  checkRateLimit(key, GLOBAL_LIMIT, GLOBAL_WINDOW)
    .then(({ allowed, remaining }) => {
      res.setHeader("X-RateLimit-Limit", String(GLOBAL_LIMIT));
      res.setHeader("X-RateLimit-Remaining", String(remaining));

      if (!allowed) {
        const retryAfter = GLOBAL_WINDOW;
        res.setHeader("Retry-After", String(retryAfter));
        logger.warn("Global rate limit exceeded", {
          identity,
          ip,
          path: req.path,
        });
        return res
          .status(429)
          .json({ message: "Too many requests. Please try again later." });
      }
      next();
    })
    .catch(() => next()); // fail open — don't block if Redis is down
}
