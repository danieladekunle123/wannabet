/**
 * Match Lifecycle Integration Tests
 *
 * Covers: create, join, report, confirm (with payout), cancel, and edge cases.
 * Tests the full wager lifecycle: create→join→report→confirm→payout
 */
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import {
  createTestUser,
  cleanupUser,
  cleanupMatch,
} from "../helpers/factories";

const userIds: string[] = [];
const matchIds: string[] = [];

afterAll(async () => {
  for (const id of matchIds) await cleanupMatch(id);
  for (const id of userIds) await cleanupUser(id);
}, 60000);

describe("Match Creation & Escrow", () => {
  it("creates a match and locks stake into escrow", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    const res = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${token}`)
      .send({ game: "Test Game", stake: 1000, matchType: "wager" })
      .expect(201);

    expect(res.body.match).toBeDefined();
    expect(res.body.match.stake).toBe(1000);
    expect(res.body.match.status).toBe("UPCOMING");
    expect(res.body.wallet.escrow).toBe(1000);
    expect(res.body.wallet.balance).toBe(4000);

    matchIds.push(res.body.match.id);
  });

  it("rejects match creation with insufficient balance", async () => {
    const { user, token } = await createTestUser({}, 100);
    userIds.push(user.id);

    await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${token}`)
      .send({ game: "Test", stake: 5000 })
      .expect(400);
  });

  it("rejects invalid game name (too short)", async () => {
    const { user, token } = await createTestUser();
    userIds.push(user.id);

    await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${token}`)
      .send({ game: "A", stake: 100 })
      .expect(400);
  });

  it("creates a zero-stake scrim match", async () => {
    const { user, token } = await createTestUser({}, 100);
    userIds.push(user.id);

    const res = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${token}`)
      .send({ game: "Test Game", stake: 0, matchType: "scrim" })
      .expect(201);

    expect(res.body.match.stake).toBe(0);
    matchIds.push(res.body.match.id);
  });

  it("creates ledger entry for escrow lock", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    const res = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${token}`)
      .send({ game: "Test Game", stake: 500 })
      .expect(201);

    matchIds.push(res.body.match.id);
    expect(res.body.ledgerEntry).toBeDefined();
    expect(res.body.ledgerEntry.type).toBe("escrow_lock");
    expect(res.body.ledgerEntry.amount).toBe(500);
  });
});

describe("Match Join", () => {
  it("allows a second player to join an open match", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, joiner.id);

    const createRes = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test Game", stake: 1000 })
      .expect(201);

    const matchId = createRes.body.match.id;
    matchIds.push(matchId);

    const joinRes = await request(app)
      .post(`/matches/${matchId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    expect(joinRes.body.match.joinerId).toBe(joiner.id);

    const joinerWallet = await prisma.wallet.findUnique({
      where: { userId: joiner.id },
    });
    expect(joinerWallet!.escrow).toBe(1000);
    expect(joinerWallet!.balance).toBe(4000);
  });

  it("prevents host from joining own match", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    userIds.push(host.id);

    const res = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 100 })
      .expect(201);
    matchIds.push(res.body.match.id);

    await request(app)
      .post(`/matches/${res.body.match.id}/join`)
      .set("Authorization", `Bearer ${hostToken}`)
      .expect(400);
  });

  it("prevents joining a match with insufficient balance", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: broke, token: brokeToken } = await createTestUser({}, 50);
    userIds.push(host.id, broke.id);

    const res = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 1000 })
      .expect(201);
    matchIds.push(res.body.match.id);

    await request(app)
      .post(`/matches/${res.body.match.id}/join`)
      .set("Authorization", `Bearer ${brokeToken}`)
      .expect(400);
  });

  it("prevents third player from joining already-joined match", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: j1, token: j1Token } = await createTestUser({}, 5000);
    const { user: j2, token: j2Token } = await createTestUser({}, 5000);
    userIds.push(host.id, j1.id, j2.id);

    const res = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 100 })
      .expect(201);
    matchIds.push(res.body.match.id);

    await request(app)
      .post(`/matches/${res.body.match.id}/join`)
      .set("Authorization", `Bearer ${j1Token}`)
      .expect(200);

    await request(app)
      .post(`/matches/${res.body.match.id}/join`)
      .set("Authorization", `Bearer ${j2Token}`)
      .expect(400);
  });
});

describe("Match Report", () => {
  it("allows participant to report result", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, joiner.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test Game", stake: 500 })
      .expect(201);
    const matchId = create.body.match.id;
    matchIds.push(matchId);

    await request(app)
      .post(`/matches/${matchId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    await prisma.match.update({
      where: { id: matchId },
      data: { status: "ACTIVE" },
    });

    const report = await request(app)
      .post(`/matches/${matchId}/report`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ winnerId: host.id })
      .expect(200);

    expect(report.body.match.status).toBe("RESULT_REPORTED");
    expect(report.body.match.reportedWinnerId).toBe(host.id);
    expect(report.body.match.reportedById).toBe(host.id);
  });

  it("rejects report from non-participant", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    const { user: outsider, token: outsiderToken } = await createTestUser(
      {},
      5000,
    );
    userIds.push(host.id, joiner.id, outsider.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 100 })
      .expect(201);
    matchIds.push(create.body.match.id);

    await request(app)
      .post(`/matches/${create.body.match.id}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    await prisma.match.update({
      where: { id: create.body.match.id },
      data: { status: "ACTIVE" },
    });

    await request(app)
      .post(`/matches/${create.body.match.id}/report`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({ winnerId: host.id })
      .expect(403);
  });

  it("rejects report on non-ACTIVE match", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, joiner.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 100 })
      .expect(201);
    matchIds.push(create.body.match.id);

    await request(app)
      .post(`/matches/${create.body.match.id}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    await request(app)
      .post(`/matches/${create.body.match.id}/report`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ winnerId: host.id })
      .expect(400);
  });

  it("rejects invalid winnerId", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, joiner.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 100 })
      .expect(201);
    matchIds.push(create.body.match.id);

    await request(app)
      .post(`/matches/${create.body.match.id}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    await prisma.match.update({
      where: { id: create.body.match.id },
      data: { status: "ACTIVE" },
    });

    await request(app)
      .post(`/matches/${create.body.match.id}/report`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ winnerId: "non-existent-user-id" })
      .expect(400);
  });
});

describe("Match Confirm & Payout", () => {
  it("completes match and pays winner 2x stake", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, joiner.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 1000 })
      .expect(201);
    const matchId = create.body.match.id;
    matchIds.push(matchId);

    await request(app)
      .post(`/matches/${matchId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    await prisma.match.update({
      where: { id: matchId },
      data: { status: "ACTIVE" },
    });

    await request(app)
      .post(`/matches/${matchId}/report`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ winnerId: joiner.id })
      .expect(200);

    const confirm = await request(app)
      .post(`/matches/${matchId}/confirm`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    expect(confirm.body.match.status).toBe("COMPLETED");

    const winnerWallet = await prisma.wallet.findUnique({
      where: { userId: joiner.id },
    });
    const loserWallet = await prisma.wallet.findUnique({
      where: { userId: host.id },
    });

    expect(winnerWallet!.balance).toBe(6000);
    expect(winnerWallet!.escrow).toBe(0);
    expect(loserWallet!.balance).toBe(4000);
    expect(loserWallet!.escrow).toBe(0);
  });

  it("prevents reporter from confirming their own report", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, joiner.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 100 })
      .expect(201);
    matchIds.push(create.body.match.id);

    await request(app)
      .post(`/matches/${create.body.match.id}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    await prisma.match.update({
      where: { id: create.body.match.id },
      data: { status: "ACTIVE" },
    });

    await request(app)
      .post(`/matches/${create.body.match.id}/report`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ winnerId: host.id })
      .expect(200);

    await request(app)
      .post(`/matches/${create.body.match.id}/confirm`)
      .set("Authorization", `Bearer ${hostToken}`)
      .expect(400);
  });

  it("prevents non-participant from confirming", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    const { user: outsider, token: outsiderToken } = await createTestUser(
      {},
      5000,
    );
    userIds.push(host.id, joiner.id, outsider.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 100 })
      .expect(201);
    matchIds.push(create.body.match.id);

    await request(app)
      .post(`/matches/${create.body.match.id}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    await prisma.match.update({
      where: { id: create.body.match.id },
      data: { status: "ACTIVE" },
    });

    await request(app)
      .post(`/matches/${create.body.match.id}/report`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ winnerId: host.id })
      .expect(200);

    await request(app)
      .post(`/matches/${create.body.match.id}/confirm`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .expect(403);
  });
});

describe("Match Cancel", () => {
  it("host can cancel and get escrow refunded", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    userIds.push(host.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 1000 })
      .expect(201);
    matchIds.push(create.body.match.id);

    const del = await request(app)
      .delete(`/matches/${create.body.match.id}`)
      .set("Authorization", `Bearer ${hostToken}`)
      .expect(200);

    expect(del.body.ok).toBe(true);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: host.id },
    });
    expect(wallet!.balance).toBe(5000);
    expect(wallet!.escrow).toBe(0);
  });

  it("cannot cancel match after someone joined", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, joiner.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 100 })
      .expect(201);
    matchIds.push(create.body.match.id);

    await request(app)
      .post(`/matches/${create.body.match.id}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    await request(app)
      .delete(`/matches/${create.body.match.id}`)
      .set("Authorization", `Bearer ${hostToken}`)
      .expect(400);
  });

  it("non-host cannot cancel match", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: other, token: otherToken } = await createTestUser({}, 5000);
    userIds.push(host.id, other.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 100 })
      .expect(201);
    matchIds.push(create.body.match.id);

    await request(app)
      .delete(`/matches/${create.body.match.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(403);
  });
});

describe("Match Read Endpoints", () => {
  it("GET /matches/featured returns a match or null", async () => {
    const res = await request(app).get("/matches/featured").expect(200);
    expect(res.body).toHaveProperty("match");
  });

  it("GET /matches/mine returns user's matches", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${token}`)
      .send({ game: "Test", stake: 0 })
      .expect(201);
    matchIds.push(create.body.match.id);

    const res = await request(app)
      .get("/matches/mine")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.matches)).toBe(true);
    expect(res.body.matches.length).toBeGreaterThanOrEqual(1);
  });
});
