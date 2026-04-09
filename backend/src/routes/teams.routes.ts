import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { uploadBufferToS3, buildS3Key } from "../services/s3Service";

export const teamsRouter = Router();

type TeamRole = "commander" | "general" | "colonel";
type TeamInviteStatus = "pending" | "accepted" | "declined";
const db = prisma as any;

const allowedTeamImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const teamProfileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTeamImageMimeTypes.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});

const CreateTeamSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional().default(""),
  game: z.string().trim().min(1).max(120),
});

const UpdateTeamSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(1000).optional(),
  game: z.string().trim().min(1).max(120).optional(),
});

const InviteSchema = z.object({
  receiverId: z.string().min(1),
});

const InviteResponseSchema = z.object({
  action: z.enum(["accepted", "declined"]),
});

const CreatePostSchema = z.object({
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(1).max(5000),
});

const UpdateRoleSchema = z.object({
  role: z.enum(["commander", "general", "colonel"]),
});

const canPost = (role: TeamRole | null | undefined) =>
  role === "commander" || role === "general";

const canManageTeam = (role: TeamRole | null | undefined) =>
  role === "commander";

async function getMembership(teamId: string, userId: string) {
  return db.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
}

async function ensureTeamChat(teamId: string) {
  const chatId = `team:${teamId}`;
  await db.teamChat.upsert({
    where: { teamId },
    create: { teamId, chatId },
    update: {
      chatId,
    },
  });
  return chatId;
}

function normalizeMatchStatus(status?: string | null) {
  const value = (status || "").toLowerCase();
  if (
    value.includes("complete") ||
    value.includes("result_verified") ||
    value.includes("result_reported")
  ) {
    return "completed";
  }
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("disput")) return "disputed";
  if (
    value.includes("ongoing") ||
    value.includes("running") ||
    value.includes("live")
  ) {
    return "ongoing";
  }
  return "upcoming";
}

function normalizeRoleLabel(role: TeamRole) {
  if (role === "commander") return "Commander";
  if (role === "general") return "General";
  return "Colonel";
}

teamsRouter.get("/my", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const memberships = await db.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            owner: { select: { id: true, username: true } },
            members: {
              select: {
                userId: true,
                role: true,
                user: {
                  select: { id: true, username: true, profileImageUrl: true },
                },
              },
            },
            chat: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    await Promise.all(memberships.map((m: any) => ensureTeamChat(m.teamId)));

    return res.json({
      teams: memberships.map((m: any) => ({
        id: m.team.id,
        name: m.team.name,
        description: m.team.description,
        game: m.team.game,
        profileImageUrl: m.team.profileImageUrl || null,
        ownerId: m.team.ownerId,
        createdAt: m.team.createdAt,
        myRole: m.role,
        chatId: m.team.chat?.chatId || `team:${m.team.id}`,
        memberCount: m.team.members.length,
        members: m.team.members,
      })),
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err?.message || "Failed to load teams" });
  }
});

teamsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const payload = CreateTeamSchema.parse(req.body || {});

    const created = await db.$transaction(async (tx: any) => {
      const team = await tx.team.create({
        data: {
          name: payload.name,
          description: payload.description || null,
          game: payload.game,
          ownerId: userId,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          role: "commander",
        },
      });

      const chatId = `team:${team.id}`;
      await tx.teamChat.create({
        data: {
          teamId: team.id,
          chatId,
        },
      });

      return { team, chatId };
    });

    return res.status(201).json({
      team: {
        ...created.team,
        chatId: created.chatId,
      },
    });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message || "Failed to create team" });
  }
});

teamsRouter.get("/invites/received", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const invites = await db.teamInvite.findMany({
      where: {
        receiverId: userId,
        status: "pending",
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            game: true,
            description: true,
          },
        },
        sender: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ invites });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err?.message || "Failed to load invites" });
  }
});

teamsRouter.post(
  "/invites/:inviteId/respond",
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      const inviteId = String(req.params.inviteId || "");
      const payload = InviteResponseSchema.parse(req.body || {});

      const invite = await db.teamInvite.findUnique({
        where: { id: inviteId },
      });
      if (!invite) return res.status(404).json({ message: "Invite not found" });
      if (invite.receiverId !== userId)
        return res.status(403).json({ message: "Forbidden" });
      if (invite.status !== "pending") {
        return res.status(400).json({ message: "Invite already processed" });
      }

      const updated = await db.$transaction(async (tx: any) => {
        const updatedInvite = await tx.teamInvite.update({
          where: { id: inviteId },
          data: { status: payload.action as TeamInviteStatus },
        });

        if (payload.action === "accepted") {
          await tx.teamMember.upsert({
            where: {
              teamId_userId: {
                teamId: invite.teamId,
                userId,
              },
            },
            create: {
              teamId: invite.teamId,
              userId,
              role: "colonel",
            },
            update: {},
          });
        }

        return updatedInvite;
      });

      return res.json({ invite: updated });
    } catch (err: any) {
      return res
        .status(400)
        .json({ message: err?.message || "Failed to respond to invite" });
    }
  },
);

teamsRouter.get("/:teamId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const teamId = String(req.params.teamId || "");

    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        owner: { select: { id: true, username: true, profileImageUrl: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImageUrl: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        chat: true,
      },
    });

    if (!team) return res.status(404).json({ message: "Team not found" });

    const chatId = await ensureTeamChat(teamId);

    const membership =
      team.members.find((m: any) => m.userId === userId) || null;
    if (!membership)
      return res.status(403).json({ message: "Join team to view details" });

    const memberIds = team.members.map((member: any) => member.userId);

    const [matches, recentLogs, playerGames, latestPosts] = await Promise.all([
      db.match.findMany({
        where: {
          OR: [{ hostId: { in: memberIds } }, { joinerId: { in: memberIds } }],
        },
        include: {
          host: { select: { id: true, username: true } },
          joiner: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      db.playerLog.findMany({
        where: { type: "MATCH_RESULT_SUBMISSION" },
        orderBy: { createdAt: "desc" },
        take: 2000,
      }),
      db.playerGame.findMany({
        where: {
          userId: { in: memberIds },
          game: team.game,
        },
        select: {
          userId: true,
          wins: true,
          losses: true,
        },
      }),
      db.teamPost.findMany({
        where: { teamId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const scoreByMatchId = new Map<string, string>();
    for (const log of recentLogs) {
      const meta = (log.meta || {}) as Record<string, unknown>;
      const matchId = typeof meta.matchId === "string" ? meta.matchId : "";
      const score = typeof meta.score === "string" ? meta.score.trim() : "";
      if (!matchId || !score || scoreByMatchId.has(matchId)) continue;
      scoreByMatchId.set(matchId, score);
    }

    const mappedMatches = matches.map((match: any) => {
      const status = normalizeMatchStatus(match.status);
      const winnerInTeam =
        !!match.reportedWinnerId && memberIds.includes(match.reportedWinnerId);
      const result =
        status === "completed"
          ? winnerInTeam
            ? "win"
            : "loss"
          : status === "cancelled"
            ? "cancelled"
            : "pending";

      const earnings = result === "win" ? Number(match.stake || 0) : 0;
      const opponent = memberIds.includes(match.hostId)
        ? match.joiner?.username || "TBD"
        : match.host?.username || "TBD";

      return {
        id: match.id,
        result,
        score: scoreByMatchId.get(match.id) || null,
        createdAt: match.createdAt,
        earnings,
        status,
        opponent,
        stake: Number(match.stake || 0),
      };
    });

    const gamesByUserId = new Map(
      playerGames.map((row: any) => [row.userId, row]),
    );

    const mappedMembers = team.members.map((member: any) => {
      const memberCompletedMatches = mappedMatches.filter((match: any) => {
        if (match.status !== "completed") return false;
        const original = matches.find((m: any) => m.id === match.id);
        if (!original) return false;
        return (
          original.hostId === member.userId ||
          original.joinerId === member.userId
        );
      });

      const wins = memberCompletedMatches.filter((match: any) => {
        const original = matches.find((m: any) => m.id === match.id);
        return original?.reportedWinnerId === member.userId;
      }).length;

      const losses = memberCompletedMatches.filter((match: any) => {
        const original = matches.find((m: any) => m.id === match.id);
        return (
          !!original?.reportedWinnerId &&
          original.reportedWinnerId !== member.userId
        );
      }).length;

      const earnings = memberCompletedMatches.reduce(
        (sum: number, match: any) => {
          const original = matches.find((m: any) => m.id === match.id);
          return original?.reportedWinnerId === member.userId
            ? sum + Number(original.stake || 0)
            : sum;
        },
        0,
      );

      const gameRow: any = gamesByUserId.get(member.userId);

      return {
        userId: member.userId,
        username: member.user?.username || "Unknown",
        role: member.role,
        roleLabel: normalizeRoleLabel(member.role),
        joinedAt: member.joinedAt,
        profileImageUrl: member.user?.profileImageUrl || null,
        stats: {
          wins,
          losses,
          mmr: null,
          earnings,
          gameWins: gameRow?.wins ?? null,
          gameLosses: gameRow?.losses ?? null,
        },
      };
    });

    return res.json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        game: team.game,
        profileImageUrl: team.profileImageUrl || null,
        createdAt: team.createdAt,
        ownerId: team.ownerId,
        myRole: membership.role,
        canPost: canPost(membership.role),
        canManageTeam: canManageTeam(membership.role),
        chatId,
        members: mappedMembers,
        matches: mappedMatches,
        latestPosts,
      },
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err?.message || "Failed to load team" });
  }
});

teamsRouter.patch("/:teamId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const teamId = String(req.params.teamId || "");
    const payload = UpdateTeamSchema.parse(req.body || {});

    const member = await getMembership(teamId, userId);
    if (!member || !canManageTeam(member.role)) {
      return res.status(403).json({ message: "Only commander can edit team" });
    }

    const team = await db.team.update({
      where: { id: teamId },
      data: {
        name: payload.name,
        description: payload.description,
        game: payload.game,
      },
    });

    return res.json({ team });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message || "Failed to update team" });
  }
});

teamsRouter.post("/:teamId/profile-image/upload", requireAuth, (req, res) => {
  teamProfileUpload.single("file")(req, res, async (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "Team image must be 15MB or smaller" });
      }

      return res
        .status(400)
        .json({ message: err?.message || "Invalid upload" });
    }

    try {
      const userId = req.user!.userId;
      const teamId = String(req.params.teamId || "");
      const member = await getMembership(teamId, userId);

      if (!member || !canManageTeam(member.role)) {
        return res
          .status(403)
          .json({ message: "Only commander can update team photo" });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const key = buildS3Key("teams", teamId, file.mimetype);
      const profileImageUrl = await uploadBufferToS3(
        file.buffer,
        key,
        file.mimetype,
      );

      const team = await db.team.update({
        where: { id: teamId },
        data: { profileImageUrl },
        select: { id: true, profileImageUrl: true },
      });

      return res.json({ team, profileImageUrl: team.profileImageUrl });
    } catch (uploadErr: any) {
      return res
        .status(500)
        .json({ message: uploadErr?.message || "Failed to upload team photo" });
    }
  });
});

teamsRouter.patch("/:teamId/profile-image", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const teamId = String(req.params.teamId || "");
    const { profileImageUrl } = req.body as { profileImageUrl?: string | null };

    if (profileImageUrl !== null && typeof profileImageUrl !== "string") {
      return res
        .status(400)
        .json({ message: "profileImageUrl must be a string or null" });
    }

    const member = await getMembership(teamId, userId);
    if (!member || !canManageTeam(member.role)) {
      return res
        .status(403)
        .json({ message: "Only commander can update team photo" });
    }

    const trimmed =
      typeof profileImageUrl === "string" ? profileImageUrl.trim() : null;
    const finalUrl = trimmed || null;

    const team = await db.team.update({
      where: { id: teamId },
      data: { profileImageUrl: finalUrl },
      select: { id: true, profileImageUrl: true },
    });

    return res.json({ team, profileImageUrl: team.profileImageUrl });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message || "Failed to update team photo" });
  }
});

teamsRouter.delete("/:teamId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const teamId = String(req.params.teamId || "");

    const member = await getMembership(teamId, userId);
    if (!member || !canManageTeam(member.role)) {
      return res
        .status(403)
        .json({ message: "Only commander can delete team" });
    }

    await db.team.delete({ where: { id: teamId } });
    return res.json({ ok: true });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message || "Failed to delete team" });
  }
});

teamsRouter.post("/:teamId/invites", requireAuth, async (req, res) => {
  try {
    const senderId = req.user!.userId;
    const teamId = String(req.params.teamId || "");
    const payload = InviteSchema.parse(req.body || {});

    const receiverInput = String(payload.receiverId || "").trim();
    const receiverUser =
      (await db.user.findUnique({
        where: { id: receiverInput },
        select: { id: true, username: true },
      })) ||
      (await db.user.findFirst({
        where: {
          username: {
            equals: receiverInput,
            mode: "insensitive",
          },
        },
        select: { id: true, username: true },
      }));

    if (!receiverUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (receiverUser.id === senderId) {
      return res.status(400).json({ message: "Cannot invite yourself" });
    }

    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const senderMembership = await getMembership(teamId, senderId);
    if (!senderMembership || !canPost(senderMembership.role)) {
      return res
        .status(403)
        .json({ message: "Only commander or general can invite" });
    }

    const alreadyMember = await getMembership(teamId, receiverUser.id);
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a team member" });
    }

    const invite = await db.teamInvite.upsert({
      where: {
        teamId_receiverId: {
          teamId,
          receiverId: receiverUser.id,
        },
      },
      create: {
        teamId,
        senderId,
        receiverId: receiverUser.id,
        status: "pending",
      },
      update: {
        senderId,
        status: "pending",
      },
    });

    return res.status(201).json({ invite });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message || "Failed to invite member" });
  }
});

teamsRouter.post(
  "/:teamId/members/:userId/role",
  requireAuth,
  async (req, res) => {
    try {
      const actorId = req.user!.userId;
      const teamId = String(req.params.teamId || "");
      const targetUserId = String(req.params.userId || "");
      const payload = UpdateRoleSchema.parse(req.body || {});

      const actor = await getMembership(teamId, actorId);
      if (!actor || !canManageTeam(actor.role)) {
        return res
          .status(403)
          .json({ message: "Only commander can assign roles" });
      }

      const target = await getMembership(teamId, targetUserId);
      if (!target) return res.status(404).json({ message: "Member not found" });

      const team = await db.team.findUnique({ where: { id: teamId } });
      if (!team) return res.status(404).json({ message: "Team not found" });

      if (team.ownerId === targetUserId) {
        return res
          .status(400)
          .json({ message: "Commander role cannot be changed" });
      }

      const updated = await db.teamMember.update({
        where: {
          teamId_userId: {
            teamId,
            userId: targetUserId,
          },
        },
        data: { role: payload.role },
      });

      return res.json({ member: updated });
    } catch (err: any) {
      return res
        .status(400)
        .json({ message: err?.message || "Failed to update role" });
    }
  },
);

teamsRouter.delete(
  "/:teamId/members/:userId",
  requireAuth,
  async (req, res) => {
    try {
      const actorId = req.user!.userId;
      const teamId = String(req.params.teamId || "");
      const targetUserId = String(req.params.userId || "");

      const actor = await getMembership(teamId, actorId);
      if (!actor || !canManageTeam(actor.role)) {
        return res
          .status(403)
          .json({ message: "Only commander can remove members" });
      }

      const team = await db.team.findUnique({ where: { id: teamId } });
      if (!team) return res.status(404).json({ message: "Team not found" });
      if (team.ownerId === targetUserId) {
        return res.status(400).json({ message: "Commander cannot be removed" });
      }

      await db.teamMember.delete({
        where: {
          teamId_userId: {
            teamId,
            userId: targetUserId,
          },
        },
      });

      return res.json({ ok: true });
    } catch (err: any) {
      return res
        .status(400)
        .json({ message: err?.message || "Failed to remove member" });
    }
  },
);

teamsRouter.post("/:teamId/leave", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const teamId = String(req.params.teamId || "");

    const member = await getMembership(teamId, userId);
    if (!member) return res.status(404).json({ message: "Not a team member" });

    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.ownerId === userId) {
      return res.status(400).json({
        message:
          "Commander cannot leave. Delete team or transfer ownership first.",
      });
    }

    await db.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    return res.json({ ok: true });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message || "Failed to leave team" });
  }
});

teamsRouter.get("/:teamId/posts", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const teamId = String(req.params.teamId || "");

    const member = await getMembership(teamId, userId);
    if (!member) return res.status(403).json({ message: "Forbidden" });

    const posts = await db.teamPost.findMany({
      where: { teamId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ posts, canPost: canPost(member.role) });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err?.message || "Failed to load posts" });
  }
});

teamsRouter.post("/:teamId/posts", requireAuth, async (req, res) => {
  try {
    const authorId = req.user!.userId;
    const teamId = String(req.params.teamId || "");
    const payload = CreatePostSchema.parse(req.body || {});

    const member = await getMembership(teamId, authorId);
    if (!member || !canPost(member.role)) {
      return res
        .status(403)
        .json({ message: "Only commander and general can post" });
    }

    const post = await db.teamPost.create({
      data: {
        teamId,
        authorId,
        title: payload.title,
        content: payload.content,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return res.status(201).json({ post });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message || "Failed to create post" });
  }
});

teamsRouter.delete("/:teamId/posts/:postId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const teamId = String(req.params.teamId || "");
    const postId = String(req.params.postId || "");

    const member = await getMembership(teamId, userId);
    if (!member || !canPost(member.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const post = await db.teamPost.findUnique({ where: { id: postId } });
    if (!post || post.teamId !== teamId) {
      return res.status(404).json({ message: "Post not found" });
    }

    await db.teamPost.delete({ where: { id: postId } });
    return res.json({ ok: true });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message || "Failed to delete post" });
  }
});
