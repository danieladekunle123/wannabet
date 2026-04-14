import { notifyRateLimit } from "../context/RateLimitContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
  };

  if (!(opts.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
  });

  if (res.status === 429) {
    const retryHeader = res.headers.get("Retry-After");
    const retrySecs = retryHeader ? parseInt(retryHeader, 10) : 30;
    notifyRateLimit(true, isNaN(retrySecs) ? 30 : retrySecs);
  }

  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getPublicProfile(userId: string) {
  return apiFetch(`/users/${userId}`);
}

export async function getUserByUsername(username: string) {
  return apiFetch(`/users/by-username/${encodeURIComponent(username)}`);
}

export async function getMyFriends() {
  return apiFetch(`/users/me/friends`);
}

export async function searchUsers(query: string) {
  return apiFetch(`/search?q=${encodeURIComponent(query)}`);
}

export async function getMyWallet() {
  return apiFetch(`/wallet`);
}

export async function getMyLedger() {
  return apiFetch(`/wallet/ledger`);
}

/**
 * Create a Stripe PaymentIntent for a deposit.
 * @param amountCents - integer amount in CENTS (e.g. $10.00 → 1000)
 * Returns { clientSecret, id }
 */
export async function createPaymentIntent(amountCents: number) {
  return apiFetch(`/stripe/payment-intent`, {
    method: "POST",
    body: JSON.stringify({ amount: amountCents }),
  });
}

/**
 * Confirm a succeeded PaymentIntent on the backend to credit the wallet.
 * Used as fallback when Stripe webhooks are not forwarded locally.
 */
export async function confirmStripePayment(paymentIntentId: string) {
  return apiFetch(`/stripe/confirm-payment`, {
    method: "POST",
    body: JSON.stringify({ paymentIntentId }),
  });
}

export async function withdraw(amount: number) {
  return apiFetch(`/wallet/withdraw`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getMyGames() {
  return apiFetch(`/users/me/games`);
}

export async function createMatch(payload: { game: string; stake: number }) {
  return apiFetch(`/matches`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTournaments() {
  return apiFetch(`/tournaments`);
}

export async function getTournament(id: string) {
  return apiFetch(`/tournaments/${id}`);
}

export async function createTournament(payload: any) {
  return apiFetch(`/tournaments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function joinTournament(id: string) {
  return apiFetch(`/tournaments/${id}/join`, { method: "POST" });
}

export async function getTournamentBracket(id: string) {
  return apiFetch(`/tournaments/${id}/bracket`);
}

export async function registerTeamForTournament(
  tournamentId: string,
  teamId: string,
) {
  return apiFetch(`/tournaments/${tournamentId}/teams`, {
    method: "POST",
    body: JSON.stringify({ teamId }),
  });
}

export async function removeTeamFromTournament(
  tournamentId: string,
  teamId: string,
) {
  return apiFetch(`/tournaments/${tournamentId}/teams/${teamId}`, {
    method: "DELETE",
  });
}

export async function startTournament(tournamentId: string) {
  return apiFetch(`/tournaments/${tournamentId}/start`, { method: "POST" });
}

export async function cancelTournament(tournamentId: string) {
  return apiFetch(`/tournaments/${tournamentId}`, { method: "DELETE" });
}

export async function cancelMatch(matchId: string) {
  return apiFetch(`/matches/${matchId}`, { method: "DELETE" });
}

export async function updateTournament(
  tournamentId: string,
  payload: { name?: string; startAt?: string | null },
) {
  return apiFetch(`/tournaments/${tournamentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function startTournamentMatch(
  tournamentId: string,
  matchId: string,
) {
  return apiFetch(`/tournaments/${tournamentId}/matches/${matchId}/start`, {
    method: "POST",
  });
}

export async function submitTournamentMatchResult(
  tournamentId: string,
  matchId: string,
  payload: { claimedWinnerId: string; scoreA?: number; scoreB?: number },
) {
  return apiFetch(`/tournaments/${tournamentId}/matches/${matchId}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resolveTournamentDispute(
  tournamentId: string,
  matchId: string,
  winnerId: string,
) {
  return apiFetch(`/tournaments/${tournamentId}/matches/${matchId}/resolve`, {
    method: "POST",
    body: JSON.stringify({ winnerId }),
  });
}

export async function forfeitTournamentMatch(
  tournamentId: string,
  matchId: string,
) {
  return apiFetch(`/tournaments/${tournamentId}/matches/${matchId}/forfeit`, {
    method: "POST",
  });
}

export async function getTournamentLeaderboard(tournamentId: string) {
  return apiFetch(`/tournaments/${tournamentId}/leaderboard`);
}

export async function getMyMatches() {
  return apiFetch(`/matches/mine`);
}

export async function joinMatch(matchId: string) {
  return apiFetch(`/matches/${matchId}/join`, { method: "POST" });
}

export async function addOrUpdateGame(payload: any) {
  return apiFetch(`/users/me/games`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteMyGame(gameId: string) {
  return apiFetch(`/users/me/games/${encodeURIComponent(gameId)}`, {
    method: "DELETE",
  });
}

export async function updateMyProfile(payload: any) {
  return apiFetch(`/users/me/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateMyAccount(payload: any) {
  return apiFetch(`/users/me`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadMyProfileImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch(`/users/me/profile-image/upload`, {
    method: "POST",
    body: form,
  });
}

export async function setMyProfileImageUrl(profileImageUrl: string | null) {
  return apiFetch(`/users/me/profile-image`, {
    method: "PATCH",
    body: JSON.stringify({ profileImageUrl }),
  });
}

export async function getMe() {
  return apiFetch(`/users/me`);
}

export async function detectRegion() {
  return apiFetch(`/api/region/detect`);
}

export async function getCountriesAndRegions() {
  return apiFetch(`/api/regions/countries`);
}

export async function getEsportsMatches(limit = 12) {
  return apiFetch(
    `/api/esports/relevant?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function getEsportsLiveMatches(limit = 12) {
  return apiFetch(
    `/api/esports/live?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function getEsportsUpcomingMatches(limit = 12) {
  return apiFetch(
    `/api/esports/upcoming?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function getEsportsRecentMatches(limit = 12) {
  return apiFetch(
    `/api/esports/recent?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function getEsportsTournaments(limit = 12) {
  return apiFetch(
    `/api/esports/tournaments/relevant?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function getLeaderboardWins(
  type: "all" | "wager" | "tournament" | "scrim" | "custom" = "all",
  userId?: string,
) {
  const params = new URLSearchParams({ type });
  if (userId) params.set("userId", userId);
  return apiFetch(`/leaderboard/wins?${params}`);
}

export async function getLeaderboardEarnings(userId?: string) {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  return apiFetch(`/leaderboard/earnings?${params}`);
}

export async function getLeaderboardTrust(userId?: string) {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  return apiFetch(`/leaderboard/trust?${params}`);
}

export async function getMyStatsTimeseries(period = "30d") {
  return apiFetch(`/users/me/stats-timeseries?period=${period}`);
}

export default {
  getPublicProfile,
  getMyStatsTimeseries,
  getUserByUsername,
  getMyFriends,
  searchUsers,
  getMyWallet,
  createPaymentIntent,
  confirmStripePayment,
  withdraw,
  getMyGames,
  addOrUpdateGame,
  deleteMyGame,
  updateMyProfile,
  updateMyAccount,
  uploadMyProfileImage,
  setMyProfileImageUrl,
  getMe,
  detectRegion,
  getCountriesAndRegions,
  getEsportsMatches,
  getEsportsLiveMatches,
  getEsportsUpcomingMatches,
  getEsportsRecentMatches,
  getEsportsTournaments,
  getMyLedger,
  createMatch,
  getMyMatches,
  joinMatch,
  getTournaments,
  getTournament,
  createTournament,
  joinTournament,
  getTournamentBracket,
  registerTeamForTournament,
  removeTeamFromTournament,
  startTournament,
  cancelTournament,
  cancelMatch,
  updateTournament,
  startTournamentMatch,
  submitTournamentMatchResult,
  resolveTournamentDispute,
  forfeitTournamentMatch,
  getTournamentLeaderboard,
  getLeaderboardWins,
  getLeaderboardEarnings,
  getLeaderboardTrust,
};
