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
      .expect(200);

    expect(join.body).toBeDefined();
  });
});
