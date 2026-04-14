import { notifyRateLimit } from "../context/RateLimitContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export type EventRecord = {
  id: string;
  sourceId: string;
  sourceType: "tournament" | "match";
  type: "tournament" | "scrim" | "wager" | "custom";
  title: string;
  game: string;
  status:
    | "upcoming"
    | "ongoing"
    | "completed"
    | "cancelled"
    | "disputed"
    | "archived";
  hostId: string | null;
  participants: Array<{ id: string; username: string }>;
  maxParticipants: number;
  date: string | null;
  time: string | null;
  region: string | null;
  teamSize: number | null;
  entryFee: number;
  prizePool: number;
  wagerAmount: number;
  format: string | null;
  platform: string;
  createdAt: string;
  startTime: string | null;
  endTime: string | null;
  description?: string | null;
  joinDeadline: string | null;
  isPrivate?: boolean;
  reportedWinnerId?: string | null;
  canReportResult?: boolean;
  canVerifyResult?: boolean;
};

export type ModeratorDisputeReport = {
  id: string;
  status: string;
  disputantId: string;
  disputantUsername: string;
  description: string;
  claimedWinnerId: string | null;
  evidenceUrls: string[];
  createdAt: string;
  reviewedById: string | null;
  reviewedByUsername: string | null;
  resolutionWinnerId: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
};

export type ModeratorDisputeCase = {
  id: string;
  matchId: string;
  game: string;
  wagerAmount: number;
  matchStatus: string;
  createdAt: string;
  participants: Array<{ id: string; username: string }>;
  reports: ModeratorDisputeReport[];
};

type EventSourceType = EventRecord["sourceType"];

export type IncomingMatchRequest = {
  id: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    profileImageUrl?: string | null;
    profile?: { displayName?: string | null };
  } | null;
  game: string;
  matchType: "casual" | "wager" | "scrim";
  description: string;
  rounds: number;
  region: string;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledAt?: string;
  wagerAmount: number;
  challengeMessage: string;
  status: "pending";
};

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string>),
  };

  if (!(opts.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
  });

  if (res.status === 429) {
    const retryHeader = res.headers.get("Retry-After");
    const retrySecs = retryHeader ? parseInt(retryHeader, 10) : 30;
    notifyRateLimit(true, isNaN(retrySecs) ? 30 : retrySecs);
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMessage = Array.isArray(payload)
      ? payload
          .map((issue) =>
            typeof issue?.message === "string" ? issue.message : null,
          )
          .filter((message): message is string => !!message)
          .join(", ")
      : typeof payload?.message === "string"
        ? payload.message
        : "Request failed";
    throw new Error(errorMessage || "Request failed");
  }
  return payload;
}

export async function getMyEvents(): Promise<EventRecord[]> {
  const data = await apiFetch("/events/my");
  return Array.isArray(data.events) ? data.events : [];
}

export async function getActiveEvents(): Promise<EventRecord[]> {
  const data = await apiFetch("/events/active");
  return Array.isArray(data.events) ? data.events : [];
}

export type RecommendedEvent = EventRecord & {
  matchScore: number;
  reason: string;
};

export async function getRecommendedEvents(): Promise<RecommendedEvent[]> {
  const data = await apiFetch("/events/recommended");
  return Array.isArray(data.events) ? data.events : [];
}

export async function getEventBySourceId(
  sourceId: string,
): Promise<EventRecord> {
  const data = await apiFetch(`/events/source/${encodeURIComponent(sourceId)}`);
  return data.event;
}

export async function getTournamentsEvents(): Promise<EventRecord[]> {
  const data = await apiFetch("/events/tournaments");
  return Array.isArray(data.events) ? data.events : [];
}

export async function getScrimEvents(): Promise<EventRecord[]> {
  const data = await apiFetch("/events/scrims");
  return Array.isArray(data.events) ? data.events : [];
}

export async function getWagerEvents(): Promise<EventRecord[]> {
  const data = await apiFetch("/events/wagers");
  return Array.isArray(data.events) ? data.events : [];
}

export async function editEvent(
  sourceType: EventSourceType,
  id: string,
  payload: { title?: string; description?: string },
) {
  return apiFetch(`/events/${sourceType}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function joinEvent(sourceType: EventSourceType, id: string) {
  return apiFetch(`/events/${sourceType}/${id}/join`, { method: "POST" });
}

export async function leaveEvent(sourceType: EventSourceType, id: string) {
  return apiFetch(`/events/${sourceType}/${id}/leave`, { method: "POST" });
}

export async function startEvent(sourceType: EventSourceType, id: string) {
  return apiFetch(`/events/${sourceType}/${id}/start`, { method: "POST" });
}

export async function cancelEvent(sourceType: EventSourceType, id: string) {
  return apiFetch(`/events/${sourceType}/${id}/cancel`, { method: "POST" });
}

export async function submitMatchResult(payload: {
  sourceId: string;
  winnerId: string;
  score?: string;
}) {
  const trimmedScore = payload.score?.trim() || "";

  return apiFetch(
    `/events/${encodeURIComponent(payload.sourceId)}/submit-result`,
    {
      method: "POST",
      body: JSON.stringify({
        winnerId: payload.winnerId,
        ...(trimmedScore ? { score: trimmedScore } : {}),
      }),
    },
  );
}

export async function uploadMatchEvidence(payload: {
  sourceId: string;
  evidenceUrl: string;
}) {
  return apiFetch(
    `/events/${encodeURIComponent(payload.sourceId)}/upload-evidence`,
    {
      method: "POST",
      body: JSON.stringify({ evidenceUrl: payload.evidenceUrl }),
    },
  );
}

export async function uploadMatchEvidenceImage(payload: {
  sourceId: string;
  file: File;
}): Promise<{ ok: boolean; url: string }> {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", payload.file);

  const res = await fetch(
    `${API_URL}/events/${encodeURIComponent(payload.sourceId)}/upload-evidence-image`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : "Upload failed",
    );
  }
  return data;
}

export async function submitDisputeReport(payload: {
  sourceId: string;
  description: string;
  claimedWinnerId?: string;
  files?: File[];
}) {
  const formData = new FormData();
  formData.append("description", payload.description.trim());
  if (payload.claimedWinnerId) {
    formData.append("claimedWinnerId", payload.claimedWinnerId);
  }
  for (const file of payload.files || []) {
    formData.append("files", file);
  }

  return apiFetch(
    `/events/${encodeURIComponent(payload.sourceId)}/dispute-report`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function getModeratorDisputes(
  status: "all" | "open" | "reviewing" | "resolved" = "all",
): Promise<ModeratorDisputeCase[]> {
  const query = status === "all" ? "" : `?status=${encodeURIComponent(status)}`;
  const data = await apiFetch(`/events/disputes${query}`);
  return Array.isArray(data.disputes) ? data.disputes : [];
}

export async function resolveModeratorDispute(payload: {
  matchId: string;
  winnerId: string;
  resolutionNote?: string;
}) {
  return apiFetch(
    `/events/disputes/${encodeURIComponent(payload.matchId)}/resolve`,
    {
      method: "POST",
      body: JSON.stringify({
        winnerId: payload.winnerId,
        ...(payload.resolutionNote?.trim()
          ? { resolutionNote: payload.resolutionNote.trim() }
          : {}),
      }),
    },
  );
}

export async function getIncomingMatchRequests(): Promise<
  IncomingMatchRequest[]
> {
  const data = await apiFetch("/events/requests/match/incoming");
  return Array.isArray(data.requests) ? data.requests : [];
}

export async function respondToMatchRequest(
  requestId: string,
  action: "accept" | "decline",
) {
  return apiFetch(`/events/requests/match/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

export async function createMatchRequest(payload: {
  recipientId: string;
  game: string;
  matchType: "casual" | "wager" | "scrim";
  description?: string;
  rounds: number;
  region?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledAt?: string;
  wagerAmount?: number;
  message?: string;
}) {
  return apiFetch("/events/requests/match", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
