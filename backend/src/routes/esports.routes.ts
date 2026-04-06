import { Router } from "express";
import {
  getLiveMatches,
  getLiveTournaments,
  getRecentMatches,
  getRelevantMatches,
  getRelevantTournaments,
  getRecentTournaments,
  getTournaments,
  getUpcomingMatches,
  getUpcomingTournaments,
} from "../services/pandascoreService";

export const esportsRouter = Router();

esportsRouter.get("/matches", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const matches = await getRelevantMatches(limit);
    return res.json({ matches });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch esports matches",
    });
  }
});

esportsRouter.get("/live", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const matches = await getLiveMatches(limit);
    return res.json({ matches });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch live esports matches",
    });
  }
});

esportsRouter.get("/upcoming", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const matches = await getUpcomingMatches(limit);
    return res.json({ matches });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch upcoming esports matches",
    });
  }
});

esportsRouter.get("/recent", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const matches = await getRecentMatches(limit);
    return res.json({ matches });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch recent esports matches",
    });
  }
});

esportsRouter.get("/relevant", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const matches = await getRelevantMatches(limit);
    return res.json({ matches });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch relevant esports matches",
    });
  }
});

esportsRouter.get("/tournaments", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const tournaments = await getRelevantTournaments(limit);
    return res.json({ tournaments });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch esports tournaments",
    });
  }
});

esportsRouter.get("/tournaments/live", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const tournaments = await getLiveTournaments(limit);
    return res.json({ tournaments });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch live esports tournaments",
    });
  }
});

esportsRouter.get("/tournaments/upcoming", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const tournaments = await getUpcomingTournaments(limit);
    return res.json({ tournaments });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch upcoming esports tournaments",
    });
  }
});

esportsRouter.get("/tournaments/recent", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const tournaments = await getRecentTournaments(limit);
    return res.json({ tournaments });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch recent esports tournaments",
    });
  }
});

esportsRouter.get("/tournaments/relevant", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const tournaments = await getRelevantTournaments(limit);
    return res.json({ tournaments });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch relevant esports tournaments",
    });
  }
});
