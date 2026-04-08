import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { userFactory, generateTestToken } from "../helpers/factories";

let sender: any;
let receiver: any;
let senderToken: string;
let conversation: any;

beforeAll(async () => {
  sender = await prisma.user.create({ data: userFactory() });
  receiver = await prisma.user.create({ data: userFactory() });
  senderToken = generateTestToken(sender.id);

  // Sort user IDs to build the canonical conversation key
  const sorted = [sender.id, receiver.id].sort();
  const key = `dm:${sorted[0]}:${sorted[1]}`;

  conversation = await prisma.conversation.create({
    data: {
      key,
      firstUserId: sorted[0],
      secondUserId: sorted[1],
    },
  });
});

afterAll(async () => {
  await prisma.message.deleteMany({
    where: { channelId: conversation.key },
  });
  await prisma.conversation.deleteMany({ where: { id: conversation.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [sender.id, receiver.id] } },
  });
});

describe("Messaging Integration", () => {
  it("sends a message", async () => {
    const res = await request(app)
      .post("/messages")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        conversationId: conversation.id,
        content: "Hello world!",
        receiverId: receiver.id,
      });
    // Route returns 200 with { data: { ... } }
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.content).toBe("Hello world!");
  });

  it("rejects sending message without content", async () => {
    const res = await request(app)
      .post("/messages")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        conversationId: conversation.id,
        content: "",
        receiverId: receiver.id,
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
