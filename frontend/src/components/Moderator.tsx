import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import {
  analyzeDispute,
  resolveDispute,
  type DisputeAnalysis,
} from "../services/disputeService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Alert, AlertDescription } from "./ui/alert";
import { getTrustRank } from "../utils/trustRank";
import {
  Search,
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Gavel,
  TrendingUp,
  DollarSign,
  Trophy,
  Target,
  MessageSquare,
  Flag,
  Eye,
  UserX,
  AlertCircle,
  FileText,
  Activity,
  Users,
  Brain,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getModeratorDisputes,
  resolveModeratorDispute,
  type ModeratorDisputeCase,
} from "../services/eventsService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface Player {
  id: string;
  username: string;
  trustScore: number;
  totalMatches: number;
  wins: number;
  losses: number;
  totalEarnings: number;
  mmr: number;
  totalHours?: number;
  walletBalance?: number;
  escrowBalance?: number;
  accountCreated: string;
  lastActive: string;
  status: "active" | "suspended" | "banned" | "warned";
  reports: number;
  avatarUrl?: string | null;
}

export function Moderator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState("");
  const [selectedPlayerLoading, setSelectedPlayerLoading] = useState(false);
  const [selectedPlayerError, setSelectedPlayerError] = useState("");
  const [playersRefreshNonce, setPlayersRefreshNonce] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [disputeFilter, setDisputeFilter] = useState("all");
  const [actionNote, setActionNote] = useState("");
  const [disputes, setDisputes] = useState<ModeratorDisputeCase[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState("");
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null);
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(
    null,
  );
  const [disputesRefreshNonce, setDisputesRefreshNonce] = useState(0);

  // AI analysis state: keyed by report (Dispute) id
  const [analysisMap, setAnalysisMap] = useState<
    Record<string, DisputeAnalysis | null>
  >({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [collapsedAnalysis, setCollapsedAnalysis] = useState<
    Record<string, boolean>
  >({});

  // Platform stats
  const [platformStats, setPlatformStats] = React.useState<any>({
    totalUsers: 0,
    activeToday: 0,
    totalMatches: 0,
    activeDisputes: 0,
    suspendedAccounts: 0,
    bannedAccounts: 0,
    warnedAccounts: 0,
    totalEscrow: 0,
    totalWalletBalance: 0,
  });

  // fetch stats
  const { token } = useAuth();

  React.useEffect(() => {
    // reuse same endpoint as Admin
    (async () => {
      try {
        if (!token) return;
        const res = await fetch(`${API_URL}/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const matchesByStatus = data.matchesByStatus || [];
        const totalMatches = matchesByStatus.reduce(
          (sum: number, s: any) => sum + (s._count?.status || 0),
          0,
        );
        const finishedEntry = matchesByStatus.find(
          (m: any) => m.status === "finished" || m.status === "completed",
        );
        const cancelledEntry = matchesByStatus.find(
          (m: any) => m.status === "cancelled",
        );
        const finishedCount =
          (finishedEntry?._count?.status || 0) +
          (cancelledEntry?._count?.status || 0);
        const activeMatches = Math.max(0, totalMatches - finishedCount);

        setPlatformStats((prev: any) => ({
          ...prev,
          totalUsers: data.totalUsers || prev.totalUsers,
          totalMatches,
          activeToday: prev.activeToday,
          activeDisputes: prev.activeDisputes,
          suspendedAccounts: data.suspendedCount ?? prev.suspendedAccounts,
          bannedAccounts: data.bannedCount ?? prev.bannedAccounts,
          warnedAccounts: data.warnedCount ?? prev.warnedAccounts,
          totalEscrow: data.totalEscrow || 0,
          totalWalletBalance: data.totalWalletBalance || 0,
          activeMatches,
        }));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const fetchPlayers = async () => {
      try {
        setPlayersLoading(true);
        setPlayersError("");

        const params = new URLSearchParams();
        params.set("limit", "10");
        if (searchTerm.trim()) {
          params.set("q", searchTerm.trim());
        }

        const res = await fetch(
          `${API_URL}/users/moderation/players?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load players");
        }

        const data = await res.json();
        const nextPlayers: Player[] = (data.players || []).slice(0, 10);
        setPlayers(nextPlayers);
        setSelectedPlayer((current) => {
          if (!current) return current;
          const stillExists = nextPlayers.some((p) => p.id === current.id);
          return stillExists ? current : null;
        });
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setPlayersError(err?.message || "Failed to load players");
      } finally {
        setPlayersLoading(false);
      }
    };

    fetchPlayers();
    return () => controller.abort();
  }, [searchTerm, token, playersRefreshNonce]);

  React.useEffect(() => {
    if (!token || !selectedPlayer?.id) return;

    const controller = new AbortController();
    const selectedId = selectedPlayer.id;

    const fetchPlayerDetails = async () => {
      try {
        setSelectedPlayerLoading(true);
        setSelectedPlayerError("");

        const res = await fetch(
          `${API_URL}/users/moderation/players/${selectedId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load player details");
        }

        const data = await res.json();
        const details = data.player as Player;
        setSelectedPlayer((current) => {
          if (!current || current.id !== selectedId) return current;
          return { ...current, ...details };
        });
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setSelectedPlayerError(err?.message || "Failed to load player details");
      } finally {
        setSelectedPlayerLoading(false);
      }
    };

    fetchPlayerDetails();
    return () => controller.abort();
  }, [selectedPlayer?.id, token, playersRefreshNonce]);

  // Activity data for chart
  const [activityData, setActivityData] = React.useState<
    { day: string; matches: number; disputes: number }[]
  >([]);

  React.useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/users/moderation/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setActivityData(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [token]);

  // User status distribution (real data)
  const statusDistribution = React.useMemo(() => {
    const banned = platformStats.bannedAccounts || 0;
    const suspended = platformStats.suspendedAccounts || 0;
    const warned = platformStats.warnedAccounts || 0;
    const active = Math.max(
      0,
      (platformStats.totalUsers || 0) - banned - suspended - warned,
    );
    return [
      { name: "Active", value: active, color: "#10B981" },
      { name: "Warned", value: warned, color: "#F59E0B" },
      { name: "Suspended", value: suspended, color: "#EF4444" },
      { name: "Banned", value: banned, color: "#7F1D1D" },
    ].filter((s) => s.value > 0);
  }, [platformStats]);

  const filteredPlayers = players;

  const getCaseStatus = (dispute: ModeratorDisputeCase) => {
    const statuses = dispute.reports.map((report) => report.status);
    if (statuses.length && statuses.every((status) => status === "resolved")) {
      return "resolved";
    }
    if (statuses.some((status) => status === "reviewing")) {
      return "reviewing";
    }
    return "pending";
  };

  React.useEffect(() => {
    if (!token) return;

    const fetchDisputes = async () => {
      try {
        setDisputesLoading(true);
        setDisputesError("");

        const apiStatus =
          disputeFilter === "pending"
            ? "open"
            : disputeFilter === "all"
              ? "all"
              : (disputeFilter as "all" | "open" | "reviewing" | "resolved");

        const rows = await getModeratorDisputes(apiStatus);
        setDisputes(rows);
        setPlatformStats((prev: any) => ({
          ...prev,
          activeDisputes: rows.filter(
            (item) => getCaseStatus(item) !== "resolved",
          ).length,
        }));
      } catch (err: any) {
        console.error(err);
        setDisputesError(err?.message || "Failed to load disputes");
      } finally {
        setDisputesLoading(false);
      }
    };

    void fetchDisputes();
  }, [token, disputeFilter, disputesRefreshNonce]);

  const filteredDisputes = disputes.filter((d) => {
    if (disputeFilter === "all") return true;
    return getCaseStatus(d) === disputeFilter;
  });

  const handleModAction = (
    playerId: string,
    action: "warn" | "suspend" | "ban" | "clear",
  ) => {
    (async () => {
      try {
        if (action === "warn") {
          await warnUser(playerId, actionNote || "Warned by moderator");
          alert("User warned");
        } else if (action === "ban") {
          await banUser(playerId, actionNote || "Banned by moderator");
          alert("User banned");
        } else if (action === "suspend") {
          // default 7-day suspension
          const expires = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString();
          await banUser(
            playerId,
            actionNote || "Suspended by moderator",
            expires,
          );
          alert("User suspended for 7 days");
        } else if (action === "clear") {
          await unbanUser(playerId);
          alert("Cleared reports / active bans for user");
        }
        setPlayersRefreshNonce((n) => n + 1);
      } catch (err) {
        console.error(err);
        alert("Action failed");
      } finally {
        setActionNote("");
      }
    })();
  };

  async function warnUser(userId: string, reason?: string) {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_URL}/users/${userId}/warn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to warn user");
    }
    return await res.json();
  }

  async function banUser(userId: string, reason?: string, expiresAt?: string) {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_URL}/users/${userId}/ban`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason, expiresAt }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to ban user");
    }
    return await res.json();
  }

  async function unbanUser(userId: string) {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_URL}/users/${userId}/unban`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to unban user");
    }
    return await res.json();
  }

  // fetch player logs when selectedPlayer changes
  React.useEffect(() => {
    if (!selectedPlayer) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/users/${selectedPlayer.id}/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPlayerLogs(data.logs || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [selectedPlayer, token]);

  const [playerLogs, setPlayerLogs] = React.useState<any[]>([]);

  const handleAnalyze = async (reportId: string) => {
    if (analysisMap[reportId] !== undefined) return; // already cached
    setAnalyzingId(reportId);
    try {
      const result = await analyzeDispute(reportId);
      setAnalysisMap((prev) => ({ ...prev, [reportId]: result }));
    } catch (err: any) {
      console.error("AI analysis failed:", err);
      setAnalysisMap((prev) => ({ ...prev, [reportId]: null }));
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleAcceptAI = async (
    reportId: string,
    analysis: DisputeAnalysis,
    matchId: string,
  ) => {
    if (!analysis.suggestedWinnerId) return;
    try {
      setResolvingDisputeId(matchId);
      await resolveDispute(
        reportId,
        analysis.suggestedWinnerId,
        "approved_reporter",
      );
      // Also sync through the existing match-level resolve
      const dispute = filteredDisputes.find((d) => d.matchId === matchId);
      if (dispute) {
        const winner = dispute.participants.find(
          (p) => p.id === analysis.suggestedWinnerId,
        );
        await handleResolveDispute(
          matchId,
          analysis.suggestedWinnerId,
          winner?.username ?? "AI Suggested",
        );
      }
    } catch (err: any) {
      console.error(err);
      setDisputesError(err?.message || "Failed to accept AI decision");
    } finally {
      setResolvingDisputeId(null);
    }
  };

  const handleResolveDispute = async (
    matchId: string,
    winnerId: string,
    winnerUsername: string,
  ) => {
    try {
      setResolvingDisputeId(matchId);
      await resolveModeratorDispute({
        matchId,
        winnerId,
        resolutionNote: actionNote || undefined,
      });
      setResolveSuccess(
        `Winner awarded: ${winnerUsername}. The match has been resolved and funds disbursed.`,
      );
      setTimeout(() => setResolveSuccess(null), 6000);
      setDisputesRefreshNonce((n) => n + 1);
      setActionNote("");
    } catch (err: any) {
      console.error(err);
      setDisputesError(err?.message || "Failed to resolve dispute");
    } finally {
      setResolvingDisputeId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "warned":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "suspended":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "banned":
        return "bg-red-900/20 text-red-300 border-red-900/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const formatDateTime = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  return (
    <div className="min-h-full pt-16 lg:pl-64 bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Moderator Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor players, resolve disputes, and maintain platform integrity
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary border border-primary/30 text-lg px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {platformStats.activeDisputes} Active Disputes
          </Badge>
        </motion.div>

        {/* Platform Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="border-primary/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-blue-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {platformStats.totalUsers.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Users
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Activity className="h-8 w-8 text-emerald-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {platformStats.activeToday.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Active Today
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Trophy className="h-8 w-8 text-purple-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-400">
                      {platformStats.totalMatches.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Matches
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Flag className="h-8 w-8 text-amber-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-400">
                      {platformStats.activeDisputes}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Active Disputes
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-400">
                      {platformStats.suspendedAccounts}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Suspended
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-900/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Ban className="h-8 w-8 text-red-300" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-300">
                      {platformStats.bannedAccounts}
                    </div>
                    <div className="text-xs text-muted-foreground">Banned</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-muted/50">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Activity className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="players"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="h-4 w-4 mr-2" />
                Player Management
              </TabsTrigger>
              <TabsTrigger
                value="disputes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Gavel className="h-4 w-4 mr-2" />
                Dispute Resolution
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Activity */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Platform Activity (Last 7 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis dataKey="day" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#16171A",
                            border: "1px solid rgba(229, 9, 20, 0.3)",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="matches"
                          stroke="#E50914"
                          strokeWidth={3}
                        />
                        <Line
                          type="monotone"
                          dataKey="disputes"
                          stroke="#F59E0B"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* User Status Distribution */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      User Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(1)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#16171A",
                            border: "1px solid rgba(229, 9, 20, 0.3)",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Player Management Tab */}
            <TabsContent value="players" className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Search Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-muted/30 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Player List */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle>
                      Player List ({filteredPlayers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {playersError && (
                      <Alert className="mb-3 border-red-500/30 bg-red-500/10">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription>{playersError}</AlertDescription>
                      </Alert>
                    )}
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-3">
                        <AnimatePresence>
                          {playersLoading && filteredPlayers.length === 0 && (
                            <div className="text-sm text-muted-foreground px-1">
                              Loading players...
                            </div>
                          )}
                          {!playersLoading &&
                            filteredPlayers.length === 0 &&
                            !playersError && (
                              <div className="text-sm text-muted-foreground px-1">
                                No players found.
                              </div>
                            )}
                          {filteredPlayers.map((player, index) => (
                            <motion.div
                              key={player.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => setSelectedPlayer(player)}
                              className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                                selectedPlayer?.id === player.id
                                  ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/20"
                                  : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/20 text-primary">
                                      {player.username.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-semibold text-foreground">
                                      {player.username}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {player.id}
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  className={getStatusColor(player.status)}
                                >
                                  {player.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">
                                    Trust:
                                  </span>
                                  {(() => {
                                    const rank = getTrustRank(
                                      player.trustScore,
                                    );
                                    return (
                                      <span
                                        className={`ml-1 font-semibold ${rank.textColor}`}
                                      >
                                        {rank.label}{" "}
                                        <span className="opacity-60 text-[10px]">
                                          ({player.trustScore})
                                        </span>
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Matches:
                                  </span>
                                  <span className="ml-1 font-semibold text-foreground">
                                    {player.totalMatches}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Reports:
                                  </span>
                                  <span
                                    className={`ml-1 font-semibold ${
                                      player.reports > 5
                                        ? "text-red-400"
                                        : player.reports > 0
                                          ? "text-amber-400"
                                          : "text-emerald-400"
                                    }`}
                                  >
                                    {player.reports}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Player Details & Actions */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle>Player Details & Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedPlayer ? (
                      <div className="space-y-6">
                        {selectedPlayerError && (
                          <Alert className="border-red-500/30 bg-red-500/10">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <AlertDescription>
                              {selectedPlayerError}
                            </AlertDescription>
                          </Alert>
                        )}
                        {selectedPlayerLoading && (
                          <div className="text-sm text-muted-foreground">
                            Refreshing player details...
                          </div>
                        )}

                        {/* Player Info */}
                        <div className="flex items-center gap-4 pb-4 border-b border-border/50">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                              {selectedPlayer.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-foreground">
                              {selectedPlayer.username}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={getStatusColor(
                                  selectedPlayer.status,
                                )}
                              >
                                {selectedPlayer.status}
                              </Badge>
                              {(() => {
                                const rank = getTrustRank(
                                  selectedPlayer.trustScore,
                                );
                                return (
                                  <Badge
                                    className={`text-xs border ${rank.bgColor} ${rank.borderColor} ${rank.textColor}`}
                                  >
                                    {rank.label} · {selectedPlayer.trustScore}
                                  </Badge>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <Trophy className="h-6 w-6 text-emerald-400" />
                                <div className="text-right">
                                  <div className="text-xl font-bold text-foreground">
                                    {selectedPlayer.wins}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Wins
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <XCircle className="h-6 w-6 text-red-400" />
                                <div className="text-right">
                                  <div className="text-xl font-bold text-foreground">
                                    {selectedPlayer.losses}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Losses
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <Target className="h-6 w-6 text-blue-400" />
                                <div className="text-right">
                                  <div className="text-xl font-bold text-foreground">
                                    {selectedPlayer.totalHours ?? 0}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Hours
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <DollarSign className="h-6 w-6 text-amber-400" />
                                <div className="text-right">
                                  <div className="text-xl font-bold text-emerald-400">
                                    $
                                    {(
                                      selectedPlayer.walletBalance ??
                                      selectedPlayer.totalEarnings ??
                                      0
                                    ).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Wallet
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Account Info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Account Created:
                            </span>
                            <span className="text-foreground font-semibold">
                              {formatDateTime(selectedPlayer.accountCreated)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Last Active:
                            </span>
                            <span className="text-foreground font-semibold">
                              {formatDateTime(selectedPlayer.lastActive)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Escrow Balance:
                            </span>
                            <span className="text-foreground font-semibold">
                              ${(selectedPlayer.escrowBalance ?? 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total Reports:
                            </span>
                            <span
                              className={`font-semibold ${
                                selectedPlayer.reports > 5
                                  ? "text-red-400"
                                  : selectedPlayer.reports > 0
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                              }`}
                            >
                              {selectedPlayer.reports}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Win Rate:
                            </span>
                            <span className="text-foreground font-semibold">
                              {selectedPlayer.totalMatches > 0
                                ? (
                                    (selectedPlayer.wins /
                                      selectedPlayer.totalMatches) *
                                    100
                                  ).toFixed(1)
                                : "0.0"}
                              %
                            </span>
                          </div>
                        </div>

                        {/* Moderator Actions */}
                        <div className="space-y-3 pt-4 border-t border-border/50">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Gavel className="h-4 w-4 text-primary" />
                            Moderator Actions
                          </h4>

                          <Textarea
                            placeholder="Add a note or reason for this action..."
                            value={actionNote}
                            onChange={(e) => setActionNote(e.target.value)}
                            className="bg-muted/30 border-border/50 focus:border-primary/50 min-h-[80px]"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Warn
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-card border-primary/30">
                                <DialogHeader>
                                  <DialogTitle>Confirm Warning</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to warn{" "}
                                    {selectedPlayer.username}? This will be
                                    logged in their account history.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button
                                    className="bg-amber-500 hover:bg-amber-600"
                                    onClick={() =>
                                      handleModAction(selectedPlayer.id, "warn")
                                    }
                                  >
                                    Confirm Warning
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Suspend
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-card border-primary/30">
                                <DialogHeader>
                                  <DialogTitle>Confirm Suspension</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to suspend{" "}
                                    {selectedPlayer.username}? They will be
                                    unable to access the platform for the
                                    suspension period.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() =>
                                      handleModAction(
                                        selectedPlayer.id,
                                        "suspend",
                                      )
                                    }
                                  >
                                    Confirm Suspension
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="border-red-900/50 text-red-300 hover:bg-red-900/10"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Ban
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-card border-primary/30">
                                <DialogHeader>
                                  <DialogTitle>
                                    Confirm Permanent Ban
                                  </DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to permanently ban{" "}
                                    {selectedPlayer.username}? This action
                                    cannot be easily reversed.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button
                                    className="bg-red-900 hover:bg-red-950"
                                    onClick={() =>
                                      handleModAction(selectedPlayer.id, "ban")
                                    }
                                  >
                                    Confirm Ban
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() =>
                                handleModAction(selectedPlayer.id, "clear")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Clear Reports
                            </Button>
                          </div>

                          <Button className="w-full bg-primary hover:bg-primary/90">
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Profile
                          </Button>

                          {/* Player Logs */}
                          <div className="pt-4">
                            <h5 className="font-semibold text-foreground mb-2">
                              Player Logs
                            </h5>
                            <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-muted/20 rounded">
                              {playerLogs.length === 0 ? (
                                <div className="text-xs text-muted-foreground">
                                  No logs
                                </div>
                              ) : (
                                playerLogs.map((l) => (
                                  <div
                                    key={l.id}
                                    className="text-xs text-muted-foreground"
                                  >
                                    <div className="font-medium text-foreground">
                                      {l.type}
                                    </div>
                                    <div>{l.message}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {new Date(l.createdAt).toLocaleString()}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                        <User className="h-16 w-16 mb-4 opacity-50" />
                        <p>Select a player to view details and take actions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Dispute Resolution Tab */}
            <TabsContent value="disputes" className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="h-5 w-5 text-primary" />
                      Active Disputes
                    </CardTitle>
                    <Select
                      value={disputeFilter}
                      onValueChange={setDisputeFilter}
                    >
                      <SelectTrigger className="w-[180px] bg-muted/30 border-border/50">
                        <SelectValue placeholder="Filter disputes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Disputes</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resolveSuccess ? (
                      <Alert className="border-emerald-500/30 bg-emerald-500/10">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <AlertDescription className="text-emerald-400">
                          {resolveSuccess}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    {disputesError ? (
                      <Alert variant="destructive">
                        <AlertDescription>{disputesError}</AlertDescription>
                      </Alert>
                    ) : null}
                    {disputesLoading ? (
                      <div className="text-sm text-muted-foreground">
                        Loading disputes...
                      </div>
                    ) : null}
                    {!disputesLoading && filteredDisputes.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No disputes match this filter.
                      </div>
                    ) : null}
                    <AnimatePresence>
                      {filteredDisputes.map((dispute, index) => {
                        const caseStatus = getCaseStatus(dispute);

                        return (
                          <motion.div
                            key={dispute.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className="bg-muted/30 border-border/50 hover:border-primary/50 transition-all duration-300">
                              <CardContent className="p-6">
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-foreground">
                                          Disputed Match {dispute.matchId}
                                        </h4>
                                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                          {dispute.game}
                                        </Badge>
                                        <Badge
                                          className={
                                            caseStatus === "pending"
                                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                              : caseStatus === "reviewing"
                                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                          }
                                        >
                                          {caseStatus}
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {formatDateTime(dispute.createdAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="h-3 w-3" />$
                                          {dispute.wagerAmount} at stake
                                        </span>
                                      </div>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {dispute.matchStatus}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {dispute.participants.map((participant) => (
                                      <div
                                        key={participant.id}
                                        className="rounded-lg border border-border/50 bg-background/40 p-3"
                                      >
                                        <div className="text-xs text-muted-foreground mb-1">
                                          Participant
                                        </div>
                                        <div className="text-sm font-semibold text-foreground">
                                          {participant.username}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="space-y-3">
                                    {dispute.reports.map((report) => (
                                      <div
                                        key={report.id}
                                        className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="text-sm font-semibold text-foreground">
                                            Report by {report.disputantUsername}
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {report.claimedWinnerId
                                              ? `Claims winner: ${
                                                  dispute.participants.find(
                                                    (p) =>
                                                      p.id ===
                                                      report.claimedWinnerId,
                                                  )?.username || "Unknown"
                                                }`
                                              : "No claimed winner"}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                          {report.description ||
                                            "No description provided."}
                                        </p>
                                        {report.evidenceUrls.length > 0 ? (
                                          <div className="space-y-2">
                                            {(() => {
                                              const imageExts =
                                                /\.(jpg|jpeg|png|webp|gif)(\?|$)/i;
                                              const isUrl = (s: string) =>
                                                /^https?:\/\//i.test(s);
                                              const images =
                                                report.evidenceUrls.filter(
                                                  (u) => imageExts.test(u),
                                                );
                                              const links =
                                                report.evidenceUrls.filter(
                                                  (u) =>
                                                    isUrl(u) &&
                                                    !imageExts.test(u),
                                                );
                                              const texts =
                                                report.evidenceUrls.filter(
                                                  (u) => !isUrl(u),
                                                );
                                              return (
                                                <>
                                                  {images.length > 0 && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                      {images.map((url, i) => (
                                                        <a
                                                          key={`${report.id}-img-${i}`}
                                                          href={url}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className="block overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                                                        >
                                                          <img
                                                            src={url}
                                                            alt={`Screenshot ${i + 1}`}
                                                            className="h-28 w-full object-cover"
                                                            onError={(e) => {
                                                              (
                                                                e.target as HTMLImageElement
                                                              ).style.display =
                                                                "none";
                                                            }}
                                                          />
                                                        </a>
                                                      ))}
                                                    </div>
                                                  )}
                                                  {texts.length > 0 && (
                                                    <div className="rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                                                      {texts.join("\n")}
                                                    </div>
                                                  )}
                                                  {links.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                      {links.map((url, i) => (
                                                        <a
                                                          key={`${report.id}-link-${i}`}
                                                          href={url}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className="text-xs text-primary underline underline-offset-2 break-all"
                                                        >
                                                          {url}
                                                        </a>
                                                      ))}
                                                    </div>
                                                  )}
                                                </>
                                              );
                                            })()}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-muted-foreground">
                                            No evidence files uploaded.
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  <div className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2">
                                    <label className="text-xs text-muted-foreground block">
                                      Resolution note (optional)
                                    </label>
                                    <Textarea
                                      value={actionNote}
                                      onChange={(e) =>
                                        setActionNote(e.target.value)
                                      }
                                      placeholder="Add a short moderator note for this decision"
                                      className="min-h-20"
                                    />
                                  </div>

                                  {/* ── AI Dispute Assistant ───────── */}
                                  {dispute.reports.map((report) => {
                                    const analysis = analysisMap[report.id];
                                    const isAnalyzing =
                                      analyzingId === report.id;
                                    const suggestedUser =
                                      analysis?.suggestedWinnerId
                                        ? dispute.participants.find(
                                            (p) =>
                                              p.id ===
                                              analysis.suggestedWinnerId,
                                          )
                                        : null;

                                    return (
                                      <Card
                                        key={`ai-${report.id}`}
                                        className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/5 relative overflow-hidden"
                                      >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 animate-pulse pointer-events-none" />
                                        <CardContent className="p-4 relative">
                                          <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                                              <Brain className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                              <h4 className="font-semibold text-foreground flex items-center gap-2">
                                                AI Dispute Assistant
                                                <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                                              </h4>
                                              <p className="text-xs text-muted-foreground">
                                                Powered by trust scoring +
                                                GPT-4o mini ·{" "}
                                                {report.disputantUsername}'s
                                                report
                                              </p>
                                            </div>
                                            {!analysis && !isAnalyzing && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-primary/50 text-primary hover:bg-primary/10 shrink-0"
                                                onClick={() =>
                                                  void handleAnalyze(report.id)
                                                }
                                              >
                                                <Zap className="h-3 w-3 mr-1" />
                                                Analyze
                                              </Button>
                                            )}
                                            {analysis && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-foreground shrink-0"
                                                onClick={() =>
                                                  setCollapsedAnalysis(
                                                    (prev) => ({
                                                      ...prev,
                                                      [report.id]:
                                                        !prev[report.id],
                                                    }),
                                                  )
                                                }
                                              >
                                                {collapsedAnalysis[
                                                  report.id
                                                ] ? (
                                                  <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                  <ChevronUp className="h-4 w-4" />
                                                )}
                                              </Button>
                                            )}
                                          </div>

                                          {isAnalyzing && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                              Running analysis…
                                            </div>
                                          )}

                                          {analysis &&
                                            !collapsedAnalysis[report.id] && (
                                              <>
                                                {/* Suggested Winner */}
                                                <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                                                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                    <Zap className="h-3 w-3" />
                                                    AI Recommendation
                                                  </div>
                                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">
                                                      <CheckCircle className="h-4 w-4 mr-2" />
                                                      Suggested Winner:{" "}
                                                      {suggestedUser?.username ??
                                                        analysis.suggestedWinnerId ??
                                                        "Unknown"}
                                                    </Badge>
                                                    <div className="text-sm">
                                                      <span className="text-muted-foreground">
                                                        Confidence:{" "}
                                                      </span>
                                                      <span
                                                        className={`font-semibold ${
                                                          analysis.confidence >=
                                                          75
                                                            ? "text-emerald-400"
                                                            : analysis.confidence >=
                                                                50
                                                              ? "text-amber-400"
                                                              : "text-red-400"
                                                        }`}
                                                      >
                                                        {analysis.confidence.toFixed(
                                                          0,
                                                        )}
                                                        %
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Confidence bar */}
                                                <div className="mb-4">
                                                  <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs text-muted-foreground">
                                                      Confidence Score
                                                    </span>
                                                    <span className="text-sm font-semibold text-primary">
                                                      {analysis.confidence.toFixed(
                                                        0,
                                                      )}
                                                      %
                                                    </span>
                                                  </div>
                                                  <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                                                    <motion.div
                                                      initial={{ width: 0 }}
                                                      animate={{
                                                        width: `${analysis.confidence}%`,
                                                      }}
                                                      transition={{
                                                        duration: 1,
                                                        ease: "easeOut",
                                                      }}
                                                      className="h-full bg-gradient-to-r from-primary via-purple-500 to-blue-500"
                                                    />
                                                  </div>
                                                </div>

                                                {/* Reasoning */}
                                                <div className="mb-4 p-3 bg-background/50 border border-border/30 rounded-lg">
                                                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                    <Brain className="h-3 w-3" />
                                                    AI Reasoning
                                                  </div>
                                                  <p className="text-sm text-foreground leading-relaxed">
                                                    {analysis.reasoning}
                                                  </p>
                                                </div>

                                                {/* Evidence points */}
                                                {analysis.evidenceSummary
                                                  .length > 0 && (
                                                  <div className="mb-4">
                                                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                      <FileText className="h-3 w-3" />
                                                      Key Evidence Points
                                                    </div>
                                                    <ul className="space-y-2 text-sm">
                                                      {analysis.evidenceSummary.map(
                                                        (point, i) => (
                                                          <li
                                                            key={i}
                                                            className="flex items-start gap-2"
                                                          >
                                                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                                            <span className="text-foreground">
                                                              {point}
                                                            </span>
                                                          </li>
                                                        ),
                                                      )}
                                                    </ul>
                                                  </div>
                                                )}

                                                {/* AI action buttons */}
                                                <div className="grid grid-cols-2 gap-2">
                                                  <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                    disabled={
                                                      resolvingDisputeId ===
                                                      dispute.matchId
                                                    }
                                                    onClick={() =>
                                                      void handleAcceptAI(
                                                        report.id,
                                                        analysis,
                                                        dispute.matchId,
                                                      )
                                                    }
                                                  >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Accept AI Decision
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                                                    onClick={() =>
                                                      setAnalysisMap((prev) => {
                                                        const next = {
                                                          ...prev,
                                                        };
                                                        delete next[report.id];
                                                        return next;
                                                      })
                                                    }
                                                  >
                                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                                    Override / Re-run
                                                  </Button>
                                                </div>
                                              </>
                                            )}

                                          {analysisMap[report.id] === null && (
                                            <div className="text-sm text-red-400 flex items-center gap-2">
                                              <AlertCircle className="h-4 w-4" />
                                              Analysis failed. Check that{" "}
                                              <code className="text-xs bg-muted px-1 rounded">
                                                OPENAI_API_KEY
                                              </code>{" "}
                                              is set in backend .env.
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    );
                                  })}

                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                                    {dispute.participants.map((participant) => (
                                      <Button
                                        key={participant.id}
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                        disabled={
                                          resolvingDisputeId === dispute.matchId
                                        }
                                        onClick={() =>
                                          void handleResolveDispute(
                                            dispute.matchId,
                                            participant.id,
                                            participant.username,
                                          )
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Award {participant.username}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
