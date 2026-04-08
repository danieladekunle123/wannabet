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
      wallet: { create: { balance: 0, escrow: 1000 } },
    },
    include: { wallet: true },
  });
  authToken = generateTestToken(testUser.id);
});

afterAll(async () => {
  await prisma.ledgerEntry.deleteMany({
    where: { walletId: testUser.wallet.id },
  });
  await prisma.wallet.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
});

describe("Payout/Refund Integration", () => {
  it("releases escrow to balance (refund)", async () => {
    const res = await request(app)
      .post("/wallet/escrow/release")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 500 })
      .expect(201);
    expect(res.body.wallet.balance).toBeGreaterThanOrEqual(500);
    expect(res.body.wallet.escrow).toBeLessThanOrEqual(500);
  });

  it("prevents over-release from escrow", async () => {
    const res = await request(app)
      .post("/wallet/escrow/release")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 999999 })
      .expect(400);
    expect(res.body.message).toMatch(/Insufficient escrow/);
  });
});
