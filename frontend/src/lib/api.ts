const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
  });

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

export async function getMyWallet() {
  return apiFetch(`/wallet`);
}

export async function getMyLedger() {
  return apiFetch(`/wallet/ledger`);
}

export async function deposit(amount: number) {
  return apiFetch(`/wallet/deposit`, {
    method: "POST",
    body: JSON.stringify({ amount }),
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
  return apiFetch(`/tournaments`, { method: "POST", body: JSON.stringify(payload) });
}

export async function joinTournament(id: string) {
  return apiFetch(`/tournaments/${id}/join`, { method: "POST" });
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

export async function getMe() {
  return apiFetch(`/users/me`);
}

export default {
  getPublicProfile,
  getMyWallet,
  deposit,
  withdraw,
  getMyGames,
  addOrUpdateGame,
  updateMyProfile,
  updateMyAccount,
  getMe,
  getMyLedger,
  createMatch,
  getMyMatches,
  joinMatch,
  getTournaments,
  getTournament,
  createTournament,
  joinTournament,
};
