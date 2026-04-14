import { notifyRateLimit } from "../context/RateLimitContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export type TeamRole = "commander" | "general" | "colonel";

export type TeamMember = {
  id?: string;
  userId: string;
  username?: string;
  role: TeamRole;
  roleLabel?: string;
  joinedAt?: string;
  profileImageUrl?: string | null;
  stats?: {
    wins?: number;
    losses?: number;
    mmr?: number | null;
    earnings?: number;
  };
  user?: {
    id: string;
    username: string;
    profileImageUrl?: string | null;
  };
};

export type TeamRecord = {
  id: string;
  name: string;
  description?: string | null;
  game: string;
  ownerId: string;
  createdAt: string;
  myRole?: TeamRole;
  canPost?: boolean;
  canManageTeam?: boolean;
  chatId?: string;
  memberCount?: number;
  members?: TeamMember[];
};

export type TeamProfileMember = {
  userId: string;
  username: string;
  role: TeamRole;
  roleLabel?: string;
  joinedAt?: string;
  profileImageUrl?: string | null;
  stats: {
    wins: number;
    losses: number;
    mmr: number | null;
    earnings: number;
    gameWins?: number | null;
    gameLosses?: number | null;
  };
};

export type TeamProfileMatch = {
  id: string;
  result: "win" | "loss" | "cancelled" | "pending";
  score: string | null;
  createdAt: string;
  earnings: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "disputed";
  opponent?: string;
  stake?: number;
};

export type TeamProfilePost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    profileImageUrl?: string | null;
  };
};

export type TeamProfile = {
  id: string;
  name: string;
  description?: string | null;
  game: string;
  createdAt: string;
  ownerId: string;
  myRole?: TeamRole;
  canPost?: boolean;
  canManageTeam?: boolean;
  chatId?: string;
  members: TeamProfileMember[];
  matches: TeamProfileMatch[];
  latestPosts: TeamProfilePost[];
};

export type TeamPost = {
  id: string;
  teamId: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    profileImageUrl?: string | null;
  };
};

export type TeamInvite = {
  id: string;
  teamId: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  team?: {
    id: string;
    name: string;
    game: string;
    description?: string | null;
  };
  sender?: {
    id: string;
    username: string;
    profileImageUrl?: string | null;
  };
};

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  if (!(init.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 429) {
    const retryHeader = res.headers.get("Retry-After");
    const retrySecs = retryHeader ? parseInt(retryHeader, 10) : 30;
    notifyRateLimit(true, isNaN(retrySecs) ? 30 : retrySecs);
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

export async function getMyTeams(): Promise<TeamRecord[]> {
  const data = await apiFetch("/teams/my");
  return Array.isArray(data?.teams) ? data.teams : [];
}

export async function createTeam(payload: {
  name: string;
  description?: string;
  game: string;
}) {
  return apiFetch("/teams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTeam(teamId: string): Promise<TeamRecord> {
  const data = await apiFetch(`/teams/${encodeURIComponent(teamId)}`);
  return data.team;
}

export async function getTeamProfile(teamId: string): Promise<TeamProfile> {
  const data = await apiFetch(`/api/teams/${encodeURIComponent(teamId)}`);
  return data.team;
}

export async function updateTeam(
  teamId: string,
  payload: { name?: string; description?: string; game?: string },
) {
  return apiFetch(`/teams/${encodeURIComponent(teamId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTeam(teamId: string) {
  return apiFetch(`/teams/${encodeURIComponent(teamId)}`, {
    method: "DELETE",
  });
}

export async function inviteToTeam(teamId: string, receiverId: string) {
  return apiFetch(`/teams/${encodeURIComponent(teamId)}/invites`, {
    method: "POST",
    body: JSON.stringify({ receiverId }),
  });
}

export async function getTeamInvites(): Promise<TeamInvite[]> {
  const data = await apiFetch("/teams/invites/received");
  return Array.isArray(data?.invites) ? data.invites : [];
}

export async function respondToTeamInvite(
  inviteId: string,
  action: "accepted" | "declined",
) {
  return apiFetch(`/teams/invites/${encodeURIComponent(inviteId)}/respond`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export async function getTeamPosts(teamId: string): Promise<{
  posts: TeamPost[];
  canPost: boolean;
}> {
  const data = await apiFetch(`/teams/${encodeURIComponent(teamId)}/posts`);
  return {
    posts: Array.isArray(data?.posts) ? data.posts : [],
    canPost: !!data?.canPost,
  };
}

export async function createTeamPost(
  teamId: string,
  payload: { title: string; content: string },
) {
  return apiFetch(`/teams/${encodeURIComponent(teamId)}/posts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeTeamMember(teamId: string, userId: string) {
  return apiFetch(
    `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    },
  );
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole,
) {
  return apiFetch(
    `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}/role`,
    {
      method: "POST",
      body: JSON.stringify({ role }),
    },
  );
}

export async function leaveTeam(teamId: string) {
  return apiFetch(`/teams/${encodeURIComponent(teamId)}/leave`, {
    method: "POST",
  });
}
