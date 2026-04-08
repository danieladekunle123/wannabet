// Auth helpers for backend tests
import request from "supertest";
import app from "../../src/app";

export async function loginTestUser(email: string, password: string) {
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.token;
}
