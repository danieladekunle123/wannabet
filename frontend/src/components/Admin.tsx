import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Settings,
  Shield,
  Database,
  Users,
  DollarSign,
  Activity,
  Bug,
  Bell,
  Lock,
  Globe,
  Server,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Crown,
  Coins,
  BarChart3,
  Wifi,
  Clock,
  Cpu,
  HardDrive,
  Image,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { motion } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function BugReportCard({
  report,
  updating,
  onUpdateStatus,
}: {
  report: any;
  updating: boolean;
  onUpdateStatus: (status: string, note?: string) => void;
}) {
  const [adminNote, setAdminNote] = React.useState(report.adminNote || "");

  const severityColor = (s: string) => {
    if (s === "critical") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (s === "high")
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (s === "medium")
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  const statusColor = (s: string) => {
    if (s === "fixed" || s === "closed")
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "investigating")
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  return (
    <Card className="bg-muted/30 border-border/50 hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground">
                  {report.title}
                </h4>
                <Badge className={`text-xs ${severityColor(report.severity)}`}>
                  {report.severity}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs capitalize">
                  {report.category}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(report.createdAt).toLocaleString()}
                </span>
                {report.user && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {report.user.username}
                  </span>
                )}
              </div>
            </div>
            <Badge className={`text-xs shrink-0 ${statusColor(report.status)}`}>
              {report.status}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground bg-background/40 rounded-lg p-3 border border-border/50">
            {report.description}
          </p>

          {/* Steps if present */}
          {report.steps && (
            <div className="text-xs font-mono text-muted-foreground bg-background/40 rounded-lg p-3 border border-border/50 whitespace-pre-wrap">
              {report.steps}
            </div>
          )}

          {/* Screenshot if present */}
          {report.imageUrl && (
            <div className="rounded-lg overflow-hidden border border-border/50">
              <img
                src={`${API_URL}${report.imageUrl}`}
                alt="Bug screenshot"
                className="w-full max-h-48 object-contain bg-muted/20 cursor-pointer"
                onClick={() =>
                  window.open(`${API_URL}${report.imageUrl}`, "_blank")
                }
              />
            </div>
          )}

          {/* Admin controls */}
          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="flex flex-wrap gap-2">
              {(["open", "investigating", "fixed", "closed"] as const).map(
                (s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={report.status === s ? "default" : "outline"}
                    className={
                      report.status === s
                        ? "bg-primary text-primary-foreground"
                        : "border-border/50 hover:border-primary/50 text-xs capitalize"
                    }
                    disabled={updating || report.status === s}
                    onClick={() => onUpdateStatus(s, adminNote || undefined)}
                  >
                    {s === "fixed" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {s === "investigating" && <Eye className="h-3 w-3 mr-1" />}
                    {s === "closed" && <XCircle className="h-3 w-3 mr-1" />}
                    <span className="capitalize">{s}</span>
                  </Button>
                ),
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 text-sm px-3 py-1.5 rounded-md border border-border/50 bg-muted/30 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                placeholder="Add admin note (optional)…"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10 shrink-0"
                disabled={updating}
                onClick={() =>
                  onUpdateStatus(report.status, adminNote || undefined)
                }
              >
                Save Note
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Admin() {
  const [activeTab, setActiveTab] = useState("overview");

  const { token } = useAuth();
  const { currency, rates } = useCurrency();

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Bug reports
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [bugReportsLoading, setBugReportsLoading] = useState(false);
  const [bugReportFilter, setBugReportFilter] = useState("all");
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  const fetchBugReports = async (status = "all") => {
    if (!token) return;
    setBugReportsLoading(true);
    try {
      const params = status !== "all" ? `?status=${status}` : "";
      const res = await fetch(`${API_URL}/users/admin/bug-reports${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBugReports(data as any[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBugReportsLoading(false);
    }
  };

  const updateBugReportStatus = async (
    id: string,
    status: string,
    adminNote?: string,
  ) => {
    if (!token) return;
    setUpdatingReportId(id);
    try {
      await fetch(`${API_URL}/users/admin/bug-reports/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          ...(adminNote !== undefined && { adminNote }),
        }),
      });
      void fetchBugReports(bugReportFilter);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingReportId(null);
    }
  };

  // Feature toggles
  const [features, setFeatures] = useState({
    tournaments: true,
    wagers: true,
    socialHubs: true,
    liveChat: true,
    leaderboards: true,
    achievements: true,
    escrowSystem: true,
    referrals: false,
  });

  // Platform settings
  const [platformSettings, setPlatformSettings] = useState({
    siteName: "WannaBet?",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    twoFactorEnabled: true,
    minWagerAmount: 5,
    maxWagerAmount: 1000,
    platformFee: 5,
    escrowHoldTime: 24,
    maxActiveMatches: 10,
    trustScoreThreshold: 50,
  });

  function formatUptime(secs: number): string {
    if (!secs) return "0m";
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  // System stats (fetched)
  const [systemStats, setSystemStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalMatches: 0,
    activeMatches: 0,
    totalEscrow: 0,
    totalWalletBalance: 0,
    serverUptime: "unknown",
    avgResponseTime: "unknown",
    databaseSize: "unknown",
    apiCalls: 0,
    errorRate: "0%",
    matchesByStatus: [],
  });

  // Live health state
  const [healthData, setHealthData] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthLastUpdated, setHealthLastUpdated] = useState<Date | null>(null);

  // Revenue data
  const [revenueData, setRevenueData] = useState<any>(null);

  // Database management
  const [backupLoading, setBackupLoading] = useState(false);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [optimizeStatus, setOptimizeStatus] = useState<
    "success" | "error" | null
  >(null);

  const handleBackup = async () => {
    if (!token) return;
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/admin/db-backup`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as any).message || "Backup failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wannabet-backup-${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Backup failed — check that pg_dump is available on the server");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!token) return;
    setOptimizeLoading(true);
    setOptimizeStatus(null);
    try {
      const res = await fetch(`${API_URL}/users/admin/db-optimize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setOptimizeStatus(res.ok ? "success" : "error");
    } catch (err) {
      console.error(err);
      setOptimizeStatus("error");
    } finally {
      setOptimizeLoading(false);
    }
  };

  const fetchRevenue = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/admin/revenue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setRevenueData(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (token) void fetchRevenue();
  }, [token, fetchRevenue]);

  const fetchHealth = React.useCallback(async () => {
    if (!token) return;
    setHealthLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/admin/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setHealthData(data);
      setHealthLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void fetchHealth();
    const interval = setInterval(() => {
      if (token) void fetchHealth();
    }, 30_000);
    return () => clearInterval(interval);
  }, [token, fetchHealth]);

  // Recent admin logs
  const [adminLogs, setAdminLogs] = React.useState<any[]>([]);

  const fetchAdminLogs = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/admin/activity-log`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAdminLogs(data.logs ?? []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (token) void fetchAdminLogs();
    if (token) void fetchBugReports();
  }, [token, fetchAdminLogs]);

  const handleFeatureToggle = (feature: string) => {
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  useEffect(() => {
    if (token) fetchUsers(1);
    if (token) fetchStats();
    if (token) void fetchConfig();
  }, [token]);

  async function fetchConfig() {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/admin/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPlatformSettings((prev) => ({
        ...prev,
        siteName: data.siteName ?? prev.siteName,
        maintenanceMode: data.maintenanceMode ?? prev.maintenanceMode,
        registrationEnabled:
          data.registrationEnabled ?? prev.registrationEnabled,
        trustScoreThreshold:
          data.trustScoreThreshold ?? prev.trustScoreThreshold,
        minWagerAmount: data.minWagerAmount ?? prev.minWagerAmount,
        maxWagerAmount: data.maxWagerAmount ?? prev.maxWagerAmount,
        maxActiveMatches: data.maxActiveMatchesPerUser ?? prev.maxActiveMatches,
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchStats() {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      // compute activeMatches from matchesByStatus excluding finished/cancelled
      const matchesByStatus = data.matchesByStatus || [];
      const totalMatches = matchesByStatus.reduce(
        (sum: number, s: any) => sum + (s._count?.status || 0),
        0,
      );
      // treat active matches as total minus finished/cancelled if present
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

      setSystemStats((prev) => ({
        ...prev,
        totalUsers: data.totalUsers || prev.totalUsers,
        totalMatches,
        activeMatches,
        totalEscrow: data.totalEscrow || prev.totalEscrow,
        totalWalletBalance: data.totalWalletBalance || prev.totalWalletBalance,
        matchesByStatus,
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchUsers(page = 1) {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/users?page=${page}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function changeRole(userId: string, role: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update role");
      }
      // update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u)),
      );
    } catch (err) {
      console.error(err);
      alert((err as any).message || "Failed to update role");
    }
  }

  const [configSaving, setConfigSaving] = React.useState(false);
  const [configSaveStatus, setConfigSaveStatus] = React.useState<
    "success" | "error" | null
  >(null);

  const handleSettingChange = (setting: string, value: any) => {
    setPlatformSettings((prev) => ({ ...prev, [setting]: value }));
  };

  async function saveConfig() {
    if (!token) return;
    setConfigSaving(true);
    setConfigSaveStatus(null);
    try {
      const res = await fetch(`${API_URL}/users/admin/config`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteName: platformSettings.siteName,
          maintenanceMode: platformSettings.maintenanceMode,
          registrationEnabled: platformSettings.registrationEnabled,
          trustScoreThreshold: platformSettings.trustScoreThreshold,
          minWagerAmount: platformSettings.minWagerAmount,
          maxWagerAmount: platformSettings.maxWagerAmount,
          maxActiveMatchesPerUser: platformSettings.maxActiveMatches,
        }),
      });
      setConfigSaveStatus(res.ok ? "success" : "error");
    } catch (err) {
      console.error(err);
      setConfigSaveStatus("error");
    } finally {
      setConfigSaving(false);
    }
  }

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "settings":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "moderation":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "system":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "finance":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
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
              <Crown className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Full control over platform configuration and management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={
                platformSettings.maintenanceMode
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }
            >
              {platformSettings.maintenanceMode
                ? "Maintenance Mode"
                : "System Online"}
            </Badge>
            <Badge className="bg-primary/20 text-primary border border-primary/30 text-lg px-4 py-2">
              <Activity className="h-4 w-4 mr-2" />
              {(healthData?.connectedClients ?? 0).toLocaleString()} Active
            </Badge>
          </div>
        </motion.div>

        {/* System Health Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-blue-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {systemStats.totalUsers.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Users
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-8 w-8 text-emerald-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {formatCurrencyFromEur(
                        (revenueData?.totalFeesCents ?? 0) / 100,
                        currency,
                        rates,
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Revenue
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Activity className="h-8 w-8 text-purple-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-400">
                      {systemStats.activeMatches}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Active Matches
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Coins className="h-8 w-8 text-amber-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-400">
                      {formatCurrencyFromEur(
                        systemStats.totalEscrow,
                        currency,
                        rates,
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      In Escrow
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Server className="h-8 w-8 text-blue-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-400">
                      {healthData ? formatUptime(healthData.uptimeSecs) : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Activity className="h-8 w-8 text-emerald-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {healthData ? `${healthData.db.latencyMs}ms` : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Response Time
                    </div>
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-auto lg:inline-grid bg-muted/50">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Bug className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>

              <TabsTrigger
                value="system"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Server className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Status */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5 text-blue-400" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              Database
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {systemStats.databaseSize}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Healthy
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Server className="h-5 w-5 text-purple-400" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              API Server
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {systemStats.apiCalls.toLocaleString()} calls
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              Error Rate
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Last 24 hours
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {systemStats.errorRate}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-5 w-5 text-yellow-400" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              Performance
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Avg response:{" "}
                              {healthData
                                ? `${healthData.db.latencyMs}ms`
                                : "—"}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Optimal
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Overview */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-emerald-400" />
                        Revenue Overview
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
                        onClick={() => void fetchRevenue()}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Total Deposits */}
                      <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          Total Deposited (all-time)
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">
                          {formatCurrencyFromEur(
                            (revenueData?.totalDepositsCents ?? 0) / 100,
                            currency,
                            rates,
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          This month:{" "}
                          <span className="text-emerald-400 font-medium">
                            {formatCurrencyFromEur(
                              (revenueData?.monthDepositsCents ?? 0) / 100,
                              currency,
                              rates,
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Platform Fees */}
                      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          Platform Fees Earned (all-time)
                        </div>
                        <div className="text-2xl font-bold text-blue-400">
                          {formatCurrencyFromEur(
                            (revenueData?.totalFeesCents ?? 0) / 100,
                            currency,
                            rates,
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          This month:{" "}
                          <span className="text-blue-400 font-medium">
                            {formatCurrencyFromEur(
                              (revenueData?.monthFeesCents ?? 0) / 100,
                              currency,
                              rates,
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Fee breakdown */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            Match Fees (5%)
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {formatCurrencyFromEur(
                              (revenueData?.matchFeesCents ?? 0) / 100,
                              currency,
                              rates,
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Vol:{" "}
                            {formatCurrencyFromEur(
                              (revenueData?.matchVolumeCents ?? 0) / 100,
                              currency,
                              rates,
                            )}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            Withdrawal Fees (2%)
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {formatCurrencyFromEur(
                              (revenueData?.withdrawalFeesCents ?? 0) / 100,
                              currency,
                              rates,
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Withdrawn:{" "}
                            {formatCurrencyFromEur(
                              (revenueData?.totalWithdrawalsCents ?? 0) / 100,
                              currency,
                              rates,
                            )}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            Tournament Fees
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {formatCurrencyFromEur(
                              (revenueData?.tournamentRevenueCents ?? 0) / 100,
                              currency,
                              rates,
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            entry fees collected
                          </div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            In Escrow Now
                          </div>
                          <div className="text-lg font-bold text-amber-400">
                            {formatCurrencyFromEur(
                              (revenueData?.totalEscrowCents ??
                                systemStats.totalEscrow) / 100,
                              currency,
                              rates,
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            locked in active matches
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Activity Log */}
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Recent Admin Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {adminLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No moderation activity recorded yet.
                        </p>
                      ) : (
                        adminLogs.map((log, index) => (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-300"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-foreground">
                                  {log.actorName}
                                </span>
                                <Badge className={getLogTypeColor(log.type)}>
                                  {log.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {log.action}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Platform Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* General Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-400" />
                      General Settings
                    </h3>

                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Site Name</Label>
                          <p className="text-sm text-muted-foreground">
                            The name of your platform
                          </p>
                        </div>
                        <Input
                          value={platformSettings.siteName}
                          onChange={(e) =>
                            handleSettingChange("siteName", e.target.value)
                          }
                          className="max-w-xs bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Maintenance Mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Disable site access for maintenance
                          </p>
                        </div>
                        <Switch
                          checked={platformSettings.maintenanceMode}
                          onCheckedChange={(checked) =>
                            handleSettingChange("maintenanceMode", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">User Registration</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow new user sign-ups
                          </p>
                        </div>
                        <Switch
                          checked={platformSettings.registrationEnabled}
                          onCheckedChange={(checked) =>
                            handleSettingChange("registrationEnabled", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Lock className="h-5 w-5 text-red-400" />
                      Security Settings
                    </h3>

                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Trust Score Threshold
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Minimum trust score to create matches:{" "}
                            {platformSettings.trustScoreThreshold}%
                          </p>
                        </div>
                        <div className="w-64">
                          <Slider
                            value={[platformSettings.trustScoreThreshold]}
                            onValueChange={(value) =>
                              handleSettingChange(
                                "trustScoreThreshold",
                                value[0],
                              )
                            }
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Settings */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      Financial Settings
                    </h3>

                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Minimum Wager Amount
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Minimum bet amount in USD
                          </p>
                        </div>
                        <Input
                          type="number"
                          value={platformSettings.minWagerAmount}
                          onChange={(e) =>
                            handleSettingChange(
                              "minWagerAmount",
                              parseInt(e.target.value),
                            )
                          }
                          className="max-w-xs bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Maximum Wager Amount
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Maximum bet amount in USD
                          </p>
                        </div>
                        <Input
                          type="number"
                          value={platformSettings.maxWagerAmount}
                          onChange={(e) =>
                            handleSettingChange(
                              "maxWagerAmount",
                              parseInt(e.target.value),
                            )
                          }
                          className="max-w-xs bg-background/50 border-border/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Match Settings */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-400" />
                      Match Settings
                    </h3>

                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            Max Active Matches Per User
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Limit simultaneous active matches
                          </p>
                        </div>
                        <Input
                          type="number"
                          value={platformSettings.maxActiveMatches}
                          onChange={(e) =>
                            handleSettingChange(
                              "maxActiveMatches",
                              parseInt(e.target.value),
                            )
                          }
                          className="max-w-xs bg-background/50 border-border/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50">
                    <Card className="border-primary/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          User Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingUsers ? (
                          <p>Loading users…</p>
                        ) : (
                          <div className="space-y-3">
                            {users.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No users found
                              </p>
                            ) : (
                              <div className="grid gap-2">
                                {users.map((u: any) => (
                                  <div
                                    key={u.id}
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {u.username}{" "}
                                        <span className="text-xs text-muted-foreground">
                                          {u.email}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {u.profile?.displayName}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Select
                                        value={u.role}
                                        onValueChange={(val: string) =>
                                          changeRole(u.id, val)
                                        }
                                      >
                                        <SelectTrigger className="w-40">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="PLAYER">
                                            PLAYER
                                          </SelectItem>
                                          <SelectItem value="MODERATOR">
                                            MODERATOR
                                          </SelectItem>
                                          <SelectItem value="ADMIN">
                                            ADMIN
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="pt-6 border-t border-border/50">
                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => void saveConfig()}
                        disabled={configSaving}
                      >
                        <CheckCircle
                          className={`h-4 w-4 mr-2 ${configSaving ? "animate-pulse" : ""}`}
                        />
                        {configSaving ? "Saving…" : "Save All Settings"}
                      </Button>
                      {configSaveStatus === "success" && (
                        <p className="text-xs text-emerald-400 text-center pt-2">
                          ✓ Settings saved successfully
                        </p>
                      )}
                      {configSaveStatus === "error" && (
                        <p className="text-xs text-red-400 text-center pt-2">
                          ✗ Failed to save settings
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="h-5 w-5 text-primary" />
                      Bug Reports
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Select
                        value={bugReportFilter}
                        onValueChange={(v) => {
                          setBugReportFilter(v);
                          void fetchBugReports(v);
                        }}
                      >
                        <SelectTrigger className="w-[160px] bg-muted/30 border-border/50">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Reports</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">
                            Investigating
                          </SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/10"
                        onClick={() => void fetchBugReports(bugReportFilter)}
                        disabled={bugReportsLoading}
                      >
                        <RefreshCw
                          className={`h-3 w-3 mr-1 ${bugReportsLoading ? "animate-spin" : ""}`}
                        />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bugReportsLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading reports…
                      </p>
                    ) : bugReports.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No bug reports found.
                      </p>
                    ) : (
                      bugReports.map((report: any) => (
                        <BugReportCard
                          key={report.id}
                          report={report}
                          updating={updatingReportId === report.id}
                          onUpdateStatus={(status, note) =>
                            void updateBugReportStatus(report.id, status, note)
                          }
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-6">
              {/* Live Health Dashboard */}
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Live System Health
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {healthLastUpdated && (
                        <span className="text-xs text-muted-foreground">
                          Updated {healthLastUpdated.toLocaleTimeString()}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/10"
                        onClick={() => void fetchHealth()}
                        disabled={healthLoading}
                      >
                        <RefreshCw
                          className={`h-3 w-3 mr-1 ${healthLoading ? "animate-spin" : ""}`}
                        />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!healthData && !healthLoading && (
                    <p className="text-sm text-muted-foreground">
                      No data yet. Click Refresh.
                    </p>
                  )}
                  {healthData && (
                    <div className="space-y-4">
                      {/* Status row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* API */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-semibold text-foreground">
                              API
                            </span>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Online
                          </Badge>
                        </div>

                        {/* Database */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-semibold text-foreground">
                              DB
                            </span>
                          </div>
                          <Badge
                            className={
                              healthData.db?.status === "ok"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
                                : "bg-red-500/20 text-red-400 border-red-500/30 text-xs"
                            }
                          >
                            {healthData.db?.status === "ok" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {healthData.db?.latencyMs ?? "?"}ms
                          </Badge>
                        </div>

                        {/* WebSocket */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Wifi className="h-4 w-4 text-green-400" />
                            <span className="text-sm font-semibold text-foreground">
                              Sockets
                            </span>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                            {healthData.connectedClients} online
                          </Badge>
                        </div>

                        {/* Uptime */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-semibold text-foreground">
                              Uptime
                            </span>
                          </div>
                          <span className="text-xs font-mono text-amber-400">
                            {(() => {
                              const s = healthData.uptimeSecs || 0;
                              const h = Math.floor(s / 3600);
                              const m = Math.floor((s % 3600) / 60);
                              const sec = s % 60;
                              return h > 0
                                ? `${h}h ${m}m`
                                : m > 0
                                  ? `${m}m ${sec}s`
                                  : `${sec}s`;
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Memory */}
                        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Cpu className="h-3 w-3" />
                            Memory
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {healthData.memory?.heapUsedMb ?? "?"} MB
                          </div>
                          <div className="text-xs text-muted-foreground">
                            heap / {healthData.memory?.heapTotalMb ?? "?"} MB
                            total &bull; RSS {healthData.memory?.rssMb ?? "?"}{" "}
                            MB
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, ((healthData.memory?.heapUsedMb || 0) / (healthData.memory?.heapTotalMb || 1)) * 100).toFixed(0)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Active Matches */}
                        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3" />
                            Active Matches
                          </div>
                          <div className="text-lg font-bold text-emerald-400">
                            {healthData.activeMatches ?? 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            in progress right now
                          </div>
                        </div>

                        {/* Open Disputes */}
                        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <AlertTriangle className="h-3 w-3" />
                            Open Disputes
                          </div>
                          <div
                            className={`text-lg font-bold ${(healthData.openDisputes ?? 0) > 0 ? "text-amber-400" : "text-emerald-400"}`}
                          >
                            {healthData.openDisputes ?? 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            awaiting resolution
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Database Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-blue-500/30 bg-blue-500/10">
                    <Database className="h-4 w-4 text-blue-400" />
                    <AlertDescription>
                      {healthData ? (
                        <>
                          DB latency:{" "}
                          <span className="font-semibold">
                            {healthData.db?.latencyMs}ms
                          </span>{" "}
                          &bull; {healthData.totalUsers?.toLocaleString()} total
                          users
                        </>
                      ) : (
                        systemStats.databaseSize
                      )}
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => void handleBackup()}
                      disabled={backupLoading}
                    >
                      <Download
                        className={`h-4 w-4 mr-2 ${backupLoading ? "animate-pulse" : ""}`}
                      />
                      {backupLoading ? "Generating backup…" : "Create Backup"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => void handleOptimize()}
                      disabled={optimizeLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${optimizeLoading ? "animate-spin" : ""}`}
                      />
                      {optimizeLoading
                        ? "Running VACUUM ANALYZE…"
                        : "Optimize Database"}
                    </Button>
                    {optimizeStatus === "success" && (
                      <p className="text-xs text-emerald-400 text-center pt-1">
                        ✓ VACUUM ANALYZE completed successfully
                      </p>
                    )}
                    {optimizeStatus === "error" && (
                      <p className="text-xs text-red-400 text-center pt-1">
                        ✗ Optimization failed — check server logs
                      </p>
                    )}
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
