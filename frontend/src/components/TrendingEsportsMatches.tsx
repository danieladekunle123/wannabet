import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ExternalLink,
  Tv,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../lib/api";
import { getMatchLink, getTournamentLink } from "../utils/getMatchLink";

type EsportsMatch = {
  id?: number;
  teams: string[];
  game: string;
  startTime: string | null;
  league: string;
  tournamentName: string;
  status: string;
  streamUrl: string | null;
  infoUrl: string | null;
  apiUrl?: string | null;
};

type EsportsTournament = {
  id?: number;
  game: string;
  startTime: string | null;
  endTime: string | null;
  league: string;
  tournamentName: string;
  status: string;
  streamUrl: string | null;
  infoUrl: string | null;
  apiUrl?: string | null;
};

interface TrendingEsportsMatchesProps {
  onNavigate?: (tab: string) => void;
}

function formatDateTime(value: string | null) {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleString();
}

const PAGE_SIZE = 5;

export function TrendingEsportsMatches({}: TrendingEsportsMatchesProps) {
  const [matches, setMatches] = useState<EsportsMatch[]>([]);
  const [tournaments, setTournaments] = useState<EsportsTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchPage, setMatchPage] = useState(0);
  const [tournamentPage, setTournamentPage] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const mergePrioritizedMatches = (groups: EsportsMatch[][], max = 20) => {
      const seen = new Set<number>();
      const merged: EsportsMatch[] = [];

      for (const group of groups) {
        for (const match of group) {
          const id = Number(match.id || 0);
          if (!id || seen.has(id)) continue;
          seen.add(id);
          merged.push(match);
          if (merged.length >= max) return merged;
        }
      }

      return merged;
    };

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [liveData, upcomingData, recentData, tournamentsData] =
          await Promise.all([
            api.getEsportsLiveMatches(15),
            api.getEsportsUpcomingMatches(15),
            api.getEsportsRecentMatches(10),
            api.getEsportsTournaments(20),
          ]);

        if (cancelled) return;
        setMatches(
          mergePrioritizedMatches(
            [
              Array.isArray(liveData.matches) ? liveData.matches : [],
              Array.isArray(upcomingData.matches) ? upcomingData.matches : [],
              Array.isArray(recentData.matches) ? recentData.matches : [],
            ],
            25,
          ),
        );
        setTournaments(
          Array.isArray(tournamentsData.tournaments)
            ? tournamentsData.tournaments
            : [],
        );
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load esports feed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Tv className="h-5 w-5 text-primary" />
          Trending Esports Matches
        </h3>
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Live & Upcoming Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matches.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                No matches available right now.
              </p>
            )}
            {matches
              .slice(matchPage * PAGE_SIZE, matchPage * PAGE_SIZE + PAGE_SIZE)
              .map((match) => {
                const link = getMatchLink(match);
                const isLive = match.status?.toLowerCase() === "running";

                return (
                  <div
                    key={String(match.id)}
                    className="p-3 rounded-lg border border-border/60 bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {match.teams.length > 0
                            ? match.teams.join(" vs ")
                            : "TBD vs TBD"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {match.game}
                        </p>
                      </div>
                      <Badge
                        variant={isLive ? "default" : "outline"}
                        className={isLive ? "bg-red-600 text-white" : undefined}
                      >
                        {isLive ? "LIVE" : match.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      <p>
                        {isLive
                          ? "Status: Live now"
                          : `Start: ${formatDateTime(match.startTime)}`}
                      </p>
                      <p>League: {match.league}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="transition-all hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {link.label}
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            {matches.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMatchPage((p) => Math.max(0, p - 1))}
                  disabled={matchPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  {matchPage + 1} / {Math.ceil(matches.length / PAGE_SIZE)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setMatchPage((p) =>
                      Math.min(
                        Math.ceil(matches.length / PAGE_SIZE) - 1,
                        p + 1,
                      ),
                    )
                  }
                  disabled={
                    matchPage >= Math.ceil(matches.length / PAGE_SIZE) - 1
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Upcoming Tournaments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tournaments.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                No tournaments available right now.
              </p>
            )}
            {tournaments
              .slice(
                tournamentPage * PAGE_SIZE,
                tournamentPage * PAGE_SIZE + PAGE_SIZE,
              )
              .map((tournament) => {
                const link = getTournamentLink(tournament);

                return (
                  <div
                    key={String(tournament.id)}
                    className="p-3 rounded-lg border border-border/60 bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {tournament.tournamentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tournament.game}
                        </p>
                      </div>
                      <Badge variant="outline">{tournament.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Start: {formatDateTime(tournament.startTime)}</p>
                      <p>League: {tournament.league}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="transition-all hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {link.label}
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            {tournaments.length > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setTournamentPage((p) => Math.max(0, p - 1))}
                  disabled={tournamentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  {tournamentPage + 1} /{" "}
                  {Math.ceil(tournaments.length / PAGE_SIZE)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setTournamentPage((p) =>
                      Math.min(
                        Math.ceil(tournaments.length / PAGE_SIZE) - 1,
                        p + 1,
                      ),
                    )
                  }
                  disabled={
                    tournamentPage >=
                    Math.ceil(tournaments.length / PAGE_SIZE) - 1
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
