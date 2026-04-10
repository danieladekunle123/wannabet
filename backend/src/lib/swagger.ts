import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Wannabet API",
      version: "2.0.0",
      description:
        "Wannabet esports wagering platform API — matches, tournaments, wallets, and more.",
    },
    servers: [
      { url: "http://localhost:4000", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        Token: {
          type: "object",
          properties: {
            token: { type: "string", description: "JWT access token" },
          },
        },
        Match: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            game: { type: "string" },
            stake: { type: "number" },
            status: {
              type: "string",
              enum: [
                "OPEN",
                "UPCOMING",
                "ACTIVE",
                "RESULT_REPORTED",
                "COMPLETED",
                "CANCELLED",
              ],
            },
            hostId: { type: "string", format: "uuid" },
            joinerId: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Wallet: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            balance: {
              type: "integer",
              description: "Balance in cents",
            },
            escrow: {
              type: "integer",
              description: "Locked escrow in cents",
            },
          },
        },
        LedgerEntry: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            walletId: { type: "string", format: "uuid" },
            type: {
              type: "string",
              enum: [
                "deposit",
                "withdrawal",
                "escrow_lock",
                "escrow_refund",
                "payout",
              ],
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
      },
    },
    tags: [
      { name: "Auth", description: "Registration, login, and Google OAuth" },
      { name: "Matches", description: "1-v-1 wager / scrim match management" },
      {
        name: "Tournaments",
        description: "Tournament brackets, teams, and results",
      },
      { name: "Wallet", description: "Deposits, withdrawals, and escrow" },
      {
        name: "Uploads",
        description: "S3 presigned URL generation for file uploads",
      },
    ],
    paths: {
      // ── Auth ──────────────────────────────────────────────────────
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new account",
          description:
            "Create a new user with email, username, and password. Auto-detects region from IP.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "username", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "player@example.com",
                    },
                    username: {
                      type: "string",
                      minLength: 3,
                      maxLength: 24,
                      example: "progamer42",
                    },
                    password: {
                      type: "string",
                      minLength: 8,
                      maxLength: 72,
                      example: "securePass123!",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Account created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Token" },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "403": {
              description: "Registrations disabled",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with email and password",
          description:
            "Authenticate and receive a JWT. Rate-limited to 10 attempts per IP.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "player@example.com",
                    },
                    password: { type: "string", example: "securePass123!" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Token" },
                },
              },
            },
            "400": {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "429": {
              description: "Too many login attempts",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/auth/google": {
        post: {
          tags: ["Auth"],
          summary: "Google OAuth authentication",
          description:
            "Exchange a Google auth code for a JWT. Supports signin and signup modes.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["code"],
                  properties: {
                    code: {
                      type: "string",
                      description: "Google authorization code",
                    },
                    redirectUri: {
                      type: "string",
                      description:
                        "OAuth redirect URI (defaults to server config)",
                    },
                    mode: {
                      type: "string",
                      enum: ["signin", "signup"],
                      description:
                        "signin = existing users only; signup = new users only",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Authentication successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Token" },
                },
              },
            },
            "400": {
              description: "Missing code or Google auth failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "No account found (signin mode)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "409": {
              description: "Account already exists (signup mode)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      // ── Matches ───────────────────────────────────────────────────
      "/matches": {
        post: {
          tags: ["Matches"],
          summary: "Create a match",
          description:
            "Create a new match and lock the stake in escrow. Rate-limited to 10 per user. Validates trust score and platform wager limits.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["game", "stake"],
                  properties: {
                    game: { type: "string", minLength: 2, maxLength: 50 },
                    stake: {
                      type: "number",
                      minimum: 0,
                      maximum: 10000,
                      description: "Wager amount in dollars",
                    },
                    matchType: {
                      type: "string",
                      enum: ["scrim", "wager", "custom"],
                    },
                    title: { type: "string", maxLength: 140 },
                    description: { type: "string", maxLength: 2000 },
                    participantCount: {
                      type: "integer",
                      minimum: 2,
                      maximum: 128,
                    },
                    teamSize: { type: "integer", minimum: 1, maximum: 20 },
                    region: { type: "string", maxLength: 120 },
                    startAt: {
                      type: "string",
                      format: "date-time",
                      description: "Scheduled start time (ISO 8601)",
                    },
                    joinDeadlineAt: {
                      type: "string",
                      format: "date-time",
                    },
                    privateMatch: { type: "boolean", default: false },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Match created, escrow locked",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      match: { $ref: "#/components/schemas/Match" },
                      wallet: { $ref: "#/components/schemas/Wallet" },
                      ledgerEntry: {
                        $ref: "#/components/schemas/LedgerEntry",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description:
                "Validation error, insufficient balance, or max matches reached",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "403": {
              description: "Trust score too low",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "429": {
              description: "Rate limit exceeded",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/matches/featured": {
        get: {
          tags: ["Matches"],
          summary: "Get featured match",
          description:
            "Returns the highest-stake open match. Cached for 30 seconds.",
          responses: {
            "200": {
              description: "Featured match (or null)",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      match: {
                        allOf: [{ $ref: "#/components/schemas/Match" }],
                        nullable: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/matches/mine": {
        get: {
          tags: ["Matches"],
          summary: "Get my matches",
          description:
            "Returns up to 50 matches where the current user is host or joiner, newest first.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "List of matches",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      matches: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Match" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/matches/{id}/join": {
        post: {
          tags: ["Matches"],
          summary: "Join a match",
          description:
            "Join an open match as joiner. Locks your stake in escrow. Notifies the host via WebSocket.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": {
              description: "Joined successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      match: { $ref: "#/components/schemas/Match" },
                    },
                  },
                },
              },
            },
            "400": {
              description:
                "Match not open, already joined, host cannot join, or insufficient balance",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/matches/{id}/report": {
        post: {
          tags: ["Matches"],
          summary: "Report match result",
          description:
            "Submit who won the match. Only participants of an ACTIVE match can report. Sets status to RESULT_REPORTED.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["winnerId"],
                  properties: {
                    winnerId: {
                      type: "string",
                      format: "uuid",
                      description: "User ID of the winner",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Result reported",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      match: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          status: { type: "string" },
                          reportedWinnerId: { type: "string" },
                          reportedById: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Match not active or already reported",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "403": {
              description: "Not a match participant",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/matches/{id}/confirm": {
        post: {
          tags: ["Matches"],
          summary: "Confirm match result",
          description:
            "The non-reporting participant confirms the reported result. Releases escrow and pays out the winner.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": {
              description: "Result confirmed, payouts issued",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      match: { $ref: "#/components/schemas/Match" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Match not in RESULT_REPORTED state",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/matches/{id}": {
        delete: {
          tags: ["Matches"],
          summary: "Cancel a match",
          description:
            "Host cancels their match before anyone joins. Refunds escrow to balance.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": {
              description: "Match cancelled, escrow refunded",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean", example: true },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Match already has a joiner or is finished",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "403": {
              description: "Only the host can cancel",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      // ── Tournaments ───────────────────────────────────────────────
      "/tournaments": {
        get: {
          tags: ["Tournaments"],
          summary: "List tournaments",
          description: "Returns all tournaments. Cached for 30 seconds.",
          responses: {
            "200": {
              description: "Tournament list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      tournaments: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Tournament" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Tournaments"],
          summary: "Create a tournament",
          description:
            "Create a new tournament. Participant count must be a power of 2 (min 4). Formats: single_elimination, double_elimination, round_robin.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "game", "maxParticipants"],
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 100 },
                    game: { type: "string", minLength: 2, maxLength: 50 },
                    maxParticipants: {
                      type: "integer",
                      minimum: 4,
                      description: "Must be a power of 2 (4, 8, 16, 32 …)",
                    },
                    format: {
                      type: "string",
                      enum: [
                        "single_elimination",
                        "double_elimination",
                        "round_robin",
                      ],
                      default: "single_elimination",
                    },
                    startAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Tournament created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      tournament: {
                        $ref: "#/components/schemas/Tournament",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/tournaments/{id}": {
        get: {
          tags: ["Tournaments"],
          summary: "Get tournament details",
          description:
            "Returns tournament info including registered participants.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": {
              description: "Tournament details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      tournament: {
                        $ref: "#/components/schemas/Tournament",
                      },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Tournament not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Tournaments"],
          summary: "Edit tournament",
          description:
            "Update tournament name or start time. Only the host can edit, and only before participants register.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    startAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Tournament updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      tournament: {
                        $ref: "#/components/schemas/Tournament",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Tournaments"],
          summary: "Cancel tournament",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "Tournament cancelled" },
          },
        },
      },

      "/tournaments/{id}/bracket": {
        get: {
          tags: ["Tournaments"],
          summary: "Get tournament bracket",
          description:
            "Returns full bracket with rounds, matches, team names, and leaderboard for round-robin.",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": {
              description: "Bracket data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      rounds: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            roundNumber: { type: "integer" },
                            name: { type: "string" },
                            matches: { type: "array", items: { type: "object" } },
                          },
                        },
                      },
                      leaderboard: {
                        type: "array",
                        nullable: true,
                        items: {
                          type: "object",
                          properties: {
                            teamId: { type: "string" },
                            teamName: { type: "string" },
                            wins: { type: "integer" },
                            losses: { type: "integer" },
                            draws: { type: "integer" },
                            points: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/tournaments/{id}/teams": {
        post: {
          tags: ["Tournaments"],
          summary: "Register a team",
          description:
            "Register an existing team for the tournament. Validates team size and membership.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["teamId"],
                  properties: {
                    teamId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Team registered" },
            "400": {
              description: "Tournament full, team invalid, or already registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/tournaments/{id}/start": {
        post: {
          tags: ["Tournaments"],
          summary: "Start the tournament",
          description:
            "Shuffles teams and generates the bracket. Host only.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": { description: "Tournament started, bracket generated" },
            "400": {
              description: "Not enough teams or already started",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/tournaments/{id}/matches/{matchId}/submit": {
        post: {
          tags: ["Tournaments"],
          summary: "Submit tournament match result",
          description:
            "Submit the winner for a tournament match. Auto-confirms if both teams agree.",
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "matchId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["winnerId"],
                  properties: {
                    winnerId: {
                      type: "string",
                      format: "uuid",
                      description: "Team ID of the winner",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Result submitted" },
            "400": {
              description: "Match not ongoing or invalid winner",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      // ── Wallet ────────────────────────────────────────────────────
      "/wallet": {
        get: {
          tags: ["Wallet"],
          summary: "Get wallet balance",
          description: "Returns the current user's wallet balance and escrow.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "Wallet summary",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      wallet: { $ref: "#/components/schemas/Wallet" },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Wallet not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/wallet/deposit": {
        post: {
          tags: ["Wallet"],
          summary: "Create a deposit (Stripe PaymentIntent)",
          description:
            "Creates a Stripe PaymentIntent. Frontend uses the returned client_secret to confirm payment. Balance is credited via Stripe webhook.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount"],
                  properties: {
                    amount: {
                      type: "integer",
                      minimum: 50,
                      maximum: 1000000,
                      description:
                        "Amount in cents (50 = $0.50, 1000000 = $10,000)",
                      example: 1000,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "PaymentIntent created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      clientSecret: {
                        type: "string",
                        description: "Stripe client secret for frontend",
                      },
                      id: {
                        type: "string",
                        description: "PaymentIntent ID",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid amount",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/wallet/withdraw": {
        post: {
          tags: ["Wallet"],
          summary: "Withdraw funds",
          description: "Withdraw from wallet balance. Amount in cents.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount"],
                  properties: {
                    amount: {
                      type: "integer",
                      minimum: 1,
                      maximum: 10000000,
                      description: "Amount in cents",
                      example: 500,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Withdrawal processed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      wallet: { $ref: "#/components/schemas/Wallet" },
                      ledgerEntry: {
                        $ref: "#/components/schemas/LedgerEntry",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Insufficient balance or invalid amount",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/wallet/escrow/lock": {
        post: {
          tags: ["Wallet"],
          summary: "Lock funds in escrow",
          description:
            "Move funds from balance into escrow for a match or tournament.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount"],
                  properties: {
                    amount: {
                      type: "integer",
                      minimum: 1,
                      description: "Amount in cents",
                    },
                    matchId: { type: "string", format: "uuid" },
                    tournamentId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Escrow locked",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      wallet: { $ref: "#/components/schemas/Wallet" },
                      ledgerEntry: {
                        $ref: "#/components/schemas/LedgerEntry",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Insufficient balance",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },

      "/wallet/escrow/release": {
        post: {
          tags: ["Wallet"],
          summary: "Release escrow back to balance",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["amount"],
                  properties: {
                    amount: {
                      type: "integer",
                      minimum: 1,
                      description: "Amount in cents",
                    },
                    matchId: { type: "string", format: "uuid" },
                    tournamentId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Escrow released",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      wallet: { $ref: "#/components/schemas/Wallet" },
                      ledgerEntry: {
                        $ref: "#/components/schemas/LedgerEntry",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/wallet/ledger": {
        get: {
          tags: ["Wallet"],
          summary: "Get ledger history",
          description: "Returns the 50 most recent ledger entries.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "Ledger entries",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      entries: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/LedgerEntry",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ── Uploads ───────────────────────────────────────────────────
      "/api/upload-url": {
        post: {
          tags: ["Uploads"],
          summary: "Generate S3 presigned upload URL",
          description:
            "Returns a presigned S3 URL for direct file upload. Allowed types: JPEG, PNG, WebP, MP4. Contexts: evidence, message, profile.",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fileType", "context"],
                  properties: {
                    fileType: {
                      type: "string",
                      enum: [
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "video/mp4",
                      ],
                      description: "MIME type of the file",
                    },
                    context: {
                      type: "string",
                      enum: ["evidence", "message", "profile"],
                      description:
                        "Upload context determines the S3 folder",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Presigned URL generated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      uploadUrl: {
                        type: "string",
                        format: "uri",
                        description:
                          "PUT this URL with the file binary to upload",
                      },
                      fileUrl: {
                        type: "string",
                        format: "uri",
                        description:
                          "Public URL of the file after upload",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid fileType or context",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We define paths inline above, no JSDoc annotations needed
};

export const swaggerSpec = swaggerJsdoc(options);
