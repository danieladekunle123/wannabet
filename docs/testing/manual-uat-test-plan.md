# WannaBet — Manual & UAT Test Plan

> **Version:** 1.0  
> **Platform:** WannaBet Peer-to-Peer Esports Wagering Platform  
> **Environment:** Staging / Production  
> **Prerequisite:** Valid user account, browser with DevTools

---

## 1. Authentication & Onboarding

### TC-AUTH-01: Email Registration

| Step | Action                                                      | Expected Result                                              |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | Navigate to signup page                                     | Signup form displays                                         |
| 2    | Enter valid email, username (3+ chars), password (8+ chars) | Fields accept input                                          |
| 3    | Click "Sign Up"                                             | Account created, JWT token returned, redirected to dashboard |
| 4    | Repeat with same email                                      | 409 error, "email already in use"                            |
| 5    | Repeat with same username (different case)                  | 409 error, "username taken"                                  |

### TC-AUTH-02: Email Login

| Step | Action                                    | Expected Result                  |
| ---- | ----------------------------------------- | -------------------------------- |
| 1    | Navigate to login page                    | Login form displays              |
| 2    | Enter registered email + correct password | Token returned, dashboard loads  |
| 3    | Enter wrong password                      | 401 error, "Invalid credentials" |
| 4    | Enter non-existent email                  | 401 error                        |

### TC-AUTH-03: Google OAuth Login

| Step | Action                               | Expected Result                                 |
| ---- | ------------------------------------ | ----------------------------------------------- |
| 1    | Click "Sign in with Google"          | Google OAuth popup appears                      |
| 2    | Select Google account                | Account linked/created, redirected to dashboard |
| 3    | Login again with same Google account | Same user session restored                      |

### TC-AUTH-04: Onboarding Flow

| Step | Action                                        | Expected Result                                      |
| ---- | --------------------------------------------- | ---------------------------------------------------- |
| 1    | Register new account                          | If onboardingComplete=false, onboarding screen shown |
| 2    | Complete profile setup (display name, region) | Profile created                                      |
| 3    | Navigate to main app                          | Onboarding flag set to true                          |

---

## 2. Wallet & Financial Operations

### TC-WALLET-01: View Wallet

| Step | Action                               | Expected Result                                |
| ---- | ------------------------------------ | ---------------------------------------------- |
| 1    | Navigate to wallet page              | Balance, escrow, and recent transactions shown |
| 2    | Verify amounts match expected values | Correct balance/escrow display                 |

### TC-WALLET-02: Deposit Funds (Stripe)

| Step | Action                                | Expected Result                     |
| ---- | ------------------------------------- | ----------------------------------- |
| 1    | Click "Deposit"                       | Stripe checkout form appears        |
| 2    | Enter test card (4242 4242 4242 4242) | Payment processes                   |
| 3    | Return to wallet                      | Balance increased by deposit amount |
| 4    | Check ledger                          | "deposit" entry recorded            |

### TC-WALLET-03: Withdraw Funds

| Step | Action                 | Expected Result                         |
| ---- | ---------------------- | --------------------------------------- |
| 1    | Click "Withdraw"       | Withdrawal form appears                 |
| 2    | Enter amount ≤ balance | Withdrawal processed, balance decreased |
| 3    | Enter amount > balance | Error: "Insufficient balance"           |
| 4    | Check ledger           | "withdrawal" entry recorded             |

### TC-WALLET-04: Currency Display

| Step | Action                                      | Expected Result                     |
| ---- | ------------------------------------------- | ----------------------------------- |
| 1    | Change currency from settings (EUR/USD/GBP) | All monetary values update          |
| 2    | Verify conversion rates apply correctly     | Amounts reflect real exchange rates |

---

## 3. Match Lifecycle (Wagers & Scrims)

### TC-MATCH-01: Create Wager Match

| Step | Action                                                   | Expected Result                                            |
| ---- | -------------------------------------------------------- | ---------------------------------------------------------- |
| 1    | Navigate to "Create Match"                               | Match creation form appears                                |
| 2    | Select game, set stake (e.g., 1000), set type to "wager" | Fields populated                                           |
| 3    | Click "Create"                                           | Match created with UPCOMING status, stake locked in escrow |
| 4    | Verify wallet: balance decreased, escrow increased       | Escrow = stake amount                                      |

### TC-MATCH-02: Join Match

| Step | Action                              | Expected Result                                        |
| ---- | ----------------------------------- | ------------------------------------------------------ |
| 1    | As second user, find the open match | Match visible in listings                              |
| 2    | Click "Join"                        | Match status changes to ACTIVE, joiner's escrow locked |
| 3    | Host tries to join own match        | Error: cannot join own match                           |
| 4    | Third user tries to join            | Error: match already full                              |

### TC-MATCH-03: Report Result

| Step | Action                          | Expected Result                |
| ---- | ------------------------------- | ------------------------------ |
| 1    | As host, click "Report Result"  | Report form appears            |
| 2    | Select winner, submit           | Match status → RESULT_REPORTED |
| 3    | Non-participant tries to report | 403 error                      |
| 4    | Report on non-ACTIVE match      | 400 error                      |

### TC-MATCH-04: Confirm & Payout

| Step | Action                                       | Expected Result   |
| ---- | -------------------------------------------- | ----------------- |
| 1    | As opposing player, confirm result           | Match → COMPLETED |
| 2    | Winner's wallet: balance += 2× stake         | Correct payout    |
| 3    | Loser's wallet: escrow released (0 returned) | Escrow emptied    |
| 4    | Reporter cannot confirm own report           | 400 error         |

### TC-MATCH-05: Cancel Match

| Step | Action                          | Expected Result                    |
| ---- | ------------------------------- | ---------------------------------- |
| 1    | Host cancels unjoined match     | Escrow refunded, match → CANCELLED |
| 2    | Host tries to cancel after join | Error: match already joined        |
| 3    | Non-host tries to cancel        | 403 error                          |

### TC-MATCH-06: Create Scrim (Zero-Stake)

| Step | Action                                | Expected Result                 |
| ---- | ------------------------------------- | ------------------------------- |
| 1    | Create match with stake=0, type=scrim | Match created, no escrow locked |
| 2    | Join and complete normally            | No financial transactions occur |

---

## 4. Dispute Resolution

### TC-DISPUTE-01: File a Dispute

| Step | Action                                                  | Expected Result      |
| ---- | ------------------------------------------------------- | -------------------- |
| 1    | After result reported, opposing player clicks "Dispute" | Dispute form appears |
| 2    | Enter reason and description                            | Dispute filed        |
| 3    | Match status → DISPUTED                                 | Status updated       |

### TC-DISPUTE-02: Upload Evidence

| Step | Action                                      | Expected Result         |
| ---- | ------------------------------------------- | ----------------------- |
| 1    | In dispute view, click "Upload Evidence"    | File picker appears     |
| 2    | Upload screenshot/video (JPEG/PNG/WebP/MP4) | File uploaded to S3     |
| 3    | Upload disallowed type (.exe)               | Error: type not allowed |
| 4    | Upload >5MB image                           | Error: file too large   |

### TC-DISPUTE-03: Moderator Resolution

| Step | Action                            | Expected Result                        |
| ---- | --------------------------------- | -------------------------------------- |
| 1    | As moderator, view disputes list  | All open disputes shown                |
| 2    | Click on dispute, review evidence | Dispute details and evidence displayed |
| 3    | Select winner, click "Resolve"    | Dispute resolved, match → COMPLETED    |
| 4    | Winning player receives payout    | Wallet updated                         |
| 5    | Both players' trust scores update | Winner +2, loser -8                    |

### TC-DISPUTE-04: AI Confidence Score

| Step | Action                                                        | Expected Result           |
| ---- | ------------------------------------------------------------- | ------------------------- |
| 1    | View dispute confidence score                                 | Score displayed (5-99%)   |
| 2    | Verify factors: trust diff, dispute history, speed, agreement | Weights applied correctly |

---

## 5. Trust Score System

### TC-TRUST-01: Trust Score Updates

| Step | Action                                 | Expected Result  |
| ---- | -------------------------------------- | ---------------- |
| 1    | New user starts at trust score 87      | Baseline correct |
| 2    | Submit correct result → +1.5           | Score increases  |
| 3    | Submit wrong result → -5               | Score decreases  |
| 4    | Win dispute → +2                       | Score increases  |
| 5    | Lose dispute → -8                      | Score decreases  |
| 6    | Score never drops below 0 or above 100 | Clamping works   |

### TC-TRUST-02: Trust Tiers

| Step | Action                               | Expected Result |
| ---- | ------------------------------------ | --------------- |
| 1    | Score ≥ 90: "Highly Trusted" (green) | Correct tier    |
| 2    | Score 75-89: "Trusted" (blue)        | Correct tier    |
| 3    | Score 50-74: "Neutral" (yellow)      | Correct tier    |
| 4    | Score 25-49: "Risky" (orange)        | Correct tier    |
| 5    | Score < 25: "Untrusted" (red)        | Correct tier    |

---

## 6. Tournament System

### TC-TOURN-01: Create Tournament

| Step | Action                                        | Expected Result                         |
| ---- | --------------------------------------------- | --------------------------------------- |
| 1    | Click "Create Tournament"                     | Tournament form appears                 |
| 2    | Enter name, game, entry fee, max participants | Fields validated                        |
| 3    | Submit                                        | Tournament created, visible in listings |

### TC-TOURN-02: Join Tournament

| Step | Action                          | Expected Result          |
| ---- | ------------------------------- | ------------------------ |
| 1    | Find tournament in list         | Tournament details shown |
| 2    | Click "Join", provide team name | Entry recorded           |
| 3    | Entry fee deducted from wallet  | Balance decreased        |

### TC-TOURN-03: Tournament Bracket

| Step | Action                      | Expected Result               |
| ---- | --------------------------- | ----------------------------- |
| 1    | View tournament bracket     | Bracket visualization renders |
| 2    | Verify matchups are correct | Seeding applied properly      |
| 3    | Submit match results        | Bracket advances              |

---

## 7. Messaging & Chat

### TC-MSG-01: Direct Message

| Step | Action                              | Expected Result                 |
| ---- | ----------------------------------- | ------------------------------- |
| 1    | Open conversation with another user | Chat window appears             |
| 2    | Type and send message               | Message appears in conversation |
| 3    | Recipient sees message in real-time | Socket.io delivers message      |

### TC-MSG-02: Message Features

| Step | Action                | Expected Result                           |
| ---- | --------------------- | ----------------------------------------- |
| 1    | Reply to a message    | Reply thread displayed                    |
| 2    | Edit a sent message   | Message updated, "edited" indicator shown |
| 3    | Delete a sent message | Message removed                           |
| 4    | Send image in chat    | Image uploaded and displayed              |

### TC-MSG-03: Conversations List

| Step | Action                  | Expected Result                       |
| ---- | ----------------------- | ------------------------------------- |
| 1    | View conversations list | All conversations with previews shown |
| 2    | Unread count displayed  | Badge shows correct count             |

---

## 8. Teams & Social

### TC-TEAM-01: Create Team

| Step | Action                            | Expected Result            |
| ---- | --------------------------------- | -------------------------- |
| 1    | Navigate to Teams, click "Create" | Team creation form appears |
| 2    | Enter name, tag, description      | Team created               |
| 3    | Creator is assigned OWNER role    | Role correct               |

### TC-TEAM-02: Invite & Accept

| Step | Action                              | Expected Result           |
| ---- | ----------------------------------- | ------------------------- |
| 1    | Invite user to team                 | Invitation sent           |
| 2    | Recipient views pending invitations | Invite visible            |
| 3    | Accept invitation                   | User joins team as MEMBER |
| 4    | Accept already-processed invite     | Error: already processed  |

### TC-TEAM-03: Team Management

| Step | Action                    | Expected Result                |
| ---- | ------------------------- | ------------------------------ |
| 1    | Owner updates member role | Role changed                   |
| 2    | Owner removes member      | Member removed from team       |
| 3    | Member leaves team        | Self-removal succeeds          |
| 4    | Owner blocks user         | User cannot interact with team |

---

## 9. Admin & Moderation

### TC-ADMIN-01: Ban User

| Step | Action                                | Expected Result     |
| ---- | ------------------------------------- | ------------------- |
| 1    | As admin, navigate to user management | User list displayed |
| 2    | Click "Ban" on a user, enter reason   | Ban created         |
| 3    | Banned user tries to access platform  | 403: "banned"       |
| 4    | Admin unbans user                     | Access restored     |
| 5    | Player tries to ban                   | 403 error           |

### TC-ADMIN-02: System Health

| Step | Action                         | Expected Result            |
| ---- | ------------------------------ | -------------------------- |
| 1    | View admin dashboard           | Health metrics displayed   |
| 2    | DB latency, Redis status shown | Services monitored         |
| 3    | Revenue statistics displayed   | Financial overview correct |

### TC-ADMIN-03: Bug Reports

| Step | Action                      | Expected Result                     |
| ---- | --------------------------- | ----------------------------------- |
| 1    | User submits bug report     | Report filed with title/description |
| 2    | Admin views bug reports     | All reports listed                  |
| 3    | Admin updates report status | Status changed                      |

---

## 10. Leaderboard & Search

### TC-LEAD-01: Leaderboards

| Step | Action                                  | Expected Result       |
| ---- | --------------------------------------- | --------------------- |
| 1    | View wins leaderboard                   | Ranked list displayed |
| 2    | Filter by type (wager/scrim/tournament) | Filtered results      |
| 3    | View earnings leaderboard               | Earnings ranked       |
| 4    | View trust leaderboard                  | Trust scores ranked   |

### TC-SEARCH-01: Global Search

| Step | Action                   | Expected Result                    |
| ---- | ------------------------ | ---------------------------------- |
| 1    | Enter search query       | Results with users, matches, games |
| 2    | Empty query              | Empty results returned             |
| 3    | Search specific username | User found in results              |

---

## 11. Notifications & Realtime

### TC-NOTIF-01: Real-time Notifications

| Step | Action               | Expected Result                  |
| ---- | -------------------- | -------------------------------- |
| 1    | Receive match invite | Notification appears in dropdown |
| 2    | Click notification   | Navigate to relevant page        |
| 3    | Mark as read         | Unread count decreases           |

### TC-NOTIF-02: Presence System

| Step | Action              | Expected Result                 |
| ---- | ------------------- | ------------------------------- |
| 1    | User A is online    | Green indicator shown to User B |
| 2    | User A goes offline | Indicator updates               |

---

## 12. File Uploads

### TC-UPLOAD-01: Profile Image

| Step | Action                                   | Expected Result               |
| ---- | ---------------------------------------- | ----------------------------- |
| 1    | Navigate to profile settings             | Upload area visible           |
| 2    | Select valid image (JPEG/PNG/WebP, <5MB) | Image uploaded, preview shown |
| 3    | Select invalid type                      | Error displayed               |
| 4    | Select oversized file                    | Error: too large              |

---

## 13. Cross-Browser & Responsive Testing

### TC-COMPAT-01: Browser Compatibility

| Browser | Version | Status | Notes |
| ------- | ------- | ------ | ----- |
| Chrome  | Latest  | ☐      |       |
| Firefox | Latest  | ☐      |       |
| Safari  | Latest  | ☐      |       |
| Edge    | Latest  | ☐      |       |

### TC-COMPAT-02: Responsive Design

| Viewport | Resolution | Status | Notes |
| -------- | ---------- | ------ | ----- |
| Mobile   | 375×667    | ☐      |       |
| Tablet   | 768×1024   | ☐      |       |
| Desktop  | 1920×1080  | ☐      |       |

---

## 14. Security Testing Checklist

| Check                                  | Status | Notes                        |
| -------------------------------------- | ------ | ---------------------------- |
| JWT expires correctly                  | ☐      |                              |
| Expired tokens rejected (401)          | ☐      |                              |
| RBAC enforced (player vs mod vs admin) | ☐      |                              |
| Banned users blocked (403)             | ☐      |                              |
| SQL injection via search               | ☐      | Prisma parameterized queries |
| XSS in messages/team posts             | ☐      | React auto-escapes           |
| CSRF protection                        | ☐      | JWT-based, no cookies        |
| Rate limiting active                   | ☐      | Redis-backed                 |
| File upload restrictions enforced      | ☐      | Type + size limits           |
| No sensitive data in JWT payload       | ☐      | Only userId                  |

---

## UAT Sign-Off

| Feature         | Tester | Date | Pass/Fail | Comments |
| --------------- | ------ | ---- | --------- | -------- |
| Auth/Onboarding |        |      |           |          |
| Wallet/Ledger   |        |      |           |          |
| Matches/Wagers  |        |      |           |          |
| Disputes        |        |      |           |          |
| Trust Score     |        |      |           |          |
| Tournaments     |        |      |           |          |
| Messaging       |        |      |           |          |
| Teams           |        |      |           |          |
| Admin           |        |      |           |          |
| Leaderboards    |        |      |           |          |
| Notifications   |        |      |           |          |
| File Uploads    |        |      |           |          |
