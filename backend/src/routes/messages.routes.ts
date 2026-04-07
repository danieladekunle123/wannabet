import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { getIo } from "../lib/socket";
import { setMessageRead, checkRateLimit } from "../services/redis";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "messages");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safeExt = path.extname(file.originalname || "").toLowerCase() || "";
      const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      cb(null, `${baseName}${safeExt}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }

    cb(null, true);
  },
});

const getMessagePreview = (message: any) => {
  if (message.messageType === "gif") return "GIF";
  if (message.messageType === "image") return "Image";
  if (message.messageType === "video") return "Video";
  return message.content || "";
};

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const normalizedPath = file.path.replace(/\\/g, "/");
      const uploadsIndex = normalizedPath.indexOf("/uploads/");
      const relativePath =
        uploadsIndex >= 0
          ? normalizedPath.slice(uploadsIndex + 1)
          : `uploads/messages/${file.filename}`;
      const mediaUrl = `/${relativePath}`;

      const messageType = file.mimetype.startsWith("video/")
        ? "video"
        : file.mimetype === "image/gif"
          ? "gif"
          : "image";
      return res.json({ mediaUrl, messageType });
    } catch (err) {
      console.error("upload error", err);
      return res.status(500).json({ message: "Upload failed" });
    }
  },
);

const normalizeDmConversationId = (conversationId: string): string => {
  if (!conversationId?.startsWith("dm:")) return conversationId;
  const parts = conversationId
    .replace(/^dm:/, "")
    .split(":")
    .filter(Boolean)
    .sort();
  return `dm:${parts.join(":")}`;
};

const extractDmParticipants = (conversationId: string): string[] => {
  if (!conversationId?.startsWith("dm:")) return [];
  return conversationId.replace(/^dm:/, "").split(":").filter(Boolean);
};

const getSortedUserPair = (
  firstId: string,
  secondId: string,
): [string, string] => {
  return [firstId, secondId].sort() as [string, string];
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const isTeamChannelId = (value: string) => value?.startsWith("team:");

const getTeamIdFromChannel = (value: string) =>
  isTeamChannelId(value) ? value.replace(/^team:/, "") : "";

const ensureTeamMember = async (channelId: string, userId: string) => {
  const teamId = getTeamIdFromChannel(channelId);
  if (!teamId) return false;
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    select: { id: true },
  });
  return !!member;
};

const findBlockBetweenUsers = async (firstId: string, secondId: string) => {
  return prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: firstId, blockedId: secondId },
        { blockerId: secondId, blockedId: firstId },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });
};

const ensureDmConversation = async (firstId: string, secondId: string) => {
  const [sortedFirstId, sortedSecondId] = getSortedUserPair(firstId, secondId);
  const key = `dm:${sortedFirstId}:${sortedSecondId}`;
  const conversation = await prisma.conversation.upsert({
    where: {
      firstUserId_secondUserId: {
        firstUserId: sortedFirstId,
        secondUserId: sortedSecondId,
      },
    },
    create: {
      key,
      firstUserId: sortedFirstId,
      secondUserId: sortedSecondId,
    },
    update: {},
  });

  return { conversation, key };
};

// list conversations for authenticated user
router.get("/conversations", requireAuth, async (req: any, res) => {
  const userId = req.user.userId;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ firstUserId: userId }, { secondUserId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      firstUser: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          profileImageUrl: true,
          profile: { select: { displayName: true } },
        },
      },
      secondUser: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          profileImageUrl: true,
          profile: { select: { displayName: true } },
        },
      },
    },
  });

  const blocked = await prisma.blockedUser.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  const blockedIds = new Set(blocked.map((b) => b.blockedId));

  const dmData = await Promise.all(
    conversations.map(async (conversation) => {
      const members = [conversation.firstUserId, conversation.secondUserId];
      const otherUser =
        conversation.firstUserId === userId
          ? conversation.secondUser
          : conversation.firstUser;

      if (blockedIds.has(otherUser.id)) {
        return null;
      }

      const lastMessage = await prisma.message.findFirst({
        where: { channelId: conversation.key },
        orderBy: { createdAt: "desc" },
      });

      const unread = await prisma.message.count({
        where: {
          readAt: null,
          senderId: { not: userId },
          OR: [
            { channelId: conversation.key },
            {
              AND: [
                { senderId: conversation.firstUserId },
                { receiverId: conversation.secondUserId },
              ],
            },
            {
              AND: [
                { senderId: conversation.secondUserId },
                { receiverId: conversation.firstUserId },
              ],
            },
          ],
        },
      });

      return {
        id: conversation.key,
        key: conversation.key,
        type: "dm",
        members,
        unread,
        lastMessage: lastMessage ? getMessagePreview(lastMessage) : "",
        updatedAt: lastMessage?.createdAt || conversation.updatedAt,
        name:
          otherUser.profile?.displayName ||
          otherUser.username ||
          "Direct Message",
        avatarUrl: otherUser.avatarUrl || null,
        profileImageUrl: otherUser.profileImageUrl || null,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          displayName: otherUser.profile?.displayName || null,
          avatarUrl: otherUser.avatarUrl,
          profileImageUrl: otherUser.profileImageUrl || null,
        },
      };
    }),
  );

  const teamMemberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          chat: true,
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  const teamData = await Promise.all(
    teamMemberships.map(async (membership) => {
      const channelId =
        membership.team.chat?.chatId || `team:${membership.teamId}`;

      const lastMessage = await prisma.message.findFirst({
        where: { channelId },
        orderBy: { createdAt: "desc" },
      });

      const unread = await prisma.message.count({
        where: {
          channelId,
          readAt: null,
          senderId: { not: userId },
        },
      });

      return {
        id: channelId,
        key: channelId,
        type: "team",
        members: membership.team.members.map((m) => m.userId),
        unread,
        lastMessage: lastMessage ? getMessagePreview(lastMessage) : "",
        updatedAt: lastMessage?.createdAt || membership.team.createdAt,
        name: membership.team.name,
        avatarUrl: membership.team.profileImageUrl || null,
        profileImageUrl: membership.team.profileImageUrl || null,
        game: membership.team.game,
        teamId: membership.teamId,
        canManageTeam: membership.role === "commander",
      };
    }),
  );

  return res.json({ data: [...dmData.filter(Boolean), ...teamData] });
});

router.post("/conversations/dm/:userId", requireAuth, async (req: any, res) => {
  const currentUserId = req.user.userId;
  const otherUserId = String(req.params.userId || "");
  if (!otherUserId) return res.status(400).json({ message: "Missing user id" });
  if (otherUserId === currentUserId) {
    return res.status(400).json({ message: "Cannot open DM with yourself" });
  }

  const target = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      profileImageUrl: true,
      profile: { select: { displayName: true } },
    },
  });
  if (!target) return res.status(404).json({ message: "User not found" });

  const block = await findBlockBetweenUsers(currentUserId, otherUserId);
  if (block) {
    return res.status(403).json({
      message:
        block.blockerId === currentUserId
          ? "Unblock this user before messaging them"
          : "This user has blocked you",
    });
  }

  const { conversation, key } = await ensureDmConversation(
    currentUserId,
    otherUserId,
  );
  return res.status(201).json({
    conversation: {
      id: key,
      key,
      members: [conversation.firstUserId, conversation.secondUserId],
      otherUser: {
        id: target.id,
        username: target.username,
        displayName: target.profile?.displayName || null,
        avatarUrl: target.avatarUrl,
        profileImageUrl: target.profileImageUrl || null,
      },
    },
  });
});

// fetch messages for a conversation
router.get("/:conversationId", requireAuth, async (req: any, res) => {
  const userId = req.user.userId;
  const { conversationId } = req.params;

  let channelKey = normalizeDmConversationId(conversationId);
  let participants: string[] = extractDmParticipants(channelKey);

  if (isUuid(conversationId)) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    channelKey = conversation.key;
    participants = [conversation.firstUserId, conversation.secondUserId];
  } else if (channelKey.startsWith("dm:")) {
    const existing = await prisma.conversation.findFirst({
      where: { key: channelKey },
    });
    if (existing) {
      participants = [existing.firstUserId, existing.secondUserId];
      channelKey = existing.key;
    }
  }

  if (participants.length && !participants.includes(userId)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (isTeamChannelId(channelKey)) {
    const allowed = await ensureTeamMember(channelKey, userId);
    if (!allowed) return res.status(403).json({ message: "Forbidden" });
  }

  let messages;
  if (channelKey.startsWith("dm:")) {
    const [a, b] =
      participants.length === 2
        ? participants
        : extractDmParticipants(channelKey);
    messages = await prisma.message.findMany({
      where: {
        OR: [
          { channelId: channelKey },
          { channelId: conversationId },
          ...(a && b
            ? [
                { AND: [{ senderId: a }, { receiverId: b }] },
                { AND: [{ senderId: b }, { receiverId: a }] },
              ]
            : []),
        ],
      },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, username: true } } },
    });
  } else {
    messages = await prisma.message.findMany({
      where: { channelId: channelKey },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, username: true } } },
    });
  }

  return res.json({ data: messages });
});

router.post("/:conversationId/read", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;

    let channelKey = normalizeDmConversationId(conversationId);
    let participants: string[] = extractDmParticipants(channelKey);

    if (isUuid(conversationId)) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      channelKey = conversation.key;
      participants = [conversation.firstUserId, conversation.secondUserId];
    } else if (channelKey.startsWith("dm:")) {
      const existing = await prisma.conversation.findFirst({
        where: { key: channelKey },
      });
      if (existing) {
        participants = [existing.firstUserId, existing.secondUserId];
        channelKey = existing.key;
      }
    }

    if (participants.length && !participants.includes(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (isTeamChannelId(channelKey)) {
      const allowed = await ensureTeamMember(channelKey, userId);
      if (!allowed) return res.status(403).json({ message: "Forbidden" });
    }

    let where: any;
    if (channelKey.startsWith("dm:")) {
      const [a, b] =
        participants.length === 2
          ? participants
          : extractDmParticipants(channelKey);
      where = {
        readAt: null,
        senderId: { not: userId },
        OR: [
          { channelId: channelKey },
          { channelId: conversationId },
          ...(a && b
            ? [
                { AND: [{ senderId: a }, { receiverId: b }] },
                { AND: [{ senderId: b }, { receiverId: a }] },
              ]
            : []),
        ],
      };
    } else {
      where = {
        channelId: channelKey,
        readAt: null,
        senderId: { not: userId },
      };
    }

    const unreadMessages = await prisma.message.findMany({
      where,
      select: { id: true },
    });

    if (!unreadMessages.length) {
      return res.json({ data: { updated: 0, messageIds: [] } });
    }

    const readAt = new Date();
    const messageIds = unreadMessages.map((msg) => msg.id);

    await prisma.message.updateMany({
      where: { id: { in: messageIds } },
      data: { readAt },
    });

    // Cache read receipts in Redis for fast lookup
    await Promise.all(
      messageIds.map((msgId) => setMessageRead(msgId, userId)),
    ).catch(() => {});

    const payload = {
      conversationId: channelKey,
      readerId: userId,
      readAt: readAt.toISOString(),
      messageIds,
    };

    const io = getIo();
    if (io) {
      if (channelKey) {
        io.to(`channel:${channelKey}`).emit("message:read", payload);
      }
      // Also emit user:read for global listeners
      if (participants.length === 2) {
        const otherUserId = participants.find((id) => id !== userId);
        if (otherUserId) {
          io.to(`user:${otherUserId}`)
            .except(`channel:${channelKey}`)
            .emit("message:read", payload);
          io.to(`user:${otherUserId}`).emit("user:read", payload);
        }
      }
    }

    return res.json({
      data: {
        updated: messageIds.length,
        messageIds,
        readAt: readAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("messages read error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// create a message (persist + broadcast)
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user!.userId;
    const { allowed } = await checkRateLimit(`rate:message:${userId}`, 30);
    if (!allowed) {
      return res.status(429).json({ message: "Too many messages. Slow down." });
    }

    // support multiple client payload shapes:
    // 1) { conversationId, content, receiverId }
    // 2) { message: { conversationId, content, receiverId } }
    // defensive body handling
    console.debug("messages POST received body type:", typeof req.body);
    console.debug("messages POST body value:", req.body);

    let body: any = {};
    if (req.body && typeof req.body === "object") {
      if (
        Object.prototype.hasOwnProperty.call(req.body, "message") &&
        req.body.message &&
        typeof req.body.message === "object"
      ) {
        body = req.body.message;
      } else {
        body = req.body;
      }
    }

    const conversationId = body?.conversationId;
    const content = body?.content ?? "";
    const messageType = body?.messageType || "text";
    const mediaUrl = body?.mediaUrl || null;
    let receiverId = body?.receiverId;

    if (!conversationId || (!content && !mediaUrl)) {
      console.warn("Invalid message payload", { body: req.body });
      return res.status(400).json({
        message: "conversationId and content or mediaUrl are required",
      });
    }

    const senderId = req.user?.userId;

    let resolvedConversationKey: string | null = null;
    let resolvedConversationId: string | null = null;
    let dmParticipants: string[] = [];

    if (isUuid(conversationId)) {
      const existingConversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!existingConversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      if (
        existingConversation.firstUserId !== senderId &&
        existingConversation.secondUserId !== senderId
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      resolvedConversationKey = existingConversation.key;
      resolvedConversationId = existingConversation.id;
      dmParticipants = [
        existingConversation.firstUserId,
        existingConversation.secondUserId,
      ];
    }

    // derive and normalize channelId for direct messages
    let finalChannelId = resolvedConversationKey || conversationId;
    if (finalChannelId?.startsWith("dm:")) {
      finalChannelId = normalizeDmConversationId(finalChannelId);
      dmParticipants = extractDmParticipants(finalChannelId);
      if (!receiverId) {
        receiverId = dmParticipants.find((p) => p !== senderId) || null;
      }

      if (receiverId) {
        const { conversation, key } = await ensureDmConversation(
          senderId,
          receiverId,
        );
        resolvedConversationKey = key;
        resolvedConversationId = conversation.id;
        finalChannelId = key;
      }
    }

    if (!finalChannelId && receiverId) {
      const pair = [senderId, receiverId].sort().join(":");
      finalChannelId = `dm:${pair}`;
      const { conversation, key } = await ensureDmConversation(
        senderId,
        receiverId,
      );
      resolvedConversationKey = key;
      resolvedConversationId = conversation.id;
      finalChannelId = key;
    }

    if (!receiverId && dmParticipants.length) {
      receiverId = dmParticipants.find((p) => p !== senderId) || null;
    }

    if (finalChannelId && isTeamChannelId(finalChannelId)) {
      const allowed = await ensureTeamMember(finalChannelId, senderId);
      if (!allowed) {
        return res.status(403).json({ message: "Not a team member" });
      }
      receiverId = null;
    }

    if (receiverId) {
      const block = await findBlockBetweenUsers(senderId, receiverId);
      if (block) {
        return res.status(403).json({
          message:
            block.blockerId === senderId
              ? "Unblock this user before messaging them"
              : "This user has blocked you",
        });
      }
    }

    const saved = await prisma.message.create({
      data: {
        channelId: finalChannelId,
        content,
        messageType,
        mediaUrl,
        senderId,
        receiverId,
        replyToId: body?.replyToId || null,
      },
      include: { sender: { select: { id: true, username: true } } },
    });

    const io = getIo();
    if (io) {
      // broadcast to the actual saved channel (finalChannelId)
      if (finalChannelId)
        io.to(`channel:${finalChannelId}`).emit("message", saved);
      if (receiverId) {
        if (finalChannelId) {
          io.to(`user:${receiverId}`)
            .except(`channel:${finalChannelId}`)
            .emit("message", saved);
        } else {
          io.to(`user:${receiverId}`).emit("message", saved);
        }
      }
    }

    if (resolvedConversationId) {
      await prisma.conversation
        .update({
          where: { id: resolvedConversationId },
          data: { updatedAt: new Date() },
        })
        .catch(() => null);
    }

    return res.json({ data: saved });
  } catch (err) {
    console.error("messages POST error", err, { body: req.body });
    return res.status(500).json({ message: "Internal server error" });
  }
});

// reply to a message (shorthand)
router.post("/:id/reply", requireAuth, async (req: any, res) => {
  try {
    const originalId = req.params.id;
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ message: "content required" });
    const senderId = req.user?.userId;

    // find original message to copy channelId/receiverId
    const orig = await prisma.message.findUnique({ where: { id: originalId } });
    if (!orig)
      return res.status(404).json({ message: "original message not found" });

    if (orig.channelId && isTeamChannelId(orig.channelId)) {
      const allowed = await ensureTeamMember(orig.channelId, senderId);
      if (!allowed) return res.status(403).json({ message: "Forbidden" });
    }

    const counterpartId =
      orig.senderId === senderId ? orig.receiverId : orig.senderId;
    if (counterpartId) {
      const block = await findBlockBetweenUsers(senderId, counterpartId);
      if (block) {
        return res.status(403).json({
          message:
            block.blockerId === senderId
              ? "Unblock this user before messaging them"
              : "This user has blocked you",
        });
      }
    }

    if (counterpartId) {
      await ensureDmConversation(senderId, counterpartId).catch(() => null);
    }

    const saved = await prisma.message.create({
      data: {
        channelId:
          orig.channelId ||
          `dm:${[orig.senderId, orig.receiverId].filter(Boolean).sort().join(":")}`,
        content,
        senderId,
        receiverId: orig.receiverId || null,
        replyToId: originalId,
      },
      include: { sender: { select: { id: true, username: true } } },
    });

    const io = getIo();
    if (io) {
      const room = saved.channelId
        ? `channel:${saved.channelId}`
        : `user:${saved.receiverId}`;
      io.to(room).emit("message", saved);
      if (saved.receiverId && saved.channelId) {
        io.to(`user:${saved.receiverId}`)
          .except(`channel:${saved.channelId}`)
          .emit("message", saved);
      } else if (saved.receiverId && !saved.channelId) {
        io.to(`user:${saved.receiverId}`).emit("message", saved);
      }
    }

    if (saved.channelId?.startsWith("dm:")) {
      const pair = extractDmParticipants(saved.channelId);
      if (pair.length === 2) {
        const [firstUserId, secondUserId] = getSortedUserPair(pair[0], pair[1]);
        await prisma.conversation
          .updateMany({
            where: { firstUserId, secondUserId },
            data: { updatedAt: new Date() },
          })
          .catch(() => null);
      }
    }

    return res.json({ data: saved });
  } catch (err) {
    console.error("reply error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// update message (only sender)
router.patch("/:id", requireAuth, async (req: any, res) => {
  try {
    const id = req.params.id;
    const { content } = req.body || {};
    if (typeof content !== "string")
      return res.status(400).json({ message: "content required" });
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ message: "not found" });
    if (msg.senderId !== req.user.userId)
      return res.status(403).json({ message: "forbidden" });
    if (msg.channelId && isTeamChannelId(msg.channelId)) {
      const allowed = await ensureTeamMember(msg.channelId, req.user.userId);
      if (!allowed) return res.status(403).json({ message: "forbidden" });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { content, editedAt: new Date() },
    });
    const io = getIo();
    if (io) {
      const room = updated.channelId
        ? `channel:${updated.channelId}`
        : `user:${updated.receiverId}`;
      io.to(room).emit("message:update", updated);
      if (updated.receiverId)
        io.to(`user:${updated.receiverId}`).emit("message:update", updated);
    }
    return res.json({ data: updated });
  } catch (err) {
    console.error("patch message error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// delete message (only sender)
router.delete("/:id", requireAuth, async (req: any, res) => {
  try {
    const id = req.params.id;
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ message: "not found" });
    if (msg.senderId !== req.user.userId)
      return res.status(403).json({ message: "forbidden" });
    if (msg.channelId && isTeamChannelId(msg.channelId)) {
      const allowed = await ensureTeamMember(msg.channelId, req.user.userId);
      if (!allowed) return res.status(403).json({ message: "forbidden" });
    }

    await prisma.message.delete({ where: { id } });
    const io = getIo();
    if (io) {
      const room = msg.channelId
        ? `channel:${msg.channelId}`
        : `user:${msg.receiverId}`;
      io.to(room).emit("message:delete", { id });
      if (msg.receiverId)
        io.to(`user:${msg.receiverId}`).emit("message:delete", { id });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("delete message error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { router as messagesRouter };
