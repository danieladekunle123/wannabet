import { prisma } from "./prisma";

export type TrustReason =
  | "CORRECT_SUBMISSION"
  | "WRONG_SUBMISSION"
  | "DISPUTE_WON"
  | "DISPUTE_LOST"
  | "HOST_CORRECT"
  | "HOST_INCORRECT";

/** Delta applied per reason.  Penalties intentionally outweigh rewards. */
const TRUST_DELTA: Record<TrustReason, number> = {
  CORRECT_SUBMISSION: 1.5,
  WRONG_SUBMISSION: -5,
  DISPUTE_WON: 2,
  DISPUTE_LOST: -8,
  HOST_CORRECT: 1,
  HOST_INCORRECT: -4,
};

export const TRUST_TIERS = [
  { min: 90, label: "Highly Trusted", color: "emerald" },
  { min: 75, label: "Trusted", color: "green" },
  { min: 50, label: "Neutral", color: "yellow" },
  { min: 25, label: "Risky", color: "orange" },
  { min: 0, label: "Untrusted", color: "red" },
] as const;

export function getTrustTier(score: number) {
  return (
    TRUST_TIERS.find((t) => score >= t.min) ??
    TRUST_TIERS[TRUST_TIERS.length - 1]
  );
}

/**
 * Update a user's trust score and create a PlayerLog entry.
 *
 * Pass `matchId` to enable per-match deduplication — only ONE trust change
 * is recorded per user per match to prevent farming.
 */
export async function updateTrustScore(
  userId: string,
  reason: TrustReason,
  matchId?: string,
): Promise<void> {
  try {
    // Anti-abuse: one trust update per user per match
    if (matchId) {
      const existing = await prisma.playerLog.findFirst({
        where: {
          userId,
          type: "TRUST_UPDATE",
          meta: { path: ["matchId"], equals: matchId },
        },
        select: { id: true },
      });
      if (existing) return;
    }

    const delta = TRUST_DELTA[reason];

    // Upsert profile with baseline 87 for new users (85–90 range per spec)
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: { userId, trustScore: 87 } as any,
      update: {},
      select: { trustScore: true },
    });

    const before = profile.trustScore ?? 87;
    const after = Math.min(100, Math.max(0, before + delta));

    await prisma.profile.update({
      where: { userId },
      data: { trustScore: after } as any,
    });

    await prisma.playerLog.create({
      data: {
        userId,
        actorId: userId,
        type: "TRUST_UPDATE",
        message: `Trust ${delta >= 0 ? "+" : ""}${delta} (${reason
          .replace(/_/g, " ")
          .toLowerCase()})`,
        meta: {
          reason,
          changeAmount: delta,
          before,
          after,
          ...(matchId ? { matchId } : {}),
        },
      },
    });
  } catch (err) {
    // Trust updates are non-critical — log but never break the calling flow
    console.error("[updateTrustScore] failed for", userId, reason, err);
  }
}
