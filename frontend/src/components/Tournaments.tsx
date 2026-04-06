import React, { useEffect, useMemo, useState } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrency } from "../utils/formatCurrency";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  AlertCircle,
  Calendar,
  Eye,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import {
  getTournamentsEvents,
  type EventRecord,
} from "../services/eventsService";
import { useAuth } from "./AuthContext";
import { searchGames } from "../services/rawgService";
import fillerBg from "../assets/fillerbg.jpg";

interface TournamentsProps {
  onNavigate?: (tab: string) => void;
  showSeeAll?: boolean;
}

export function Tournaments({
  onNavigate,
  showSeeAll = false,
}: TournamentsProps) {
  const { user } = useAuth();
  const { currency, rates } = useCurrency();
  const [tournaments, setTournaments] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameCoversTournament, setGameCoversTournament] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTournamentsEvents();
        if (!cancelled) setTournaments(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load tournaments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch RAWG covers for tournament cards
  useEffect(() => {
    if (!tournaments.length) return;
    const uniqueGames = Array.from(new Set(tournaments.map((t) => t.game)));
    uniqueGames.forEach(async (game) => {
      if (gameCoversTournament[game] !== undefined) return;
      try {
        const res = await searchGames(game);
        const cover = res.results[0]?.background_image ?? null;
        setGameCoversTournament((prev) => ({ ...prev, [game]: cover }));
      } catch {
        setGameCoversTournament((prev) => ({ ...prev, [game]: null }));
      }
    });
  }, [tournaments]);

  const activeCount = useMemo(
    () =>
      tournaments.filter(
        (event) => event.status === "upcoming" || event.status === "ongoing",
      ).length,
    [tournaments],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Tournaments
          </h2>
          <p className="text-muted-foreground">
            Public tournaments created by users
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showSeeAll && (
            <Button
              variant="outline"
              onClick={() => onNavigate?.("tournaments")}
            >
              See All
            </Button>
          )}
          <Button onClick={() => onNavigate?.("create-tournament")}>
            Create Tournament
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {activeCount} active tournaments
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">
          Loading tournaments...
        </div>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No tournaments found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((event) => {
            const isHost = !!event.hostId && event.hostId === user?.id;
            return (
              <Card
                key={event.id}
                className="border-border/50 hover:border-primary/50 transition-colors overflow-hidden"
              >
                {/* RAWG game cover banner */}
                <div className="relative h-24 bg-muted overflow-hidden">
                  <img
                    src={gameCoversTournament[event.game] ?? fillerBg}
                    alt={event.game}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-amber-600/90 text-white text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      {event.game}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant="outline" className="bg-card/80 text-xs">
                      {event.status}
                    </Badge>
                    {isHost && (
                      <Badge className="bg-amber-600 text-white text-xs">
                        Host
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {event.title}
                    </h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {event.game}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.participants.length}/{event.maxParticipants}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.region || "Global"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {event.date || "TBD"} {event.time || ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {formatCurrency(
                        (event.prizePool || 0) * 100,
                        currency,
                        rates,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onNavigate?.(`tournament-bracket-${event.sourceId}`)
                      }
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Bracket
                    </Button>
                    {event.status === "upcoming" &&
                      event.hostId !== user?.id && (
                        <Button
                          size="sm"
                          onClick={() =>
                            onNavigate?.(`join-tournament-${event.sourceId}`)
                          }
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Join
                        </Button>
                      )}
                    {event.status === "upcoming" &&
                      event.hostId === user?.id && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            onNavigate?.(`tournament-bracket-${event.sourceId}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      )}
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
