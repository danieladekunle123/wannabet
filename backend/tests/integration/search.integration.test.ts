import request from "supertest";
import app from "../../src/app";
import { createTestUser, cleanupUser } from "../helpers/factories";

let user: any;
const userIds: string[] = [];

beforeAll(async () => {
  const u = await createTestUser({ username: `searchTest_${Date.now()}` });
  user = u.user;
  userIds.push(user.id);
});

afterAll(async () => {
  for (const id of userIds) await cleanupUser(id);
}, 15000);

describe("Search Integration", () => {
  it("returns search results with users and matches", async () => {
    const res = await request(app).get("/search?q=Test").expect(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.users).toBeInstanceOf(Array);
    expect(res.body.data.matches).toBeInstanceOf(Array);
  });

  it("returns empty results for empty query", async () => {
    const res = await request(app).get("/search?q=").expect(200);
    expect(res.body.data.users).toEqual([]);
    expect(res.body.data.matches).toEqual([]);
  });

  it("finds user by unique username", async () => {
    const res = await request(app)
      .get(`/search?q=${user.username}`)
      .expect(200);
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.users.find((u: any) => u.id === user.id);
    expect(found).toBeDefined();
  });

  it("returns games in search results", async () => {
    const res = await request(app).get("/search?q=Valorant").expect(200);
    expect(res.body.data.games).toBeInstanceOf(Array);
  });
});
