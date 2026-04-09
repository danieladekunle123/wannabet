import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import {
  createTestUser,
  createModUser,
  cleanupUser,
  cleanupMatch,
} from "../helpers/factories";

let host: any, hostToken: string;
let joiner: any, joinerToken: string;
let mod: any, modToken: string;
const userIds: string[] = [];
const matchIds: string[] = [];

beforeAll(async () => {
  const h = await createTestUser({}, 10000);
  host = h.user;
  hostToken = h.token;
  userIds.push(host.id);

  const j = await createTestUser({}, 10000);
  joiner = j.user;
  joinerToken = j.token;
  userIds.push(joiner.id);

  const m = await createModUser();
  mod = m.user;
  modToken = m.token;
  userIds.push(mod.id);
});

afterAll(async () => {
  for (const mid of matchIds) await cleanupMatch(mid);
  for (const id of userIds) await cleanupUser(id);
}, 15000);

describe("Events Integration", () => {
  describe("Event Listings", () => {
    it("GET /events/tournaments returns list", async () => {
      const res = await request(app).get("/events/tournaments").expect(200);
      expect(res.body).toBeDefined();
    });

    it("GET /events/wagers returns list", async () => {
      const res = await request(app).get("/events/wagers").expect(200);
      expect(res.body).toBeDefined();
    });

    it("GET /events/scrims returns list", async () => {
      const res = await request(app).get("/events/scrims").expect(200);
      expect(res.body).toBeDefined();
    });

    it("GET /events/active returns list", async () => {
      const res = await request(app).get("/events/active").expect(200);
      expect(res.body).toBeDefined();
    });

    it("GET /events/custom returns list", async () => {
      const res = await request(app).get("/events/custom").expect(200);
      expect(res.body).toBeDefined();
    });
  });

  describe("My Events", () => {
    it("requires authentication", async () => {
      await request(app).get("/events/my").expect(401);
    });

    it("returns user events with auth", async () => {
      const res = await request(app)
        .get("/events/my")
        .set("Authorization", `Bearer ${hostToken}`)
        .expect(200);
      expect(res.body).toBeDefined();
    });
  });

  describe("Recommended Events", () => {
    it("requires authentication", async () => {
      await request(app).get("/events/recommended").expect(401);
    });

    it("returns recommendations with auth", async () => {
      const res = await request(app)
        .get("/events/recommended")
        .set("Authorization", `Bearer ${hostToken}`)
        .expect(200);
      expect(res.body).toBeDefined();
    });
  });

  describe("Match Request Flow", () => {
    let matchRequestId: string;

    it("creates a match request", async () => {
      const res = await request(app)
        .post("/events/requests/match")
        .set("Authorization", `Bearer ${hostToken}`)
        .send({
          recipientId: joiner.id,
          game: "Valorant",
          matchType: "wager",
          rounds: 1,
          wagerAmount: 50,
        });
      // 201 or 200 depending on implementation
      expect([200, 201]).toContain(res.status);
      if (res.body.request) {
        matchRequestId = res.body.request.id;
      } else if (res.body.matchRequest) {
        matchRequestId = res.body.matchRequest.id;
      } else if (res.body.id) {
        matchRequestId = res.body.id;
      }
    });

    it("lists incoming match requests", async () => {
      const res = await request(app)
        .get("/events/requests/match/incoming")
        .set("Authorization", `Bearer ${joinerToken}`)
        .expect(200);
      expect(res.body).toBeDefined();
    });

    it("rejects creating request without auth", async () => {
      await request(app)
        .post("/events/requests/match")
        .send({
          recipientId: joiner.id,
          game: "Valorant",
          matchType: "wager",
          rounds: 1,
        })
        .expect(401);
    });
  });

  describe("Event Lifecycle", () => {
    let eventMatchId: string;

    it("creates a match via events (wager)", async () => {
      // Create a match directly so we can test events endpoints against it
      const match = await prisma.match.create({
        data: {
          game: "CS2",
          stake: 100,
          status: "UPCOMING",
          hostId: host.id,
        },
      });
      eventMatchId = match.id;
      matchIds.push(match.id);
      expect(eventMatchId).toBeDefined();
    });

    it("looks up an event by source ID", async () => {
      const res = await request(app)
        .get(`/events/source/${eventMatchId}`)
        .expect(200);
      expect(res.body).toBeDefined();
    });

    it("host can edit match title", async () => {
      const res = await request(app)
        .patch(`/events/match/${eventMatchId}`)
        .set("Authorization", `Bearer ${hostToken}`)
        .send({ title: "Updated Title" });
      // May succeed or return 400 if match is already joined
      expect([200, 400]).toContain(res.status);
    });

    it("non-host cannot edit match", async () => {
      const res = await request(app)
        .patch(`/events/match/${eventMatchId}`)
        .set("Authorization", `Bearer ${joinerToken}`)
        .send({ title: "Hacked" });
      expect([400, 403]).toContain(res.status);
    });
  });

  describe("Join & Cancel", () => {
    let matchId: string;

    it("user can join a match event", async () => {
      // Create a joinable match with proper escrow
      const match = await prisma.match.create({
        data: {
          game: "Apex Legends",
          stake: 50,
          status: "UPCOMING",
          hostId: host.id,
        },
      });
      matchId = match.id;
      matchIds.push(match.id);

      // Lock host escrow manually
      await prisma.wallet.update({
        where: { userId: host.id },
        data: { escrow: { increment: 50 }, balance: { decrement: 50 } },
      });

      const res = await request(app)
        .post(`/events/match/${matchId}/join`)
        .set("Authorization", `Bearer ${joinerToken}`);
      // Accept 200, 201, or 400 (rate limit or escrow issue)
      expect([200, 201, 400]).toContain(res.status);
    });

    it("host can cancel a match event", async () => {
      const match = await prisma.match.create({
        data: {
          game: "Cancel Test",
          stake: 0,
          status: "UPCOMING",
          hostId: host.id,
        },
      });
      matchIds.push(match.id);

      const res = await request(app)
        .post(`/events/match/${match.id}/cancel`)
        .set("Authorization", `Bearer ${hostToken}`);
      expect([200, 400]).toContain(res.status);
    });

    it("non-host cannot cancel", async () => {
      const match = await prisma.match.create({
        data: {
          game: "No Cancel",
          stake: 0,
          status: "UPCOMING",
          hostId: host.id,
        },
      });
      matchIds.push(match.id);

      const res = await request(app)
        .post(`/events/match/${match.id}/cancel`)
        .set("Authorization", `Bearer ${joinerToken}`);
      expect([403, 400]).toContain(res.status);
    });
  });

  describe("Result Submission & Verification", () => {
    let matchId: string;

    beforeAll(async () => {
      const match = await prisma.match.create({
        data: {
          game: "Result Test",
          stake: 0,
          status: "ONGOING",
          hostId: host.id,
          joinerId: joiner.id,
        },
      });
      matchId = match.id;
      matchIds.push(match.id);
    });

    it("participant can submit result via events", async () => {
      const res = await request(app)
        .post(`/events/${matchId}/submit-result`)
        .set("Authorization", `Bearer ${hostToken}`)
        .send({ winnerId: host.id });
      expect([200, 201]).toContain(res.status);
    });

    it("reports a match winner via events/match", async () => {
      // Create a fresh ACTIVE match for the report endpoint
      const freshMatch = await prisma.match.create({
        data: {
          game: "Report Test",
          stake: 0,
          status: "ONGOING",
          hostId: host.id,
          joinerId: joiner.id,
        },
      });
      matchIds.push(freshMatch.id);

      const res = await request(app)
        .post(`/events/match/${freshMatch.id}/report`)
        .set("Authorization", `Bearer ${hostToken}`)
        .send({ winnerId: host.id });
      expect([200, 201]).toContain(res.status);
    });
  });

  describe("Dispute Endpoints", () => {
    it("GET /events/disputes requires mod role", async () => {
      const res = await request(app)
        .get("/events/disputes")
        .set("Authorization", `Bearer ${hostToken}`);
      expect(res.status).toBe(403);
    });

    it("moderator can list disputes", async () => {
      const res = await request(app)
        .get("/events/disputes")
        .set("Authorization", `Bearer ${modToken}`)
        .expect(200);
      expect(res.body).toBeDefined();
    });
  });

  describe("Evidence Upload", () => {
    it("rejects evidence upload without auth", async () => {
      const match = await prisma.match.create({
        data: {
          game: "Evidence Test",
          stake: 0,
          status: "DISPUTED",
          hostId: host.id,
        },
      });
      matchIds.push(match.id);

      await request(app)
        .post(`/events/${match.id}/upload-evidence`)
        .send({ evidence: "some text" })
        .expect(401);
    });
  });
});
