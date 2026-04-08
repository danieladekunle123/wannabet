import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { userFactory, generateTestToken } from "../helpers/factories";

let adminUser: any;
let normalUser: any;
let adminToken: string;
let normalToken: string;

beforeAll(async () => {
  adminUser = await prisma.user.create({
    data: { ...userFactory(), role: "ADMIN" },
  });
  normalUser = await prisma.user.create({
    data: { ...userFactory(), role: "PLAYER" },
  });
  adminToken = generateTestToken(adminUser.id);
  normalToken = generateTestToken(normalUser.id);
});

afterAll(async () => {
  await prisma.ban.deleteMany({
    where: { userId: { in: [adminUser.id, normalUser.id] } },
  });
  await prisma.dispute.deleteMany({
    where: { disputantId: { in: [adminUser.id, normalUser.id] } },
  });
  await prisma.match.deleteMany({
    where: { hostId: { in: [adminUser.id, normalUser.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [adminUser.id, normalUser.id] } },
  });
});

describe("Admin/Moderation Integration", () => {
  it("allows admin to ban a user", async () => {
    const res = await request(app)
      .post(`/users/${normalUser.id}/ban`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Violation" })
      .expect(200);
    expect(res.body.ban).toBeDefined();
  });

  it("prevents normal user from banning", async () => {
    const res = await request(app)
      .post(`/users/${adminUser.id}/ban`)
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ reason: "Abuse" })
      .expect(403);
    expect(res.body.message).toBeDefined();
  });

  it("allows admin to resolve a dispute", async () => {
    const match = await prisma.match.create({
      data: {
        game: "Test Game",
        stake: 100,
        status: "DISPUTED",
        hostId: normalUser.id,
      },
    });
    const dispute = await prisma.dispute.create({
      data: {
        disputantId: normalUser.id,
        matchId: match.id,
        reason: "Test",
        status: "open",
      },
    });
    const res = await request(app)
      .post(`/disputes/${dispute.id}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ winnerId: normalUser.id, outcome: "approved_reporter" })
      .expect(200);
    expect(res.body).toBeDefined();
  });
});
