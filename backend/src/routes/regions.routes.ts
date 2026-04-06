import { Router } from "express";
import { getCountries } from "../services/countriesService";

export const regionsRouter = Router();

regionsRouter.get("/countries", async (_req, res) => {
  try {
    const countries = await getCountries();
    const regions = Array.from(
      new Set(countries.map((country) => country.matchmakingRegion)),
    ).sort((a, b) => a.localeCompare(b));

    return res.json({
      countries,
      regions,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Failed to fetch countries",
    });
  }
});
