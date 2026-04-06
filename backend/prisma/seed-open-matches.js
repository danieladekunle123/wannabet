// seed-open-matches.js
// Seeds 20 open scrims and 25 open wager matches between fyptest accounts.
// These will appear on the Lobbies page as joinable open matches.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const GAMES = [
  "Valorant",
  "CS2",
  "Rocket League",
  "League of Legends",
  "Fortnite",
  "Apex Legends",
  "Call of Duty: Warzone",
  "Overwatch 2",
  "Rainbow Six Siege",
  "Dota 2",
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDate(start, end) {
  const s = start.getTime();
  const e = end.getTime();
  return new Date(s + Math.random() * (e - s));
}

const START = new Date("2026-04-01");
const END = new Date("2026-04-06");

async function main() {
  console.log("🌱 Seeding open lobbies (scrims + wagers)…\n");

  const users = await prisma.user.findMany({
    where: { username: { startsWith: "fyptest" } },
    orderBy: { username: "asc" },
  });

  if (users.length === 0) {
    console.error("No fyptest users found. Run seed-fyptest.js first.");
    process.exit(1);
  }

  // ── 20 open scrims ──────────────────────────────────────────────
  let scrims = 0;
  for (let i = 0; i < 20; i++) {
    const host = users[i % users.length];
    const game = GAMES[i % GAMES.length];
    await prisma.match.create({
      data: {
        game,
        stake: 0,
        status: "OPEN",
        hostId: host.id,
        createdAt: randDate(START, END),
      },
    });
    scrims++;
  }
  console.log(`  ✅ ${scrims} open scrims created (stake = $0)`);

  // ── 25 open wager matches ────────────────────────────────────────
  let wagers = 0;
  for (let i = 0; i < 25; i++) {
    const host = users[(i + 3) % users.length]; // offset to vary hosts
    const game = GAMES[(i + 4) % GAMES.length];
    const stake = randInt(2, 30) * 100; // $2–$30 in cents
    await prisma.match.create({
      data: {
        game,
        stake,
        status: "OPEN",
        hostId: host.id,
        createdAt: randDate(START, END),
      },
    });
    wagers++;
  }
  console.log(`  ✅ ${wagers} open wager matches created (stake = $2–$30)`);

  console.log("\n🎉 Done! These matches are now visible on the Lobbies page.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
