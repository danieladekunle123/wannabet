import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { userFactory, generateTestToken } from "../helpers/factories";

let testUser: any;
let authToken: string;

beforeAll(async () => {
  testUser = await prisma.user.create({
    data: {
      ...userFactory(),
      role: "MODERATOR",
      wallet: { create: { balance: 1000, escrow: 0 } },
    },
    include: { wallet: true },
  });
  authToken = generateTestToken(testUser.id);
});

afterAll(async () => {
  await prisma.dispute.deleteMany({ where: { disputantId: testUser.id } });
  await prisma.match.deleteMany({ where: { hostId: testUser.id } });
  await prisma.wallet.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
});

describe("Dispute Flow Integration", () => {
  it("retrieves disputes list as moderator", async () => {
    const res = await request(app)
      .get("/disputes")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);
    expect(Array.isArray(res.body.disputes)).toBe(true);
  });

  it("retrieves dispute stats as moderator", async () => {
    const res = await request(app)
      .get("/disputes/stats")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);
    expect(res.body).toBeDefined();
  });
});
