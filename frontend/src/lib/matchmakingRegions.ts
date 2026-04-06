export const DEFAULT_MATCHMAKING_REGIONS = [
  "North America East",
  "North America West",
  "EU West",
  "EU East",
  "South America",
  "Asia East",
  "Asia West",
  "Oceania",
  "Africa",
];

type CountryLike = {
  code?: string;
  region?: string;
  matchmakingRegion?: string;
};

const SOUTH_AMERICA_CODES = new Set([
  "AR",
  "BO",
  "BR",
  "CL",
  "CO",
  "EC",
  "GF",
  "GY",
  "PE",
  "PY",
  "SR",
  "UY",
  "VE",
]);

const EU_EAST_CODES = new Set([
  "AL",
  "AT",
  "BA",
  "BG",
  "BY",
  "CH",
  "CZ",
  "DE",
  "EE",
  "HR",
  "HU",
  "LT",
  "LV",
  "MD",
  "ME",
  "MK",
  "PL",
  "RO",
  "RS",
  "SI",
  "SK",
  "UA",
]);

const ASIA_WEST_CODES = new Set([
  "AE",
  "AF",
  "AM",
  "AZ",
  "BD",
  "BH",
  "CY",
  "GE",
  "IN",
  "IQ",
  "IR",
  "IL",
  "JO",
  "KW",
  "KZ",
  "LB",
  "NP",
  "OM",
  "PK",
  "QA",
  "SA",
  "SY",
  "TJ",
  "TM",
  "TR",
  "UZ",
  "YE",
]);

export function normalizeMatchmakingRegion(region: string | null | undefined) {
  const value = (region || "").trim().toLowerCase();
  if (!value) return null;

  if (
    value === "na east" ||
    value === "north america east" ||
    value === "na-east"
  ) {
    return "North America East";
  }

  if (
    value === "na west" ||
    value === "north america west" ||
    value === "na-west"
  ) {
    return "North America West";
  }

  if (value === "eu west" || value === "europe west" || value === "eu-west") {
    return "EU West";
  }

  if (
    value === "eu east" ||
    value === "europe east" ||
    value === "eu-east" ||
    value === "eu central" ||
    value === "eu north"
  ) {
    return "EU East";
  }

  if (
    value === "south america" ||
    value === "sa" ||
    value === "latam" ||
    value === "brazil"
  ) {
    return "South America";
  }

  if (value === "asia east" || value === "asia-east") {
    return "Asia East";
  }

  if (value === "asia west" || value === "asia-west") {
    return "Asia West";
  }

  if (value === "asia") {
    return "Asia East";
  }

  if (value === "oce" || value === "oceania") {
    return "Oceania";
  }

  if (value === "africa") {
    return "Africa";
  }

  return null;
}

function mapCountryToRegion(country: CountryLike) {
  const normalized = normalizeMatchmakingRegion(country.matchmakingRegion);
  if (normalized) return normalized;

  const code = (country.code || "").toUpperCase();
  const continent = (country.region || "").toLowerCase();

  if (SOUTH_AMERICA_CODES.has(code)) return "South America";

  if (continent.includes("america")) {
    return "North America East";
  }

  if (continent.includes("europe")) {
    return EU_EAST_CODES.has(code) ? "EU East" : "EU West";
  }

  if (continent.includes("asia")) {
    return ASIA_WEST_CODES.has(code) ? "Asia West" : "Asia East";
  }

  if (continent.includes("oceania")) {
    return "Oceania";
  }

  if (continent.includes("africa")) {
    return "Africa";
  }

  return null;
}

export function buildMatchmakingRegionOptions(data: {
  countries?: CountryLike[];
  regions?: string[];
}) {
  const regionSet = new Set<string>();

  for (const region of data.regions || []) {
    const normalized = normalizeMatchmakingRegion(region);
    if (normalized) regionSet.add(normalized);
  }

  for (const country of data.countries || []) {
    const mapped = mapCountryToRegion(country);
    if (mapped) regionSet.add(mapped);
  }

  // Keep a stable order in the UI while still deriving values from country API data.
  const ordered = DEFAULT_MATCHMAKING_REGIONS.filter((region) =>
    regionSet.has(region),
  );

  return ordered.length > 0 ? ordered : DEFAULT_MATCHMAKING_REGIONS;
}
