import { prisma } from "./prisma";

export interface PlatformConfig {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  trustScoreThreshold: number;
  minWagerAmount: number;
  maxWagerAmount: number;
  maxActiveMatchesPerUser: number;
}

const DEFAULTS: PlatformConfig = {
  siteName: "WannaBet?",
  maintenanceMode: false,
  registrationEnabled: true,
  trustScoreThreshold: 0,
  minWagerAmount: 5,
  maxWagerAmount: 10000,
  maxActiveMatchesPerUser: 10,
};

let cached: PlatformConfig | null = null;
let cacheExpiry = 0;
const TTL_MS = 60_000; // 1 minute

export async function getConfig(): Promise<PlatformConfig> {
  if (cached && Date.now() < cacheExpiry) return cached;

  const row = await prisma.platformConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...DEFAULTS, updatedAt: new Date() },
    update: {},
  });

  cached = {
    siteName: row.siteName,
    maintenanceMode: row.maintenanceMode,
    registrationEnabled: row.registrationEnabled,
    trustScoreThreshold: row.trustScoreThreshold,
    minWagerAmount: row.minWagerAmount,
    maxWagerAmount: row.maxWagerAmount,
    maxActiveMatchesPerUser: row.maxActiveMatchesPerUser,
  };
  cacheExpiry = Date.now() + TTL_MS;
  return cached;
}

export function invalidateConfigCache() {
  cached = null;
  cacheExpiry = 0;
}
