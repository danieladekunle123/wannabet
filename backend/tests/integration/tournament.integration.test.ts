import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { userFactory, generateTestToken } from "../helpers/factories";

let testUser: any;
let authToken: string;
let tournament: any;

beforeAll(async () => {
  testUser = await prisma.user.create({
    data: {
      ...userFactory(),
      wallet: { create: { balance: 2000, escrow: 0 } },
    },
    include: { wallet: true },
  });
  authToken = generateTestToken(testUser.id);
});

afterAll(async () => {
  await prisma.tournamentTeam.deleteMany({
    where: { tournament: { hostId: testUser.id } },
  });
  await prisma.tournament.deleteMany({ where: { hostId: testUser.id } });
  await prisma.wallet.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
});

describe("Tournament Integration", () => {
  it("creates a tournament", async () => {
    const res = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Tournament",
        game: "Valorant",
        entryFee: 0,
        maxParticipants: 8,
      })
      .expect(201);
    expect(res.body.tournament).toBeDefined();
    tournament = res.body.tournament;
  });

  it("retrieves a tournament by ID", async () => {
    const res = await request(app)
      .get(`/tournaments/${tournament.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);
    expect(res.body.tournament).toBeDefined();
    expect(res.body.tournament.id).toBe(tournament.id);
  });

  it("rejects tournament with invalid maxParticipants", async () => {
    const res = await request(app)
      .post("/tournaments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Bad Tournament",
        game: "Valorant",
        entryFee: 0,
        maxParticipants: 5, // not a power of 2
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
