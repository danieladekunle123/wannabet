/**
 * Auth Integration Tests
 *
 * Covers: registration, login, JWT validation, role-based access,
 * banned user blocks, and input validation.
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import {
  generateTestToken,
  createTestUser,
  createModUser,
  createAdminUser,
  cleanupUser,
} from "../helpers/factories";

const userIds: string[] = [];

afterAll(async () => {
  for (const id of userIds) {
    await cleanupUser(id);
  }
}, 15000);

describe("POST /auth/register", () => {
  it("creates a new user and returns a token", async () => {
    const email = `auth_reg_${Date.now()}@example.com`;
    const res = await request(app)
      .post("/auth/register")
      .send({ email, username: `auser${Date.now()}`, password: "Password123!" })
      .expect(201);

    expect(res.body.message).toBeDefined();
    expect(res.body.user.email).toBe(email);

    userIds.push(res.body.user.id);
  });

  it("rejects duplicate email", async () => {
    const email = `auth_dup_${Date.now()}@example.com`;
    const res1 = await request(app)
      .post("/auth/register")
      .send({
        email,
        username: `dupuser1_${Date.now()}`,
        password: "Password123!",
      });
    userIds.push(res1.body.user.id);

    const res2 = await request(app)
      .post("/auth/register")
      .send({
        email,
        username: `dupuser2_${Date.now()}`,
        password: "Password123!",
      })
      .expect(409);
    expect(res2.body.message).toMatch(/email/i);
  });

  it("rejects duplicate username (case-insensitive)", async () => {
    const username = `UniqueUser${Date.now()}`;
    const res1 = await request(app)
      .post("/auth/register")
      .send({
        email: `uq1_${Date.now()}@example.com`,
        username,
        password: "Password123!",
      });
    userIds.push(res1.body.user.id);

    const res2 = await request(app)
      .post("/auth/register")
      .send({
        email: `uq2_${Date.now()}@example.com`,
        username: username.toLowerCase(),
        password: "Password123!",
      })
      .expect(409);
    expect(res2.body.message).toMatch(/username/i);
  });

  it("rejects invalid email format", async () => {
    await request(app)
      .post("/auth/register")
      .send({
        email: "not-an-email",
        username: "bad1",
        password: "Password123!",
      })
      .expect(400);
  });

  it("rejects short password", async () => {
    await request(app)
      .post("/auth/register")
      .send({
        email: `short_pw_${Date.now()}@example.com`,
        username: `shortpw${Date.now()}`,
        password: "1234567",
      })
      .expect(400);
  });

  it("rejects short username", async () => {
    await request(app)
      .post("/auth/register")
      .send({
        email: `short_un_${Date.now()}@example.com`,
        username: "ab",
        password: "Password123!",
      })
      .expect(400);
  });
});

describe("POST /auth/login", () => {
  let loginEmail: string;
  const loginPassword = "MySecretPass123!";

  beforeAll(async () => {
    loginEmail = `auth_login_${Date.now()}@example.com`;
    const hash = await bcrypt.hash(loginPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: loginEmail,
        username: `loginuser${Date.now()}`,
        passwordHash: hash,
        isVerified: true,
        wallet: { create: { balance: 0 } },
      },
    });
    userIds.push(user.id);
  });

  it("returns token for valid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: loginEmail, password: loginPassword })
      .expect(200);

    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(loginEmail);
  });

  it("rejects wrong password", async () => {
    await request(app)
      .post("/auth/login")
      .send({ email: loginEmail, password: "WrongPassword!" })
      .expect(401);
  });

  it("rejects non-existent email", async () => {
    await request(app)
      .post("/auth/login")
      .send({ email: "nonexistent@test.com", password: "Password123!" })
      .expect(401);
  });

  it("rejects invalid email format in login", async () => {
    await request(app)
      .post("/auth/login")
      .send({ email: "not-email", password: "whatever" })
      .expect(400);
  });
});

describe("Auth Middleware — JWT Validation", () => {
  it("returns 401 when no Authorization header is sent", async () => {
    await request(app).get("/wallet").expect(401);
  });

  it("returns 401 for malformed token", async () => {
    await request(app)
      .get("/wallet")
      .set("Authorization", "Bearer invalid.token.here")
      .expect(401);
  });

  it("returns 401 for expired token", async () => {
    const jwt = require("jsonwebtoken");
    const expired = jwt.sign(
      { userId: "fake-id" },
      process.env.JWT_SECRET ||
        "some_super_long_random_string_at_least_16_chars",
      { expiresIn: "0s" },
    );
    await request(app)
      .get("/wallet")
      .set("Authorization", `Bearer ${expired}`)
      .expect(401);
  });

  it("allows access with valid token", async () => {
    const { user, token } = await createTestUser();
    userIds.push(user.id);

    const res = await request(app)
      .get("/wallet")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.wallet).toBeDefined();
  });
});

describe("Role-Based Access Control", () => {
  it("players cannot access moderator endpoints", async () => {
    const { user, token } = await createTestUser();
    userIds.push(user.id);

    await request(app)
      .get("/disputes")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("moderators can access moderator endpoints", async () => {
    const { user, token } = await createModUser();
    userIds.push(user.id);

    const res = await request(app)
      .get("/disputes")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.disputes)).toBe(true);
  });

  it("admins can access moderator endpoints", async () => {
    const { user, token } = await createAdminUser();
    userIds.push(user.id);

    const res = await request(app)
      .get("/disputes")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.disputes)).toBe(true);
  });
});

describe("Banned User Access", () => {
  it("returns 403 for banned user", async () => {
    const { user, token } = await createTestUser();
    userIds.push(user.id);

    // Ban the user
    await prisma.ban.create({
      data: {
        userId: user.id,
        moderatorId: user.id,
        reason: "Test ban",
        active: true,
      },
    });

    const res = await request(app)
      .get("/wallet")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
    expect(res.body.message).toMatch(/banned/i);

    // Cleanup ban
    await prisma.ban.deleteMany({ where: { userId: user.id } });
  });
});

describe("Health Endpoint", () => {
  it("returns ok without auth", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
  });
});
