# WannaBet

![CI/CD Pipeline](https://github.com/danieladekunle123/wannabet/actions/workflows/ci-cd.yml/badge.svg)

WannaBet is a full-stack competitive esports platform where players can create accounts, build profiles, challenge opponents to 1v1 wagered or casual matches, compete in multi-team tournaments, and manage real-money wallets with Stripe-powered deposits and escrow-backed payouts. The platform includes real-time messaging, live presence tracking, AI-assisted dispute resolution, team management, and a moderator/admin dashboard.

---

## Tech Stack

### Frontend

- React 19 + TypeScript (Vite)
- Tailwind CSS + shadcn/ui
- i18n (multi-language support)
- Socket.io client (real-time notifications & presence)
- Stripe Elements (payment UI)
- Vitest (unit/component testing)

### Backend

- Node.js + Express 5
- Prisma ORM + PostgreSQL
- Redis (caching, presence, rate limiting)
- Socket.io (real-time events)
- JWT + Google OAuth authentication
- Stripe (payments, webhooks)
- AWS S3 (file uploads via presigned URLs)
- OpenAI GPT-4o-mini (dispute analysis)
- BullMQ (background job processing)
- Winston (structured logging)
- Swagger / OpenAPI (interactive API docs)
- Zod (request validation)

### Infrastructure

- Docker + Docker Compose
- GitHub Actions CI/CD
- Render (deployment)
- PandaScore API (live esports data)

---

## Features

### Matchmaking & Wagering

- Create 1v1 matches (wager, scrim, or custom)
- Escrow-backed stakes — funds locked on creation, released on result confirmation
- Match lifecycle: OPEN → UPCOMING → ACTIVE → RESULT_REPORTED → COMPLETED
- Featured match display (highest-stake open match)
- Trust score system that tracks player reliability

### Tournaments

- Single elimination, double elimination, and round-robin formats
- Bracket generation with automatic seeding
- Team registration with size validation
- Match-by-match result submission with auto-confirmation
- Live leaderboard for round-robin events

### Wallet & Payments

- Stripe-powered deposits (PaymentIntent flow)
- Wallet balance + escrow tracking
- Withdrawal support
- Full ledger history (deposits, withdrawals, escrow locks, payouts)
- Webhook-based payment confirmation with idempotency

### Teams

- Create and manage teams with role-based membership
- Team chat channels (auto-created)
- Invite system (send, accept, decline)
- Team posts and activity feeds

### Messaging

- Direct messages and team chat
- Media uploads (images, video via S3)
- Message replies, editing, and deletion
- Read receipts (Redis-backed)
- Typing indicators (real-time)
- Conversation list with unread counts

### Disputes & AI Analysis

- Players can dispute match results
- Hybrid scoring model (trust scores, dispute history, win rates, submission timing)
- GPT-4o-mini analysis with structured reasoning and evidence summary
- Moderator resolution with accuracy tracking for AI training
- Background processing via BullMQ

### Real-Time Features

- Socket.io presence system (online/away/DND/offline)
- Live notifications (match joins, event reminders, match requests)
- Notification delivery via BullMQ queue
- Typing indicators in chat
- Redis pub/sub for multi-server sync

### Admin & Moderation

- Platform config management (maintenance mode, registration toggle, wager limits)
- User management with ban system (temporary/permanent)
- Dispute queue with AI-assisted analysis
- Bug report system with screenshot uploads
- Platform stats dashboard

### Monitoring & Security

- Global rate limiting (100 req/15min per IP via Redis)
- Per-route rate limiting (login: 10/min, messages: 30/min, match creation: 10/min)
- Structured logging with Winston (console + file)
- `GET /health` — service health check
- `GET /metrics` — active users, total matches, total users, uptime, memory usage
- `GET /stats` — platform analytics (payouts, escrow, online players)
- Interactive API docs at `/api/docs` (Swagger UI)

### Other

- Google OAuth (sign in / sign up)
- IP-based region detection (IPinfo)
- Live esports data feed (PandaScore API)
- Global search (users, matches, games)
- Leaderboards (wins, earnings, trust score)
- Player profiles with bio, country, level, and profile images
- Onboarding flow
- Friend requests and blocking

---

## Database Models

User, Profile, PlayerGame, Wallet, LedgerEntry, Escrow, Match, Tournament, TournamentEntry, TournamentTeam, TournamentMatch, TournamentMatchSubmission, Team, TeamMember, TeamPost, TeamInvite, TeamChat, Message, Dispute, DisputeAnalysis, DisputeTrainingData, PlatformConfig, Ban, PlayerLog, Friend, FriendRequest, BlockedUser, Conversation, BugReport

---

## Project Structure

```
├── .github/workflows/    # CI/CD pipeline (GitHub Actions)
├── backend/
│   ├── prisma/            # Schema, migrations, seed scripts
│   ├── src/
│   │   ├── jobs/          # BullMQ workers (disputes, notifications)
│   │   ├── lib/           # Logger, Prisma client, Socket.io, Swagger, trust score
│   │   ├── middleware/     # Auth, request logging, rate limiting
│   │   ├── routes/        # All API route handlers
│   │   └── services/      # Redis, Stripe, S3, IPinfo, PandaScore
│   └── tests/             # Unit + integration tests
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Auth, presence contexts
│   │   ├── i18n/          # Translations
│   │   ├── services/      # API service clients
│   │   └── __tests__/     # Frontend tests
│   └── public/            # Static assets
├── e2e/                   # Playwright end-to-end tests
├── docs/                  # Manual test cases & UAT plans
└── docker-compose.yml
```

---

## Running Locally

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/wannabet
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000

IPINFO_TOKEN=your_ipinfo_token
PANDASCORE_TOKEN=your_pandascore_token

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_placeholder

AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=wannabet-uploads
CDN_URL=https://your-distribution.cloudfront.net
```

### 3. Database setup

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Start the app

```bash
# Backend (http://localhost:4000)
cd backend && npm run dev

# Frontend (http://localhost:5173)
cd frontend && npm run dev
```

### 5. Run tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests (requires running app)
cd e2e && npx playwright test
```

---

## Docker

```bash
docker-compose up --build
```

---

## API Documentation

Interactive Swagger UI available at:

```
GET /api/docs       # Browser UI
GET /api/docs.json  # Raw OpenAPI spec
```

---

## Monitoring

```
GET /health   → { status: "ok" }
GET /metrics  → { activeUsers, totalUsers, totalMatches, uptime, memoryMB }
GET /stats    → { totalAccounts, completedMatches, activeMatches, onlinePlayers, ... }
```

---

## File Uploads & CDN

Files are stored in **AWS S3** (`wannabet-uploads` bucket, `eu-north-1`) and delivered via **CloudFront CDN**.

- **Uploads** go directly to S3 via presigned URLs or server-side `PutObjectCommand` — CloudFront is not involved in writes
- **Downloads/delivery** go through CloudFront, which acts as an edge cache in front of the S3 bucket
- CloudFront caches files at 400+ edge locations worldwide, so users load media from the nearest server instead of a single S3 region
- This reduces latency, lowers S3 transfer costs, and offloads bandwidth from the origin bucket

Upload folders: `profiles/`, `messages/`, `disputes/`, `bug-reports/`, `teams/`

Set `CDN_URL` in your environment to enable CloudFront delivery. Without it, URLs fall back to direct S3 links.
