import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Crown, Trophy, Shield, DollarSign, Medal } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import { UserAvatar } from "./UserAvatar";
import { getTrustRank } from "../utils/trustRank";
import api from "../lib/api";

type WinsType = "all" | "wager" | "tournament" | "scrim" | "custom";

interface WinsEntry {
  rank: number;
  userId: string;
  username: string;
  profileImageUrl: string | null;
  wins: number;
  losses: number;
  trustScore: number;
  country: string | null;
}
interface EarningsEntry {
  rank: number;
  userId: string;
  username: string;
  profileImageUrl: string | null;
  earningsCents: number;
  trustScore: number;
  country: string | null;
}
interface TrustEntry {
  rank: number;
  userId: string;
  username: string;
  profileImageUrl: string | null;
  trustScore: number;
  country: string | null;
}

function getRankBadge(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-zinc-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return (
    <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
  );
}

function getRankCircleClass(rank: number) {
  if (rank === 1)
    return "bg-gradient-to-br from-amber-400 to-amber-600 text-white";
  if (rank === 2)
    return "bg-gradient-to-br from-zinc-400 to-zinc-500 text-white";
  if (rank === 3)
    return "bg-gradient-to-br from-amber-600 to-amber-800 text-white";
  if (rank <= 10) return "bg-primary/20 text-primary";
  return "bg-muted text-muted-foreground";
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Icon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function LoadingRows() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-muted" />
            <div className="w-9 h-9 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-32" />
              <div className="h-2 bg-muted rounded w-20" />
            </div>
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Podium({
  entries,
  currentUserId,
  renderDetails,
}: {
  entries: Array<{
    userId: string;
    username: string;
    profileImageUrl: string | null;
    rank: number;
  }>;
  currentUserId?: string;
  renderDetails: (e: any) => React.ReactNode;
}) {
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;
  // Display order: rank2 left, rank1 center, rank3 right (matching OG CSS)
  const displayOrder = [top3[1], top3[0], top3[2]];
  const orderClass = ["md:order-1", "md:order-2", "md:order-3"];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {displayOrder.map((p, i) => {
        const isFirst = p.rank === 1;
        const isMe = p.userId === currentUserId;
        return (
          <Card
            key={p.userId}
            className={`${orderClass[i]} ${isFirst ? "border-amber-400/50" : ""} ${isMe ? "border-primary/50" : ""} hover:border-primary/50 transition-all duration-200`}
          >
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-3">
                {getRankBadge(p.rank)}
              </div>
              <UserAvatar
                className={`h-16 w-16 mx-auto mb-3 ${isFirst ? "ring-2 ring-amber-400" : ""}`}
                name={p.username}
                username={p.username}
                imageUrl={p.profileImageUrl}
                fallbackClassName={
                  isMe
                    ? "bg-primary text-primary-foreground text-xl"
                    : "bg-primary/20 text-primary text-xl"
                }
              />
              <h3
                className={`font-semibold mb-3 ${isMe ? "text-primary" : "text-foreground"}`}
              >
                {p.username}
                {isMe && (
                  <Badge className="ml-1 text-[10px] h-4 px-1 bg-primary text-primary-foreground">
                    You
                  </Badge>
                )}
              </h3>
              {renderDetails(p)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Shared row renderers ──────────────────────────────────────────────────────

function WinsRow({ e, isMe }: { e: WinsEntry; isMe: boolean }) {
  const total = e.wins + e.losses;
  const wr = total > 0 ? ((e.wins / total) * 100).toFixed(1) : "—";
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? "bg-primary/10" : "hover:bg-muted/40"}`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${getRankCircleClass(e.rank)}`}
      >
        {e.rank <= 3 ? (
          getRankBadge(e.rank)
        ) : (
          <span className="text-xs font-bold">#{e.rank}</span>
        )}
      </div>
      <UserAvatar
        className="w-9 h-9 shrink-0"
        name={e.username}
        username={e.username}
        imageUrl={e.profileImageUrl}
        fallbackClassName={
          isMe
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-sm truncate ${isMe ? "text-primary" : "text-foreground"}`}
          >
            {e.username}
          </span>
          {isMe && (
            <Badge className="text-[10px] h-4 px-1 bg-primary text-primary-foreground">
              You
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="text-emerald-400 font-medium">{e.wins}W</span>
          <span className="mx-1 text-zinc-500">/</span>
          <span className="text-rose-400 font-medium">{e.losses}L</span>
          <span className="ml-2">{wr}% WR</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-foreground">{e.wins}</div>
        <div className="text-xs text-muted-foreground">wins</div>
      </div>
    </div>
  );
}

function EarningsRow({
  e,
  isMe,
  currency,
  rates,
}: {
  e: EarningsEntry;
  isMe: boolean;
  currency: string;
  rates: any;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? "bg-primary/10" : "hover:bg-muted/40"}`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${getRankCircleClass(e.rank)}`}
      >
        {e.rank <= 3 ? (
          getRankBadge(e.rank)
        ) : (
          <span className="text-xs font-bold">#{e.rank}</span>
        )}
      </div>
      <UserAvatar
        className="w-9 h-9 shrink-0"
        name={e.username}
        username={e.username}
        imageUrl={e.profileImageUrl}
        fallbackClassName={
          isMe
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-sm truncate ${isMe ? "text-primary" : "text-foreground"}`}
          >
            {e.username}
          </span>
          {isMe && (
            <Badge className="text-[10px] h-4 px-1 bg-primary text-primary-foreground">
              You
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Total payouts from matches
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-emerald-400">
          {formatCurrencyFromEur(e.earningsCents / 100, currency, rates)}
        </div>
        <div className="text-xs text-muted-foreground">earned</div>
      </div>
    </div>
  );
}

function TrustRow({ e, isMe }: { e: TrustEntry; isMe: boolean }) {
  const rank = getTrustRank(e.trustScore);
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? "bg-primary/10" : "hover:bg-muted/40"}`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${getRankCircleClass(e.rank)}`}
      >
        {e.rank <= 3 ? (
          getRankBadge(e.rank)
        ) : (
          <span className="text-xs font-bold">#{e.rank}</span>
        )}
      </div>
      <UserAvatar
        className="w-9 h-9 shrink-0"
        name={e.username}
        username={e.username}
        imageUrl={e.profileImageUrl}
        fallbackClassName={
          isMe
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-sm truncate ${isMe ? "text-primary" : "text-foreground"}`}
          >
            {e.username}
          </span>
          {isMe && (
            <Badge className="text-[10px] h-4 px-1 bg-primary text-primary-foreground">
              You
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Match accuracy & dispute history
        </div>
      </div>
      <div className="text-right shrink-0">
        <Badge
          className={`text-xs border ${rank.bgColor} ${rank.borderColor} ${rank.textColor}`}
        >
          {rank.label}
        </Badge>
        <div className="text-xs text-muted-foreground mt-0.5">
          {e.trustScore.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

function UserDivider() {
  return (
    <div className="flex items-center gap-2 px-4 py-1 bg-muted/30">
      <div className="flex-1 border-t border-dashed border-border" />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        your rank
      </span>
      <div className="flex-1 border-t border-dashed border-border" />
    </div>
  );
}

// ── Tab components ────────────────────────────────────────────────────────────

function WinsTab({ currentUserId }: { currentUserId?: string }) {
  const [winsType, setWinsType] = useState<WinsType>("all");
  const [entries, setEntries] = useState<WinsEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<WinsEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (type: WinsType) => {
      setLoading(true);
      try {
        const data = await api.getLeaderboardWins(type, currentUserId);
        setEntries(data.entries || []);
        setCurrentUser(data.currentUser || null);
      } catch {
        setEntries([]);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    load(winsType);
  }, [winsType, load]);

  const TYPES: { value: WinsType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "wager", label: "Wager" },
    { value: "tournament", label: "Tournament" },
    { value: "scrim", label: "Scrim" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={winsType === t.value ? "default" : "outline"}
            onClick={() => setWinsType(t.value)}
            className="h-7 text-xs"
          >
            {t.label}
          </Button>
        ))}
      </div>
      {loading ? (
        <LoadingRows />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          message="No data yet. Play some matches to appear here!"
        />
      ) : (
        <>
          <Podium
            entries={entries}
            currentUserId={currentUserId}
            renderDetails={(e: WinsEntry) => (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">W/L:</span>
                  <span className="font-medium">
                    <span className="text-emerald-400">{e.wins}</span>/
                    <span className="text-rose-400">{e.losses}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="text-foreground font-medium">
                    {e.wins + e.losses > 0
                      ? ((e.wins / (e.wins + e.losses)) * 100).toFixed(1)
                      : "—"}
                    %
                  </span>
                </div>
              </div>
            )}
          />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {winsType === "all"
                  ? "All Matches"
                  : winsType.charAt(0).toUpperCase() + winsType.slice(1)}{" "}
                Wins — Top 10
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {entries.map((e) => (
                  <WinsRow
                    key={e.userId}
                    e={e}
                    isMe={e.userId === currentUserId}
                  />
                ))}
                {currentUser && (
                  <>
                    <UserDivider />
                    <WinsRow e={currentUser} isMe={true} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function EarningsTab({ currentUserId }: { currentUserId?: string }) {
  const [entries, setEntries] = useState<EarningsEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<EarningsEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { currency, rates } = useCurrency();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getLeaderboardEarnings(currentUserId);
        setEntries(data.entries || []);
        setCurrentUser(data.currentUser || null);
      } catch {
        setEntries([]);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUserId]);

  return loading ? (
    <LoadingRows />
  ) : entries.length === 0 ? (
    <EmptyState icon={DollarSign} message="No earnings data yet." />
  ) : (
    <>
      <Podium
        entries={entries}
        currentUserId={currentUserId}
        renderDetails={(e: EarningsEntry) => (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Earned:</span>
              <span className="text-emerald-400 font-medium">
                {formatCurrencyFromEur(e.earningsCents / 100, currency, rates)}
              </span>
            </div>
          </div>
        )}
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Earners — Top 10</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {entries.map((e) => (
              <EarningsRow
                key={e.userId}
                e={e}
                isMe={e.userId === currentUserId}
                currency={currency}
                rates={rates}
              />
            ))}
            {currentUser && (
              <>
                <UserDivider />
                <EarningsRow
                  e={currentUser}
                  isMe={true}
                  currency={currency}
                  rates={rates}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function TrustTab({ currentUserId }: { currentUserId?: string }) {
  const [entries, setEntries] = useState<TrustEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<TrustEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getLeaderboardTrust(currentUserId);
        setEntries(data.entries || []);
        setCurrentUser(data.currentUser || null);
      } catch {
        setEntries([]);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUserId]);

  return loading ? (
    <LoadingRows />
  ) : entries.length === 0 ? (
    <EmptyState icon={Shield} message="No trust score data yet." />
  ) : (
    <>
      <Podium
        entries={entries}
        currentUserId={currentUserId}
        renderDetails={(e: TrustEntry) => {
          const r = getTrustRank(e.trustScore);
          return (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rank:</span>
                <Badge
                  className={`text-xs border ${r.bgColor} ${r.borderColor} ${r.textColor}`}
                >
                  {r.label}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score:</span>
                <span className="text-foreground font-medium">
                  {e.trustScore.toFixed(1)}
                </span>
              </div>
            </div>
          );
        }}
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Trust Score Rankings — Top 10
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {entries.map((e) => (
              <TrustRow
                key={e.userId}
                e={e}
                isMe={e.userId === currentUserId}
              />
            ))}
            {currentUser && (
              <>
                <UserDivider />
                <TrustRow e={currentUser} isMe={true} />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function Leaderboards() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Leaderboards</h1>
        <p className="text-muted-foreground">
          See how you rank against the best players
        </p>
      </div>
      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 h-auto">
          <TabsTrigger
            value="global"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Global
          </TabsTrigger>
          <TabsTrigger
            value="earnings"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Earnings
          </TabsTrigger>
          <TabsTrigger
            value="trust"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Shield className="h-4 w-4 mr-2" />
            Trust Score
          </TabsTrigger>
        </TabsList>
        <TabsContent value="global">
          <WinsTab currentUserId={user?.id} />
        </TabsContent>
        <TabsContent value="earnings">
          <EarningsTab currentUserId={user?.id} />
        </TabsContent>
        <TabsContent value="trust">
          <TrustTab currentUserId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
