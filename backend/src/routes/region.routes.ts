import { Router } from "express";
import { getUserRegion } from "../services/ipinfoService";
import { resolveClientIp } from "../lib/clientIp";

export const regionRouter = Router();

regionRouter.get("/detect", async (req, res) => {
  try {
    const resolved = resolveClientIp(req);
    const detection = await getUserRegion(resolved.ip);
    return res.json({
      ip: detection.resolvedIp || resolved.ip,
      requestIp: resolved.ip,
      ipSource: resolved.source,
      ipPrivate: resolved.isPrivate,
      country: detection.country,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to detect region",
    });
  }
});
