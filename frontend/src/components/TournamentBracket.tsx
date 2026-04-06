import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import {
  Trophy,
  Users,
  DollarSign,
  Clock,
  Crown,
  ArrowLeft,
  Calendar,
  Shield,
  Target,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Swords,
  Star,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import {
  getTournamentBracket,
  startTournament,
  cancelTournament,
  updateTournament,
  startTournamentMatch,
  submitTournamentMatchResult,
  forfeitTournamentMatch,
  resolveTournamentDispute,
} from "../lib/api";
import { Input } from "./ui/input";
import { useAuth } from "./AuthContext";

interface TournamentBracketProps {
  onNavigate?: (tab: string) => void;
  tournamentId?: string;
}

// ─── Local types (mirrors API response) ────────────────────────────────────

interface TeamSlot {
  id: string;
  name: string;
}

interface BracketMatch {
  id: string;
  matchIndex: number;
  status: string;
  teamAId: string | null;
  teamBId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: string | null;
  teamA: { id: string; team: TeamSlot } | null;
  teamB: { id: string; team: TeamSlot } | null;
  winner: { id: string; team: TeamSlot } | null;
}

interface BracketRound {
  roundNumber: number;
  roundName: string;
  matches: BracketMatch[];
}

interface TournamentData {
  id: string;
  name: string;
  game: string;
  format: string;
  teamSize: number;
  maxParticipants: number;
  entryFee: number;
  status: string;
  hostId: string | null;
  startAt: string | null;
  createdAt: string;
}

interface LeaderboardEntry {
  id: string;
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  scoreDiff: number;
}

// ─── Match card ─────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: BracketMatch;
  tournamentId: string;
  isHost: boolean;
  userId: string | undefined;
  onAction: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "border-border",
  ongoing: "border-primary",
  completed: "border-emerald-500/50",
  disputed: "border-amber-500",
};

const getStatusLabel = (status: string) => {
  if (status === "pending")
    return { label: "Pending", cls: "bg-muted text-muted-foreground" };
  if (status === "ongoing")
    return { label: "Live", cls: "bg-primary/20 text-primary animate-pulse" };
  if (status === "completed")
    return { label: "Done", cls: "bg-emerald-600/20 text-emerald-400" };
  if (status === "disputed")
    return { label: "Disputed", cls: "bg-amber-600/20 text-amber-400" };
  return { label: status, cls: "bg-muted text-muted-foreground" };
};

function MatchCard({
  match,
  tournamentId,
  isHost,
  userId,
  onAction,
}: MatchCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const [claimA, setClaimA] = useState("");
  const [claimB, setClaimB] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);

  const teamAName = match.teamA?.team.name ?? "TBD";
  const teamBName = match.teamB?.team.name ?? "TBD";
  const aWon = match.winnerId === match.teamAId;
  const bWon = match.winnerId === match.teamBId;
  const statusInfo = getStatusLabel(match.status);
  const borderCls = STATUS_COLORS[match.status] ?? "border-border";
  const isLive = match.status === "ongoing";
  const isDone = match.status === "completed";
  const isPlayable =
    ["pending", "ongoing"].includes(match.status) &&
    !!match.teamAId &&
    !!match.teamBId;

  async function handleSubmit(winnerTTeamId: string) {
    if (!winnerTTeamId) return;
    setSubmitting(true);
    try {
      const sA = claimA !== "" ? Number(claimA) : undefined;
      const sB = claimB !== "" ? Number(claimB) : undefined;
      await submitTournamentMatchResult(tournamentId, match.id, {
        claimedWinnerId: winnerTTeamId,
        scoreA: sA,
        scoreB: sB,
      });
      setShowSubmit(false);
      onAction();
    } catch (e: any) {
      alert(e?.message ?? "Failed to submit result");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartMatch() {
    setSubmitting(true);
    try {
      await startTournamentMatch(tournamentId, match.id);
      onAction();
    } catch (e: any) {
      alert(e?.message ?? "Failed to start match");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForfeit() {
    if (!confirm("Forfeit this match? Your opponent will auto-win.")) return;
    setSubmitting(true);
    try {
      await forfeitTournamentMatch(tournamentId, match.id);
      onAction();
    } catch (e: any) {
      alert(e?.message ?? "Failed to forfeit");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(winnerTTeamId: string) {
    setSubmitting(true);
    try {
      await resolveTournamentDispute(tournamentId, match.id, winnerTTeamId);
      onAction();
    } catch (e: any) {
      alert(e?.message ?? "Failed to resolve dispute");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`relative bg-card rounded-lg border overflow-hidden min-w-[260px] ${borderCls}`}
    >
      {/* Header */}
      <div className="bg-muted/30 px-3 py-1.5 border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          #{match.matchIndex + 1}
        </span>
        <span
          className={`text-[10px] rounded px-1.5 py-0.5 font-semibold ${statusInfo.cls}`}
        >
          {isLive && (
            <span className="w-1.5 h-1.5 bg-current rounded-full inline-block mr-1" />
          )}
          {statusInfo.label}
        </span>
      </div>

      {/* Teams */}
      <div className="p-2.5 space-y-1.5">
        {[
          {
            ttId: match.teamAId,
            name: teamAName,
            score: match.scoreA,
            won: aWon,
          },
          {
            ttId: match.teamBId,
            name: teamBName,
            score: match.scoreB,
            won: bWon,
          },
        ].map((side, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-2.5 py-2 rounded ${
              isDone
                ? side.won
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-muted/20 opacity-60"
                : "bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {side.won && (
                <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              )}
              <span
                className={`text-sm ${side.won ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {side.name}
              </span>
            </div>
            {isDone && side.score !== null && (
              <span
                className={`text-base font-bold ml-2 ${side.won ? "text-primary" : "text-muted-foreground"}`}
              >
                {side.score}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      {isPlayable && (
        <div className="px-2.5 pb-2.5 space-y-1.5">
          {match.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-7"
              onClick={handleStartMatch}
              disabled={submitting}
            >
              <Swords className="h-3 w-3 mr-1" /> Start Match
            </Button>
          )}
          {!showSubmit && (
            <Button
              size="sm"
              className="w-full text-xs h-7"
              onClick={() => setShowSubmit(true)}
              disabled={submitting}
            >
              Submit Result
            </Button>
          )}
          {showSubmit && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                <input
                  className="w-12 h-7 rounded border border-border bg-background text-center text-sm"
                  placeholder="A"
                  value={claimA}
                  onChange={(e) => setClaimA(e.target.value)}
                />
                <span className="self-center">-</span>
                <input
                  className="w-12 h-7 rounded border border-border bg-background text-center text-sm"
                  placeholder="B"
                  value={claimB}
                  onChange={(e) => setClaimB(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => match.teamAId && handleSubmit(match.teamAId)}
                disabled={submitting}
              >
                {teamAName} Wins
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-7"
                onClick={() => match.teamBId && handleSubmit(match.teamBId)}
                disabled={submitting}
              >
                {teamBName} Wins
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs h-7"
                onClick={() => setShowSubmit(false)}
              >
                Cancel
              </Button>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs h-7 text-destructive hover:text-destructive"
            onClick={handleForfeit}
            disabled={submitting}
          >
            Forfeit
          </Button>
        </div>
      )}

      {/* Host dispute resolution */}
      {isHost && match.status === "disputed" && (
        <div className="px-2.5 pb-2.5 space-y-1">
          <p className="text-xs text-amber-400 font-semibold">
            Resolve dispute:
          </p>
          <Button
            size="sm"
            className="w-full text-xs h-7"
            onClick={() => match.teamAId && handleResolve(match.teamAId)}
            disabled={submitting}
          >
            {teamAName} Wins
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-7"
            onClick={() => match.teamBId && handleResolve(match.teamBId)}
            disabled={submitting}
          >
            {teamBName} Wins
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function TournamentBracket({
  onNavigate,
  tournamentId,
}: TournamentBracketProps) {
  const { user } = useAuth();
  const { currency, rates } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [rounds, setRounds] = useState<BracketRound[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Edit / cancel state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStartAt, setEditStartAt] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isHost = !!user && tournament?.hostId === user.id;

  async function fetchBracket() {
    if (!tournamentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTournamentBracket(tournamentId);
      setTournament(data.tournament);
      setRounds(data.rounds ?? []);
      setLeaderboard(data.leaderboard ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load bracket");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!tournamentId || !tournament) return;
    setEditSaving(true);
    setEditError(null);
    try {
      await updateTournament(tournamentId, {
        name: editName.trim() || undefined,
        startAt: editStartAt ? new Date(editStartAt).toISOString() : null,
      });
      setEditMode(false);
      await fetchBracket();
    } catch (e: any) {
      setEditError(e?.message ?? "Failed to save changes");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleCancel() {
    if (!tournamentId) return;
    setCancelling(true);
    try {
      await cancelTournament(tournamentId);
      onNavigate?.("tournaments");
    } catch (e: any) {
      setError(e?.message ?? "Failed to cancel tournament");
      setCancelling(false);
      setConfirmCancel(false);
    }
  }

  function openEditMode() {
    if (!tournament) return;
    setEditName(tournament.name);
    setEditStartAt(
      tournament.startAt
        ? new Date(tournament.startAt).toISOString().slice(0, 16)
        : "",
    );
    setEditError(null);
    setEditMode(true);
  }

  useEffect(() => {
    fetchBracket();
  }, [tournamentId]);

  const allMatches = rounds.flatMap((r) => r.matches);
  const pendingCount = allMatches.filter(
    (m) => m.status === "pending" && m.teamAId && m.teamBId,
  ).length;
  const ongoingCount = allMatches.filter((m) => m.status === "ongoing").length;
  const disputedCount = allMatches.filter(
    (m) => m.status === "disputed",
  ).length;

  const formatLabel: Record<string, string> = {
    single_elimination: "Single Elimination",
    double_elimination: "Double Elimination",
    round_robin: "Round Robin",
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate?.("tournaments")}
        className="hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tournaments
      </Button>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Loading bracket...</span>
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-6 flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {!loading && !error && tournament && (
        <>
          {/* Tournament Header */}
          <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shrink-0 shadow-lg">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                      {tournament.name}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className="bg-primary/20 text-primary">
                        {tournament.game}
                      </Badge>
                      <Badge
                        className={
                          tournament.status === "ongoing"
                            ? "bg-emerald-600/20 text-emerald-400"
                            : tournament.status === "completed"
                              ? "bg-zinc-600/20 text-zinc-400"
                              : "bg-sky-600/20 text-sky-400"
                        }
                      >
                        {tournament.status}
                      </Badge>
                      <Badge variant="outline">
                        {formatLabel[tournament.format] ?? tournament.format}
                      </Badge>
                      {isHost && (
                        <Badge className="bg-amber-600 text-white">Host</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-muted-foreground">Teams:</span>
                        <span className="font-medium">
                          {tournament.maxParticipants}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">
                          {tournament.teamSize}v{tournament.teamSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-muted-foreground">Entry:</span>
                        <span className="font-medium">
                          {formatCurrencyFromEur(
                            tournament.entryFee,
                            currency,
                            rates,
                          )}
                        </span>
                      </div>
                      {tournament.startAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-muted-foreground">
                            {new Date(tournament.startAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onNavigate?.(`tournament-schedule-${tournament.id}`)
                  }
                  className="shrink-0"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Host Controls — cancel / edit / start */}
          {isHost && ["upcoming", "open"].includes(tournament.status) && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                {!editMode && !confirmCancel && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
                      <Crown className="h-4 w-4" />
                      Host Controls
                    </div>
                    <div className="flex flex-wrap gap-2 ml-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openEditMode}
                        className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await startTournament(tournament.id);
                            await fetchBracket();
                          } catch (e: any) {
                            setError(
                              e?.message ?? "Failed to start tournament",
                            );
                          }
                        }}
                        disabled={rounds.length > 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Trophy className="h-3.5 w-3.5 mr-1.5" />
                        Start Tournament
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmCancel(true)}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Cancel Tournament
                      </Button>
                    </div>
                  </div>
                )}

                {/* Edit form */}
                {editMode && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-400 mb-2">
                      <Pencil className="h-4 w-4" />
                      Edit Tournament
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Name
                        </label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-muted/50 border-muted"
                          placeholder="Tournament name"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Start Date &amp; Time
                        </label>
                        <Input
                          type="datetime-local"
                          value={editStartAt}
                          onChange={(e) => setEditStartAt(e.target.value)}
                          className="bg-muted/50 border-muted"
                        />
                      </div>
                    </div>
                    {editError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {editError}
                      </p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditMode(false)}
                        disabled={editSaving}
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={editSaving || !editName.trim()}
                        className="bg-primary text-primary-foreground"
                      >
                        {editSaving ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}

                {/* Cancel confirmation */}
                {confirmCancel && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Cancel this tournament?
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          This cannot be undone. All registered teams will be
                          removed.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmCancel(false)}
                        disabled={cancelling}
                      >
                        Keep Tournament
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {cancelling ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Yes, Cancel Tournament
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats row */}
          {rounds.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Total Matches",
                  value: allMatches.length,
                  color: "text-blue-400",
                },
                {
                  label: "Pending",
                  value: pendingCount,
                  color: "text-sky-400",
                },
                {
                  label: "Live",
                  value: ongoingCount,
                  color: "text-emerald-400",
                },
                {
                  label: "Disputed",
                  value: disputedCount,
                  color: "text-amber-400",
                },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-3 text-center">
                    <div className={`text-2xl font-bold ${s.color}`}>
                      {s.value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {s.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Bracket is not yet generated */}
          {rounds.length === 0 && tournament.status !== "completed" && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium mb-1">
                  Bracket not yet generated
                </p>
                <p className="text-sm text-muted-foreground">
                  {isHost
                    ? "Once all teams have registered, click Start Tournament to generate the bracket."
                    : "Waiting for the host to start the tournament."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Single / Double elimination bracket */}
          {rounds.length > 0 && tournament.format !== "round_robin" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                  Tournament Bracket
                  <Badge variant="outline" className="ml-auto text-xs">
                    ← scroll →
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto pb-4 px-4">
                  <div className="flex gap-6 items-start min-w-max py-4">
                    {rounds.map((round) => (
                      <div
                        key={round.roundNumber}
                        className="flex flex-col gap-4"
                      >
                        {/* Round header */}
                        <div className="text-center font-bold text-sm bg-muted border border-border rounded-lg px-4 py-2 whitespace-nowrap">
                          {round.roundName}
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            ({round.matches.length}{" "}
                            {round.matches.length === 1 ? "match" : "matches"})
                          </span>
                        </div>
                        {/* Matches - vertically centred as rounds shrink */}
                        <div
                          className="flex flex-col gap-8"
                          style={{ justifyContent: "space-around", flex: 1 }}
                        >
                          {round.matches.map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              tournamentId={tournament.id}
                              isHost={isHost}
                              userId={user?.id}
                              onAction={fetchBracket}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Round-robin schedule + leaderboard */}
          {rounds.length > 0 && tournament.format === "round_robin" && (
            <div className="space-y-4">
              {/* Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-amber-400" /> Standings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-xs border-b border-border">
                          <th className="pb-2 text-left">#</th>
                          <th className="pb-2 text-left">Team</th>
                          <th className="pb-2 text-center">W</th>
                          <th className="pb-2 text-center">L</th>
                          <th className="pb-2 text-center">+/-</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, i) => (
                          <tr
                            key={entry.id}
                            className="border-b border-border/50 hover:bg-muted/30"
                          >
                            <td className="py-2 pr-3 text-muted-foreground">
                              {i + 1}
                            </td>
                            <td className="py-2 font-medium text-foreground">
                              {entry.teamName}
                            </td>
                            <td className="py-2 text-center text-emerald-400 font-bold">
                              {entry.wins}
                            </td>
                            <td className="py-2 text-center text-red-400">
                              {entry.losses}
                            </td>
                            <td
                              className={`py-2 text-center font-medium ${entry.scoreDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {entry.scoreDiff > 0 ? "+" : ""}
                              {entry.scoreDiff}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Rounds */}
              {rounds.map((round) => (
                <Card key={round.roundNumber}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {round.roundName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {round.matches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          tournamentId={tournament.id}
                          isHost={isHost}
                          userId={user?.id}
                          onAction={fetchBracket}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No tournament ID passed (static fallback message) */}
        </>
      )}

      {/* No ID: prompt to select a tournament */}
      {!loading && !error && !tournamentId && (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Select a tournament to view its bracket.
            </p>
            <Button
              className="mt-4"
              onClick={() => onNavigate?.("tournaments")}
            >
              Browse Tournaments
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
