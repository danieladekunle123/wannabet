/**
 * Seed some upcoming tournaments in April–May 2026 and enrol fyptest users.
 *
 * Run with:
 *   cd backend
 *   node prisma/seed-tournaments-april-may.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const TOURNAMENT_DEFS = [
  {
    name: "Valorant Spring Cup",
    game: "Valorant",
    description:
      "1v1 Valorant tournament — glory and bragging rights on the line.",
    entryFee: 500,
    maxParticipants: 16,
    startAt: new Date("2026-04-22T18:00:00Z"),
    status: "upcoming",
    enrollCount: 10,
  },
  {
    name: "CS2 Weekend League",
    game: "CS2",
    description: "Head-to-head CS2 matches. Top seed takes the pot.",
    entryFee: 1000,
    maxParticipants: 8,
    startAt: new Date("2026-05-03T14:00:00Z"),
    status: "upcoming",
    enrollCount: 6,
  },
  {
    name: "Rocket League Showdown",
    game: "Rocket League",
    description: "Who has the most mechanical skill? Find out here.",
    entryFee: 0,
    maxParticipants: 16,
    startAt: new Date("2026-05-17T16:00:00Z"),
    status: "upcoming",
    enrollCount: 8,
  },
  {
    name: "LoL Solo Queue Invitational",
    game: "League of Legends",
    description: "8-player single elimination. May the best carry win.",
    entryFee: 750,
    maxParticipants: 8,
    startAt: new Date("2026-05-24T15:00:00Z"),
    status: "upcoming",
    enrollCount: 5,
  },
  {
    name: "Fortnite April Frenzy",
    game: "Fortnite",
    description: "Build, shoot, win. Classic Fortnite bracket.",
    entryFee: 300,
    maxParticipants: 16,
    startAt: new Date("2026-04-27T20:00:00Z"),
    status: "active",
    enrollCount: 12,
  },
];

async function main() {
  console.log("🌱 Seeding April–May 2026 tournaments…\n");

  // Fetch fyptest users
  const users = await prisma.user.findMany({
    where: { username: { startsWith: "fyptest" } },
    include: { wallet: true },
    orderBy: { username: "asc" },
  });

  if (users.length === 0) {
    console.error("❌ No fyptest accounts found. Run seed-fyptest.js first.");
    process.exit(1);
  }

  // Use fyptest1 as the host for all seeded tournaments
  const host = users[0];

  let totalEntries = 0;

  for (const def of TOURNAMENT_DEFS) {
    // Check if tournament with this name already exists
    const existing = await prisma.tournament.findFirst({
      where: { name: def.name },
    });
    if (existing) {
      console.log(`  ⚠️  "${def.name}" already exists — skipping`);
      continue;
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: def.name,
        game: def.game,
        description: def.description,
        entryFee: def.entryFee,
        maxParticipants: def.maxParticipants,
        startAt: def.startAt,
        status: def.status,
        format: "single_elimination",
        teamSize: 1,
        hostId: host.id,
      },
    });

    // Enrol a random subset of fyptest users (excluding the host)
    const candidates = shuffle(users.filter((u) => u.id !== host.id));
    const toEnrol = candidates.slice(
      0,
      Math.min(def.enrollCount, candidates.length),
    );

    // Always enrol the host too
    const allEnrol = [host, ...toEnrol];

    for (const user of allEnrol) {
      await prisma.tournamentEntry.create({
        data: {
          tournamentId: tournament.id,
          userId: user.id,
          paid: def.entryFee === 0,
        },
      });
      totalEntries++;

      // Deduct entry fee from wallet for paid tournaments (to simulate real participation)
      if (
        def.entryFee > 0 &&
        user.wallet &&
        user.wallet.balance >= def.entryFee
      ) {
        await prisma.wallet.update({
          where: { id: user.wallet.id },
          data: { escrow: { increment: def.entryFee } },
        });
        await prisma.ledgerEntry.create({
          data: {
            walletId: user.wallet.id,
            type: "escrow_lock",
            amount: def.entryFee,
            tournamentId: tournament.id,
          },
        });
      }
    }

    console.log(
      `  ✅ "${def.name}" (${def.game}) — ${allEnrol.length} participants enrolled, starts ${def.startAt.toDateString()}`,
    );
  }

  console.log(`\n📋 Total tournament entries created: ${totalEntries}`);
  console.log("\n🎉 Done!\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
