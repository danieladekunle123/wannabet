/**
 * Dispute Flow Integration Tests
 *
 * Covers: dispute list, stats, resolution, access control, and training data tracking.
 */
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import {
  createTestUser,
  createModUser,
  cleanupUser,
  cleanupMatch,
} from "../helpers/factories";

const userIds: string[] = [];
const matchIds: string[] = [];

afterAll(async () => {
  for (const id of matchIds) await cleanupMatch(id);
  for (const id of userIds) await cleanupUser(id);
}, 15000);

describe("Dispute List & Stats", () => {
  it("retrieves disputes list as moderator", async () => {
    const { user, token } = await createModUser();
    userIds.push(user.id);

    const res = await request(app)
      .get("/disputes")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.disputes)).toBe(true);
  });

  it("retrieves dispute stats as moderator", async () => {
    const { user, token } = await createModUser();
    userIds.push(user.id);

    const res = await request(app)
      .get("/disputes/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("resolved");
    expect(res.body).toHaveProperty("open");
    expect(res.body).toHaveProperty("aiAccuracy");
  }, 15000);

  it("can filter disputes by status", async () => {
    const { user, token } = await createModUser();
    userIds.push(user.id);

    const res = await request(app)
      .get("/disputes?status=open")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.disputes)).toBe(true);
  });
});

describe("Dispute Access Control", () => {
  it("rejects dispute list for regular player", async () => {
    const { user, token } = await createTestUser();
    userIds.push(user.id);

    await request(app)
      .get("/disputes")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("rejects dispute stats for regular player", async () => {
    const { user, token } = await createTestUser();
    userIds.push(user.id);

    await request(app)
      .get("/disputes/stats")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("rejects unauthenticated dispute access", async () => {
    await request(app).get("/disputes").expect(401);
  });
});

describe("Dispute Resolution Flow", () => {
  it("resolves a dispute and updates match status", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    const { user: mod, token: modToken } = await createModUser();
    userIds.push(host.id, joiner.id, mod.id);

    // Create and set up a disputed match
    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 500 })
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

    // Report result
    await request(app)
      .post(`/matches/${matchId}/report`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ winnerId: host.id })
      .expect(200);

    // Create a dispute manually
    const dispute = await (prisma as any).dispute.create({
      data: {
        matchId,
        disputantId: joiner.id,
        reason: "Wrong result reported",
        description: "I actually won this match",
        status: "open",
      },
    });

    // Resolve the dispute as moderator
    const resolve = await request(app)
      .post(`/disputes/${dispute.id}/resolve`)
      .set("Authorization", `Bearer ${modToken}`)
      .send({ winnerId: joiner.id, outcome: "approved_reporter" })
      .expect(200);

    expect(resolve.body.dispute.status).toBe("resolved");

    // Verify match was updated
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    expect(match!.status).toBe("COMPLETED");
  });

  it("rejects resolving an already-resolved dispute", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    const { user: mod, token: modToken } = await createModUser();
    userIds.push(host.id, joiner.id, mod.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 500 })
      .expect(201);
    const matchId = create.body.match.id;
    matchIds.push(matchId);

    await request(app)
      .post(`/matches/${matchId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    const dispute = await (prisma as any).dispute.create({
      data: {
        matchId,
        disputantId: joiner.id,
        reason: "Test",
        status: "resolved",
        resolvedWinnerId: host.id,
        resolvedAt: new Date(),
        resolvedByModId: mod.id,
      },
    });

    await request(app)
      .post(`/disputes/${dispute.id}/resolve`)
      .set("Authorization", `Bearer ${modToken}`)
      .send({ winnerId: host.id, outcome: "denied_reporter" })
      .expect(400);
  });

  it("rejects resolve with missing fields", async () => {
    const { user: mod, token: modToken } = await createModUser();
    userIds.push(mod.id);

    await request(app)
      .post("/disputes/fake-id/resolve")
      .set("Authorization", `Bearer ${modToken}`)
      .send({})
      .expect(400);
  });

  it("returns 404 for non-existent dispute", async () => {
    const { user: mod, token: modToken } = await createModUser();
    userIds.push(mod.id);

    await request(app)
      .post("/disputes/00000000-0000-0000-0000-000000000000/resolve")
      .set("Authorization", `Bearer ${modToken}`)
      .send({ winnerId: "someone", outcome: "approved_reporter" })
      .expect(404);
  });
});

describe("Dispute Financial Settlement", () => {
  it("credits winner with 2x stake and clears all escrow", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    const { user: mod, token: modToken } = await createModUser();
    userIds.push(host.id, joiner.id, mod.id);

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
      .send({ winnerId: host.id })
      .expect(200);

    const dispute = await (prisma as any).dispute.create({
      data: {
        matchId,
        disputantId: joiner.id,
        reason: "Wrong result",
        status: "open",
      },
    });

    // Moderator overrides — joiner is the actual winner
    await request(app)
      .post(`/disputes/${dispute.id}/resolve`)
      .set("Authorization", `Bearer ${modToken}`)
      .send({ winnerId: joiner.id, outcome: "approved_reporter" })
      .expect(200);

    const joinerWallet = await prisma.wallet.findUnique({
      where: { userId: joiner.id },
    });
    const hostWallet = await prisma.wallet.findUnique({
      where: { userId: host.id },
    });

    // joiner (winner): 5000 - 1000 (escrow on join) + 2000 (payout) = 6000
    expect(joinerWallet!.balance).toBe(6000);
    expect(joinerWallet!.escrow).toBe(0);
    // host (loser): 5000 - 1000 (escrow on create), escrow released
    expect(hostWallet!.balance).toBe(4000);
    expect(hostWallet!.escrow).toBe(0);
  });

  it("payout is idempotent — second resolve attempt is blocked", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    const { user: mod, token: modToken } = await createModUser();
    userIds.push(host.id, joiner.id, mod.id);

    const create = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ game: "Test", stake: 500 })
      .expect(201);
    const matchId = create.body.match.id;
    matchIds.push(matchId);

    await request(app)
      .post(`/matches/${matchId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`)
      .expect(200);

    const dispute = await (prisma as any).dispute.create({
      data: {
        matchId,
        disputantId: joiner.id,
        reason: "Test",
        status: "open",
      },
    });

    // Resolve once
    await request(app)
      .post(`/disputes/${dispute.id}/resolve`)
      .set("Authorization", `Bearer ${modToken}`)
      .send({ winnerId: joiner.id, outcome: "approved_reporter" })
      .expect(200);

    // Attempt to resolve again — should be blocked
    const second = await request(app)
      .post(`/disputes/${dispute.id}/resolve`)
      .set("Authorization", `Bearer ${modToken}`)
      .send({ winnerId: host.id, outcome: "denied_reporter" })
      .expect(400);

    expect(second.body.message).toMatch(/already resolved/i);

    // Winner wallet reflects only a single payout
    const winnerWallet = await prisma.wallet.findUnique({
      where: { userId: joiner.id },
    });
    expect(winnerWallet!.balance).toBe(5500); // 5000 - 500 + 1000
  });

  it("creates two payout ledger entries (winner +pot, loser -stake)", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: joiner, token: joinerToken } = await createTestUser({}, 5000);
    const { user: mod, token: modToken } = await createModUser();
    userIds.push(host.id, joiner.id, mod.id);

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
      .send({ winnerId: host.id })
      .expect(200);

    const dispute = await (prisma as any).dispute.create({
      data: {
        matchId,
        disputantId: joiner.id,
        reason: "Wrong result",
        status: "open",
      },
    });

    await request(app)
      .post(`/disputes/${dispute.id}/resolve`)
      .set("Authorization", `Bearer ${modToken}`)
      .send({ winnerId: host.id, outcome: "denied_reporter" })
      .expect(200);

    const entries = await prisma.ledgerEntry.findMany({
      where: { matchId, type: "payout" },
    });
    expect(entries).toHaveLength(2);

    const winEntry = entries.find((e) => e.amount > 0)!;
    const lossEntry = entries.find((e) => e.amount < 0)!;
    expect(winEntry.amount).toBe(2000); // pot (2x stake)
    expect(lossEntry.amount).toBe(-1000); // -stake
  });
});
