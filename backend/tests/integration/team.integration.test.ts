import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { createTestUser, cleanupUser } from "../helpers/factories";

let userA: any, tokenA: string;
let userB: any, tokenB: string;
let userC: any, tokenC: string;
let team: any;
const userIds: string[] = [];
const teamIds: string[] = [];

beforeAll(async () => {
  const a = await createTestUser();
  userA = a.user;
  tokenA = a.token;
  userIds.push(userA.id);

  const b = await createTestUser();
  userB = b.user;
  tokenB = b.token;
  userIds.push(userB.id);

  const c = await createTestUser();
  userC = c.user;
  tokenC = c.token;
  userIds.push(userC.id);
});

afterAll(async () => {
  for (const tid of teamIds) {
    await (prisma as any).teamPost.deleteMany({ where: { teamId: tid } });
    await (prisma as any).teamInvite.deleteMany({ where: { teamId: tid } });
    await (prisma as any).teamMember.deleteMany({ where: { teamId: tid } });
    await (prisma as any).teamChat.deleteMany({ where: { teamId: tid } });
    await (prisma as any).team.deleteMany({ where: { id: tid } });
  }
  await prisma.blockedUser.deleteMany({
    where: {
      OR: userIds.map((id) => ({ blockerId: id })),
    },
  });
  for (const id of userIds) await cleanupUser(id);
});

describe("Team Integration", () => {
  describe("Team CRUD", () => {
    it("creates a team", async () => {
      const res = await request(app)
        .post("/teams")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "Test Team", game: "Valorant" })
        .expect(201);
      expect(res.body.team).toBeDefined();
      expect(res.body.team.name).toBe("Test Team");
      expect(res.body.team.chatId).toBeDefined();
      team = res.body.team;
      teamIds.push(team.id);
    });

    it("rejects creating a team without name", async () => {
      const res = await request(app)
        .post("/teams")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ game: "Valorant" });
      expect(res.status).toBe(400);
    });

    it("commander can update team", async () => {
      const res = await request(app)
        .patch(`/teams/${team.id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "Updated Team" })
        .expect(200);
      expect(res.body.team.name).toBe("Updated Team");
    });

    it("non-commander cannot update team", async () => {
      const res = await request(app)
        .patch(`/teams/${team.id}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ name: "Hacked" });
      expect(res.status).toBe(403);
    });

    it("requires auth to create team", async () => {
      await request(app)
        .post("/teams")
        .send({ name: "No Auth Team", game: "Valorant" })
        .expect(401);
    });
  });

  describe("Team Invites", () => {
    let inviteId: string;

    it("invites a user to the team", async () => {
      const res = await request(app)
        .post(`/teams/${team.id}/invites`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ receiverId: userB.id })
        .expect(201);
      expect(res.body.invite).toBeDefined();
      inviteId = res.body.invite.id;
    });

    it("rejects inviting yourself", async () => {
      const res = await request(app)
        .post(`/teams/${team.id}/invites`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ receiverId: userA.id });
      expect(res.status).toBe(400);
    });

    it("user can accept invite", async () => {
      const res = await request(app)
        .post(`/teams/invites/${inviteId}/respond`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ action: "accepted" })
        .expect(200);
      expect(res.body.invite.status).toBe("accepted");
    });

    it("rejects responding to already-processed invite", async () => {
      const res = await request(app)
        .post(`/teams/invites/${inviteId}/respond`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ action: "accepted" });
      expect(res.status).toBe(400);
    });
  });

  describe("Team Members", () => {
    it("lists my teams", async () => {
      const res = await request(app)
        .get("/teams/my")
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.teams).toBeInstanceOf(Array);
      expect(res.body.teams.length).toBeGreaterThanOrEqual(1);
    });

    it("gets team detail as member", async () => {
      const res = await request(app)
        .get(`/teams/${team.id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.team).toBeDefined();
      expect(res.body.team.members.length).toBeGreaterThanOrEqual(2);
    });

    it("non-member cannot view team detail", async () => {
      const res = await request(app)
        .get(`/teams/${team.id}`)
        .set("Authorization", `Bearer ${tokenC}`);
      expect(res.status).toBe(403);
    });

    it("commander can update member role", async () => {
      const res = await request(app)
        .post(`/teams/${team.id}/members/${userB.id}/role`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ role: "general" })
        .expect(200);
      expect(res.body.member.role).toBe("general");
    });

    it("cannot change commander's own role", async () => {
      const res = await request(app)
        .post(`/teams/${team.id}/members/${userA.id}/role`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ role: "colonel" });
      expect(res.status).toBe(400);
    });
  });

  describe("Team Posts", () => {
    let postId: string;

    it("commander can create post", async () => {
      const res = await request(app)
        .post(`/teams/${team.id}/posts`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ title: "Test Post", content: "Post content" })
        .expect(201);
      expect(res.body.post).toBeDefined();
      postId = res.body.post.id;
    });

    it("lists team posts", async () => {
      const res = await request(app)
        .get(`/teams/${team.id}/posts`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.posts).toBeInstanceOf(Array);
      expect(res.body.posts.length).toBeGreaterThanOrEqual(1);
    });

    it("non-member cannot view posts", async () => {
      const res = await request(app)
        .get(`/teams/${team.id}/posts`)
        .set("Authorization", `Bearer ${tokenC}`);
      expect(res.status).toBe(403);
    });

    it("commander can delete post", async () => {
      const res = await request(app)
        .delete(`/teams/${team.id}/posts/${postId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .expect(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe("Leave & Remove", () => {
    it("commander cannot leave team", async () => {
      const res = await request(app)
        .post(`/teams/${team.id}/leave`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(res.status).toBe(400);
    });

    it("member can leave team", async () => {
      const res = await request(app)
        .post(`/teams/${team.id}/leave`)
        .set("Authorization", `Bearer ${tokenB}`)
        .expect(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe("Block User", () => {
    it("blocks a user", async () => {
      const res = await request(app)
        .post(`/users/${userA.id}/block`)
        .set("Authorization", `Bearer ${tokenC}`)
        .send({})
        .expect(201);
      expect(res.body.ok).toBe(true);
    });
  });
});
