import request from "supertest";
import app from "../../src/app";

describe("Platform Config Integration", () => {
  it("retrieves platform config", async () => {
    const res = await request(app).get("/users/config").expect(200);
    expect(res.body.siteName).toBeDefined();
    expect(res.body.maintenanceMode).toBeDefined();
  });
});
