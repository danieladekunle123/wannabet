/**
 * Trust Score Engine — Unit Tests
 *
 * Tests the pure computation logic of trust score deltas, tier labelling,
 * and the full updateTrustScore() function with Prisma integration.
 */
import { prisma } from "../../src/lib/prisma";
import {
  getTrustTier,
  updateTrustScore,
  TRUST_TIERS,
  type TrustReason,
} from "../../src/lib/trustScore";
import { createTestUser, cleanupUser } from "../helpers/factories";

// ─── Pure function tests (no DB) ──────────────────────────────────────────────

describe("getTrustTier()", () => {
  it("returns 'Highly Trusted' for score >= 90", () => {
    expect(getTrustTier(95).label).toBe("Highly Trusted");
    expect(getTrustTier(90).label).toBe("Highly Trusted");
  });

  it("returns 'Trusted' for score 75-89", () => {
    expect(getTrustTier(89).label).toBe("Trusted");
    expect(getTrustTier(75).label).toBe("Trusted");
  });

  it("returns 'Neutral' for score 50-74", () => {
    expect(getTrustTier(74).label).toBe("Neutral");
    expect(getTrustTier(50).label).toBe("Neutral");
  });

  it("returns 'Risky' for score 25-49", () => {
    expect(getTrustTier(49).label).toBe("Risky");
    expect(getTrustTier(25).label).toBe("Risky");
  });

  it("returns 'Untrusted' for score < 25", () => {
    expect(getTrustTier(24).label).toBe("Untrusted");
    expect(getTrustTier(0).label).toBe("Untrusted");
  });

  it("handles boundary values exactly", () => {
    expect(getTrustTier(100).label).toBe("Highly Trusted");
  });

  it("returns correct colors for each tier", () => {
    expect(getTrustTier(95).color).toBe("emerald");
    expect(getTrustTier(80).color).toBe("green");
    expect(getTrustTier(60).color).toBe("yellow");
    expect(getTrustTier(30).color).toBe("orange");
    expect(getTrustTier(10).color).toBe("red");
  });
});

describe("TRUST_TIERS ordering", () => {
  it("tiers are ordered from highest to lowest min", () => {
    for (let i = 1; i < TRUST_TIERS.length; i++) {
      expect(TRUST_TIERS[i - 1].min).toBeGreaterThan(TRUST_TIERS[i].min);
    }
  });
});

// ─── Integration tests (requires DB) ─────────────────────────────────────────

describe("updateTrustScore()", () => {
  let userId: string;

  beforeAll(async () => {
    const { user } = await createTestUser();
    userId = user.id;
  });

  afterAll(async () => {
    await cleanupUser(userId);
  });

  it("increases trust score for CORRECT_SUBMISSION (+1.5)", async () => {
    const before = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });

    await updateTrustScore(
      userId,
      "CORRECT_SUBMISSION",
      `test-match-cs-${Date.now()}`,
    );

    const after = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });
    expect(after!.trustScore).toBe(before!.trustScore + 1.5);
  });

  it("decreases trust score for WRONG_SUBMISSION (-5)", async () => {
    const before = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });

    await updateTrustScore(
      userId,
      "WRONG_SUBMISSION",
      `test-match-ws-${Date.now()}`,
    );

    const after = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });
    expect(after!.trustScore).toBe(before!.trustScore - 5);
  });

  it("adds DISPUTE_WON (+2)", async () => {
    const before = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });

    await updateTrustScore(
      userId,
      "DISPUTE_WON",
      `test-match-dw-${Date.now()}`,
    );

    const after = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });
    expect(after!.trustScore).toBe(before!.trustScore + 2);
  });

  it("applies DISPUTE_LOST (-8)", async () => {
    const before = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });

    await updateTrustScore(
      userId,
      "DISPUTE_LOST",
      `test-match-dl-${Date.now()}`,
    );

    const after = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });
    expect(after!.trustScore).toBe(before!.trustScore - 8);
  });

  it("clamps score at 0 (never negative)", async () => {
    // Set score to 3 so -5 would go below 0
    await prisma.profile.update({
      where: { userId },
      data: { trustScore: 3 } as any,
    });

    await updateTrustScore(
      userId,
      "WRONG_SUBMISSION",
      `test-match-clamp0-${Date.now()}`,
    );

    const after = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });
    expect(after!.trustScore).toBe(0);
  });

  it("clamps score at 100 (never exceeds max)", async () => {
    await prisma.profile.update({
      where: { userId },
      data: { trustScore: 99.5 } as any,
    });

    await updateTrustScore(
      userId,
      "CORRECT_SUBMISSION",
      `test-match-clamp100-${Date.now()}`,
    );

    const after = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });
    expect(after!.trustScore).toBe(100);
  });

  it("creates a PlayerLog entry for each trust update", async () => {
    const matchId = `test-match-log-${Date.now()}`;
    await prisma.profile.update({
      where: { userId },
      data: { trustScore: 50 } as any,
    });

    await updateTrustScore(userId, "HOST_CORRECT", matchId);

    const log = await prisma.playerLog.findFirst({
      where: {
        userId,
        type: "TRUST_UPDATE",
        meta: { path: ["matchId"], equals: matchId },
      },
    });
    expect(log).toBeTruthy();
    expect(log!.message).toContain("+1");
    expect(log!.message).toContain("host correct");
  });

  it("deduplicates trust updates per user per match", async () => {
    const matchId = `test-match-dedup-${Date.now()}`;
    await prisma.profile.update({
      where: { userId },
      data: { trustScore: 50 } as any,
    });

    await updateTrustScore(userId, "CORRECT_SUBMISSION", matchId);
    const afterFirst = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });

    // Second call with same matchId should be a no-op
    await updateTrustScore(userId, "CORRECT_SUBMISSION", matchId);
    const afterSecond = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });

    expect(afterSecond!.trustScore).toBe(afterFirst!.trustScore);
  });

  it("allows trust updates without matchId (no dedup)", async () => {
    await prisma.profile.update({
      where: { userId },
      data: { trustScore: 50 } as any,
    });

    await updateTrustScore(userId, "HOST_CORRECT");
    const after1 = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });
    expect(after1!.trustScore).toBe(51);

    await updateTrustScore(userId, "HOST_CORRECT");
    const after2 = await prisma.profile.findUnique({
      where: { userId },
      select: { trustScore: true },
    });
    expect(after2!.trustScore).toBe(52);
  });
});
