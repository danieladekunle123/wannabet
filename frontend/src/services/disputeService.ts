import { notifyRateLimit } from "../context/RateLimitContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function apiFetch<T = any>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...getHeaders(), ...(opts.headers as Record<string, string>) },
  });
  if (res.status === 429) {
    const retryHeader = res.headers.get("Retry-After");
    const retrySecs = retryHeader ? parseInt(retryHeader, 10) : 30;
    notifyRateLimit(true, isNaN(retrySecs) ? 30 : retrySecs);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message ?? "Request failed");
  return data;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DisputePlayerInfo {
  id: string;
  username: string;
  profile?: { trustScore: number } | null;
}

export interface DisputeMatchInfo {
  id: string;
  game: string;
  stake: number;
  status: string;
  hostId: string;
  joinerId: string | null;
  reportedWinnerId: string | null;
  reportedById: string | null;
  host: DisputePlayerInfo;
  joiner: DisputePlayerInfo | null;
}

export interface DisputeAnalysis {
  id: string;
  disputeId: string;
  suggestedWinnerId: string | null;
  confidence: number;
  reasoning: string;
  evidenceSummary: string[];
  createdAt: string;
}

export interface DisputeRecord {
  id: string;
  matchId: string;
  disputantId: string;
  reason: string | null;
  description: string | null;
  evidence: string | null;
  status: "open" | "reviewing" | "resolved";
  resolvedWinnerId: string | null;
  createdAt: string;
  match: DisputeMatchInfo;
  disputant: DisputePlayerInfo;
  analysis: DisputeAnalysis | null;
}

export interface DisputeStats {
  total: number;
  resolved: number;
  open: number;
  aiAccuracy: number | null;
}

// ─── API calls ─────────────────────────────────────────────────────────────────

export async function getDisputes(status?: string): Promise<DisputeRecord[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await apiFetch<{ disputes: DisputeRecord[] }>(`/disputes${qs}`);
  return data.disputes;
}

export async function getDisputeStats(): Promise<DisputeStats> {
  return apiFetch<DisputeStats>("/disputes/stats");
}

export async function analyzeDispute(
  disputeId: string,
): Promise<DisputeAnalysis> {
  const data = await apiFetch<{ analysis: DisputeAnalysis }>(
    "/disputes/analyze",
    {
      method: "POST",
      body: JSON.stringify({ disputeId }),
    },
  );
  return data.analysis;
}

export async function resolveDispute(
  disputeId: string,
  winnerId: string,
  outcome: "approved_reporter" | "denied_reporter" | "split",
): Promise<DisputeRecord> {
  const data = await apiFetch<{ dispute: DisputeRecord }>(
    `/disputes/${disputeId}/resolve`,
    {
      method: "POST",
      body: JSON.stringify({ winnerId, outcome }),
    },
  );
  return data.dispute;
}
