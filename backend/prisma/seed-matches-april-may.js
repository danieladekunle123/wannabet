/**
 * Seed 75 matches (mid-April → end-May 2026) between fyptest accounts,
 * and enrol test users into any existing upcoming/active tournaments.
 *
 * Run with:
 *   cd backend
 *   node prisma/seed-matches-april-may.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const GAMES = [
  "Valorant",
  "CS2",
  "League of Legends",
  "Fortnite",
  "Rocket League",
];

// Random integer in [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random Date between two Dates
function randDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

// Shuffle array in-place (Fisher-Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  console.log("🌱 Seeding April–May 2026 matches + tournament entries…\n");

  // ── Fetch all fyptest users ──────────────────────────────────────────────
  const users = await prisma.user.findMany({
    where: { username: { startsWith: "fyptest" } },
    include: { wallet: true },
    orderBy: { username: "asc" },
  });

  if (users.length === 0) {
    console.error("❌ No fyptest accounts found. Run seed-fyptest.js first.");
    process.exit(1);
  }

  console.log(`👥 Found ${users.length} fyptest accounts.\n`);

  const startDate = new Date("2026-04-15T00:00:00Z");
  const endDate = new Date("2026-05-31T23:59:59Z");

  // ── Create 75 matches ────────────────────────────────────────────────────
  const TARGET_MATCHES = 75;
  let matchCount = 0;
  let payoutCount = 0;
  let updateCount = 0;

  // Build a shuffled list of unique [hostIdx, joinerIdx] pairings and cycle through
  const pairs = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j) pairs.push([i, j]);
    }
  }
  shuffle(pairs);

  for (let m = 0; m < TARGET_MATCHES; m++) {
    const [hIdx, jIdx] = pairs[m % pairs.length];
    const host = users[hIdx];
    const joiner = users[jIdx];

    const game = GAMES[m % GAMES.length];
    const isWager = m % 3 !== 0; // 2-in-3 are wager matches
    const stake = isWager ? randInt(2, 20) * 100 : 0; // $2–$20 in cents
    const createdAt = randDate(startDate, endDate);

    // Randomly decide winner (host wins ~55% of the time)
    const hostWins = Math.random() < 0.55;
    const winnerId = hostWins ? host.id : joiner.id;
    const loserId = hostWins ? joiner.id : host.id;

    const match = await prisma.match.create({
      data: {
        game,
        stake,
        status: "COMPLETED",
        hostId: host.id,
        joinerId: joiner.id,
        reportedWinnerId: winnerId,
        reportedById: winnerId,
        createdAt,
      },
    });
    matchCount++;

    // ── Ledger + PlayerGame updates for wager matches ──────────────────────
    if (isWager) {
      const winnerWallet = users.find((u) => u.id === winnerId)?.wallet;
      const loserWallet = users.find((u) => u.id === loserId)?.wallet;

      if (winnerWallet) {
        await prisma.ledgerEntry.create({
          data: {
            walletId: winnerWallet.id,
            type: "payout",
            amount: stake * 2,
            matchId: match.id,
            createdAt,
          },
        });
        await prisma.wallet.update({
          where: { id: winnerWallet.id },
          data: { balance: { increment: stake * 2 } },
        });
        payoutCount++;
      }

      if (loserWallet) {
        await prisma.ledgerEntry.create({
          data: {
            walletId: loserWallet.id,
            type: "payout",
            amount: -stake,
            matchId: match.id,
            createdAt,
          },
        });
        await prisma.wallet.update({
          where: { id: loserWallet.id },
          data: { balance: { decrement: stake } },
        });
      }
    }

    // ── Increment PlayerGame win/loss counts ───────────────────────────────
    for (const [userId, isWin] of [
      [winnerId, true],
      [loserId, false],
    ]) {
      const existing = await prisma.playerGame.findFirst({
        where: { userId, game },
      });
      if (existing) {
        await prisma.playerGame.update({
          where: { id: existing.id },
          data: isWin
            ? { wins: { increment: 1 } }
            : { losses: { increment: 1 } },
        });
      } else {
        await prisma.playerGame.create({
          data: {
            userId,
            game,
            wins: isWin ? 1 : 0,
            losses: isWin ? 0 : 1,
          },
        });
      }
      updateCount++;
    }
  }

  console.log(
    `  ✅ Created ${matchCount} matches (${payoutCount} payouts, ${updateCount} game stat updates)\n`,
  );

  // ── Enrol test users into existing tournaments ───────────────────────────
  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ["upcoming", "open", "active"] } },
    include: {
      participants: true,
      _count: { select: { participants: true } },
    },
  });

  if (tournaments.length === 0) {
    console.log(
      "ℹ️  No open/upcoming tournaments found — skipping tournament enrolment.",
    );
  } else {
    console.log(
      `🏆 Found ${tournaments.length} open tournament(s). Enrolling test users…\n`,
    );
    let entryCount = 0;

    for (const tournament of tournaments) {
      const spotsLeft =
        tournament.maxParticipants - tournament._count.participants;
      if (spotsLeft <= 0) {
        console.log(`  ⏭  ${tournament.name} — full, skipping`);
        continue;
      }

      const alreadyEnrolled = new Set(
        tournament.participants.map((p) => p.userId),
      );
      const eligible = shuffle(users.filter((u) => !alreadyEnrolled.has(u.id)));
      const toEnrol = eligible.slice(
        0,
        Math.min(spotsLeft, eligible.length, randInt(3, 8)),
      );

      for (const user of toEnrol) {
        await prisma.tournamentEntry.create({
          data: {
            tournamentId: tournament.id,
            userId: user.id,
            paid: tournament.entryFee === 0,
            joinedAt: randDate(startDate, endDate),
          },
        });
        entryCount++;
      }

      console.log(
        `  ✅ ${tournament.name} — enrolled ${toEnrol.length} test user(s)`,
      );
    }

    console.log(`\n  📋 Total tournament entries created: ${entryCount}`);
  }

  console.log("\n🎉 Done!\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
