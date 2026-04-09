import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import {
  createTestUser,
  createModUser,
  createAdminUser,
  cleanupUser,
  cleanupMatch,
} from "../helpers/factories";

let admin: any, adminToken: string;
let mod: any, modToken: string;
let player: any, playerToken: string;
const userIds: string[] = [];
const matchIds: string[] = [];

beforeAll(async () => {
  const a = await createAdminUser();
  admin = a.user;
  adminToken = a.token;
  userIds.push(admin.id);

  const m = await createModUser();
  mod = m.user;
  modToken = m.token;
  userIds.push(mod.id);

  const p = await createTestUser();
  player = p.user;
  playerToken = p.token;
  userIds.push(player.id);
});

afterAll(async () => {
  for (const mid of matchIds) await cleanupMatch(mid);
  await prisma.ban.deleteMany({
    where: { userId: { in: userIds } },
  });
  for (const id of userIds) await cleanupUser(id);
}, 15000);

describe("Admin/Moderation Integration", () => {
  describe("Ban System", () => {
    it("admin can ban a user", async () => {
      const res = await request(app)
        .post(`/users/${player.id}/ban`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ reason: "Testing ban" })
        .expect(200);
      expect(res.body.ban).toBeDefined();
    });

    it("moderator can ban a user", async () => {
      // unban first
      await prisma.ban.deleteMany({ where: { userId: player.id } });
      const res = await request(app)
        .post(`/users/${player.id}/ban`)
        .set("Authorization", `Bearer ${modToken}`)
        .send({ reason: "Mod ban" })
        .expect(200);
      expect(res.body.ban).toBeDefined();
    });

    it("player cannot ban anyone", async () => {
      await prisma.ban.deleteMany({ where: { userId: player.id } });
      const res = await request(app)
        .post(`/users/${admin.id}/ban`)
        .set("Authorization", `Bearer ${playerToken}`)
        .send({ reason: "Abuse" })
        .expect(403);
      expect(res.body.message).toBeDefined();
    });

    it("banned user receives 403 on auth endpoints", async () => {
      // ensure user is banned
      await prisma.ban.deleteMany({ where: { userId: player.id } });
      await prisma.ban.create({
        data: {
          userId: player.id,
          moderatorId: admin.id,
          reason: "test",
          active: true,
        },
      });
      const res = await request(app)
        .get("/wallet")
        .set("Authorization", `Bearer ${playerToken}`);
      expect(res.status).toBe(403);

      // cleanup ban for further tests
      await prisma.ban.deleteMany({ where: { userId: player.id } });
    });
  });

  describe("Dispute Resolution", () => {
    it("admin can resolve a dispute", async () => {
      const match = await prisma.match.create({
        data: {
          game: "Test Game",
          stake: 100,
          status: "DISPUTED",
          hostId: player.id,
        },
      });
      matchIds.push(match.id);
      const dispute = await prisma.dispute.create({
        data: {
          disputantId: player.id,
          matchId: match.id,
          reason: "Test dispute",
          status: "open",
        },
      });

      const res = await request(app)
        .post(`/disputes/${dispute.id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ winnerId: player.id, outcome: "approved_reporter" })
        .expect(200);
      expect(res.body).toBeDefined();
    });

    it("player cannot resolve disputes", async () => {
      const match = await prisma.match.create({
        data: {
          game: "Test Game 2",
          stake: 50,
          status: "DISPUTED",
          hostId: player.id,
        },
      });
      matchIds.push(match.id);
      const dispute = await prisma.dispute.create({
        data: {
          disputantId: player.id,
          matchId: match.id,
          reason: "Cannot resolve",
          status: "open",
        },
      });

      const res = await request(app)
        .post(`/disputes/${dispute.id}/resolve`)
        .set("Authorization", `Bearer ${playerToken}`)
        .send({ winnerId: player.id, outcome: "approved_reporter" });
      expect(res.status).toBe(403);
    });
  });
});
