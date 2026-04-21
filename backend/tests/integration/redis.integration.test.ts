import request from "supertest";
import app from "../../src/app";
import { userFactory, generateTestToken } from "../helpers/factories";
import { prisma } from "../../src/lib/prisma";

let testUser: any;
let authToken: string;

beforeAll(async () => {
  testUser = await prisma.user.create({
    data: {
      ...userFactory(),
      isVerified: true,
      wallet: { create: { balance: 10000, escrow: 0 } },
    },
    include: { wallet: true },
  });
  authToken = generateTestToken(testUser.id);
}, 15000);

afterAll(async () => {
  if (!testUser) return;
  await prisma.match.deleteMany({ where: { hostId: testUser.id } });
  await prisma.wallet.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
}, 15000);

describe("Redis/Rate Limiting Integration", () => {
  it("enforces rate limiting on match creation", async () => {
    let lastRes: any;
    for (let i = 0; i < 15; i++) {
      lastRes = await request(app)
        .post("/matches")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          game: "Test",
          stake: 1,
          matchType: "wager",
          title: `RL Test ${i}`,
        });
      if (lastRes.status === 429) break;
    }
    expect(lastRes!.status).toBe(429);
  }, 30000);

  it("includes Retry-After header on 429 responses", async () => {
    let lastRes: any;
    for (let i = 0; i < 15; i++) {
      lastRes = await request(app)
        .post("/matches")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          game: "Test",
          stake: 1,
          matchType: "wager",
          title: `RL Retry-After ${i}`,
        });
      if (lastRes.status === 429) break;
    }
    expect(lastRes!.status).toBe(429);
    expect(lastRes!.headers["retry-after"]).toBeDefined();
    expect(Number(lastRes!.headers["retry-after"])).toBeGreaterThan(0);
  }, 30000);

  // Note: X-RateLimit-Limit/Remaining headers come from the global rate
  // limiter which is intentionally skipped when NODE_ENV=test, so they
  // cannot be verified in integration tests. They are covered by the
  // unit tests in rateLimit.unit.test.ts instead.
});
