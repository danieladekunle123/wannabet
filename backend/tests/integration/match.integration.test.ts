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
      wallet: { create: { balance: 5000, escrow: 0 } },
    },
    include: { wallet: true },
  });
  authToken = generateTestToken(testUser.id);
});

afterAll(async () => {
  await prisma.ledgerEntry.deleteMany({
    where: { walletId: testUser.wallet.id },
  });
  await prisma.escrow.deleteMany({ where: { userId: testUser.id } });
  await prisma.match.deleteMany({ where: { hostId: testUser.id } });
  await prisma.wallet.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
});

describe("Match Creation & Escrow Integration", () => {
  it("locks stake into escrow on match creation", async () => {
    const res = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        game: "Test Game",
        stake: 1000,
        matchType: "wager",
        title: "Test Match",
      })
      .expect(201);
    expect(res.body).toBeDefined();
    // Check wallet/escrow state in DB
    const wallet = await prisma.wallet.findUnique({
      where: { id: testUser.wallet.id },
    });
    expect(wallet?.escrow).toBeGreaterThanOrEqual(1000);
    expect(wallet?.balance).toBeLessThanOrEqual(4000);
  });

  it("prevents match creation if insufficient balance", async () => {
    const res = await request(app)
      .post("/matches")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        game: "Test Game",
        stake: 9999,
        matchType: "wager",
        title: "Test Match",
      })
      .expect(400);
    expect(res.body.message).toBeDefined();
  });
});
