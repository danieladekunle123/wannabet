import type { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../services/redis";
import { resolveClientIp } from "../lib/clientIp";
import logger from "../lib/logger";

/**
 * Global API rate limiter — 100 requests per 15 minutes per IP.
 * Skips health, docs, and webhook endpoints.
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
    req.path.startsWith("/stripe/webhook");

  if (skip) return next();

  const ip = resolveClientIp(req).ip;
  const key = `rate:global:${ip}`;

  checkRateLimit(key, 100, 900) // 100 requests, 900 seconds = 15 min
    .then(({ allowed, remaining }) => {
      res.setHeader("X-RateLimit-Limit", "100");
      res.setHeader("X-RateLimit-Remaining", String(remaining));

      if (!allowed) {
        logger.warn("Global rate limit exceeded", { ip, path: req.path });
        return res
          .status(429)
          .json({ message: "Too many requests. Please try again later." });
      }
      next();
    })
    .catch(() => next()); // fail open — don't block if Redis is down
}
