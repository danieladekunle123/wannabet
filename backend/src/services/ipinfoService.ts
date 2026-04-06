import axios from "axios";
import { env } from "../lib/env";
import { isPrivateOrLocalIp } from "../lib/clientIp";

export type RegionDetection = {
  resolvedIp: string | null;
  country: string | null;
  region: string | null;
  continent: string | null;
  matchmakingRegion: string;
};

type IpinfoLiteResponse = {
  ip?: string;
  country?: string;
  country_code?: string;
  region?: string;
  continent?: string;
  continent_code?: string;
};

type IpinfoCoreResponse = {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
};

function normalizeIp(rawIp?: string | null) {
  if (!rawIp) return null;
  const cleaned = rawIp.replace(/^::ffff:/i, "").trim();
  if (!cleaned || isPrivateOrLocalIp(cleaned)) return null;
  return cleaned;
}

export function mapCountryToMatchmakingRegion(
  countryCode?: string | null,
  regionName?: string | null,
  continent?: string | null,
) {
  const country = (countryCode || "").toUpperCase();
  const region = (regionName || "").toLowerCase();
  const continentName = (continent || "").toLowerCase();

  if (country === "US") {
    const westHints = [
      "west",
      "california",
      "oregon",
      "washington",
      "nevada",
      "arizona",
      "utah",
      "colorado",
      "idaho",
      "montana",
      "wyoming",
      "new mexico",
      "alaska",
      "hawaii",
    ];
    return westHints.some((hint) => region.includes(hint))
      ? "NA West"
      : "NA East";
  }

  if (country === "CA") return "NA East";

  if (["IE", "GB", "UK", "FR"].includes(country)) return "EU West";

  if (["DE", "PL"].includes(country)) return "EU East";

  if (["JP", "KR"].includes(country)) return "Asia";

  if (["AU", "NZ"].includes(country)) return "OCE";

  if (continentName.includes("europe")) return "EU West";
  if (continentName.includes("asia")) return "Asia";
  if (continentName.includes("oceania")) return "OCE";
  if (continentName.includes("north")) return "NA East";

  return "Global";
}

export async function getUserRegion(
  ip?: string | null,
): Promise<RegionDetection> {
  if (!env.IPINFO_TOKEN) {
    throw new Error("IPINFO_TOKEN is not configured");
  }

  const targetIp = normalizeIp(ip);
  const endpoint = targetIp
    ? `https://api.ipinfo.io/lite/${encodeURIComponent(targetIp)}`
    : "https://api.ipinfo.io/lite/me";
  const response = await axios.get<IpinfoLiteResponse>(endpoint, {
    headers: {
      Authorization: `Bearer ${env.IPINFO_TOKEN}`,
    },
    timeout: 8000,
  });

  const data = response.data || {};
  let resolvedIp = data.ip || null;
  const country = data.country_code || data.country || null;
  let detectedRegion = data.region || null;
  const detectedContinent = data.continent || data.continent_code || null;

  // Lite responses can omit region for some IPs; ask the richer endpoint for state/province.
  if (!detectedRegion) {
    try {
      const coreEndpoint = targetIp
        ? `https://ipinfo.io/${encodeURIComponent(targetIp)}/json`
        : "https://ipinfo.io/json";
      const core = await axios.get<IpinfoCoreResponse>(coreEndpoint, {
        params: { token: env.IPINFO_TOKEN },
        timeout: 8000,
      });
      resolvedIp = core.data?.ip || resolvedIp;
      detectedRegion = core.data?.region || null;
    } catch {
      // Preserve lite-based detection even if the rich lookup fails.
    }
  }

  return {
    resolvedIp,
    country,
    region: detectedRegion,
    continent: detectedContinent,
    matchmakingRegion: mapCountryToMatchmakingRegion(
      country,
      detectedRegion,
      detectedContinent,
    ),
  };
}
