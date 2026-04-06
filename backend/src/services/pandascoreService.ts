import axios from "axios";
import { env } from "../lib/env";

const API_BASE = "https://api.pandascore.co";
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<any>>();

function readCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache<T>(key: string, value: T) {
  cache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

type PandaTeam = {
  name?: string;
};

type PandaLeague = {
  name?: string;
};

type PandaTournament = {
  id?: number;
  name?: string;
  slug?: string;
  videogame?: { name?: string };
  begin_at?: string | null;
  end_at?: string | null;
  status?: string;
  league?: PandaLeague;
  series?: { full_name?: string; name?: string };
  winner_type?: string | null;
  live_supported?: boolean;
};

type PandaMatch = {
  id?: number;
  slug?: string;
  name?: string;
  begin_at?: string | null;
  status?: string;
  league?: PandaLeague;
  tournament?: { name?: string };
  videogame?: { name?: string };
  opponents?: Array<{ opponent?: PandaTeam }>;
  streams_list?: Array<{ raw_url?: string | null; language?: string }>;
};

type FormattedMatch = {
  id: number | undefined;
  teams: string[];
  game: string;
  startTime: string | null | undefined;
  league: string;
  tournamentName: string;
  status: string;
  streamUrl: string | null;
  infoUrl: string;
  apiUrl: string | null;
};

type FormattedTournament = {
  id: number | undefined;
  game: string;
  startTime: string | null | undefined;
  endTime: string | null;
  league: string;
  tournamentName: string;
  status: string;
  streamUrl: null;
  infoUrl: string;
  apiUrl: string | null;
  teams: string[];
};

function getPandascoreClient() {
  if (!env.PANDASCORE_TOKEN) {
    throw new Error("PANDASCORE_TOKEN is not configured");
  }

  return axios.create({
    baseURL: API_BASE,
    timeout: 12000,
    headers: {
      Authorization: `Bearer ${env.PANDASCORE_TOKEN}`,
    },
  });
}

function formatMatches(matches: PandaMatch[]): FormattedMatch[] {
  return (matches || []).map((match) => {
    const teams = (match.opponents || [])
      .map((entry) => entry.opponent?.name)
      .filter((name): name is string => !!name);

    return {
      id: match.id,
      teams,
      game: match.videogame?.name || "Unknown",
      startTime: match.begin_at,
      league: match.league?.name || "Unknown",
      tournamentName: match.tournament?.name || "Unknown",
      status: match.status || "unknown",
      streamUrl:
        (match.streams_list || []).find((stream) => !!stream.raw_url)
          ?.raw_url || null,
      infoUrl: "https://developers.pandascore.co/reference/get_matches-matchid",
      apiUrl: match.id ? `https://api.pandascore.co/matches/${match.id}` : null,
    };
  });
}

async function fetchMatchesByParams(
  cacheKey: string,
  params: Record<string, string | number>,
): Promise<FormattedMatch[]> {
  const cached = readCache<FormattedMatch[]>(cacheKey);
  if (cached) return cached;

  const client = getPandascoreClient();
  const response = await client.get<PandaMatch[]>("/matches", {
    params,
  });

  const formatted = formatMatches(response.data || []);
  writeCache(cacheKey, formatted);
  return formatted;
}

export async function getLiveMatches(limit = 10) {
  return fetchMatchesByParams(`matches:live:${limit}`, {
    per_page: limit,
    "filter[status]": "running",
    sort: "-begin_at",
  });
}

export async function getUpcomingMatches(limit = 10) {
  return fetchMatchesByParams(`matches:upcoming:${limit}`, {
    per_page: limit,
    "filter[status]": "not_started",
    sort: "begin_at",
  });
}

export async function getRecentMatches(limit = 10) {
  const now = new Date();
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);

  return fetchMatchesByParams(`matches:recent:${limit}`, {
    per_page: limit,
    "range[begin_at]": `${lastWeek.toISOString()},${now.toISOString()}`,
    sort: "-begin_at",
  });
}

export async function getRelevantMatches(limit = 20) {
  const bucketLimit = Math.max(limit, 10);
  const [live, upcoming, recent] = await Promise.all([
    getLiveMatches(bucketLimit),
    getUpcomingMatches(bucketLimit),
    getRecentMatches(bucketLimit),
  ]);

  const seen = new Set<number>();
  const deduped: FormattedMatch[] = [];

  for (const group of [live, upcoming, recent]) {
    for (const match of group) {
      const id = Number(match.id || 0);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      deduped.push(match);
      if (deduped.length >= limit) return deduped;
    }
  }

  return deduped;
}

export async function getMatches(limit = 20) {
  const cacheKey = `matches:relevant:${limit}`;
  const cached = readCache<FormattedMatch[]>(cacheKey);
  if (cached) return cached;

  const relevant = await getRelevantMatches(limit);
  writeCache(cacheKey, relevant);
  return relevant;
}

function formatTournaments(
  tournaments: PandaTournament[],
): FormattedTournament[] {
  return (tournaments || []).map((tournament) => ({
    id: tournament.id,
    game: tournament.videogame?.name || "Unknown",
    startTime: tournament.begin_at,
    endTime: tournament.end_at || null,
    league: tournament.league?.name || "Unknown",
    tournamentName:
      tournament.name || tournament.series?.full_name || "Unknown",
    status: tournament.status || "unknown",
    streamUrl: null,
    infoUrl:
      "https://developers.pandascore.co/reference/get_tournaments-tournamentid",
    apiUrl: tournament.id
      ? `https://api.pandascore.co/tournaments/${tournament.id}`
      : null,
    teams: [],
  }));
}

function getTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
}

async function getTournamentUniverse(
  limit = 100,
): Promise<FormattedTournament[]> {
  const cacheKey = `tournaments:universe:${limit}`;
  const cached = readCache<FormattedTournament[]>(cacheKey);
  if (cached) return cached;

  const client = getPandascoreClient();
  const response = await client.get<PandaTournament[]>("/tournaments", {
    params: {
      per_page: limit,
      sort: "-begin_at",
    },
  });

  const formatted = formatTournaments(response.data || []);
  writeCache(cacheKey, formatted);
  return formatted;
}

export async function getLiveTournaments(limit = 10) {
  const universe = await getTournamentUniverse(Math.max(limit * 5, 50));
  return universe
    .filter((tournament) => tournament.status.toLowerCase() === "running")
    .slice(0, limit);
}

export async function getUpcomingTournaments(limit = 10) {
  const universe = await getTournamentUniverse(Math.max(limit * 5, 50));
  const nowTs = Date.now();

  return universe
    .filter((tournament) => {
      const startTs = getTimestamp(tournament.startTime);
      return startTs !== null && startTs >= nowTs;
    })
    .sort((a, b) => {
      const aTs = getTimestamp(a.startTime) ?? Number.MAX_SAFE_INTEGER;
      const bTs = getTimestamp(b.startTime) ?? Number.MAX_SAFE_INTEGER;
      return aTs - bTs;
    })
    .slice(0, limit);
}

export async function getRecentTournaments(limit = 10) {
  const universe = await getTournamentUniverse(Math.max(limit * 5, 50));
  const nowTs = Date.now();
  const lastWeekTs = nowTs - 7 * 24 * 60 * 60 * 1000;

  return universe
    .filter((tournament) => {
      const startTs = getTimestamp(tournament.startTime);
      return startTs !== null && startTs >= lastWeekTs && startTs <= nowTs;
    })
    .sort((a, b) => {
      const aTs = getTimestamp(a.startTime) ?? 0;
      const bTs = getTimestamp(b.startTime) ?? 0;
      return bTs - aTs;
    })
    .slice(0, limit);
}

export async function getRelevantTournaments(limit = 20) {
  const bucketLimit = Math.max(limit, 10);
  const [live, upcoming, recent] = await Promise.all([
    getLiveTournaments(bucketLimit),
    getUpcomingTournaments(bucketLimit),
    getRecentTournaments(bucketLimit),
  ]);

  const seen = new Set<number>();
  const deduped: FormattedTournament[] = [];

  for (const group of [live, upcoming, recent]) {
    for (const tournament of group) {
      const id = Number(tournament.id || 0);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      deduped.push(tournament);
      if (deduped.length >= limit) return deduped;
    }
  }

  return deduped;
}

export async function getTournaments(limit = 20) {
  const cacheKey = `tournaments:relevant:${limit}`;
  const cached = readCache<FormattedTournament[]>(cacheKey);
  if (cached) return cached;

  const relevant = await getRelevantTournaments(limit);
  writeCache(cacheKey, relevant);
  return relevant;
}
