import request from "supertest";
import app from "../../src/app";

describe("Search Integration", () => {
  it("returns search results", async () => {
    const res = await request(app).get("/search?q=Test").expect(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.users).toBeInstanceOf(Array);
    expect(res.body.data.matches).toBeInstanceOf(Array);
  });
});
