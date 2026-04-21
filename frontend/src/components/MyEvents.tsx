import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Eye,
  Gamepad2,
  LogOut,
  MapPin,
  Play,
  Search,
  Swords,
  Target,
  Trash2,
  Trophy,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useAuth } from "./AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import {
  cancelEvent,
  editEvent,
  getMyEvents,
  joinEvent,
  leaveEvent,
  startEvent,
  type EventRecord,
} from "../services/eventsService";
import { MatchRequestsPanel } from "./MatchRequestsPanel";
import { usePresence } from "../context/PresenceContext";
import { useTranslation } from "react-i18next";

interface MyEventsProps {
  onNavigate?: (tab: string, query?: string) => void;
  initialTab?: string;
}

function getStatusColor(status: EventRecord["status"]) {
  switch (status) {
    case "ongoing":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse";
    case "upcoming":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "completed":
      return "bg-muted/20 text-muted-foreground border-muted/30";
    case "cancelled":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-muted/20 text-muted-foreground border-muted/30";
  }
}

function getTypeColor(type: EventRecord["type"]) {
  switch (type) {
    case "tournament":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "scrim":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "wager":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "custom":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    default:
      return "bg-muted/20 text-muted-foreground border-muted/30";
  }
}

function getTypeIcon(type: EventRecord["type"]) {
  switch (type) {
    case "tournament":
      return Trophy;
    case "scrim":
      return Swords;
    case "wager":
      return DollarSign;
    case "custom":
      return Gamepad2;
    default:
      return Calendar;
  }
}

export function MyEvents({ onNavigate, initialTab = "all" }: MyEventsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency, rates } = useCurrency();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(
        `dismissed_events_${user?.id ?? "guest"}`,
      );
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const typeLabels: Record<EventRecord["type"], string> = {
    tournament: t("common.tournaments"),
    scrim: t("common.scrims"),
    wager: t("common.wagers"),
    custom: t("my_events.custom"),
  };

  const statusLabels: Record<EventRecord["status"], string> = {
    upcoming: t("my_events.upcoming"),
    ongoing: t("my_events.ongoing"),
    completed: t("my_events.completed"),
    cancelled: t("common.cancelled"),
    disputed: "Disputed",
    archived: "Archived",
  };

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err?.message || t("errors.failed_load_events"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  // Real-time: refresh when any event is updated
  const { socket } = usePresence();
  useEffect(() => {
    if (!socket) return;
    const handler = () => void fetchMyEvents();
    socket.on("event:updated", handler);
    return () => {
      socket.off("event:updated", handler);
    };
  }, [socket]);

  useEffect(() => {
    setActiveTab(initialTab || "all");
  }, [initialTab]);

  const eventsWithRole = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        role:
          event.hostId && user?.id === event.hostId ? "host" : "participant",
      })),
    [events, user?.id],
  );

  const filteredEvents = useMemo(
    () =>
      eventsWithRole.filter((event) => {
        if (dismissedIds.has(event.id)) return false;
        const matchesSearch =
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.game.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeTab === "all" || event.type === activeTab;
        const matchesRole = filterRole === "all" || event.role === filterRole;
        const matchesStatus =
          filterStatus === "all" || event.status === filterStatus;
        return matchesSearch && matchesType && matchesRole && matchesStatus;
      }),
    [
      eventsWithRole,
      searchTerm,
      activeTab,
      filterRole,
      filterStatus,
      dismissedIds,
    ],
  );

  const stats = useMemo(() => {
    const completed = eventsWithRole.filter((e) => e.status === "completed");
    const resolved = completed.length;
    const wins = completed.filter(
      (e) => e.reportedWinnerId != null && e.reportedWinnerId === user?.id,
    ).length;
    const losses = completed.filter(
      (e) => e.reportedWinnerId != null && e.reportedWinnerId !== user?.id,
    ).length;
    return {
      total: eventsWithRole.length,
      upcoming: eventsWithRole.filter((e) => e.status === "upcoming").length,
      ongoing: eventsWithRole.filter((e) => e.status === "ongoing").length,
      hosting: eventsWithRole.filter((e) => e.role === "host").length,
      participating: eventsWithRole.filter((e) => e.role === "participant")
        .length,
      completed: resolved,
      wins,
      losses,
      winRate: resolved > 0 ? ((wins / resolved) * 100).toFixed(1) : "0.0",
    };
  }, [eventsWithRole]);

  const handleEditEvent = async (event: EventRecord) => {
    const nextTitle = window.prompt(
      t("my_events.edit_title_prompt"),
      event.title,
    );
    if (!nextTitle || nextTitle.trim() === event.title) return;
    try {
      setBusyId(event.id);
      await editEvent(event.sourceType, event.sourceId, {
        title: nextTitle.trim(),
      });
      await fetchMyEvents();
    } catch (err: any) {
      setError(err?.message || t("errors.failed_edit_event"));
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelEvent = async (event: EventRecord) => {
    try {
      setBusyId(event.id);
      await cancelEvent(event.sourceType, event.sourceId);
      setCancelSuccess(
        `"${event.title}" has been cancelled. Any escrowed funds have been refunded.`,
      );
      setTimeout(() => setCancelSuccess(null), 5000);
      await fetchMyEvents();
    } catch (err: any) {
      setError(err?.message || t("errors.failed_cancel_event"));
    } finally {
      setBusyId(null);
    }
  };

  const handleLeaveEvent = async (event: EventRecord) => {
    try {
      setBusyId(event.id);
      await leaveEvent(event.sourceType, event.sourceId);
      await fetchMyEvents();
    } catch (err: any) {
      setError(err?.message || t("errors.failed_leave_event"));
    } finally {
      setBusyId(null);
    }
  };

  const handleStartEvent = async (event: EventRecord) => {
    try {
      setBusyId(event.id);
      await startEvent(event.sourceType, event.sourceId);
      await fetchMyEvents();
    } catch (err: any) {
      setError(err?.message || t("errors.failed_start_event"));
    } finally {
      setBusyId(null);
    }
  };

  const handleJoinEvent = async (event: EventRecord) => {
    try {
      setBusyId(event.id);
      await joinEvent(event.sourceType, event.sourceId);
      await fetchMyEvents();
    } catch (err: any) {
      setError(err?.message || t("errors.failed_join_event"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDismissEvent = (event: EventRecord) => {
    setDismissedIds((prev) => {
      const next = new Set([...prev, event.id]);
      try {
        localStorage.setItem(
          `dismissed_events_${user?.id ?? "guest"}`,
          JSON.stringify([...next]),
        );
      } catch {}
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            {t("my_events.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("my_events.subtitle")}
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => onNavigate?.("create-match")}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {t("common.create_match")}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="border-primary/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Calendar className="h-6 w-6 text-blue-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {stats.total}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("my_events.stats_total")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Clock className="h-6 w-6 text-blue-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.upcoming}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("my_events.stats_upcoming")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Play className="h-6 w-6 text-emerald-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-400">
                    {stats.ongoing}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("my_events.stats_ongoing")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Trophy className="h-6 w-6 text-amber-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-400">
                    {stats.hosting}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("my_events.stats_hosting")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-500/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-6 w-6 text-purple-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-400">
                    {stats.participating}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("my_events.stats_enrolled")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-muted/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {stats.completed}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("my_events.stats_completed")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Target className="h-6 w-6 text-emerald-400" />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    <span className="text-emerald-400">{stats.wins}</span>
                    <span className="mx-0.5 text-zinc-500">/</span>
                    <span className="text-rose-400">{stats.losses}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Win / Loss
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-6 w-6 text-primary" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {stats.winRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("my_events.stats_win_rate")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-primary/30">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("my_events.search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-muted/30 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-muted/30 border-border/50">
                    <SelectValue placeholder={t("common.role")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("my_events.all_roles")}
                    </SelectItem>
                    <SelectItem value="host">{t("common.hosting")}</SelectItem>
                    <SelectItem value="participant">
                      {t("my_events.stats_enrolled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-muted/30 border-border/50">
                    <SelectValue placeholder={t("common.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("my_events.all_status")}
                    </SelectItem>
                    <SelectItem value="upcoming">
                      {t("my_events.upcoming")}
                    </SelectItem>
                    <SelectItem value="ongoing">
                      {t("my_events.ongoing")}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("my_events.completed")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("common.cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {cancelSuccess && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {cancelSuccess}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full bg-muted/30 border-border/50">
                <SelectValue placeholder={t("my_events.title")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("my_events.all")} ({eventsWithRole.length})
                </SelectItem>
                <SelectItem value="tournament">
                  {t("common.tournaments")} (
                  {eventsWithRole.filter((e) => e.type === "tournament").length}
                  )
                </SelectItem>
                <SelectItem value="scrim">
                  {t("common.scrims")} (
                  {eventsWithRole.filter((e) => e.type === "scrim").length})
                </SelectItem>
                <SelectItem value="wager">
                  {t("common.wagers")} (
                  {eventsWithRole.filter((e) => e.type === "wager").length})
                </SelectItem>
                <SelectItem value="custom">
                  {t("my_events.custom")} (
                  {eventsWithRole.filter((e) => e.type === "custom").length})
                </SelectItem>
                <SelectItem value="requests">
                  {t("my_events.requests")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsList className="hidden md:flex h-auto w-full items-stretch justify-start gap-2 overflow-x-auto whitespace-nowrap rounded-xl bg-muted/50 p-1 scrollbar-hide">
            <TabsTrigger
              value="all"
              className="min-w-[120px] shrink-0 justify-center gap-2 whitespace-nowrap px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Calendar className="h-4 w-4" />
              <span>{t("my_events.all")}</span>
              <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-blue-600 text-white text-[10px] leading-none">
                {eventsWithRole.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="tournament"
              className="min-w-[120px] shrink-0 justify-center gap-2 whitespace-nowrap px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="h-4 w-4" />
              <span>{t("common.tournaments")}</span>
              <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-amber-600 text-white text-[10px] leading-none">
                {eventsWithRole.filter((e) => e.type === "tournament").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="scrim"
              className="min-w-[120px] shrink-0 justify-center gap-2 whitespace-nowrap px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Swords className="h-4 w-4" />
              <span>{t("common.scrims")}</span>
              <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-blue-600 text-white text-[10px] leading-none">
                {eventsWithRole.filter((e) => e.type === "scrim").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="wager"
              className="min-w-[120px] shrink-0 justify-center gap-2 whitespace-nowrap px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <DollarSign className="h-4 w-4" />
              <span>{t("common.wagers")}</span>
              <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-purple-600 text-white text-[10px] leading-none">
                {eventsWithRole.filter((e) => e.type === "wager").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="min-w-[120px] shrink-0 justify-center gap-2 whitespace-nowrap px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Gamepad2 className="h-4 w-4" />
              <span>{t("my_events.custom")}</span>
              <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-emerald-600 text-white text-[10px] leading-none">
                {eventsWithRole.filter((e) => e.type === "custom").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="min-w-[120px] shrink-0 justify-center gap-2 whitespace-nowrap px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <UserPlus className="h-4 w-4" />
              <span>{t("my_events.requests")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {activeTab === "requests" ? (
              <MatchRequestsPanel onNavigate={onNavigate} />
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  <AnimatePresence>
                    {!loading && filteredEvents.length > 0 ? (
                      filteredEvents.map((event, index) => {
                        const TypeIcon = getTypeIcon(event.type);
                        const isHost = event.role === "host";
                        const isBusy = busyId === event.id;

                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className="border-border/50 hover:border-primary/50 transition-all duration-300 bg-muted/30 hover:bg-muted/50">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3 gap-3">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                                      <TypeIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-semibold text-foreground">
                                          {event.title}
                                        </h3>
                                        <Badge
                                          className={getStatusColor(
                                            event.status,
                                          )}
                                        >
                                          {statusLabels[event.status]}
                                        </Badge>
                                        <Badge
                                          className={getTypeColor(event.type)}
                                        >
                                          {typeLabels[event.type]}
                                        </Badge>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {isHost
                                            ? `👑 ${t("my_events.role_host")}`
                                            : `🎮 ${t("my_events.role_participant")}`}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <Gamepad2 className="h-4 w-4" />
                                        <span>{event.game}</span>
                                      </div>
                                      <div className="flex items-center gap-4 text-xs flex-wrap">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          {event.startTime ? (
                                            <>
                                              {event.date || t("lobbies.tbd")}{" "}
                                              {event.time || ""}
                                            </>
                                          ) : (
                                            <span className="text-blue-400 font-medium">
                                              On demand
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Users className="h-3 w-3" />
                                          {t("my_events.participants_count", {
                                            count: event.participants.length,
                                            max: event.maxParticipants,
                                          })}
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <MapPin className="h-3 w-3" />
                                          {event.region || t("common.global")}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        onNavigate?.(
                                          `view-match-${event.sourceId}`,
                                        )
                                      }
                                    >
                                      {" "}
                                      <Eye className="h-4 w-4" />{" "}
                                    </Button>
                                    {isHost && event.status === "upcoming" && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={isBusy}
                                        onClick={() => handleEditEvent(event)}
                                      >
                                        {" "}
                                        <Edit className="h-4 w-4" />{" "}
                                      </Button>
                                    )}
                                    {isHost &&
                                      event.sourceType === "match" &&
                                      event.status === "upcoming" &&
                                      event.participants.length <
                                        event.maxParticipants && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          disabled={isBusy}
                                          onClick={() => handleJoinEvent(event)}
                                        >
                                          {" "}
                                          <UserPlus className="h-4 w-4" />{" "}
                                        </Button>
                                      )}
                                    {isHost && event.status === "upcoming" && (
                                      <Button
                                        size="sm"
                                        variant={
                                          !event.startTime &&
                                          event.sourceType === "match" &&
                                          event.participants.length >= 2
                                            ? "default"
                                            : "ghost"
                                        }
                                        className={
                                          !event.startTime &&
                                          event.sourceType === "match" &&
                                          event.participants.length >= 2
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                            : ""
                                        }
                                        disabled={isBusy}
                                        onClick={() => handleStartEvent(event)}
                                      >
                                        <Play className="h-4 w-4" />
                                        {!event.startTime &&
                                        event.sourceType === "match" &&
                                        event.participants.length >= 2 ? (
                                          <span className="ml-1">Start</span>
                                        ) : null}
                                      </Button>
                                    )}
                                    {isHost &&
                                      !["cancelled", "completed"].includes(
                                        event.status,
                                      ) &&
                                      (event.status === "upcoming" ||
                                        (event.sourceType === "match"
                                          ? event.participants.length <= 1
                                          : event.participants.length ===
                                            0)) && (
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="text-red-400"
                                              disabled={isBusy}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Cancel "{event.title}"?
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will permanently cancel the
                                                event. All participants will be
                                                removed and any escrowed funds
                                                will be refunded. This cannot be
                                                undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Keep Event
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                onClick={() =>
                                                  handleCancelEvent(event)
                                                }
                                              >
                                                Yes, Cancel Event
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      )}
                                    {!isHost &&
                                      event.status !== "completed" &&
                                      event.status !== "cancelled" && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          disabled={isBusy}
                                          onClick={() =>
                                            handleLeaveEvent(event)
                                          }
                                        >
                                          {" "}
                                          <LogOut className="h-4 w-4" />{" "}
                                        </Button>
                                      )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-border/30 gap-3 flex-wrap">
                                  <div className="flex items-center gap-4 flex-wrap">
                                    {event.prizePool > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Trophy className="h-4 w-4 text-amber-400" />
                                        <span className="text-sm font-semibold text-amber-400">
                                          {formatCurrencyFromEur(
                                            event.prizePool,
                                            currency,
                                            rates,
                                          )}{" "}
                                          {t("common.prize")}
                                        </span>
                                      </div>
                                    )}
                                    {event.wagerAmount > 0 && (
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="h-4 w-4 text-purple-400" />
                                        <span className="text-sm font-semibold text-purple-400">
                                          {formatCurrencyFromEur(
                                            event.wagerAmount,
                                            currency,
                                            rates,
                                          )}{" "}
                                          {t("common.wager")}
                                        </span>
                                      </div>
                                    )}
                                    {event.entryFee > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Target className="h-4 w-4 text-blue-400" />
                                        <span className="text-sm text-muted-foreground">
                                          {formatCurrencyFromEur(
                                            event.entryFee,
                                            currency,
                                            rates,
                                          )}{" "}
                                          {t("common.entry")}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {event.status === "ongoing" && (
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() =>
                                        onNavigate?.(
                                          event.type === "tournament"
                                            ? `tournament-bracket-${event.sourceId}`
                                            : `view-match-${event.sourceId}`,
                                        )
                                      }
                                    >
                                      <Play className="h-4 w-4 mr-2" />
                                      {event.type === "tournament"
                                        ? (t("my_events.view_bracket") ??
                                          "View Bracket")
                                        : t("common.join_now")}
                                    </Button>
                                  )}
                                  {event.status === "upcoming" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-primary/30 hover:bg-primary/10"
                                      onClick={() =>
                                        onNavigate?.(
                                          event.type === "tournament"
                                            ? `tournament-bracket-${event.sourceId}`
                                            : `view-match-${event.sourceId}`,
                                        )
                                      }
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      {event.type === "tournament"
                                        ? "View Bracket"
                                        : t("common.view_details")}
                                    </Button>
                                  )}
                                  {event.status === "completed" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-primary/30 hover:bg-primary/10"
                                      onClick={() =>
                                        onNavigate?.(
                                          event.type === "tournament"
                                            ? `tournament-bracket-${event.sourceId}`
                                            : `view-match-${event.sourceId}`,
                                        )
                                      }
                                    >
                                      <Trophy className="h-4 w-4 mr-2 text-amber-400" />
                                      View Results
                                    </Button>
                                  )}
                                  {event.status === "cancelled" && (
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1 text-sm text-red-400">
                                        <XCircle className="h-4 w-4" />{" "}
                                        {t("common.cancelled")}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-red-400 h-9 w-9 p-0"
                                        title="Dismiss"
                                        onClick={() =>
                                          handleDismissEvent(event)
                                        }
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {loading
                            ? t("common.loading")
                            : t("my_events.no_active")}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {loading
                            ? t("my_events.fetching")
                            : searchTerm
                              ? t("my_events.empty_filtered")
                              : t("my_events.empty_intro")}
                        </p>
                        {!loading && (
                          <Button
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => onNavigate?.("create-match")}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t("common.create_match")}
                          </Button>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
