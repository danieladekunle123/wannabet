import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";

export type AuthUser = { userId: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = payload;

    // Check for active ban
    try {
      const activeBan = await prisma.ban.findFirst({
        where: {
          userId: payload.userId,
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (activeBan) {
        return res.status(403).json({
          message: "Account is banned",
          reason: activeBan.reason,
          expiresAt: activeBan.expiresAt,
        });
      }
    } catch (err) {
      console.error("Failed to check ban status", err);
      // allow to continue auth if ban check fails, but log it
    }

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(requiredRole: "ADMIN" | "MODERATOR" | "PLAYER") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      if (!user) return res.status(404).json({ message: "User not found" });

      const role = user.role as "ADMIN" | "MODERATOR" | "PLAYER";

      // ADMIN has all privileges. MODERATOR has moderator privileges but not admin.
      if (requiredRole === "ADMIN" && role !== "ADMIN") {
        return res.status(403).json({ message: "Admin role required" });
      }

      if (
        requiredRole === "MODERATOR" &&
        !(role === "MODERATOR" || role === "ADMIN")
      ) {
        return res.status(403).json({ message: "Moderator role required" });
      }

      // PLAYER requirement passes for any authenticated user
      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to verify role" });
    }
  };
}
