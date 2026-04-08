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
      wallet: { create: { balance: 10000, escrow: 0 } },
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

describe("Wallet API Integration", () => {
  it("returns wallet summary", async () => {
    const res = await request(app)
      .get("/wallet")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);
    expect(res.body.wallet).toBeDefined();
    expect(res.body.wallet.balance).toBeGreaterThanOrEqual(0);
  });

  it("locks funds into escrow", async () => {
    const res = await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 500 })
      .expect(201);
    expect(res.body.wallet.escrow).toBeGreaterThanOrEqual(500);
    expect(res.body.wallet.balance).toBeLessThanOrEqual(9500);
  });

  it("releases funds from escrow", async () => {
    // Lock first
    await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 200 });
    // Release
    const res = await request(app)
      .post("/wallet/escrow/release")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 200 })
      .expect(201);
    expect(res.body.wallet.escrow).toBeGreaterThanOrEqual(0);
    expect(res.body.wallet.balance).toBeGreaterThanOrEqual(0);
  });

  it("prevents withdrawal if insufficient balance", async () => {
    const res = await request(app)
      .post("/wallet/withdraw")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 999999 })
      .expect(400);
    expect(res.body.message).toMatch(/Insufficient balance/);
  });

  it("prevents escrow lock if insufficient balance", async () => {
    const res = await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 999999 })
      .expect(400);
    expect(res.body.message).toMatch(/Insufficient balance/);
  });

  it("prevents escrow release if insufficient escrow", async () => {
    const res = await request(app)
      .post("/wallet/escrow/release")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 999999 })
      .expect(400);
    expect(res.body.message).toMatch(/Insufficient escrow/);
  });

  it("rejects negative or zero amounts for lock/release", async () => {
    const lockRes = await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 0 })
      .expect(400);
    expect(lockRes.body.message).toBeDefined();

    const releaseRes = await request(app)
      .post("/wallet/escrow/release")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: -100 })
      .expect(400);
    expect(releaseRes.body.message).toBeDefined();
  });
});
