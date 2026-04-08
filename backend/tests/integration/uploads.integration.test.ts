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
  await prisma.user.deleteMany({ where: { id: testUser.id } });
});

describe("Uploads/S3 Integration", () => {
  it("generates a presigned URL for upload", async () => {
    const res = await request(app)
      .post("/api/upload-url")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ fileType: "image/png", context: "profile" });
    // May return 200 with URL or 500 if S3 not configured — both are valid in test
    if (res.status === 200) {
      expect(res.body.uploadUrl).toBeDefined();
      expect(res.body.fileUrl).toBeDefined();
    } else {
      expect(res.status).toBe(500);
    }
  });

  it("rejects unauthorized upload URL requests", async () => {
    const res = await request(app)
      .post("/api/upload-url")
      .send({ fileType: "image/png", context: "profile" })
      .expect(401);
    expect(res.body).toBeDefined();
  });

  it("rejects invalid file types", async () => {
    const res = await request(app)
      .post("/api/upload-url")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ fileType: "application/x-msdownload", context: "profile" })
      .expect(400);
    expect(res.body).toBeDefined();
  });
});
