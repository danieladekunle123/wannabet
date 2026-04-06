import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { UserAvatar } from "./UserAvatar";
import {
  Trophy,
  DollarSign,
  Shield,
  Target,
  Gamepad2,
  Clock,
  Swords,
  CheckCircle,
  XCircle,
  Flame,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../lib/api";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import { getTrustRank } from "../utils/trustRank";

interface PlayerStatsProps {
  onNavigate?: (tab: string) => void;
}

export function PlayerStats({ onNavigate }: PlayerStatsProps = {}) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [timeseriesData, setTimeseriesData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTimeseries, setLoadingTimeseries] = useState(true);

  const { user } = useAuth();
  const { currency, rates } = useCurrency();
  const displayName = user?.profile?.displayName ?? user?.username ?? "You";
  const accountUsername = user?.username ? `@${user.username}` : "@unknown";

  // Load profile stats once
  useEffect(() => {
    if (!user?.id) return;
    setLoadingProfile(true);
    api
      .getPublicProfile(user.id)
      .then((data: any) => {
        setProfileStats(data?.stats ?? null);
        setRecentMatches(data?.recentMatches ?? []);
      })
      .catch(console.error)
      .finally(() => setLoadingProfile(false));
  }, [user?.id]);

  // Load timeseries when period changes
  useEffect(() => {
    setLoadingTimeseries(true);
    api
      .getMyStatsTimeseries(selectedPeriod)
      .then((data: any) => setTimeseriesData(data))
      .catch(console.error)
      .finally(() => setLoadingTimeseries(false));
  }, [selectedPeriod]);

  // Handle period change with transition
  const handlePeriodChange = (period: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedPeriod(period);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const winLossData = timeseriesData?.winLossData ?? [];
  const earningsData = timeseriesData?.earningsData ?? [];
  const gameDistribution = timeseriesData?.gameDistribution ?? [];

  const wins = profileStats?.wins ?? 0;
  const losses = profileStats?.losses ?? 0;
  const winRate = profileStats?.winRate ?? 0;
  const totalEarningsCents = profileStats?.totalEarningsCents ?? 0;
  const currentStreak = profileStats?.currentStreak ?? 0;
  const trustScore = user?.profile?.trustScore ?? 0;
  const trustRank = getTrustRank(trustScore);

  const CustomTooltip = useMemo(() => {
    return ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-card border border-primary/30 rounded-lg p-3 shadow-lg">
            <p className="text-sm font-semibold text-foreground mb-1">
              {label}
            </p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-xs" style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Player Info */}
      <Card className="border-primary/30 transition-all duration-300 overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <UserAvatar
                className="w-20 h-20"
                name={displayName}
                username={user?.username}
                imageUrl={user?.profileImageUrl || user?.avatarUrl}
                fallbackClassName="bg-gradient-to-br from-primary to-amber-500 text-3xl font-bold text-white"
              />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {displayName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {accountUsername}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {currentStreak > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">
                      <Flame className="h-3 w-3 mr-1" />
                      {currentStreak} streak
                    </Badge>
                  )}
                  <Badge
                    className={`${trustRank.bgColor} ${trustRank.textColor} border ${trustRank.borderColor}`}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {trustRank.label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="text-center bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Trophy className="h-4 w-4 text-emerald-400" />
                  <div className="text-2xl font-bold text-emerald-400">
                    {loadingProfile ? "—" : wins}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Total Wins</div>
              </div>
              <div className="text-center bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <DollarSign className="h-4 w-4 text-amber-400" />
                  <div className="text-2xl font-bold text-amber-400">
                    {loadingProfile
                      ? "—"
                      : formatCurrencyFromEur(
                          totalEarningsCents / 100,
                          currency,
                          rates,
                        )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Earned
                </div>
              </div>
              <div className="text-center bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Target className="h-4 w-4 text-purple-400" />
                  <div className="text-2xl font-bold text-purple-400">
                    {loadingProfile ? "—" : `${winRate}%`}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <div className={`text-2xl font-bold ${trustRank.textColor}`}>
                    {loadingProfile ? "—" : Math.round(trustScore)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Trust Score</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Performance Analytics
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "7d", label: "7 Days" },
            { value: "30d", label: "30 Days" },
            { value: "3mo", label: "3 Months" },
            { value: "6mo", label: "6 Months" },
            { value: "1y", label: "1 Year" },
            { value: "all", label: "All Time" },
          ].map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange(period.value)}
              className={`transition-all duration-300 ${
                selectedPeriod === period.value
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg scale-105"
                  : "hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500 ${
          isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Win/Loss Chart */}
        <Card className="transition-all duration-500 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-emerald-400" />
              <span>Win/Loss History</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {selectedPeriod === "7d" && "7 Days"}
                {selectedPeriod === "30d" && "30 Days"}
                {selectedPeriod === "3mo" && "3 Months"}
                {selectedPeriod === "6mo" && "6 Months"}
                {selectedPeriod === "1y" && "1 Year"}
                {selectedPeriod === "all" && "All Time"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTimeseries ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Loading…
              </div>
            ) : winLossData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={winLossData} key={selectedPeriod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="period"
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="wins"
                    fill="#10B981"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  />
                  <Bar
                    dataKey="losses"
                    fill="#EF4444"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Game Distribution Pie Chart */}
        <Card className="transition-all duration-500 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gamepad2 className="h-5 w-5 text-purple-400" />
              <span>Game Distribution</span>
              <span className="ml-auto text-xs text-muted-foreground font-normal">
                All time
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTimeseries ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Loading…
              </div>
            ) : gameDistribution.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No matches yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={gameDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {gameDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart - Full Width */}
      <Card
        className={`transition-all duration-500 hover-lift ${
          isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-amber-400" />
            <span>Earnings Over Time</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {selectedPeriod === "7d" && "7 Days"}
              {selectedPeriod === "30d" && "30 Days"}
              {selectedPeriod === "3mo" && "3 Months"}
              {selectedPeriod === "6mo" && "6 Months"}
              {selectedPeriod === "1y" && "1 Year"}
              {selectedPeriod === "all" && "All Time"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTimeseries ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Loading…
            </div>
          ) : earningsData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No earnings data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earningsData} key={selectedPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis
                  dataKey="period"
                  stroke="#9CA3AF"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: "#F59E0B", r: 5 }}
                  activeDot={{ r: 8 }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Swords className="h-5 w-5 text-primary" />
            <span>Recent Matches</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProfile ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Loading…
            </div>
          ) : recentMatches.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No matches played yet
            </div>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((match: any) => (
                <div
                  key={match.id}
                  className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {match.result === "Win" ? (
                        <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-foreground">
                            {match.game}
                          </span>
                          {match.stake > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-500/40 text-amber-400"
                            >
                              Wager
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Free
                            </Badge>
                          )}
                          {match.opponentUsername && (
                            <span className="text-xs text-muted-foreground">
                              vs @{match.opponentUsername}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(match.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {match.earnedCents > 0 ? (
                        <div className="font-semibold text-emerald-400">
                          +
                          {formatCurrencyFromEur(
                            match.earnedCents / 100,
                            currency,
                            rates,
                          )}
                        </div>
                      ) : match.stake > 0 ? (
                        <div className="font-semibold text-red-400">
                          -
                          {formatCurrencyFromEur(
                            match.stake / 100,
                            currency,
                            rates,
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Free
                        </div>
                      )}
                      <div
                        className={`text-xs font-medium mt-0.5 ${
                          match.result === "Win"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {match.result}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
