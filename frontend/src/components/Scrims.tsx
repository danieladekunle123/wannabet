import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AlertCircle, Clock, Eye, MapPin, Swords, Users } from "lucide-react";
import { getScrimEvents, type EventRecord } from "../services/eventsService";
import { useAuth } from "./AuthContext";
import { searchGames } from "../services/rawgService";
import fillerBg from "../assets/fillerbg.jpg";

interface ScrimsProps {
  onNavigate?: (tab: string) => void;
  showSeeAll?: boolean;
}

export function Scrims({ onNavigate, showSeeAll = false }: ScrimsProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameCovers, setGameCovers] = useState<Record<string, string | null>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getScrimEvents();
        if (!cancelled) setEvents(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load scrims");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Scrims</h2>
          <p className="text-muted-foreground">
            Practice events created by players
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showSeeAll && (
            <Button variant="outline" onClick={() => onNavigate?.("scrims")}>
              See All
            </Button>
          )}
          <Button onClick={() => onNavigate?.("create-scrim")}>
            <Swords className="h-4 w-4 mr-2" />
            Create Scrim
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading scrims...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No scrims found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((event) => {
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
                    <Badge className="bg-card/80 text-foreground text-xs">
                      <Swords className="h-3 w-3 mr-1" />
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
