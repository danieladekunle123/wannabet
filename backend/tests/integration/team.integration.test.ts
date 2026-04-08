import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { userFactory, generateTestToken } from "../helpers/factories";

let userA: any;
let userB: any;
let team: any;
let tokenA: string;
let tokenB: string;

beforeAll(async () => {
  userA = await prisma.user.create({ data: userFactory() });
  userB = await prisma.user.create({ data: userFactory() });
  tokenA = generateTestToken(userA.id);
  tokenB = generateTestToken(userB.id);
});

afterAll(async () => {
  await prisma.teamInvite.deleteMany({
    where: { teamId: team?.id },
  });
  await prisma.teamMember.deleteMany({
    where: { teamId: team?.id },
  });
  await prisma.teamChat.deleteMany({
    where: { teamId: team?.id },
  });
  await prisma.team.deleteMany({ where: { id: team?.id } });
  await prisma.blockedUser.deleteMany({
    where: {
      OR: [{ blockerId: userA.id }, { blockerId: userB.id }],
    },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [userA.id, userB.id] } },
  });
});

describe("Team/Social Integration", () => {
  it("creates a team", async () => {
    const res = await request(app)
      .post("/teams")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Test Team", game: "Valorant" })
      .expect(201);
    expect(res.body.team).toBeDefined();
    team = res.body.team;
  });

  it("invites a user to the team", async () => {
    const res = await request(app)
      .post(`/teams/${team.id}/invites`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ receiverId: userB.id })
      .expect(201);
    expect(res.body.invite).toBeDefined();
  });

  it("blocks a user", async () => {
    const res = await request(app)
      .post(`/users/${userA.id}/block`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({})
      .expect(201);
    expect(res.body.ok).toBe(true);
  });
});
