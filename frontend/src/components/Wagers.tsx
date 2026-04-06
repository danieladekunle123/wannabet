import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertCircle,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import { getWagerEvents, type EventRecord } from "../services/eventsService";
import { useAuth } from "./AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import { searchGames } from "../services/rawgService";
import fillerBg from "../assets/fillerbg.jpg";

interface WagersProps {
  onNavigate?: (tab: string) => void;
}

export function Wagers({ onNavigate }: WagersProps = {}) {
  const { user } = useAuth();
  const { currency, rates } = useCurrency();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [gameCovers, setGameCovers] = useState<Record<string, string | null>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getWagerEvents();
        if (!cancelled) setEvents(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load wagers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!events.length) return;
    const uniqueGames = Array.from(new Set(events.map((e) => e.game)));
    uniqueGames.forEach(async (game) => {
      if (gameCovers[game] !== undefined) return;
      try {
        const res = await searchGames(game);
        const cover = res.results[0]?.background_image ?? null;
        setGameCovers((prev) => ({ ...prev, [game]: cover }));
      } catch {
        setGameCovers((prev) => ({ ...prev, [game]: null }));
      }
    });
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter(
      (event) => statusFilter === "all" || event.status === statusFilter,
    );
  }, [events, statusFilter]);

  const totalWagered = events.reduce(
    (sum, event) => sum + (event.wagerAmount || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Wagers</h1>
          <p className="text-muted-foreground">
            Real wager events from WannaBet
          </p>
        </div>
        <Button onClick={() => onNavigate?.("create-wager")}>
          <DollarSign className="h-4 w-4 mr-2" />
          Create Wager
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Wagered</div>
            <div className="text-2xl font-semibold">
              {formatCurrencyFromEur(totalWagered, currency, rates)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Active Wagers</div>
            <div className="text-2xl font-semibold">
              {
                events.filter(
                  (e) => e.status === "ongoing" || e.status === "upcoming",
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-semibold">
              {events.filter((e) => e.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="ongoing">Ongoing</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading wagers...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No wagers found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => {
            const isHost = !!event.hostId && event.hostId === user?.id;
            return (
              <Card
                key={event.id}
                className="border-border/50 hover:border-primary/50 transition-colors overflow-hidden"
              >
                {/* RAWG game cover banner */}
                <div className="relative h-24 bg-muted overflow-hidden">
                  <img
                    src={gameCovers[event.game] ?? fillerBg}
                    alt={event.game}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-blue-600/90 text-white text-xs">
                      <DollarSign className="h-3 w-3 mr-1" />
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
                  <h3 className="font-semibold text-foreground">
                    {event.title}
                  </h3>
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
                      <Clock className="h-3 w-3" />
                      {event.date || "TBD"} {event.time || ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />$
                      {(
                        event.wagerAmount ||
                        event.entryFee ||
                        0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onNavigate?.(`view-match-${event.sourceId}`)
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
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
