import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Clock,
  ArrowLeft,
  Calendar,
  Trophy,
  PlayCircle,
  CheckCircle2,
  Users,
  Loader2,
  AlertCircle,
  Crown,
  Swords,
} from "lucide-react";
import { getTournamentBracket } from "../lib/api";

interface TournamentScheduleProps {
  onNavigate?: (tab: string) => void;
  tournamentId?: string;
}

interface ScheduleMatch {
  id: string;
  matchIndex: number;
  status: string;
  teamA: { team: { name: string } } | null;
  teamB: { team: { name: string } } | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  teamAId: string | null;
  teamBId: string | null;
}

interface ScheduleRound {
  roundNumber: number;
  roundName: string;
  matches: ScheduleMatch[];
}

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  ongoing: { label: "Live", icon: PlayCircle, cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  completed: { label: "Completed", icon: CheckCircle2, cls: "bg-zinc-500/15 text-zinc-200 border-zinc-500/30" },
  disputed: { label: "Disputed", icon: AlertCircle, cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
}

export function TournamentSchedule({ onNavigate, tournamentId }: TournamentScheduleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentName, setTournamentName] = useState("Tournament");
  const [game, setGame] = useState("");
  const [rounds, setRounds] = useState<ScheduleRound[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [completedMatches, setCompletedMatches] = useState(0);

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTournamentBracket(tournamentId);
        if (cancelled) return;
        setTournamentName(data.tournament?.name ?? "Tournament");
        setGame(data.tournament?.game ?? "");
        const r: ScheduleRound[] = data.rounds ?? [];
        setRounds(r);
        const all = r.flatMap((rnd: ScheduleRound) => rnd.matches);
        setTotalMatches(all.length);
        setCompletedMatches(all.filter((m: ScheduleMatch) => m.status === "completed").length);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load schedule");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tournamentId]);

  const backTab = tournamentId ? `tournament-bracket-${tournamentId}` : "tournament-bracket";

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => onNavigate?.(backTab)} className="hover:bg-muted">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Bracket
      </Button>

      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Match Schedule</h1>
              <p className="text-sm text-muted-foreground mb-2">{tournamentName}{game ? ` · ${game}` : ""}</p>
              <div className="flex flex-wrap gap-2">
                {!loading && !error && (
                  <>
                    <Badge variant="outline" className="text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      {rounds.length} rounds
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Swords className="h-3 w-3 mr-1" />
                      {completedMatches}/{totalMatches} played
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Loading schedule...</span>
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

      {!loading && !error && !tournamentId && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No tournament selected. Open a tournament to view its schedule.
          </CardContent>
        </Card>
      )}

      {!loading && !error && rounds.length === 0 && !!tournamentId && (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No matches scheduled yet. The bracket will appear here once the tournament starts.</p>
          </CardContent>
        </Card>
      )}

      {/* Rounds */}
      {!loading && !error && rounds.length > 0 && (
        <div className="space-y-4">
          {rounds.map((round, ri) => {
            const liveCount = round.matches.filter((m) => m.status === "ongoing").length;
            const doneCount = round.matches.filter((m) => m.status === "completed").length;
            const roundStatus =
              doneCount === round.matches.length && round.matches.length > 0
                ? "completed"
                : liveCount > 0
                  ? "ongoing"
                  : "pending";
            const roundCfg = getStatusConfig(roundStatus);
            const RoundIcon = roundCfg.icon;

            return (
              <Card
                key={round.roundNumber}
                className={`animate-fadeInUp transition-all ${
                  roundStatus === "ongoing" ? "border-primary/50 bg-gradient-to-r from-primary/5 to-transparent" : ""
                }`}
                style={{ animationDelay: `${ri * 0.06}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          roundStatus === "ongoing"
                            ? "bg-primary text-primary-foreground"
                            : roundStatus === "completed"
                              ? "bg-emerald-600 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <RoundIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{round.roundName}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {doneCount}/{round.matches.length} matches completed
                        </p>
                      </div>
                    </div>
                    <Badge className={roundCfg.cls + " text-xs border"}>
                      {roundCfg.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    {round.matches.map((match) => {
                      const teamAName = match.teamA?.team.name ?? "TBD";
                      const teamBName = match.teamB?.team.name ?? "TBD";
                      const aWon = match.winnerId === match.teamAId;
                      const bWon = match.winnerId === match.teamBId;
                      const cfg = getStatusConfig(match.status);
                      const Icon = cfg.icon;
                      const hasScore = match.scoreA !== null || match.scoreB !== null;

                      return (
                        <div
                          key={match.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30 border border-border/50 hover:border-border transition-colors"
                        >
                          {/* Status icon */}
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              match.status === "ongoing"
                                ? "text-emerald-400 animate-pulse"
                                : match.status === "completed"
                                  ? "text-emerald-400"
                                  : match.status === "disputed"
                                    ? "text-amber-400"
                                    : "text-muted-foreground"
                            }`}
                          />

                          {/* Match info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              {/* Team A */}
                              <span
                                className={`text-sm truncate flex items-center gap-1 ${
                                  aWon ? "font-semibold text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {aWon && <Crown className="h-3 w-3 text-amber-400" />}
                                {teamAName}
                              </span>

                              {/* Score */}
                              {hasScore ? (
                                <span className="text-sm font-bold text-foreground tabular-nums shrink-0 mx-1">
                                  {match.scoreA ?? 0} – {match.scoreB ?? 0}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground mx-1">vs</span>
                              )}

                              {/* Team B */}
                              <span
                                className={`text-sm truncate text-right flex items-center gap-1 justify-end ${
                                  bWon ? "font-semibold text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {teamBName}
                                {bWon && <Crown className="h-3 w-3 text-amber-400" />}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-muted-foreground">Match {match.matchIndex + 1}</span>
                              <span className={`text-[10px] rounded px-1 ${cfg.cls} border`}>{cfg.label}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
