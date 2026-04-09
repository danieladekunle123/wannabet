import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { userFactory, generateTestToken } from "../helpers/factories";

let user: any;
let token: string;

beforeAll(async () => {
  user = await prisma.user.create({ data: userFactory() });
  token = generateTestToken(user.id);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: user.id } });
});

describe("Events Integration", () => {
  it("events/my requires authentication", async () => {
    const res = await request(app).get("/events/my");
    expect(res.status).toBe(401);
  });

  it("events/tournaments returns list", async () => {
    const res = await request(app).get("/events/tournaments").expect(200);
    expect(res.body).toBeDefined();
  }, 15000);

  it("events/my returns user events with auth", async () => {
    const res = await request(app)
      .get("/events/my")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body).toBeDefined();
  });
});
