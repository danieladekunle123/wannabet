import jwt from "jsonwebtoken";

// Example factory for backend tests
export function userFactory(overrides: Record<string, any> = {}) {
  return {
    id: "user_" + Math.random().toString(36).substring(2, 10),
    email: "test" + Math.random().toString(36).substring(2, 6) + "@example.com",
    passwordHash:
      "$2a$10$testtesttesttesttesttesttesttesttesttesttesttesttesttesttestte",
    username: "user_" + Math.random().toString(36).substring(2, 8),
    ...overrides,
  };
}

/** Generate a valid JWT for a test user */
export function generateTestToken(userId: string): string {
  const secret =
    process.env.JWT_SECRET || "some_super_long_random_string_at_least_16_chars";
  return jwt.sign({ userId }, secret, { expiresIn: "1h" });
}
