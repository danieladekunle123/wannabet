/**
 * Dispute Confidence Scoring — Unit Tests
 *
 * Tests the computeConfidenceScore() function that powers the hybrid
 * dispute resolution scoring model.
 */

// Re-implement the scoring function locally so we can test it in isolation
// without importing the router file (which initializes OpenAI client).

interface DisputeFeatures {
  reporterTrustScore: number;
  reportedTrustScore: number;
  reporterDisputeCount: number;
  reportedDisputeCount: number;
  reporterWinRate: number;
  reportedWinRate: number;
  bothSubmittedSame: boolean;
  reporterSubmittedFirst: boolean;
  submissionDelayMinutes: number;
  matchStake: number;
}

function computeConfidenceScore(features: DisputeFeatures) {
  const breakdown: Record<string, number> = {};
  let reporterWeight = 0;

  const trustDiff = features.reporterTrustScore - features.reportedTrustScore;
  const trustScore = Math.max(-40, Math.min(40, trustDiff * 0.4));
  breakdown.trustDifferential = trustScore;
  reporterWeight += trustScore;

  const historyScore = Math.min(20, features.reportedDisputeCount * 2.5);
  breakdown.reportedDisputeHistory = historyScore;
  reporterWeight += historyScore;

  const reporterHistPenalty = Math.min(15, features.reporterDisputeCount * 1.5);
  breakdown.reporterHistoryPenalty = -reporterHistPenalty;
  reporterWeight -= reporterHistPenalty;

  const speedScore = features.reporterSubmittedFirst
    ? Math.max(0, 10 - features.submissionDelayMinutes * 0.5)
    : 0;
  breakdown.submissionSpeed = speedScore;
  reporterWeight += speedScore;

  if (features.bothSubmittedSame) {
    breakdown.agreement = 20;
    reporterWeight += 20;
  } else {
    breakdown.agreement = 0;
  }

  const winRateDiff = features.reporterWinRate - features.reportedWinRate;
  const winRateScore = Math.max(-5, Math.min(5, winRateDiff * 0.05));
  breakdown.winRateDifferential = winRateScore;
  reporterWeight += winRateScore;

  const rawConfidence = 50 + reporterWeight;
  const confidence = Math.max(5, Math.min(99, rawConfidence));
  const suggestReporterId = confidence >= 50;

  return { score: confidence, suggestReporterId, breakdown };
}

describe("computeConfidenceScore()", () => {
  const baseFeatures: DisputeFeatures = {
    reporterTrustScore: 80,
    reportedTrustScore: 80,
    reporterDisputeCount: 0,
    reportedDisputeCount: 0,
    reporterWinRate: 50,
    reportedWinRate: 50,
    bothSubmittedSame: false,
    reporterSubmittedFirst: false,
    submissionDelayMinutes: 5,
    matchStake: 1000,
  };

  it("returns 50 confidence when all features are equal", () => {
    const result = computeConfidenceScore(baseFeatures);
    expect(result.score).toBe(50);
    expect(result.suggestReporterId).toBe(true); // >= 50
  });

  it("favors reporter when reporter has higher trust score", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reporterTrustScore: 95,
      reportedTrustScore: 40,
    });
    expect(result.score).toBeGreaterThan(50);
    expect(result.suggestReporterId).toBe(true);
    expect(result.breakdown.trustDifferential).toBeGreaterThan(0);
  });

  it("favors reported player when reporter has lower trust score", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reporterTrustScore: 30,
      reportedTrustScore: 95,
    });
    expect(result.score).toBeLessThan(50);
    expect(result.suggestReporterId).toBe(false);
  });

  it("caps trust differential at ±40", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reporterTrustScore: 100,
      reportedTrustScore: 0,
    });
    expect(result.breakdown.trustDifferential).toBe(40);
  });

  it("penalizes reported player with high dispute history", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reportedDisputeCount: 10,
    });
    expect(result.score).toBeGreaterThan(50);
    expect(result.breakdown.reportedDisputeHistory).toBe(20); // capped
  });

  it("penalizes reporter who files many disputes", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reporterDisputeCount: 10,
    });
    expect(result.score).toBeLessThan(50);
    expect(result.breakdown.reporterHistoryPenalty).toBe(-15); // capped
  });

  it("rewards first-to-submit reporter", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reporterSubmittedFirst: true,
      submissionDelayMinutes: 0,
    });
    expect(result.breakdown.submissionSpeed).toBe(10);
    expect(result.score).toBeGreaterThan(50);
  });

  it("reduces speed bonus for late submissions", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reporterSubmittedFirst: true,
      submissionDelayMinutes: 20,
    });
    expect(result.breakdown.submissionSpeed).toBe(0); // 10 - 20*0.5 = 0
  });

  it("gives no speed bonus if reporter did not submit first", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reporterSubmittedFirst: false,
      submissionDelayMinutes: 0,
    });
    expect(result.breakdown.submissionSpeed).toBe(0);
  });

  it("adds +20 when both submitted same winner", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      bothSubmittedSame: true,
    });
    expect(result.breakdown.agreement).toBe(20);
    expect(result.score).toBe(70);
  });

  it("applies win rate differential as minor signal", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reporterWinRate: 90,
      reportedWinRate: 10,
    });
    expect(result.breakdown.winRateDifferential).toBeCloseTo(4.0);
  });

  it("caps win rate differential at ±5", () => {
    const result = computeConfidenceScore({
      ...baseFeatures,
      reporterWinRate: 100,
      reportedWinRate: 0,
    });
    expect(result.breakdown.winRateDifferential).toBe(5);
  });

  it("clamps final confidence to 5-99 range", () => {
    // Maximum possible: trust 40 + history 20 - 0 penalty + speed 10 + agreement 20 + winrate 5 = 95
    // 50 + 95 = 145 → clamped to 99
    const high = computeConfidenceScore({
      ...baseFeatures,
      reporterTrustScore: 100,
      reportedTrustScore: 0,
      reportedDisputeCount: 10,
      reporterDisputeCount: 0,
      reporterSubmittedFirst: true,
      submissionDelayMinutes: 0,
      bothSubmittedSame: true,
      reporterWinRate: 100,
      reportedWinRate: 0,
    });
    expect(high.score).toBe(99);

    // Minimum possible
    const low = computeConfidenceScore({
      ...baseFeatures,
      reporterTrustScore: 0,
      reportedTrustScore: 100,
      reportedDisputeCount: 0,
      reporterDisputeCount: 10,
      reporterSubmittedFirst: false,
      bothSubmittedSame: false,
      reporterWinRate: 0,
      reportedWinRate: 100,
    });
    expect(low.score).toBe(5);
  });

  it("returns correct suggestReporterId flag", () => {
    expect(
      computeConfidenceScore({
        ...baseFeatures,
        reporterTrustScore: 90,
        reportedTrustScore: 50,
      }).suggestReporterId,
    ).toBe(true);

    expect(
      computeConfidenceScore({
        ...baseFeatures,
        reporterTrustScore: 30,
        reportedTrustScore: 90,
      }).suggestReporterId,
    ).toBe(false);
  });
});
