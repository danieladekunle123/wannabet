import jwt from "jsonwebtoken";
import { prisma } from "../../src/lib/prisma";

const SECRET =
  process.env.JWT_SECRET || "some_super_long_random_string_at_least_16_chars";

let counter = 0;
function uid() {
  return `t${++counter}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Factories ────────────────────────────────────────────────────────────────

export function userFactory(overrides: Record<string, any> = {}) {
  const id = uid();
  return {
    email: `test_${id}@example.com`,
    passwordHash:
      "$2a$10$testtesttesttesttesttesttesttesttesttesttesttesttesttesttestte",
    username: `user_${id}`,
    ...overrides,
  };
}

/** Generate a valid JWT for a test user */
export function generateTestToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: "1h" });
}

/** Create a full user with wallet, profile, and auth token — ready for integration tests */
export async function createTestUser(
  overrides: Record<string, any> = {},
  walletBalance = 10000,
) {
  const data = userFactory(overrides);
  const user = await prisma.user.create({
    data: {
      ...data,
      wallet: { create: { balance: walletBalance, escrow: 0 } },
      profile: {
        create: {
          displayName: data.username,
          bio: "",
          level: 1,
          trustScore: 87,
        } as any,
      },
    },
    include: { wallet: true, profile: true },
  });
  const token = generateTestToken(user.id);
  return { user, token };
}

/** Create a moderator user with wallet */
export async function createModUser(walletBalance = 0) {
  return createTestUser({ role: "MODERATOR" }, walletBalance);
}

/** Create an admin user with wallet */
export async function createAdminUser(walletBalance = 0) {
  return createTestUser({ role: "ADMIN" }, walletBalance);
}

// ─── Cleanup helpers ──────────────────────────────────────────────────────────

/** Delete a user and all related records in FK-safe order */
export async function cleanupUser(userId: string) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    await (prisma as any).disputeTrainingData.deleteMany({
      where: { dispute: { disputantId: userId } },
    });
    await (prisma as any).disputeAnalysis.deleteMany({
      where: { dispute: { disputantId: userId } },
    });
    await (prisma as any).dispute.deleteMany({
      where: { disputantId: userId },
    });

    await prisma.escrow.deleteMany({ where: { userId } });
    if (wallet) {
      await prisma.ledgerEntry.deleteMany({ where: { walletId: wallet.id } });
    }
    await prisma.playerLog.deleteMany({ where: { userId } });
    await prisma.match.deleteMany({
      where: { OR: [{ hostId: userId }, { joinerId: userId }] },
    });

    await (prisma as any).teamPost.deleteMany({
      where: { authorId: userId },
    });
    await (prisma as any).teamInvite.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });
    await (prisma as any).teamMember.deleteMany({ where: { userId } });
    await (prisma as any).tournamentEntry.deleteMany({ where: { userId } });

    await (prisma as any).friendRequest.deleteMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    });
    await (prisma as any).friend.deleteMany({
      where: { OR: [{ userId }, { friendId: userId }] },
    });
    await (prisma as any).blockedUser.deleteMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    });
    await prisma.message.deleteMany({ where: { senderId: userId } });

    await prisma.profile.deleteMany({ where: { userId } });
    if (wallet) {
      await prisma.wallet.deleteMany({ where: { userId } });
    }
    await prisma.user.deleteMany({ where: { id: userId } });
  } catch (err) {
    console.error(`[cleanupUser] failed for ${userId}:`, err);
  }
}

/** Delete a match and related escrow/ledger rows */
export async function cleanupMatch(matchId: string) {
  try {
    await (prisma as any).disputeTrainingData.deleteMany({
      where: { dispute: { matchId } },
    });
    await (prisma as any).disputeAnalysis.deleteMany({
      where: { dispute: { matchId } },
    });
    await (prisma as any).dispute.deleteMany({ where: { matchId } });
    await prisma.escrow.deleteMany({ where: { matchId } });
    await prisma.ledgerEntry.deleteMany({ where: { matchId } });
    await prisma.playerLog.deleteMany({
      where: { meta: { path: ["matchId"], equals: matchId } },
    });
    await prisma.match.deleteMany({ where: { id: matchId } });
  } catch (err) {
    console.error(`[cleanupMatch] failed for ${matchId}:`, err);
  }
}
