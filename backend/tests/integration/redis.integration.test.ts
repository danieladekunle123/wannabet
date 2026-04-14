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
      wallet: { create: { balance: 10000, escrow: 0 } },
    },
    include: { wallet: true },
  });
  authToken = generateTestToken(testUser.id);
});

afterAll(async () => {
  await prisma.match.deleteMany({ where: { hostId: testUser.id } });
  await prisma.wallet.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
});

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

  it("sets X-RateLimit-Limit and X-RateLimit-Remaining headers", async () => {
    const res = await request(app)
      .get("/health")
      .set("Authorization", `Bearer ${authToken}`);
    // /health is skipped by the rate limiter, so test a non-skip route
    const res2 = await request(app)
      .get("/leaderboard/earnings")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res2.headers["x-ratelimit-limit"]).toBe("300");
    expect(res2.headers["x-ratelimit-remaining"]).toBeDefined();
  });
});
