import swaggerJsdoc from "swagger-jsdoc";

const idParam = (name = "id") => ({
  name,
  in: "path" as const,
  required: true,
  schema: { type: "string" as const, format: "uuid" },
});

const auth = [{ BearerAuth: [] }];
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const err = (desc: string) => ({
  description: desc,
  content: { "application/json": { schema: ref("Error") } },
});
const json = (schema: any) => ({
  content: { "application/json": { schema } },
});

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "WannaBet API",
      version: "2.0.0",
      description:
        "WannaBet esports wagering platform — matches, tournaments, wallets, teams, messaging, disputes, and more.",
    },
    servers: [
      { url: "http://localhost:4000", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: { message: { type: "string" } },
        },
        Token: {
          type: "object",
          properties: { token: { type: "string" } },
        },
        Match: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            game: { type: "string" },
            stake: { type: "number" },
            status: {
              type: "string",
              enum: ["OPEN", "UPCOMING", "ACTIVE", "RESULT_REPORTED", "COMPLETED", "CANCELLED"],
            },
            matchType: { type: "string", enum: ["scrim", "wager", "custom"] },
            hostId: { type: "string", format: "uuid" },
            joinerId: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Wallet: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            balance: { type: "integer", description: "Balance in cents" },
            escrow: { type: "integer", description: "Locked escrow in cents" },
          },
        },
        LedgerEntry: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            walletId: { type: "string", format: "uuid" },
            type: {
              type: "string",
              enum: ["deposit", "withdrawal", "escrow_lock", "escrow_refund", "payout"],
            },
            amount: { type: "integer" },
            matchId: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Tournament: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            game: { type: "string" },
            format: {
              type: "string",
              enum: ["single_elimination", "double_elimination", "round_robin"],
            },
            status: {
              type: "string",
              enum: ["draft", "open", "ongoing", "completed", "cancelled"],
            },
            maxParticipants: { type: "integer" },
            hostId: { type: "string", format: "uuid" },
            startAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            displayName: { type: "string", nullable: true },
            role: { type: "string", enum: ["user", "moderator", "admin"] },
            profileImageUrl: { type: "string", nullable: true },
            onboardingComplete: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Profile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            bio: { type: "string", nullable: true },
            country: { type: "string", nullable: true },
            region: { type: "string", nullable: true },
            level: { type: "integer" },
            trustScore: { type: "number" },
          },
        },
        Team: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            game: { type: "string" },
            profileImageUrl: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            conversationId: { type: "string", format: "uuid" },
            senderId: { type: "string", format: "uuid" },
            content: { type: "string" },
            messageType: { type: "string", enum: ["text", "image", "video"] },
            mediaUrl: { type: "string", nullable: true },
            replyToId: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Dispute: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            matchId: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["pending", "resolved"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Registration, login, and Google OAuth" },
      { name: "Users", description: "User profiles, friends, blocking, admin, and moderation" },
      { name: "Matches", description: "1v1 wager/scrim match management" },
      { name: "Tournaments", description: "Tournament brackets, teams, and results" },
      { name: "Wallet", description: "Deposits, withdrawals, and escrow" },
      { name: "Stripe", description: "Stripe payment intents and webhooks" },
      { name: "Disputes", description: "Match dispute management and AI analysis" },
      { name: "Events", description: "Unified event system (matches, tournaments, scrims)" },
      { name: "Leaderboard", description: "Player rankings by wins, earnings, and trust" },
      { name: "Messages", description: "Direct messages, team chat, and conversations" },
      { name: "Teams", description: "Team management, invites, and posts" },
      { name: "Search", description: "Global search for users, matches, and games" },
      { name: "Uploads", description: "S3 presigned URL generation for file uploads" },
      { name: "Region", description: "IP-based region detection and country data" },
      { name: "Esports", description: "Live esports data from PandaScore" },
      { name: "System", description: "Health checks, metrics, and platform stats" },
    ],
    paths: {
      // ── Auth ──────────────────────────────────────────────────────
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new account",
          requestBody: {
            required: true,
            ...json({
              type: "object",
              required: ["email", "username", "password"],
              properties: {
                email: { type: "string", format: "email" },
                username: { type: "string", minLength: 3, maxLength: 24 },
                password: { type: "string", minLength: 8, maxLength: 72 },
              },
            }),
          },
          responses: {
            "201": { description: "Account created", ...json(ref("Token")) },
            "400": err("Validation error"),
            "403": err("Registrations disabled"),
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with email and password",
          description: "Rate-limited to 10 attempts per IP per minute.",
          requestBody: {
            required: true,
            ...json({
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string" },
              },
            }),
          },
          responses: {
            "200": { description: "Login successful", ...json(ref("Token")) },
            "400": err("Invalid credentials"),
            "429": err("Too many login attempts"),
          },
        },
      },
      "/auth/google": {
        post: {
          tags: ["Auth"],
          summary: "Google OAuth authentication",
          requestBody: {
            required: true,
            ...json({
              type: "object",
              required: ["code"],
              properties: {
                code: { type: "string" },
                redirectUri: { type: "string" },
                mode: { type: "string", enum: ["signin", "signup"] },
              },
            }),
          },
          responses: {
            "200": { description: "Auth successful", ...json(ref("Token")) },
            "400": err("Missing code or Google auth failed"),
            "404": err("No account found (signin mode)"),
            "409": err("Account already exists (signup mode)"),
          },
        },
      },

      // ── Users ─────────────────────────────────────────────────────
      "/users/me": {
        get: {
          tags: ["Users"], summary: "Get current user profile", security: auth,
          responses: { "200": { description: "Current user with profile", ...json(ref("User")) } },
        },
        patch: {
          tags: ["Users"], summary: "Update username/displayName/profileImage", security: auth,
          requestBody: { ...json({ type: "object", properties: { username: { type: "string" }, displayName: { type: "string" }, profileImageUrl: { type: "string" } } }) },
          responses: { "200": { description: "Updated user", ...json(ref("User")) } },
        },
        delete: {
          tags: ["Users"], summary: "Permanently delete account", security: auth,
          responses: { "200": { description: "Account deleted" } },
        },
      },
      "/users/me/onboarding": {
        patch: {
          tags: ["Users"], summary: "Mark onboarding complete", security: auth,
          responses: { "200": { description: "Onboarding marked complete" } },
        },
      },
      "/users/me/profile-image/upload": {
        post: {
          tags: ["Users"], summary: "Upload profile image (multipart)", security: auth,
          requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
          responses: { "200": { description: "Image uploaded", ...json({ type: "object", properties: { user: ref("User"), profileImageUrl: { type: "string" } } }) } },
        },
      },
      "/users/me/profile-image": {
        patch: {
          tags: ["Users"], summary: "Set or clear profile image URL", security: auth,
          requestBody: { ...json({ type: "object", properties: { profileImageUrl: { type: "string", nullable: true } } }) },
          responses: { "200": { description: "Image URL updated" } },
        },
      },
      "/users/me/profile": {
        patch: {
          tags: ["Users"], summary: "Update profile (bio/country/region)", security: auth,
          requestBody: { ...json({ type: "object", properties: { bio: { type: "string" }, country: { type: "string" }, region: { type: "string" } } }) },
          responses: { "200": { description: "Profile updated", ...json(ref("Profile")) } },
        },
      },
      "/users/me/friends": {
        get: {
          tags: ["Users"], summary: "List current user's friends", security: auth,
          responses: { "200": { description: "Friends list", ...json({ type: "array", items: ref("User") }) } },
        },
      },
      "/users/me/blocked": {
        get: {
          tags: ["Users"], summary: "List blocked users", security: auth,
          responses: { "200": { description: "Blocked users list" } },
        },
      },
      "/users/me/friend-requests/incoming": {
        get: {
          tags: ["Users"], summary: "Get incoming friend requests", security: auth,
          responses: { "200": { description: "Incoming requests" } },
        },
      },
      "/users/me/friend-requests/outgoing": {
        get: {
          tags: ["Users"], summary: "Get outgoing friend requests", security: auth,
          responses: { "200": { description: "Outgoing requests" } },
        },
      },
      "/users/me/friend-requests/{id}": {
        patch: {
          tags: ["Users"], summary: "Accept or decline a friend request", security: auth,
          parameters: [idParam()],
          requestBody: { ...json({ type: "object", required: ["action"], properties: { action: { type: "string", enum: ["accept", "decline"] } } }) },
          responses: { "200": { description: "Request updated" } },
        },
      },
      "/users/me/games": {
        get: {
          tags: ["Users"], summary: "List current user's games", security: auth,
          responses: { "200": { description: "Player games" } },
        },
        post: {
          tags: ["Users"], summary: "Add or upsert a game", security: auth,
          requestBody: { ...json({ type: "object", required: ["game"], properties: { game: { type: "string" }, rank: { type: "string" }, ign: { type: "string" } } }) },
          responses: { "201": { description: "Game added" } },
        },
      },
      "/users/me/games/{id}": {
        put: {
          tags: ["Users"], summary: "Update a game entry", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Game updated" } },
        },
        delete: {
          tags: ["Users"], summary: "Delete a game entry", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Game deleted" } },
        },
      },
      "/users/me/stats-timeseries": {
        get: {
          tags: ["Users"], summary: "Bucketed win/loss/earnings stats", security: auth,
          parameters: [{ name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d", "1y", "all"] } }],
          responses: { "200": { description: "Time-series stats data" } },
        },
      },
      "/users/me/deactivate": {
        post: {
          tags: ["Users"], summary: "Deactivate own account", security: auth,
          responses: { "200": { description: "Account deactivated" } },
        },
      },
      "/users/config": {
        get: {
          tags: ["Users"], summary: "Get public platform config",
          responses: { "200": { description: "Platform config (siteName, maintenanceMode, etc.)" } },
        },
      },
      "/users/presence": {
        get: {
          tags: ["Users"], summary: "Batch presence/online status",
          parameters: [{ name: "userIds", in: "query", schema: { type: "string" }, description: "Comma-separated user IDs" }],
          responses: { "200": { description: "Presence map" } },
        },
      },
      "/users/by-username/{username}": {
        get: {
          tags: ["Users"], summary: "Lookup user by username",
          parameters: [{ name: "username", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "User profile" }, "404": err("User not found") },
        },
      },
      "/users/{id}": {
        get: {
          tags: ["Users"], summary: "Get user profile by ID",
          parameters: [idParam()],
          responses: { "200": { description: "User profile", ...json(ref("User")) }, "404": err("User not found") },
        },
      },
      "/users/{id}/status": {
        get: {
          tags: ["Users"], summary: "Get single user online status",
          parameters: [idParam()],
          responses: { "200": { description: "Online status and last seen" } },
        },
      },
      "/users/{id}/friendship-status": {
        get: {
          tags: ["Users"], summary: "Check friendship status with user", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Friendship status (friends, pending, none)" } },
        },
      },
      "/users/{id}/friends": {
        post: {
          tags: ["Users"], summary: "Add friend (legacy)", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Friend added" } },
        },
        delete: {
          tags: ["Users"], summary: "Remove friend", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Friend removed" } },
        },
      },
      "/users/{id}/friend-requests": {
        post: {
          tags: ["Users"], summary: "Send friend request", security: auth,
          parameters: [idParam()],
          responses: { "201": { description: "Request sent" }, "400": err("Already friends or request exists") },
        },
        delete: {
          tags: ["Users"], summary: "Retract friend request", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Request retracted" } },
        },
      },
      "/users/{id}/block": {
        post: {
          tags: ["Users"], summary: "Block a user", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "User blocked" } },
        },
        delete: {
          tags: ["Users"], summary: "Unblock a user", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "User unblocked" } },
        },
      },

      // ── Users: Admin ──────────────────────────────────────────────
      "/users": {
        get: {
          tags: ["Users"], summary: "Admin: list all users (paginated)", security: auth,
          parameters: [
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Paginated user list" } },
        },
      },
      "/users/admin/config": {
        get: {
          tags: ["Users"], summary: "Admin: read full platform config", security: auth,
          responses: { "200": { description: "Full config object" } },
        },
        patch: {
          tags: ["Users"], summary: "Admin: update platform config", security: auth,
          requestBody: { ...json({ type: "object", properties: { maintenanceMode: { type: "boolean" }, registrationEnabled: { type: "boolean" }, maxWagerAmount: { type: "number" }, minWagerAmount: { type: "number" } } }) },
          responses: { "200": { description: "Config updated" } },
        },
      },
      "/users/admin/health": {
        get: {
          tags: ["Users"], summary: "Admin: health/status endpoint", security: auth,
          responses: { "200": { description: "System health data" } },
        },
      },
      "/users/admin/revenue": {
        get: {
          tags: ["Users"], summary: "Admin: revenue overview", security: auth,
          responses: { "200": { description: "Revenue stats" } },
        },
      },
      "/users/admin/db-backup": {
        get: {
          tags: ["Users"], summary: "Admin: stream pg_dump database backup", security: auth,
          responses: { "200": { description: "SQL backup stream" } },
        },
      },
      "/users/admin/db-optimize": {
        post: {
          tags: ["Users"], summary: "Admin: run VACUUM ANALYZE", security: auth,
          responses: { "200": { description: "Optimization complete" } },
        },
      },
      "/users/admin/activity-log": {
        get: {
          tags: ["Users"], summary: "Admin: recent ban/warn activity log", security: auth,
          responses: { "200": { description: "Activity log entries" } },
        },
      },
      "/users/admin/bug-reports": {
        get: {
          tags: ["Users"], summary: "Admin: list all bug reports", security: auth,
          responses: { "200": { description: "Bug reports list" } },
        },
      },
      "/users/admin/bug-reports/{id}": {
        patch: {
          tags: ["Users"], summary: "Admin: update bug report status", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Bug report updated" } },
        },
      },
      "/users/bug-reports": {
        post: {
          tags: ["Users"], summary: "Submit a bug report (multipart)", security: auth,
          requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, file: { type: "string", format: "binary" } } } } } },
          responses: { "201": { description: "Bug report submitted" } },
        },
      },
      "/users/bug-reports/mine": {
        get: {
          tags: ["Users"], summary: "Get my bug reports", security: auth,
          responses: { "200": { description: "User's bug reports" } },
        },
      },

      // ── Users: Moderation ─────────────────────────────────────────
      "/users/stats": {
        get: {
          tags: ["Users"], summary: "Moderator: platform stats", security: auth,
          responses: { "200": { description: "Platform statistics" } },
        },
      },
      "/users/moderation/activity": {
        get: {
          tags: ["Users"], summary: "Moderator: 7-day activity chart data", security: auth,
          responses: { "200": { description: "Daily activity data" } },
        },
      },
      "/users/moderation/players": {
        get: {
          tags: ["Users"], summary: "Moderator: player list", security: auth,
          responses: { "200": { description: "Player list for moderation" } },
        },
      },
      "/users/moderation/players/{id}": {
        get: {
          tags: ["Users"], summary: "Moderator: single player detail", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Player detail with history" } },
        },
      },
      "/users/{id}/logs": {
        get: {
          tags: ["Users"], summary: "Moderator: player action logs", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Player logs" } },
        },
      },
      "/users/{id}/role": {
        patch: {
          tags: ["Users"], summary: "Admin: change user role", security: auth,
          parameters: [idParam()],
          requestBody: { ...json({ type: "object", required: ["role"], properties: { role: { type: "string", enum: ["user", "moderator", "admin"] } } }) },
          responses: { "200": { description: "Role updated" } },
        },
      },
      "/users/{id}/warn": {
        post: {
          tags: ["Users"], summary: "Moderator: warn a user", security: auth,
          parameters: [idParam()],
          requestBody: { ...json({ type: "object", required: ["reason"], properties: { reason: { type: "string" } } }) },
          responses: { "200": { description: "User warned" } },
        },
      },
      "/users/{id}/ban": {
        post: {
          tags: ["Users"], summary: "Moderator: ban a user", security: auth,
          parameters: [idParam()],
          requestBody: { ...json({ type: "object", required: ["reason"], properties: { reason: { type: "string" }, duration: { type: "string", description: "e.g. 7d, 30d, permanent" } } }) },
          responses: { "200": { description: "User banned" } },
        },
      },
      "/users/{id}/unban": {
        post: {
          tags: ["Users"], summary: "Moderator: unban a user", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "User unbanned" } },
        },
      },
      "/users/{id}/bans": {
        get: {
          tags: ["Users"], summary: "Moderator: list user's ban history", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Ban history" } },
        },
      },

      // ── Matches ───────────────────────────────────────────────────
      "/matches": {
        post: {
          tags: ["Matches"], summary: "Create a match", security: auth,
          description: "Create a match and lock stake in escrow. Rate-limited to 10/min.",
          requestBody: {
            required: true,
            ...json({
              type: "object",
              required: ["game", "stake"],
              properties: {
                game: { type: "string" }, stake: { type: "number" },
                matchType: { type: "string", enum: ["scrim", "wager", "custom"] },
                title: { type: "string" }, description: { type: "string" },
                participantCount: { type: "integer" }, teamSize: { type: "integer" },
                region: { type: "string" }, startAt: { type: "string", format: "date-time" },
                joinDeadlineAt: { type: "string", format: "date-time" },
                privateMatch: { type: "boolean" },
              },
            }),
          },
          responses: {
            "201": { description: "Match created, escrow locked", ...json({ type: "object", properties: { match: ref("Match"), wallet: ref("Wallet"), ledgerEntry: ref("LedgerEntry") } }) },
            "400": err("Validation error or insufficient balance"),
            "403": err("Trust score too low"), "429": err("Rate limit"),
          },
        },
      },
      "/matches/featured": {
        get: {
          tags: ["Matches"], summary: "Get featured match (highest-stake open)",
          responses: { "200": { description: "Featured match or null", ...json({ type: "object", properties: { match: { allOf: [ref("Match")], nullable: true } } }) } },
        },
      },
      "/matches/mine": {
        get: {
          tags: ["Matches"], summary: "Get my matches", security: auth,
          responses: { "200": { description: "List of matches", ...json({ type: "object", properties: { matches: { type: "array", items: ref("Match") } } }) } },
        },
      },
      "/matches/{id}/join": {
        post: {
          tags: ["Matches"], summary: "Join a match", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Joined", ...json({ type: "object", properties: { match: ref("Match") } }) }, "400": err("Cannot join") },
        },
      },
      "/matches/{id}/report": {
        post: {
          tags: ["Matches"], summary: "Report match result", security: auth,
          parameters: [idParam()],
          requestBody: { required: true, ...json({ type: "object", required: ["winnerId"], properties: { winnerId: { type: "string", format: "uuid" } } }) },
          responses: { "200": { description: "Result reported" }, "400": err("Not active"), "403": err("Not a participant") },
        },
      },
      "/matches/{id}/confirm": {
        post: {
          tags: ["Matches"], summary: "Confirm match result and trigger payout", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Confirmed, payouts issued" }, "400": err("Not in RESULT_REPORTED state") },
        },
      },
      "/matches/{id}": {
        delete: {
          tags: ["Matches"], summary: "Cancel a match (host only)", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Match cancelled, escrow refunded" }, "403": err("Not the host") },
        },
      },

      // ── Tournaments ───────────────────────────────────────────────
      "/tournaments": {
        get: {
          tags: ["Tournaments"], summary: "List tournaments",
          responses: { "200": { description: "Tournament list", ...json({ type: "object", properties: { tournaments: { type: "array", items: ref("Tournament") } } }) } },
        },
        post: {
          tags: ["Tournaments"], summary: "Create a tournament", security: auth,
          requestBody: { required: true, ...json({ type: "object", required: ["name", "game", "maxParticipants"], properties: { name: { type: "string" }, game: { type: "string" }, maxParticipants: { type: "integer" }, format: { type: "string", enum: ["single_elimination", "double_elimination", "round_robin"] }, startAt: { type: "string", format: "date-time" }, description: { type: "string" }, region: { type: "string" }, tournamentFormat: { type: "string" }, joinDeadlineAt: { type: "string", format: "date-time" } } }) },
          responses: { "201": { description: "Tournament created" }, "400": err("Validation error") },
        },
      },
      "/tournaments/{id}": {
        get: {
          tags: ["Tournaments"], summary: "Get tournament details",
          parameters: [idParam()],
          responses: { "200": { description: "Tournament details" }, "404": err("Not found") },
        },
        patch: {
          tags: ["Tournaments"], summary: "Edit tournament", security: auth,
          parameters: [idParam()],
          requestBody: { ...json({ type: "object", properties: { name: { type: "string" }, startAt: { type: "string", format: "date-time", nullable: true } } }) },
          responses: { "200": { description: "Tournament updated" } },
        },
        delete: {
          tags: ["Tournaments"], summary: "Cancel tournament", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Tournament cancelled" } },
        },
      },
      "/tournaments/{id}/bracket": {
        get: {
          tags: ["Tournaments"], summary: "Get tournament bracket and leaderboard",
          parameters: [idParam()],
          responses: { "200": { description: "Bracket with rounds, matches, and leaderboard" } },
        },
      },
      "/tournaments/{id}/teams": {
        post: {
          tags: ["Tournaments"], summary: "Register a team", security: auth,
          parameters: [idParam()],
          requestBody: { required: true, ...json({ type: "object", required: ["teamId"], properties: { teamId: { type: "string", format: "uuid" } } }) },
          responses: { "200": { description: "Team registered" }, "400": err("Tournament full or team invalid") },
        },
      },
      "/tournaments/{id}/teams/{teamId}": {
        delete: {
          tags: ["Tournaments"], summary: "Remove/leave team from tournament", security: auth,
          parameters: [idParam(), idParam("teamId")],
          responses: { "200": { description: "Team removed" } },
        },
      },
      "/tournaments/{id}/start": {
        post: {
          tags: ["Tournaments"], summary: "Start the tournament (host only)", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Tournament started, bracket generated" }, "400": err("Not enough teams") },
        },
      },
      "/tournaments/{id}/join": {
        post: {
          tags: ["Tournaments"], summary: "Join tournament (legacy individual join)", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Joined tournament" } },
        },
      },
      "/tournaments/{id}/leaderboard": {
        get: {
          tags: ["Tournaments"], summary: "Get round-robin leaderboard",
          parameters: [idParam()],
          responses: { "200": { description: "Leaderboard standings" } },
        },
      },
      "/tournaments/{id}/matches/{matchId}/submit": {
        post: {
          tags: ["Tournaments"], summary: "Submit tournament match result", security: auth,
          parameters: [idParam(), idParam("matchId")],
          requestBody: { required: true, ...json({ type: "object", required: ["winnerId"], properties: { winnerId: { type: "string", format: "uuid" } } }) },
          responses: { "200": { description: "Result submitted" } },
        },
      },
      "/tournaments/{id}/matches/{matchId}/start": {
        post: {
          tags: ["Tournaments"], summary: "Start a tournament match", security: auth,
          parameters: [idParam(), idParam("matchId")],
          responses: { "200": { description: "Match started" } },
        },
      },
      "/tournaments/{id}/matches/{matchId}/resolve": {
        post: {
          tags: ["Tournaments"], summary: "Host resolves disputed tournament match", security: auth,
          parameters: [idParam(), idParam("matchId")],
          requestBody: { required: true, ...json({ type: "object", required: ["winnerId"], properties: { winnerId: { type: "string", format: "uuid" } } }) },
          responses: { "200": { description: "Match resolved" } },
        },
      },
      "/tournaments/{id}/matches/{matchId}/forfeit": {
        post: {
          tags: ["Tournaments"], summary: "Forfeit a tournament match", security: auth,
          parameters: [idParam(), idParam("matchId")],
          responses: { "200": { description: "Match forfeited" } },
        },
      },

      // ── Wallet ────────────────────────────────────────────────────
      "/wallet": {
        get: {
          tags: ["Wallet"], summary: "Get wallet balance", security: auth,
          responses: { "200": { description: "Wallet summary", ...json({ type: "object", properties: { wallet: ref("Wallet") } }) }, "404": err("Wallet not found") },
        },
      },
      "/wallet/deposit": {
        post: {
          tags: ["Wallet"], summary: "Create deposit (Stripe PaymentIntent)", security: auth,
          requestBody: { required: true, ...json({ type: "object", required: ["amount"], properties: { amount: { type: "integer", description: "Amount in cents" } } }) },
          responses: { "200": { description: "PaymentIntent created", ...json({ type: "object", properties: { clientSecret: { type: "string" }, id: { type: "string" } } }) }, "400": err("Invalid amount") },
        },
      },
      "/wallet/withdraw": {
        post: {
          tags: ["Wallet"], summary: "Withdraw funds", security: auth,
          requestBody: { required: true, ...json({ type: "object", required: ["amount"], properties: { amount: { type: "integer" } } }) },
          responses: { "201": { description: "Withdrawal processed", ...json({ type: "object", properties: { wallet: ref("Wallet"), ledgerEntry: ref("LedgerEntry") } }) }, "400": err("Insufficient balance") },
        },
      },
      "/wallet/escrow/lock": {
        post: {
          tags: ["Wallet"], summary: "Lock funds in escrow", security: auth,
          requestBody: { required: true, ...json({ type: "object", required: ["amount"], properties: { amount: { type: "integer" }, matchId: { type: "string" }, tournamentId: { type: "string" } } }) },
          responses: { "201": { description: "Escrow locked" }, "400": err("Insufficient balance") },
        },
      },
      "/wallet/escrow/release": {
        post: {
          tags: ["Wallet"], summary: "Release escrow back to balance", security: auth,
          requestBody: { required: true, ...json({ type: "object", required: ["amount"], properties: { amount: { type: "integer" }, matchId: { type: "string" }, tournamentId: { type: "string" } } }) },
          responses: { "201": { description: "Escrow released" } },
        },
      },
      "/wallet/ledger": {
        get: {
          tags: ["Wallet"], summary: "Get ledger history (50 most recent)", security: auth,
          responses: { "200": { description: "Ledger entries", ...json({ type: "object", properties: { entries: { type: "array", items: ref("LedgerEntry") } } }) } },
        },
      },

      // ── Stripe ────────────────────────────────────────────────────
      "/stripe/payment-intent": {
        post: {
          tags: ["Stripe"], summary: "Create Stripe PaymentIntent directly", security: auth,
          requestBody: { required: true, ...json({ type: "object", required: ["amount"], properties: { amount: { type: "integer", description: "Amount in cents" } } }) },
          responses: { "200": { description: "PaymentIntent created", ...json({ type: "object", properties: { clientSecret: { type: "string" } } }) } },
        },
      },
      "/stripe/webhook": {
        post: {
          tags: ["Stripe"], summary: "Stripe webhook handler",
          description: "Receives Stripe events. Verified via webhook signature. Credits wallet on payment_intent.succeeded.",
          responses: { "200": { description: "Webhook processed" }, "400": err("Invalid signature") },
        },
      },
      "/stripe/confirm-payment": {
        post: {
          tags: ["Stripe"], summary: "Backup payment confirmation (dev)", security: auth,
          requestBody: { ...json({ type: "object", required: ["paymentIntentId"], properties: { paymentIntentId: { type: "string" } } }) },
          responses: { "200": { description: "Payment confirmed" } },
        },
      },

      // ── Disputes ──────────────────────────────────────────────────
      "/disputes": {
        get: {
          tags: ["Disputes"], summary: "List disputes (filter by status)", security: auth,
          description: "Moderator/admin only.",
          parameters: [{ name: "status", in: "query", schema: { type: "string", enum: ["pending", "resolved"] } }],
          responses: { "200": { description: "Disputes list", ...json({ type: "array", items: ref("Dispute") }) } },
        },
      },
      "/disputes/analyze": {
        post: {
          tags: ["Disputes"], summary: "Queue AI dispute analysis", security: auth,
          description: "Queues background BullMQ job for hybrid scoring + GPT-4o-mini analysis. Returns 202 with job ID.",
          requestBody: { required: true, ...json({ type: "object", required: ["matchId"], properties: { matchId: { type: "string", format: "uuid" } } }) },
          responses: { "202": { description: "Analysis job queued", ...json({ type: "object", properties: { jobId: { type: "string" } } }) } },
        },
      },
      "/disputes/{id}/resolve": {
        post: {
          tags: ["Disputes"], summary: "Resolve a dispute", security: auth,
          description: "Moderator resolves dispute, updates trust scores, and logs accuracy data.",
          parameters: [idParam()],
          requestBody: { required: true, ...json({ type: "object", required: ["winnerId"], properties: { winnerId: { type: "string", format: "uuid" }, reason: { type: "string" } } }) },
          responses: { "200": { description: "Dispute resolved" } },
        },
      },
      "/disputes/stats": {
        get: {
          tags: ["Disputes"], summary: "AI accuracy statistics", security: auth,
          responses: { "200": { description: "AI dispute analysis accuracy stats" } },
        },
      },

      // ── Events ────────────────────────────────────────────────────
      "/events/my": {
        get: {
          tags: ["Events"], summary: "Get current user's events", security: auth,
          responses: { "200": { description: "User's events (matches, tournaments)" } },
        },
      },
      "/events/tournaments": {
        get: {
          tags: ["Events"], summary: "Public tournament events",
          responses: { "200": { description: "Tournament events list" } },
        },
      },
      "/events/scrims": {
        get: {
          tags: ["Events"], summary: "Public scrim events",
          responses: { "200": { description: "Scrim events list" } },
        },
      },
      "/events/wagers": {
        get: {
          tags: ["Events"], summary: "Public wager events",
          responses: { "200": { description: "Wager events list" } },
        },
      },
      "/events/custom": {
        get: {
          tags: ["Events"], summary: "Public custom events",
          responses: { "200": { description: "Custom events list" } },
        },
      },
      "/events/active": {
        get: {
          tags: ["Events"], summary: "All active events",
          responses: { "200": { description: "Active events list" } },
        },
      },
      "/events/recommended": {
        get: {
          tags: ["Events"], summary: "Personalized event recommendations", security: auth,
          responses: { "200": { description: "Recommended events" } },
        },
      },
      "/events/source/{id}": {
        get: {
          tags: ["Events"], summary: "Get single event by source ID",
          parameters: [idParam()],
          responses: { "200": { description: "Event details" }, "404": err("Event not found") },
        },
      },
      "/events/{sourceType}/{id}": {
        patch: {
          tags: ["Events"], summary: "Edit event (match or tournament)", security: auth,
          parameters: [{ name: "sourceType", in: "path", required: true, schema: { type: "string", enum: ["match", "tournament"] } }, idParam()],
          responses: { "200": { description: "Event updated" } },
        },
      },
      "/events/{sourceType}/{id}/join": {
        post: {
          tags: ["Events"], summary: "Join an event", security: auth,
          parameters: [{ name: "sourceType", in: "path", required: true, schema: { type: "string" } }, idParam()],
          responses: { "200": { description: "Joined event" } },
        },
      },
      "/events/{sourceType}/{id}/start": {
        post: {
          tags: ["Events"], summary: "Start an event", security: auth,
          parameters: [{ name: "sourceType", in: "path", required: true, schema: { type: "string" } }, idParam()],
          responses: { "200": { description: "Event started" } },
        },
      },
      "/events/{id}/start": {
        patch: {
          tags: ["Events"], summary: "Start match (alias)", security: auth,
          parameters: [idParam()],
          responses: { "200": { description: "Match started" } },
        },
      },
      "/events/{id}/submit-result": {
        post: {
          tags: ["Events"], summary: "Submit match result", security: auth,
          parameters: [idParam()],
          requestBody: { required: true, ...json({ type: "object", required: ["winnerId"], properties: { winnerId: { type: "string" }, score: { type: "string" } } }) },
          responses: { "200": { description: "Result submitted" } },
        },
      },
      "/events/{id}/upload-evidence": {
        post: {
          tags: ["Events"], summary: "Upload dispute evidence URL", security: auth,
          parameters: [idParam()],
          requestBody: { required: true, ...json({ type: "object", required: ["evidenceUrl"], properties: { evidenceUrl: { type: "string" } } }) },
          responses: { "200": { description: "Evidence uploaded" } },
        },
      },
      "/events/{id}/upload-evidence-image": {
        post: {
          tags: ["Events"], summary: "Upload evidence screenshot (multipart)", security: auth,
          parameters: [idParam()],
          requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
          responses: { "200": { description: "Image uploaded", ...json({ type: "object", properties: { ok: { type: "boolean" }, url: { type: "string" } } }) } },
        },
      },
      "/events/match/{id}/report": {
        post: {
          tags: ["Events"], summary: "Report match result", security: auth,
          parameters: [idParam()],
          requestBody: { required: true, ...json({ type: "object", required: ["winnerId"], properties: { winnerId: { type: "string" } } }) },
          responses: { "200": { description: "Result reported" } },
        },
      },
      "/events/match/{id}/verify": {
        post: {
          tags: ["Events"], summary: "Verify or dispute reported result", security: auth,
          parameters: [idParam()],
          requestBody: { required: true, ...json({ type: "object", required: ["action"], properties: { action: { type: "string", enum: ["confirm", "dispute"] } } }) },
          responses: { "200": { description: "Result verified or disputed" } },
        },
      },
      "/events/{sourceType}/{id}/complete": {
        post: {
          tags: ["Events"], summary: "Complete an event", security: auth,
          parameters: [{ name: "sourceType", in: "path", required: true, schema: { type: "string" } }, idParam()],
          responses: { "200": { description: "Event completed" } },
        },
      },
      "/events/{sourceType}/{id}/cancel": {
        post: {
          tags: ["Events"], summary: "Cancel an event", security: auth,
          parameters: [{ name: "sourceType", in: "path", required: true, schema: { type: "string" } }, idParam()],
          responses: { "200": { description: "Event cancelled" } },
        },
      },
      "/events/{sourceType}/{id}/leave": {
        post: {
          tags: ["Events"], summary: "Leave an event", security: auth,
          parameters: [{ name: "sourceType", in: "path", required: true, schema: { type: "string" } }, idParam()],
          responses: { "200": { description: "Left event" } },
        },
      },
      "/events/requests/match": {
        post: {
          tags: ["Events"], summary: "Create a match request/challenge", security: auth,
          requestBody: { required: true, ...json({ type: "object", required: ["recipientId", "game"], properties: { recipientId: { type: "string" }, game: { type: "string" }, stake: { type: "number" }, description: { type: "string" }, region: { type: "string" }, scheduledDate: { type: "string" }, scheduledTime: { type: "string" }, message: { type: "string" } } }) },
          responses: { "201": { description: "Match request sent" } },
        },
      },
      "/events/requests/match/incoming": {
        get: {
          tags: ["Events"], summary: "Get incoming match requests", security: auth,
          responses: { "200": { description: "Incoming match requests" } },
        },
      },
      "/events/requests/match/{id}": {
        patch: {
          tags: ["Events"], summary: "Accept or decline match request", security: auth,
          parameters: [idParam()],
          requestBody: { ...json({ type: "object", required: ["action"], properties: { action: { type: "string", enum: ["accept", "decline"] } } }) },
          responses: { "200": { description: "Request updated" } },
        },
      },
      "/events/disputes": {
        get: {
          tags: ["Events"], summary: "Moderator: list match disputes", security: auth,
          responses: { "200": { description: "Disputes list" } },
        },
      },
      "/events/disputes/{matchId}/resolve": {
        post: {
          tags: ["Events"], summary: "Moderator: resolve a match dispute", security: auth,
          parameters: [idParam("matchId")],
          requestBody: { required: true, ...json({ type: "object", required: ["winnerId"], properties: { winnerId: { type: "string" } } }) },
          responses: { "200": { description: "Dispute resolved" } },
        },
      },

      // ── Leaderboard ───────────────────────────────────────────────
      "/leaderboard/wins": {
        get: {
          tags: ["Leaderboard"], summary: "Top players by wins",
          parameters: [{ name: "type", in: "query", schema: { type: "string", enum: ["all", "wager", "scrim", "tournament"] } }],
          responses: { "200": { description: "Leaderboard by wins" } },
        },
      },
      "/leaderboard/earnings": {
        get: {
          tags: ["Leaderboard"], summary: "Top players by earnings",
          responses: { "200": { description: "Leaderboard by earnings" } },
        },
      },
      "/leaderboard/trust": {
        get: {
          tags: ["Leaderboard"], summary: "Top players by trust score",
          responses: { "200": { description: "Leaderboard by trust score" } },
        },
      },

      // ── Messages ──────────────────────────────────────────────────
      "/messages": {
        post: {
          tags: ["Messages"], summary: "Send a message", security: auth,
          description: "Rate-limited to 30/min per user.",
          requestBody: { required: true, ...json({ type: "object", required: ["conversationId", "content"], properties: { conversationId: { type: "string", format: "uuid" }, content: { type: "string" }, messageType: { type: "string", enum: ["text", "image", "video"] }, mediaUrl: { type: "string" } } }) },
          responses: { "201": { description: "Message sent", ...json(ref("Message")) }, "429": err("Rate limit exceeded") },
        },
      },
      "/messages/upload": {
        post: {
          tags: ["Messages"], summary: "Upload media for message (multipart)", security: auth,
          requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
          responses: { "200": { description: "Media uploaded", ...json({ type: "object", properties: { mediaUrl: { type: "string" }, messageType: { type: "string" } } }) } },
        },
      },
      "/messages/conversations": {
        get: {
          tags: ["Messages"], summary: "List user's conversations (DMs + teams)", security: auth,
          responses: { "200": { description: "Conversations list with last message and unread count" } },
        },
      },
      "/messages/conversations/dm/{userId}": {
        post: {
          tags: ["Messages"], summary: "Open or create a DM conversation", security: auth,
          parameters: [idParam("userId")],
          responses: { "200": { description: "Conversation object" } },
        },
      },
      "/messages/{conversationId}": {
        get: {
          tags: ["Messages"], summary: "Fetch messages in a conversation", security: auth,
          parameters: [idParam("conversationId"), { name: "cursor", in: "query", schema: { type: "string" } }, { name: "limit", in: "query", schema: { type: "integer" } }],
          responses: { "200": { description: "Paginated messages" } },
        },
      },
      "/messages/{conversationId}/read": {
        post: {
          tags: ["Messages"], summary: "Mark messages as read", security: auth,
          parameters: [idParam("conversationId")],
          responses: { "200": { description: "Messages marked as read" } },
        },
      },
      "/messages/{id}/reply": {
        post: {
          tags: ["Messages"], summary: "Reply to a message", security: auth,
          parameters: [idParam()],
          requestBody: { required: true, ...json({ type: "object", required: ["content"], properties: { content: { type: "string" } } }) },
          responses: { "201": { description: "Reply sent" } },
        },
      },

      // ── Teams ─────────────────────────────────────────────────────
      "/teams": {
        post: {
          tags: ["Teams"], summary: "Create a team", security: auth,
          requestBody: { required: true, ...json({ type: "object", required: ["name", "game"], properties: { name: { type: "string" }, game: { type: "string" }, description: { type: "string" } } }) },
          responses: { "201": { description: "Team created", ...json(ref("Team")) } },
        },
      },
      "/teams/my": {
        get: {
          tags: ["Teams"], summary: "Get user's teams", security: auth,
          responses: { "200": { description: "User's teams list" } },
        },
      },
      "/teams/invites/received": {
        get: {
          tags: ["Teams"], summary: "Get pending team invites", security: auth,
          responses: { "200": { description: "Pending invites" } },
        },
      },
      "/teams/invites/{inviteId}/respond": {
        post: {
          tags: ["Teams"], summary: "Accept or decline a team invite", security: auth,
          parameters: [idParam("inviteId")],
          requestBody: { required: true, ...json({ type: "object", required: ["action"], properties: { action: { type: "string", enum: ["accept", "decline"] } } }) },
          responses: { "200": { description: "Invite response recorded" } },
        },
      },
      "/teams/{teamId}": {
        get: {
          tags: ["Teams"], summary: "Get team details", security: auth,
          parameters: [idParam("teamId")],
          responses: { "200": { description: "Team with members", ...json(ref("Team")) } },
        },
        patch: {
          tags: ["Teams"], summary: "Edit team name/description/game", security: auth,
          parameters: [idParam("teamId")],
          requestBody: { ...json({ type: "object", properties: { name: { type: "string" }, description: { type: "string" }, game: { type: "string" } } }) },
          responses: { "200": { description: "Team updated" } },
        },
        delete: {
          tags: ["Teams"], summary: "Delete team (commander only)", security: auth,
          parameters: [idParam("teamId")],
          responses: { "200": { description: "Team deleted" } },
        },
      },
      "/teams/{teamId}/profile-image/upload": {
        post: {
          tags: ["Teams"], summary: "Upload team image (multipart)", security: auth,
          parameters: [idParam("teamId")],
          requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
          responses: { "200": { description: "Team image uploaded" } },
        },
      },
      "/teams/{teamId}/profile-image": {
        patch: {
          tags: ["Teams"], summary: "Set or clear team image URL", security: auth,
          parameters: [idParam("teamId")],
          responses: { "200": { description: "Image URL updated" } },
        },
      },
      "/teams/{teamId}/invites": {
        post: {
          tags: ["Teams"], summary: "Invite user to team", security: auth,
          parameters: [idParam("teamId")],
          requestBody: { required: true, ...json({ type: "object", required: ["receiverId"], properties: { receiverId: { type: "string", format: "uuid" } } }) },
          responses: { "201": { description: "Invite sent" } },
        },
      },
      "/teams/{teamId}/members/{userId}/role": {
        post: {
          tags: ["Teams"], summary: "Update member role", security: auth,
          parameters: [idParam("teamId"), idParam("userId")],
          requestBody: { required: true, ...json({ type: "object", required: ["role"], properties: { role: { type: "string", enum: ["commander", "general", "colonel"] } } }) },
          responses: { "200": { description: "Role updated" } },
        },
      },
      "/teams/{teamId}/members/{userId}": {
        delete: {
          tags: ["Teams"], summary: "Remove member from team", security: auth,
          parameters: [idParam("teamId"), idParam("userId")],
          responses: { "200": { description: "Member removed" } },
        },
      },
      "/teams/{teamId}/leave": {
        post: {
          tags: ["Teams"], summary: "Leave a team", security: auth,
          parameters: [idParam("teamId")],
          responses: { "200": { description: "Left team" } },
        },
      },
      "/teams/{teamId}/posts": {
        get: {
          tags: ["Teams"], summary: "Get team posts", security: auth,
          parameters: [idParam("teamId")],
          responses: { "200": { description: "Team posts list" } },
        },
        post: {
          tags: ["Teams"], summary: "Create a team post", security: auth,
          parameters: [idParam("teamId")],
          requestBody: { required: true, ...json({ type: "object", required: ["title", "content"], properties: { title: { type: "string" }, content: { type: "string" } } }) },
          responses: { "201": { description: "Post created" } },
        },
      },
      "/teams/{teamId}/posts/{postId}": {
        delete: {
          tags: ["Teams"], summary: "Delete a team post", security: auth,
          parameters: [idParam("teamId"), idParam("postId")],
          responses: { "200": { description: "Post deleted" } },
        },
      },

      // ── Search ────────────────────────────────────────────────────
      "/search": {
        get: {
          tags: ["Search"], summary: "Search users, matches, and games",
          parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search query" }],
          responses: { "200": { description: "Search results", ...json({ type: "object", properties: { users: { type: "array", items: ref("User") }, matches: { type: "array", items: ref("Match") }, games: { type: "array", items: { type: "string" } } } }) } },
        },
      },

      // ── Uploads ───────────────────────────────────────────────────
      "/api/upload-url": {
        post: {
          tags: ["Uploads"], summary: "Generate S3 presigned upload URL", security: auth,
          requestBody: { required: true, ...json({ type: "object", required: ["fileType", "context"], properties: { fileType: { type: "string", enum: ["image/jpeg", "image/png", "image/webp", "video/mp4"] }, context: { type: "string", enum: ["evidence", "message", "profile"] } } }) },
          responses: { "200": { description: "Presigned URL generated", ...json({ type: "object", properties: { uploadUrl: { type: "string", format: "uri" }, fileUrl: { type: "string", format: "uri" } } }) }, "400": err("Invalid fileType or context") },
        },
      },

      // ── Region ────────────────────────────────────────────────────
      "/api/region/detect": {
        get: {
          tags: ["Region"], summary: "Detect user region from IP",
          responses: { "200": { description: "Detected region", ...json({ type: "object", properties: { country: { type: "string" }, region: { type: "string" }, city: { type: "string" } } }) } },
        },
      },
      "/api/regions/countries": {
        get: {
          tags: ["Region"], summary: "Get countries and matchmaking regions",
          responses: { "200": { description: "Countries and regions list" } },
        },
      },

      // ── Esports ───────────────────────────────────────────────────
      "/api/esports/matches": {
        get: {
          tags: ["Esports"], summary: "Relevant esports matches",
          responses: { "200": { description: "Esports matches from PandaScore" } },
        },
      },
      "/api/esports/live": {
        get: {
          tags: ["Esports"], summary: "Live esports matches",
          responses: { "200": { description: "Currently live matches" } },
        },
      },
      "/api/esports/upcoming": {
        get: {
          tags: ["Esports"], summary: "Upcoming esports matches",
          responses: { "200": { description: "Upcoming matches" } },
        },
      },
      "/api/esports/recent": {
        get: {
          tags: ["Esports"], summary: "Recent esports matches",
          responses: { "200": { description: "Recent matches" } },
        },
      },
      "/api/esports/relevant": {
        get: {
          tags: ["Esports"], summary: "Relevant esports matches (alias)",
          responses: { "200": { description: "Relevant matches" } },
        },
      },
      "/api/esports/tournaments": {
        get: {
          tags: ["Esports"], summary: "Relevant esports tournaments",
          responses: { "200": { description: "Esports tournaments" } },
        },
      },
      "/api/esports/tournaments/live": {
        get: {
          tags: ["Esports"], summary: "Live esports tournaments",
          responses: { "200": { description: "Currently live tournaments" } },
        },
      },
      "/api/esports/tournaments/upcoming": {
        get: {
          tags: ["Esports"], summary: "Upcoming esports tournaments",
          responses: { "200": { description: "Upcoming tournaments" } },
        },
      },
      "/api/esports/tournaments/recent": {
        get: {
          tags: ["Esports"], summary: "Recent esports tournaments",
          responses: { "200": { description: "Recent tournaments" } },
        },
      },
      "/api/esports/tournaments/relevant": {
        get: {
          tags: ["Esports"], summary: "Relevant esports tournaments (alias)",
          responses: { "200": { description: "Relevant tournaments" } },
        },
      },

      // ── System ────────────────────────────────────────────────────
      "/health": {
        get: {
          tags: ["System"], summary: "Health check",
          responses: { "200": { description: "Service is healthy", ...json({ type: "object", properties: { status: { type: "string", example: "ok" } } }) } },
        },
      },
      "/metrics": {
        get: {
          tags: ["System"], summary: "Server metrics",
          responses: { "200": { description: "Metrics snapshot", ...json({ type: "object", properties: { status: { type: "string" }, uptime: { type: "number" }, activeUsers: { type: "integer" }, totalUsers: { type: "integer" }, totalMatches: { type: "integer" }, memoryMB: { type: "number" } } }) } },
        },
      },
      "/stats": {
        get: {
          tags: ["System"], summary: "Platform analytics",
          responses: { "200": { description: "Platform stats", ...json({ type: "object", properties: { totalAccounts: { type: "integer" }, completedMatches: { type: "integer" }, activeMatches: { type: "integer" }, onlinePlayers: { type: "integer" }, totalPayouts: { type: "number" }, totalEscrow: { type: "number" } } }) } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
