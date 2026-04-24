/**
 * Tournament Integration Tests
 *
 * Covers: CRUD, joining, bracket generation, result submission, and access control.
 */
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { createTestUser, cleanupUser } from "../helpers/factories";

const userIds: string[] = [];
const tournamentIds: string[] = [];

afterAll(async () => {
  for (const tid of tournamentIds) {
    try {
      await (prisma as any).tournamentMatchSubmission.deleteMany({
        where: { match: { tournamentId: tid } },
      });
      await (prisma as any).tournamentMatch.deleteMany({
        where: { tournamentId: tid },
      });
      await (prisma as any).tournamentTeam.deleteMany({
        where: { tournamentId: tid },
      });
      await (prisma as any).tournamentEntry.deleteMany({
        where: { tournamentId: tid },
      });
      await prisma.tournament.deleteMany({ where: { id: tid } });
    } catch {}
  }
  for (const id of userIds) await cleanupUser(id);
}, 15000);

describe("Tournament CRUD", () => {
  it("creates a tournament", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    const res = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Tournament",
        game: "Valorant",
        entryFee: 0,
        maxParticipants: 8,
      })
      .expect(201);

    expect(res.body.tournament).toBeDefined();
    expect(res.body.tournament.name).toBe("Test Tournament");
    tournamentIds.push(res.body.tournament.id);
  });

  it("lists tournaments", async () => {
    const res = await request(app).get("/tournaments").expect(200);
    expect(Array.isArray(res.body.tournaments)).toBe(true);
  });

  it("retrieves a tournament by ID", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    const create = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Get By ID", game: "Fortnite", maxParticipants: 4 })
      .expect(201);
    tournamentIds.push(create.body.tournament.id);

    const res = await request(app)
      .get(`/tournaments/${create.body.tournament.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.tournament.id).toBe(create.body.tournament.id);
  });

  it("rejects tournament with missing name", async () => {
    const { user, token } = await createTestUser();
    userIds.push(user.id);

    await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${token}`)
      .send({ game: "Test" })
      .expect(400);
  });

  it("requires auth to create tournament", async () => {
    await request(app)
      .post("/tournaments")
      .send({ name: "No Auth", game: "Test" })
      .expect(401);
  });
});

describe("Tournament Join", () => {
  it("allows a user to join a tournament", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: player, token: playerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, player.id);

    const create = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({
        name: "Join Test",
        game: "Valorant",
        maxParticipants: 8,
        entryFee: 0,
      })
      .expect(201);
    tournamentIds.push(create.body.tournament.id);

    const join = await request(app)
      .post(`/tournaments/${create.body.tournament.id}/join`)
      .set("Authorization", `Bearer ${playerToken}`)
      .send({ teamName: "Player Team" })
      .expect(201);

    expect(join.body).toBeDefined();
  });
});

describe("Tournament Entry Fee (solo)", () => {
  it("deducts entry fee from balance when player joins", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: player, token: playerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, player.id);

    const create = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({
        name: "Fee Test Solo",
        game: "Valorant",
        maxParticipants: 8,
        entryFee: 1000,
        teamSize: 1,
      })
      .expect(201);
    const tid = create.body.tournament.id;
    tournamentIds.push(tid);

    await request(app)
      .post(`/tournaments/${tid}/join`)
      .set("Authorization", `Bearer ${playerToken}`)
      .expect(201);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: player.id },
    });
    expect(wallet!.balance).toBe(4000); // 5000 - 1000
    expect(wallet!.escrow).toBe(1000);
  });

  it("rejects join when balance is below entry fee", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: broke, token: brokeToken } = await createTestUser({}, 500);
    userIds.push(host.id, broke.id);

    const create = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({
        name: "Expensive Solo",
        game: "Valorant",
        maxParticipants: 8,
        entryFee: 5000,
        teamSize: 1,
      })
      .expect(201);
    tournamentIds.push(create.body.tournament.id);

    await request(app)
      .post(`/tournaments/${create.body.tournament.id}/join`)
      .set("Authorization", `Bearer ${brokeToken}`)
      .expect(400);
  });

  it("does not deduct fee for free tournaments", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: player, token: playerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, player.id);

    const create = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({
        name: "Free Solo",
        game: "Valorant",
        maxParticipants: 8,
        entryFee: 0,
        teamSize: 1,
      })
      .expect(201);
    tournamentIds.push(create.body.tournament.id);

    await request(app)
      .post(`/tournaments/${create.body.tournament.id}/join`)
      .set("Authorization", `Bearer ${playerToken}`)
      .expect(201);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: player.id },
    });
    expect(wallet!.balance).toBe(5000); // unchanged
    expect(wallet!.escrow).toBe(0);
  });
});

describe("Tournament Cancellation Refund", () => {
  it("refunds all entry fees when tournament is cancelled", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: p1, token: p1Token } = await createTestUser({}, 5000);
    const { user: p2, token: p2Token } = await createTestUser({}, 5000);
    userIds.push(host.id, p1.id, p2.id);

    const create = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({
        name: "Cancel Refund Test",
        game: "Valorant",
        maxParticipants: 8,
        entryFee: 1000,
        teamSize: 1,
      })
      .expect(201);
    const tid = create.body.tournament.id;
    tournamentIds.push(tid);

    await request(app)
      .post(`/tournaments/${tid}/join`)
      .set("Authorization", `Bearer ${p1Token}`)
      .expect(201);
    await request(app)
      .post(`/tournaments/${tid}/join`)
      .set("Authorization", `Bearer ${p2Token}`)
      .expect(201);

    // Host cancels
    await request(app)
      .delete(`/tournaments/${tid}`)
      .set("Authorization", `Bearer ${hostToken}`)
      .expect(200);

    const w1 = await prisma.wallet.findUnique({ where: { userId: p1.id } });
    const w2 = await prisma.wallet.findUnique({ where: { userId: p2.id } });
    expect(w1!.balance).toBe(5000);
    expect(w1!.escrow).toBe(0);
    expect(w2!.balance).toBe(5000);
    expect(w2!.escrow).toBe(0);
  });

  it("creates refund ledger entries after cancellation", async () => {
    const { user: host, token: hostToken } = await createTestUser({}, 5000);
    const { user: player, token: playerToken } = await createTestUser({}, 5000);
    userIds.push(host.id, player.id);

    const create = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${hostToken}`)
      .send({
        name: "Refund Ledger Test",
        game: "Valorant",
        maxParticipants: 8,
        entryFee: 2000,
        teamSize: 1,
      })
      .expect(201);
    const tid = create.body.tournament.id;
    tournamentIds.push(tid);

    await request(app)
      .post(`/tournaments/${tid}/join`)
      .set("Authorization", `Bearer ${playerToken}`)
      .expect(201);

    await request(app)
      .delete(`/tournaments/${tid}`)
      .set("Authorization", `Bearer ${hostToken}`)
      .expect(200);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: player.id },
    });
    const refunds = await prisma.ledgerEntry.findMany({
      where: { walletId: wallet!.id, type: "refund", tournamentId: tid },
    });
    expect(refunds).toHaveLength(1);
    expect(refunds[0].amount).toBe(2000);
  });
});
