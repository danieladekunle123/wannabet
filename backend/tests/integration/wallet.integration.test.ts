/**
 * Wallet API Integration Tests
 *
 * Covers: wallet summary, escrow lock/release, withdrawal, ledger entries,
 * balance validations, and edge cases.
 */
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { createTestUser, cleanupUser } from "../helpers/factories";

const userIds: string[] = [];

afterAll(async () => {
  for (const id of userIds) await cleanupUser(id);
}, 15000);

describe("Wallet Summary", () => {
  it("returns wallet balance and escrow", async () => {
    const { user, token } = await createTestUser({}, 10000);
    userIds.push(user.id);

    const res = await request(app)
      .get("/wallet")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.wallet.balance).toBe(10000);
    expect(res.body.wallet.escrow).toBe(0);
  }, 15000);

  it("returns 401 without auth", async () => {
    await request(app).get("/wallet").expect(401);
  });
});

describe("Escrow Lock & Release", () => {
  it("locks funds into escrow", async () => {
    const { user, token } = await createTestUser({}, 10000);
    userIds.push(user.id);

    const res = await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 500 })
      .expect(201);
    expect(res.body.wallet.escrow).toBe(500);
    expect(res.body.wallet.balance).toBe(9500);
  });

  it("releases funds from escrow back to balance", async () => {
    const { user, token } = await createTestUser({}, 10000);
    userIds.push(user.id);

    await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 500 });

    const res = await request(app)
      .post("/wallet/escrow/release")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 500 })
      .expect(201);
    expect(res.body.wallet.balance).toBe(10000);
    expect(res.body.wallet.escrow).toBe(0);
  });

  it("creates ledger entries for lock and release", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    const lockRes = await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 300 })
      .expect(201);
    expect(lockRes.body.ledgerEntry.type).toBe("escrow_lock");

    const releaseRes = await request(app)
      .post("/wallet/escrow/release")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 300 })
      .expect(201);
    expect(releaseRes.body.ledgerEntry.type).toBe("refund");
  });

  it("prevents escrow lock with insufficient balance", async () => {
    const { user, token } = await createTestUser({}, 100);
    userIds.push(user.id);

    const res = await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 999999 })
      .expect(400);
    expect(res.body.message).toMatch(/Insufficient balance/);
  });

  it("prevents escrow release with insufficient escrow", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    const res = await request(app)
      .post("/wallet/escrow/release")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 999999 })
      .expect(400);
    expect(res.body.message).toMatch(/Insufficient escrow/);
  });

  it("rejects zero/negative amounts", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 0 })
      .expect(400);

    await request(app)
      .post("/wallet/escrow/release")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: -100 })
      .expect(400);
  });
});

describe("Withdrawal", () => {
  it("withdraws from balance", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    const res = await request(app)
      .post("/wallet/withdraw")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 2000 })
      .expect(201);
    expect(res.body.wallet.balance).toBe(3000);
  });

  it("prevents withdrawal with insufficient balance", async () => {
    const { user, token } = await createTestUser({}, 100);
    userIds.push(user.id);

    const res = await request(app)
      .post("/wallet/withdraw")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 999999 })
      .expect(400);
    expect(res.body.message).toMatch(/Insufficient balance/);
  });
});

describe("Ledger", () => {
  it("returns ledger entries", async () => {
    const { user, token } = await createTestUser({}, 5000);
    userIds.push(user.id);

    // Make some transactions to generate entries
    await request(app)
      .post("/wallet/escrow/lock")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100 });

    const res = await request(app)
      .get("/wallet/ledger")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
    expect(res.body.entries.length).toBeGreaterThanOrEqual(1);
  });
});
