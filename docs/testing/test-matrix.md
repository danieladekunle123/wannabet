# WannaBet Test Matrix

> **Last updated:** Auto-generated from test suite audit

## Coverage Summary

| Layer             | Files | Tests | Status  |
| ----------------- | :---: | :---: | :-----: |
| Unit Tests        |   5   |  48+  | ✅ Done |
| Integration Tests |  15+  | 120+  | ✅ Done |
| Frontend Tests    |  10   |  25+  | ✅ Done |
| E2E Tests         |  10   |  25+  | ✅ Done |

## Feature × Layer Matrix

| Feature/Module         | Unit Tests | Integration Tests | Frontend Tests | E2E Tests | Priority |
| ---------------------- | :--------: | :---------------: | :------------: | :-------: | :------: |
| Auth/Onboarding        |     ✅     |      ✅ (18)      |    ✅ Login    |  ✅ (4)   | Critical |
| Wallet/Ledger          |  ✅ (17)   |      ✅ (11)      |   ✅ Wallet    |  ✅ (2)   | Critical |
| Escrow                 |  ✅ (17)   |      ✅ (11)      |       —        |     —     | Critical |
| Matches/Lobbies        |     —      |      ✅ (21)      | ✅ CreateMatch |  ✅ (3)   | Critical |
| Result Reporting       |     —      |      ✅ (2)       |       —        |     —     | Critical |
| Disputes/Moderation    |  ✅ (13)   |      ✅ (10)      |       —        |  ✅ (2)   | Critical |
| Trust Score Engine     |  ✅ (16)   |         —         |       —        |     —     | Critical |
| Tournaments            |     —      |      ✅ (6)       | ✅ Tournaments |  ✅ (3)   |   High   |
| Events System          |     —      |      ✅ (22)      |       —        |     —     |   High   |
| Messaging/Chat         |     —      |      ✅ (15)      |  ✅ Messages   |  ✅ (2)   |   High   |
| Teams/Friends/Blocking |     —      |      ✅ (18)      |       —        |     —     |   High   |
| Notifications/Realtime |     —      |      ✅ (3)       | ✅ Notif Drop  |  ✅ (2)   |   High   |
| File Uploads/S3        |     —      |      ✅ (3)       | ✅ Upload Svc  |  ✅ (2)   |   High   |
| Redis/Cache/RateLimit  |     —      |      ✅ (1)       |       —        |     —     |   High   |
| Stripe/Webhooks        |     —      |      ✅ (3)       |       —        |     —     | Critical |
| Leaderboards/Search    |     —      |      ✅ (13)      |       —        |     —     |  Medium  |
| Admin/Config/BugReport |     —      |      ✅ (8)       |    ✅ Admin    |  ✅ (2)   |  Medium  |

## Test File Inventory

### Backend Unit Tests (`backend/tests/unit/`)

| File                           | Tests | Category                                                 |
| ------------------------------ | :---: | -------------------------------------------------------- |
| `trustScore.unit.test.ts`      |  16   | Trust tier logic, score updates, clamping, dedup         |
| `wallet-math.unit.test.ts`     |  17   | Escrow lock/release, withdraw, payout, ledger invariants |
| `dispute-scoring.unit.test.ts` |  13   | Confidence scoring formula, feature weighting, clamping  |
| `ledger.unit.test.ts`          |   2   | Basic ledger math                                        |
| `example.unit.test.ts`         |   1   | Sanity check                                             |

### Backend Integration Tests (`backend/tests/integration/`)

| File                                 | Tests | Category                                                            |
| ------------------------------------ | :---: | ------------------------------------------------------------------- |
| `auth.integration.test.ts`           |  18   | Register, login, JWT validation, RBAC, ban enforcement              |
| `match.integration.test.ts`          |  21   | Create, join, report, confirm+payout, cancel, read                  |
| `events.integration.test.ts`         |  22   | Listings, match requests, lifecycle, join/cancel, results, disputes |
| `team.integration.test.ts`           |  18   | CRUD, invites, members, posts, leave/remove, block                  |
| `messages.integration.test.ts`       |  15   | Send, fetch, reply, edit/delete, conversations, DM open             |
| `dispute.integration.test.ts`        |  10   | List, stats, access control, resolution flow                        |
| `wallet.integration.test.ts`         |  11   | Summary, escrow lock/release, withdrawal, ledger                    |
| `leaderboard.integration.test.ts`    |   9   | Wins (all/wager/scrim/tournament), earnings, trust, currentUser     |
| `admin.integration.test.ts`          |   6   | Admin/mod/player ban, banned access, dispute resolution             |
| `tournament.integration.test.ts`     |   6   | CRUD + join                                                         |
| `search.integration.test.ts`         |   4   | Query, empty, username, games                                       |
| `bugreport.integration.test.ts`      |   3   | Submit, no-auth, missing title                                      |
| `uploads.integration.test.ts`        |   3   | Presigned URL, no-auth, invalid type                                |
| `stripe.integration.test.ts`         |   3   | Invalid amount, no-auth, webhook                                    |
| `notifications.integration.test.ts`  |   3   | Auth requirement, tournament list, user events                      |
| `redis.integration.test.ts`          |   1   | Rate limiting enforcement                                           |
| `platformconfig.integration.test.ts` |   1   | Config retrieval                                                    |
| `result.integration.test.ts`         |   2   | Submit result, duplicate prevention                                 |
| `payout.integration.test.ts`         |   2   | Escrow release, over-release prevention                             |

### Frontend Component Tests (`frontend/src/__tests__/`)

| File                            | Tests | Component                                              |
| ------------------------------- | :---: | ------------------------------------------------------ |
| `Login.test.tsx`                |   4   | Login form rendering and input                         |
| `AdminPanel.test.tsx`           |   2   | Admin panel mounting                                   |
| `Wallet.test.tsx`               |   2   | WalletEscrow component                                 |
| `Messages.test.tsx`             |   3   | Messages component with props                          |
| `NotificationDropdown.test.tsx` |   3   | NotificationsDropdown rendering                        |
| `TournamentCard.test.tsx`       |   3   | Tournaments listing                                    |
| `DisputeForm.test.tsx`          |   3   | Signup form (renamed from missing DisputeForm)         |
| `MatchCard.test.tsx`            |   3   | CreateMatch component (renamed from missing MatchCard) |
| `Upload.test.tsx`               |   3   | Upload service unit tests                              |
| `example.test.tsx`              |   1   | Sanity check                                           |

### E2E Tests (`e2e/`)

| File                        | Tests | Scope                                                |
| --------------------------- | :---: | ---------------------------------------------------- |
| `auth.e2e.spec.ts`          |   4   | Landing page, form fields, health API, invalid login |
| `match.e2e.spec.ts`         |   3   | Match creation API, featured, events                 |
| `wallet.e2e.spec.ts`        |   2   | Wallet API auth, unauthenticated access              |
| `dispute.e2e.spec.ts`       |   2   | Role enforcement for dispute list/stats              |
| `tournament.e2e.spec.ts`    |   3   | Public listing, auth requirement                     |
| `messages.e2e.spec.ts`      |   2   | Auth requirement on conversations/send               |
| `admin.e2e.spec.ts`         |   2   | Ban role enforcement, public config                  |
| `notifications.e2e.spec.ts` |   2   | Auth requirement on events/recommended               |
| `upload.e2e.spec.ts`        |   2   | Auth requirement on upload endpoints                 |
| `example.e2e.spec.ts`       |   1   | Title check                                          |

## Running Tests

```bash
# Backend unit + integration tests
cd backend && npx jest --runInBand --forceExit

# Frontend component tests
cd frontend && npx vitest run

# E2E tests (requires running servers)
cd e2e && npx playwright test

# Coverage report
cd backend && npx jest --coverage --runInBand --forceExit
```
