/**
 * Unit tests for the global rate limiter middleware.
 *
 * Tests the middleware logic in isolation by mocking Redis (checkRateLimit),
 * JWT verification, and the client IP resolver.
 */

const mockCheckRateLimit = jest.fn();
const mockResolveClientIp = jest.fn();
const mockJwtVerify = jest.fn();
const mockLoggerWarn = jest.fn();

jest.mock("../../src/services/redis", () => ({
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
  closeRedisConnections: jest.fn(),
  redis: { on: jest.fn(), keys: jest.fn(), get: jest.fn() },
  pub: { on: jest.fn() },
  sub: { on: jest.fn() },
}));

jest.mock("../../src/lib/clientIp", () => ({
  resolveClientIp: (...args: any[]) => mockResolveClientIp(...args),
}));

jest.mock("jsonwebtoken", () => ({
  verify: (...args: any[]) => mockJwtVerify(...args),
}));

jest.mock("../../src/lib/env", () => ({
  env: { JWT_SECRET: "test-secret" },
}));

jest.mock("../../src/lib/logger", () => {
  const warn = (...args: any[]) => mockLoggerWarn(...args);
  return {
    default: { warn, info: jest.fn(), error: jest.fn(), debug: jest.fn() },
    __esModule: true,
  };
});

import { globalRateLimit } from "../../src/middleware/rateLimit";

function mockReq(overrides: Record<string, any> = {}) {
  return {
    path: "/matches",
    headers: {},
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
  return res;
}

const next = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.NODE_ENV;
  mockResolveClientIp.mockReturnValue({ ip: "1.2.3.4" });
  mockCheckRateLimit.mockReset();
  mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 299 });
});

describe("globalRateLimit", () => {
  // ─── Skip paths ──────────────────────────────────────────────────────────

  describe("skip paths", () => {
    const skipPaths = [
      "/health",
      "/metrics",
      "/api/docs",
      "/api/docs/swagger",
      "/stripe/webhook",
      "/stripe/webhook/test",
      "/favicon.ico",
      "/assets/index.js",
      "/assets/style.css",
    ];

    test.each(skipPaths)("skips rate limiting for %s", (path) => {
      const req = mockReq({ path });
      const res = mockRes();

      globalRateLimit(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });
  });

  it("skips entirely in test environment", () => {
    process.env.NODE_ENV = "test";
    const req = mockReq({ path: "/matches" });
    const res = mockRes();

    globalRateLimit(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });

  // ─── Rate limit keying ────────────────────────────────────────────────────

  it("uses userId from JWT as rate limit key when authenticated", async () => {
    mockJwtVerify.mockReturnValue({ userId: "user-abc-123" });
    const req = mockReq({
      headers: { authorization: "Bearer valid-jwt-token" },
    });
    const res = mockRes();

    globalRateLimit(req, res, next);

    // Wait for the async .then chain
    await new Promise((r) => setTimeout(r, 10));

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "rate:global:user:user-abc-123",
      300,
      900,
    );
  });

  it("falls back to IP when no auth header is present", async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();

    globalRateLimit(req, res, next);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "rate:global:1.2.3.4",
      300,
      900,
    );
  });

  it("falls back to IP when JWT is invalid", async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error("invalid token");
    });
    const req = mockReq({
      headers: { authorization: "Bearer bad-token" },
    });
    const res = mockRes();

    globalRateLimit(req, res, next);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "rate:global:1.2.3.4",
      300,
      900,
    );
  });

  // ─── Allowed requests ────────────────────────────────────────────────────

  it("calls next() and sets headers when request is allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 250 });
    const req = mockReq();
    const res = mockRes();

    globalRateLimit(req, res, next);

    await new Promise((r) => setTimeout(r, 10));

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", "300");
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", "250");
    expect(res.status).not.toHaveBeenCalled();
  });

  // ─── Blocked requests ────────────────────────────────────────────────────

  it("returns 429 with Retry-After when rate limited", async () => {
    mockCheckRateLimit.mockReset();
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    process.env.NODE_ENV = "production";

    const req = mockReq();
    const statusCalls: number[] = [];
    const jsonCalls: any[] = [];
    const headerCalls: [string, string][] = [];
    const nextCalls: any[] = [];
    const res: any = {};
    res.setHeader = (k: string, v: string) => { headerCalls.push([k, v]); };
    res.status = (code: number) => { statusCalls.push(code); return res; };
    res.json = (body: any) => { jsonCalls.push(body); return res; };
    const localNext = (...args: any[]) => { nextCalls.push(args); };

    globalRateLimit(req, res, localNext);

    await new Promise((r) => setTimeout(r, 50));

    expect(statusCalls).toContain(429);
    expect(jsonCalls[0]).toEqual({
      message: "Too many requests. Please try again later.",
    });
    expect(headerCalls).toContainEqual(["Retry-After", "900"]);
    expect(headerCalls).toContainEqual(["X-RateLimit-Limit", "300"]);
    expect(headerCalls).toContainEqual(["X-RateLimit-Remaining", "0"]);
    expect(nextCalls).toHaveLength(0);
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      "Global rate limit exceeded",
      expect.objectContaining({ identity: "1.2.3.4", ip: "1.2.3.4" }),
    );
  });

  // ─── Fail open ────────────────────────────────────────────────────────────

  it("fails open (calls next) when Redis errors", async () => {
    mockCheckRateLimit.mockRejectedValue(new Error("Redis connection refused"));
    const req = mockReq();
    const res = mockRes();

    globalRateLimit(req, res, next);

    await new Promise((r) => setTimeout(r, 10));

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
