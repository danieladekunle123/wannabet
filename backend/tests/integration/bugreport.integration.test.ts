import request from "supertest";
import app from "../../src/app";
import { createTestUser, cleanupUser } from "../helpers/factories";
import { prisma } from "../../src/lib/prisma";

let user: any, token: string;
const userIds: string[] = [];

beforeAll(async () => {
  const u = await createTestUser();
  user = u.user;
  token = u.token;
  userIds.push(user.id);
});

afterAll(async () => {
  await prisma.bugReport.deleteMany({ where: { userId: user.id } });
  for (const id of userIds) await cleanupUser(id);
});

describe("Bug Report Integration", () => {
  it("submits a bug report", async () => {
    const res = await request(app)
      .post("/users/bug-reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Bug",
        category: "ui",
        severity: "low",
        description: "Test bug description",
        steps: "1. Do X",
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
  });

  it("rejects bug report without auth", async () => {
    await request(app)
      .post("/users/bug-reports")
      .send({
        title: "No Auth Bug",
        category: "ui",
        severity: "low",
        description: "desc",
      })
      .expect(401);
  });

  it("rejects bug report with missing title", async () => {
    const res = await request(app)
      .post("/users/bug-reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        category: "ui",
        severity: "low",
        description: "desc",
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
