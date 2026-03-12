const RAWG_BASE_URL = "https://api.rawg.io/api";
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;

export interface RawgGameSummary {
  id: number;
  name: string;
  released?: string | null;
  background_image?: string | null;
  rating?: number;
}

export interface RawgSearchResponse {
  results: RawgGameSummary[];
}

export interface RawgGameDetails {
  id: number;
  name: string;
  description?: string;
  rating?: number;
  background_image?: string | null;
  released?: string | null;
  genres?: Array<{ id: number; name: string }>;
  platforms?: Array<{ platform: { id: number; name: string } }>;
}

const searchCache = new Map<string, RawgSearchResponse>();
const detailsCache = new Map<number, RawgGameDetails>();

function ensureKey() {
  if (!RAWG_API_KEY) {
    throw new Error("Missing RAWG API key. Set VITE_RAWG_API_KEY in frontend/.env");
  }
}

export async function searchGames(query: string): Promise<RawgSearchResponse> {
  ensureKey();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return { results: [] };
  }

  const cached = searchCache.get(normalizedQuery);
  if (cached) {
    return cached;
  }

  const url = new URL(`${RAWG_BASE_URL}/games`);
  url.searchParams.set("key", RAWG_API_KEY);
  url.searchParams.set("search", normalizedQuery);
  url.searchParams.set("page_size", "10");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`RAWG search failed (${response.status})`);
  }

  const data = (await response.json()) as RawgSearchResponse;
  searchCache.set(normalizedQuery, data);
  return data;
}

export async function getGameDetails(gameId: number): Promise<RawgGameDetails> {
  ensureKey();

  const cached = detailsCache.get(gameId);
  if (cached) {
    return cached;
  }

  const url = new URL(`${RAWG_BASE_URL}/games/${gameId}`);
  url.searchParams.set("key", RAWG_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`RAWG game details failed (${response.status})`);
  }

  const data = (await response.json()) as RawgGameDetails;
  detailsCache.set(gameId, data);
  return data;
}
