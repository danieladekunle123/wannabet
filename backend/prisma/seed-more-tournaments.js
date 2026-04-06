// seed-more-tournaments.js
// Seeds 10 additional tournaments with fyptest user enrolments.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TOURNAMENTS = [
  {
    name: "Overwatch 2 Season Showdown",
    game: "Overwatch 2",
    entryFee: 400,
    maxParticipants: 16,
    format: "single_elimination",
    status: "upcoming",
    startAt: new Date("2026-04-15T18:00:00Z"),
    enrol: 9,
  },
  {
    name: "Dota 2 Battle Cup Spring",
    game: "Dota 2",
    entryFee: 600,
    maxParticipants: 8,
    format: "single_elimination",
    status: "upcoming",
    startAt: new Date("2026-04-20T15:00:00Z"),
    enrol: 7,
  },
  {
    name: "Apex Legends Squad Cup",
    game: "Apex Legends",
    entryFee: 0,
    maxParticipants: 20,
    format: "round_robin",
    status: "upcoming",
    startAt: new Date("2026-05-05T17:00:00Z"),
    enrol: 12,
  },
  {
    name: "FIFA 26 Weekend League",
    game: "EA FC 26",
    entryFee: 200,
    maxParticipants: 16,
    format: "round_robin",
    status: "upcoming",
    startAt: new Date("2026-04-25T14:00:00Z"),
    enrol: 11,
  },
  {
    name: "Rainbow Six Siege Pro Series",
    game: "Rainbow Six Siege",
    entryFee: 800,
    maxParticipants: 8,
    format: "single_elimination",
    status: "upcoming",
    startAt: new Date("2026-05-22T19:00:00Z"),
    enrol: 6,
  },
  {
    name: "Tekken 8 Challenger Series",
    game: "Tekken 8",
    entryFee: 500,
    maxParticipants: 16,
    format: "single_elimination",
    status: "active",
    startAt: new Date("2026-05-12T16:00:00Z"),
    enrol: 10,
  },
  {
    name: "Street Fighter 6 Ranked Cup",
    game: "Street Fighter 6",
    entryFee: 300,
    maxParticipants: 8,
    format: "single_elimination",
    status: "upcoming",
    startAt: new Date("2026-06-05T18:00:00Z"),
    enrol: 7,
  },
  {
    name: "Warzone Trios Invitational",
    game: "Call of Duty: Warzone",
    entryFee: 0,
    maxParticipants: 24,
    format: "round_robin",
    status: "upcoming",
    startAt: new Date("2026-06-15T20:00:00Z"),
    enrol: 14,
  },
  {
    name: "Mortal Kombat 1 Online Tournament",
    game: "Mortal Kombat 1",
    entryFee: 250,
    maxParticipants: 16,
    format: "double_elimination",
    status: "upcoming",
    startAt: new Date("2026-05-30T17:00:00Z"),
    enrol: 8,
  },
  {
    name: "Minecraft Build Wars Championship",
    game: "Minecraft",
    entryFee: 0,
    maxParticipants: 32,
    format: "round_robin",
    status: "upcoming",
    startAt: new Date("2026-06-20T15:00:00Z"),
    enrol: 16,
  },
];

async function main() {
  console.log("🌱 Seeding 10 more tournaments…\n");

  const users = await prisma.user.findMany({
    where: { username: { startsWith: "fyptest" } },
    include: { wallet: true },
    orderBy: { username: "asc" },
  });

  if (users.length === 0) {
    console.error("No fyptest users found. Run seed-fyptest.js first.");
    process.exit(1);
  }

  const host = users[0]; // fyptest1 hosts all

  let totalEntries = 0;

  for (const t of TOURNAMENTS) {
    // Skip if already exists
    const existing = await prisma.tournament.findFirst({
      where: { name: t.name },
    });
    if (existing) {
      console.log(`  ⏭  "${t.name}" already exists — skipping`);
      continue;
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: t.name,
        description: `Competitive ${t.game} tournament hosted by WannaBet.`,
        game: t.game,
        entryFee: t.entryFee,
        maxParticipants: t.maxParticipants,
        format: t.format,
        status: t.status,
        startAt: t.startAt,
        hostId: host.id,
      },
    });

    // Determine how many users to enrol (capped at users.length and t.maxParticipants)
    const cap = Math.min(t.enrol, users.length, t.maxParticipants);

    // Always enrol the host first
    const enrollCandidates = [
      host,
      ...users.filter((u) => u.id !== host.id),
    ].slice(0, cap);

    let enrolled = 0;
    for (const u of enrollCandidates) {
      try {
        await prisma.tournamentEntry.create({
          data: {
            tournamentId: tournament.id,
            userId: u.id,
            paid: t.entryFee > 0,
            joinedAt: new Date(),
          },
        });

        if (t.entryFee > 0 && u.wallet) {
          // Deduct entry fee from wallet (escrow)
          await prisma.wallet.update({
            where: { id: u.wallet.id },
            data: { escrow: { increment: t.entryFee } },
          });
          await prisma.ledgerEntry.create({
            data: {
              walletId: u.wallet.id,
              type: "escrow_lock",
              amount: -t.entryFee,
              tournamentId: tournament.id,
            },
          });
        }

        enrolled++;
        totalEntries++;
      } catch (err) {
        if (!err.message?.includes("Unique constraint")) throw err;
      }
    }

    console.log(
      `  ✅ "${t.name}" (${t.game}) — ${enrolled} participants enrolled, starts ${t.startAt.toDateString()}`,
    );
  }

  console.log(`\n📋 Total new tournament entries created: ${totalEntries}`);
  console.log("\n🎉 Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
