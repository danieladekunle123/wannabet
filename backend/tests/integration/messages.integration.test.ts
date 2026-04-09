import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { createTestUser, cleanupUser } from "../helpers/factories";

let sender: any, senderToken: string;
let receiver: any, receiverToken: string;
let conversationKey: string;
let conversationId: string;
const userIds: string[] = [];

beforeAll(async () => {
  const s = await createTestUser();
  sender = s.user;
  senderToken = s.token;
  userIds.push(sender.id);

  const r = await createTestUser();
  receiver = r.user;
  receiverToken = r.token;
  userIds.push(receiver.id);

  // Sort user IDs to build the canonical conversation key
  const sorted = [sender.id, receiver.id].sort();
  conversationKey = `dm:${sorted[0]}:${sorted[1]}`;

  const conv = await prisma.conversation.create({
    data: {
      key: conversationKey,
      firstUserId: sorted[0],
      secondUserId: sorted[1],
    },
  });
  conversationId = conv.id;
});

afterAll(async () => {
  await prisma.message.deleteMany({
    where: { channelId: conversationKey },
  });
  await prisma.conversation.deleteMany({ where: { id: conversationId } });
  for (const id of userIds) await cleanupUser(id);
});

describe("Messaging Integration", () => {
  let firstMessageId: string;

  describe("Send Message", () => {
    it("sends a text message", async () => {
      const res = await request(app)
        .post("/messages")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          conversationId: conversationId,
          content: "Hello world!",
          receiverId: receiver.id,
        });
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.content).toBe("Hello world!");
      expect(res.body.data.senderId).toBe(sender.id);
      firstMessageId = res.body.data.id;
    });

    it("rejects empty content without media", async () => {
      const res = await request(app)
        .post("/messages")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          conversationId: conversationId,
          content: "",
          receiverId: receiver.id,
        });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("rejects without auth", async () => {
      await request(app)
        .post("/messages")
        .send({
          conversationId: conversationId,
          content: "no auth",
          receiverId: receiver.id,
        })
        .expect(401);
    });
  });

  describe("Fetch Messages", () => {
    it("retrieves conversation messages", async () => {
      const res = await request(app)
        .get(`/messages/${conversationKey}`)
        .set("Authorization", `Bearer ${senderToken}`)
        .expect(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 403 for non-participant", async () => {
      const third = await createTestUser();
      userIds.push(third.user.id);
      const res = await request(app)
        .get(`/messages/${conversationKey}`)
        .set("Authorization", `Bearer ${third.token}`);
      expect(res.status).toBe(403);
    });
  });

  describe("Reply to Message", () => {
    it("replies to an existing message", async () => {
      const res = await request(app)
        .post(`/messages/${firstMessageId}/reply`)
        .set("Authorization", `Bearer ${receiverToken}`)
        .send({ content: "Reply!" })
        .expect(200);
      expect(res.body.data.replyToId).toBe(firstMessageId);
    });

    it("rejects reply without content", async () => {
      const res = await request(app)
        .post(`/messages/${firstMessageId}/reply`)
        .set("Authorization", `Bearer ${receiverToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("Edit & Delete Message", () => {
    it("sender can edit own message", async () => {
      const res = await request(app)
        .patch(`/messages/${firstMessageId}`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "edited content" })
        .expect(200);
      expect(res.body.data.content).toBe("edited content");
      expect(res.body.data.editedAt).toBeDefined();
    });

    it("non-sender cannot edit message", async () => {
      const res = await request(app)
        .patch(`/messages/${firstMessageId}`)
        .set("Authorization", `Bearer ${receiverToken}`)
        .send({ content: "hacked" });
      expect(res.status).toBe(403);
    });

    it("non-sender cannot delete message", async () => {
      const res = await request(app)
        .delete(`/messages/${firstMessageId}`)
        .set("Authorization", `Bearer ${receiverToken}`);
      expect(res.status).toBe(403);
    });

    it("sender can delete own message", async () => {
      // send a disposable message
      const msg = await request(app)
        .post("/messages")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({
          conversationId: conversationId,
          content: "to delete",
          receiverId: receiver.id,
        });
      const res = await request(app)
        .delete(`/messages/${msg.body.data.id}`)
        .set("Authorization", `Bearer ${senderToken}`)
        .expect(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe("Conversations List", () => {
    it("lists conversations for authenticated user", async () => {
      const res = await request(app)
        .get("/messages/conversations")
        .set("Authorization", `Bearer ${senderToken}`)
        .expect(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("requires auth to list conversations", async () => {
      await request(app).get("/messages/conversations").expect(401);
    });
  });

  describe("Open DM Conversation", () => {
    it("opens a DM conversation with another user", async () => {
      const res = await request(app)
        .post(`/messages/conversations/dm/${receiver.id}`)
        .set("Authorization", `Bearer ${senderToken}`)
        .expect(201);
      expect(res.body.conversation).toBeDefined();
      expect(res.body.conversation.key).toContain("dm:");
    });

    it("rejects opening DM with yourself", async () => {
      const res = await request(app)
        .post(`/messages/conversations/dm/${sender.id}`)
        .set("Authorization", `Bearer ${senderToken}`);
      expect(res.status).toBe(400);
    });
  });
});
