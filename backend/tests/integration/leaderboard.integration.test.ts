import request from "supertest";
import app from "../../src/app";

describe("Leaderboard Integration", () => {
  it("retrieves wins leaderboard", async () => {
    const res = await request(app).get("/leaderboard/wins").expect(200);
    expect(res.body).toBeDefined();
  });

  it("retrieves earnings leaderboard", async () => {
    const res = await request(app).get("/leaderboard/earnings").expect(200);
    expect(res.body).toBeDefined();
  });

  it("retrieves trust leaderboard", async () => {
    const res = await request(app).get("/leaderboard/trust").expect(200);
    expect(res.body).toBeDefined();
  });
});
