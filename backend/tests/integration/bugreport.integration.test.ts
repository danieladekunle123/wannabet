import request from "supertest";
import app from "../../src/app";
import { userFactory, generateTestToken } from "../helpers/factories";
import { prisma } from "../../src/lib/prisma";

let testUser: any;
let authToken: string;

beforeAll(async () => {
  testUser = await prisma.user.create({ data: userFactory() });
  authToken = generateTestToken(testUser.id);
});

afterAll(async () => {
  await prisma.bugReport.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });
});

describe("Bug Report Integration", () => {
  it("submits a bug report", async () => {
    const res = await request(app)
      .post("/users/bug-reports")
      .set("Authorization", `Bearer ${authToken}`)
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
});
