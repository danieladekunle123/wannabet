import type { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const userId = (req as any).user?.userId;

    const meta: Record<string, unknown> = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
    };

    if (userId) meta.userId = userId;

    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger.log({
      level,
      message: `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      userId,
      ...meta,
    });
  });

  next();
}
