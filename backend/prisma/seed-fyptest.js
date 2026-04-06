/**
 * Seed 20 fyptest accounts into the database with realistic
 * win/loss records and earnings to populate the leaderboards.
 *
 * Run with:
 *   cd backend
 *   node prisma/seed-fyptest.js
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const COUNTRIES = ["US", "GB", "DE", "FR", "CA", "AU", "JP", "BR", "KR", "SE"];
const GAMES = [
  "Valorant",
  "CS2",
  "League of Legends",
  "Fortnite",
  "Rocket League",
];

async function main() {
  console.log("🌱 Seeding 20 fyptest accounts...\n");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // ── Create 20 users ───────────────────────────────────────────────────────
  const createdUsers = [];

  for (let i = 1; i <= 20; i++) {
    const username = `fyptest${i}`;
    const email = `fyptest${i}@wannabet.test`;

    // Trust score: fyptest1 = 99.5 … fyptest20 = 63.0
    const trustScore = parseFloat((99.5 - (i - 1) * 1.92).toFixed(1));
    const country = COUNTRIES[(i - 1) % COUNTRIES.length];

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`  ⚠️  ${username} already exists — skipping creation`);
      const wallet = await prisma.wallet.findUnique({
        where: { userId: existing.id },
      });
      if (wallet) createdUsers.push({ id: existing.id, walletId: wallet.id });
      continue;
    }

    // Create user, profile, and wallet in one go
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        hasCompletedOnboarding: true,
      },
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: `FYP Test ${i}`,
        trustScore,
        country,
      },
    });

    const wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        escrow: 0,
      },
    });

    createdUsers.push({ id: user.id, walletId: wallet.id });
    console.log(
      `  ✅ Created ${username} (trust: ${trustScore}, country: ${country})`,
    );
  }

  console.log(`\n👥 ${createdUsers.length} accounts ready.\n`);

  // ── Create matches and payouts ─────────────────────────────────────────────
  // User i gets (20 - i) wins so fyptest1 = 20 wins, fyptest20 = 1 win.
  // Each pair: winner = createdUsers[i], loser = createdUsers[(i+1) % 20].
  // 1-in-3 matches are wager matches (stake = 500 cents) → payout entries.

  let matchCount = 0;
  let payoutCount = 0;

  for (let i = 0; i < createdUsers.length; i++) {
    const winner = createdUsers[i];
    const targetWins = 20 - i; // 20 down to 1
    const loser = createdUsers[(i + 1) % createdUsers.length];

    for (let w = 0; w < targetWins; w++) {
      const isWager = w % 3 === 0;
      const stake = isWager ? 500 : 0;
      const game = GAMES[(w + i) % GAMES.length];

      const match = await prisma.match.create({
        data: {
          game,
          stake,
          status: "COMPLETED",
          hostId: winner.id,
          joinerId: loser.id,
          reportedWinnerId: winner.id,
          reportedById: winner.id,
        },
      });
      matchCount++;

      // Add payout ledger entry for wager matches
      if (isWager) {
        await prisma.ledgerEntry.create({
          data: {
            walletId: winner.walletId,
            type: "payout",
            amount: stake * 2, // winner collects both sides
            matchId: match.id,
          },
        });
        payoutCount++;
      }
    }

    const username = `fyptest${i + 1}`;
    console.log(
      `  🏆 ${username}: ${targetWins} wins, ${Math.ceil(targetWins / 3)} payouts`,
    );
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Matches created : ${matchCount}`);
  console.log(`   Payouts created : ${payoutCount}`);
  console.log(`\n✅ Done! Login: fyptest1–fyptest20 / Password123!\n`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
