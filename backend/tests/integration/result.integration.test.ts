import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { userFactory, generateTestToken } from "../helpers/factories";

let host: any;
let joiner: any;
let hostToken: string;
let match: any;

beforeAll(async () => {
  host = await prisma.user.create({
    data: {
      ...userFactory(),
      wallet: { create: { balance: 1000, escrow: 0 } },
    },
    include: { wallet: true },
  });
  joiner = await prisma.user.create({
    data: {
      ...userFactory(),
      wallet: { create: { balance: 1000, escrow: 0 } },
    },
    include: { wallet: true },
  });
  match = await prisma.match.create({
    data: {
      game: "Test Game",
      stake: 100,
      status: "ACTIVE",
      hostId: host.id,
      joinerId: joiner.id,
    },
  });
  hostToken = generateTestToken(host.id);
});

afterAll(async () => {
  await prisma.match.deleteMany({ where: { id: match.id } });
  await prisma.wallet.deleteMany({
    where: { userId: { in: [host.id, joiner.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [host.id, joiner.id] } },
  });
});

describe("Result Reporting Integration", () => {
  it("submits a result for a match", async () => {
    const res = await request(app)
      .post(`/matches/${match.id}/report`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ winnerId: host.id })
      .expect(200);
    expect(res.body.match).toBeDefined();
    expect(res.body.match.reportedWinnerId).toBe(host.id);
    expect(res.body.match.reportedById).toBe(host.id);
    expect(res.body.match.status).toBe("RESULT_REPORTED");
  });

  it("prevents duplicate result submission", async () => {
    const res = await request(app)
      .post(`/matches/${match.id}/report`)
      .set("Authorization", `Bearer ${hostToken}`)
      .send({ winnerId: host.id })
      .expect(400);
    expect(res.body.message).toBeDefined();
  });
});
