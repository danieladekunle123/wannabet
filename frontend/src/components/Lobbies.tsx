import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertCircle,
  Brain,
  Clock,
  DollarSign,
  Gamepad2,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import {
  getActiveEvents,
  getRecommendedEvents,
  type EventRecord,
  type RecommendedEvent,
} from "../services/eventsService";
import { searchGames } from "../services/rawgService";
import fillerBg from "../assets/fillerbg.jpg";
import { useAuth } from "./AuthContext";
import { GameSelector, type SelectedGameOption } from "./games/GameSelector";
import api from "../lib/api";
import {
  buildMatchmakingRegionOptions,
  DEFAULT_MATCHMAKING_REGIONS,
} from "../lib/matchmakingRegions";

interface LobbiesProps {
  onNavigate?: (tab: string) => void;
}

export function Lobbies({ onNavigate }: LobbiesProps = {}) {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [trustScoreByHost, setTrustScoreByHost] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<SelectedGameOption | null>(
    null,
  );
  const [regionFilter, setRegionFilter] = useState("all");
  const [regionOptions, setRegionOptions] = useState<string[]>([
    "all",
    ...DEFAULT_MATCHMAKING_REGIONS,
  ]);
  const [stakeRange, setStakeRange] = useState<[number, number]>([0, 100]);
  const [trustScoreMin, setTrustScoreMin] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [stakeBucket, setStakeBucket] = useState("all");

  // Main grid event covers
  const [eventCovers, setEventCovers] = useState<Record<string, string | null>>(
    {},
  );

  // Recommendation state
  const [recommendations, setRecommendations] = useState<RecommendedEvent[]>(
    [],
  );
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recCovers, setRecCovers] = useState<Record<string, string | null>>({});
  const [showRecommended, setShowRecommended] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getActiveEvents();
        if (!cancelled) {
          setEvents(data);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load lobbies");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch RAWG covers for main grid event cards
  useEffect(() => {
    if (!events.length) return;
    const uniqueGames = Array.from(new Set(events.map((e) => e.game)));
    uniqueGames.forEach(async (game) => {
      if (eventCovers[game] !== undefined) return;
      try {
        const res = await searchGames(game);
        const cover = res.results[0]?.background_image ?? null;
        setEventCovers((prev) => ({ ...prev, [game]: cover }));
      } catch {
        setEventCovers((prev) => ({ ...prev, [game]: null }));
      }
    });
  }, [events]);

  // Fetch personalised recommendations (only when logged in)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoadingRecs(true);
      try {
        const data = await getRecommendedEvents();
        if (!cancelled) setRecommendations(data);
      } catch {
        // recommendations are non-critical; ignore errors
      } finally {
        if (!cancelled) setLoadingRecs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch RAWG covers for recommendation cards
  useEffect(() => {
    if (!recommendations.length) return;
    const uniqueGames = Array.from(new Set(recommendations.map((r) => r.game)));
    uniqueGames.forEach(async (game) => {
      if (recCovers[game] !== undefined) return;
      try {
        const res = await searchGames(game);
        const cover = res.results[0]?.background_image ?? null;
        setRecCovers((prev) => ({ ...prev, [game]: cover }));
      } catch {
        setRecCovers((prev) => ({ ...prev, [game]: null }));
      }
    });
  }, [recommendations]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.getCountriesAndRegions();
        if (cancelled) return;
        const countries = Array.isArray(data?.countries) ? data.countries : [];
        const regions = Array.isArray(data?.regions) ? data.regions : [];
        const options = [
          "all",
          ...buildMatchmakingRegionOptions({ countries, regions }),
        ];
        const uniqueOptions = Array.from(new Set(options));
        setRegionOptions(uniqueOptions);
        setRegionFilter((current) =>
          uniqueOptions.includes(current) ? current : "all",
        );
      } catch {
        // Keep fallback default regions if lookup fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventEntryFee = Number(event.entryFee || 0);
      const hostTrustScore = event.hostId
        ? (trustScoreByHost[event.hostId] ?? 0)
        : 0;
      const searchNeedle = searchQuery.trim().toLowerCase();

      let matchesStakeBucket = true;
      if (stakeBucket === "low")
        matchesStakeBucket = eventEntryFee >= 1 && eventEntryFee <= 25;
      if (stakeBucket === "mid")
        matchesStakeBucket = eventEntryFee >= 26 && eventEntryFee <= 100;
      if (stakeBucket === "high") matchesStakeBucket = eventEntryFee > 100;

      const matchesSearch =
        !searchNeedle ||
        event.title.toLowerCase().includes(searchNeedle) ||
        event.game.toLowerCase().includes(searchNeedle) ||
        (event.region || "").toLowerCase().includes(searchNeedle);

      const matchesGame =
        !selectedGame ||
        event.game.toLowerCase() === selectedGame.name.toLowerCase();
      const matchesRegion =
        regionFilter === "all" || event.region === regionFilter;
      const matchesTrust = hostTrustScore >= trustScoreMin;

      return (
        matchesSearch &&
        matchesGame &&
        matchesRegion &&
        matchesStakeBucket &&
        matchesTrust
      );
    });
  }, [
    events,
    searchQuery,
    stakeBucket,
    selectedGame,
    regionFilter,
    trustScoreByHost,
    trustScoreMin,
  ]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hostIds = Array.from(
        new Set(
          events
            .map((event) => event.hostId)
            .filter((hostId): hostId is string => !!hostId),
        ),
      );
      if (hostIds.length === 0) {
        setTrustScoreByHost({});
        return;
      }

      try {
        const profiles = await Promise.all(
          hostIds.map(async (hostId) => {
            try {
              const data = await api.getPublicProfile(hostId);
              const score = Number(data?.profile?.trustScore ?? 0);
              return [hostId, Number.isFinite(score) ? score : 0] as const;
            } catch {
              return [hostId, 0] as const;
            }
          }),
        );

        if (cancelled) return;
        setTrustScoreByHost(Object.fromEntries(profiles));
      } catch {
        if (!cancelled) setTrustScoreByHost({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [events]);

  const getMatchScoreColor = (score: number) =>
    score >= 90
      ? "text-emerald-400"
      : score >= 75
        ? "text-blue-400"
        : "text-amber-400";

  const getTypeIcon = (type: string) => {
    if (type === "tournament") return Trophy;
    if (type === "wager") return Swords;
    return Target;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">
              Browse All Lobbies
            </h2>
            <p className="text-muted-foreground">
              Find the perfect match and start competing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>{filteredEvents.length} active lobbies</span>
          </div>
          <Button onClick={() => onNavigate?.("create-match")}>
            Create Lobby
          </Button>
        </div>
      </div>

      {/* AI Recommendation Section */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5" />
            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Recommended For You
                      </h3>
                      <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ranked by your game history, region &amp; stake
                      preferences
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showRecommended ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRecommended(true)}
                  >
                    Recommended
                  </Button>
                  <Button
                    variant={!showRecommended ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowRecommended(false)}
                  >
                    All Events
                  </Button>
                </div>
              </div>
            </CardHeader>

            {showRecommended && (
              <CardContent className="relative pb-6">
                {loadingRecs ? (
                  <div className="text-sm text-muted-foreground py-4">
                    Analysing your activity…
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-10">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold text-foreground mb-1">
                      No Recommendations Yet
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Play more matches to get smarter recommendations.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRecommended(false)}
                      className="border-primary/50"
                    >
                      Browse All Events
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="w-full" type="always">
                    <div
                      className="flex gap-4 pb-6 pr-4"
                      style={{ width: "max-content" }}
                    >
                      {recommendations.map((event, index) => {
                        const TypeIcon = getTypeIcon(event.type);
                        const cover = recCovers[event.game];
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.07 }}
                            className="flex-shrink-0 w-[300px]"
                          >
                            <Card className="group hover:border-primary/70 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 border-primary/30 h-full flex flex-col">
                              {/* Game cover */}
                              <div className="relative h-20 bg-muted rounded-t-lg overflow-hidden">
                                {cover ? (
                                  <img
                                    src={cover}
                                    alt={event.game}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                                    <Gamepad2 className="h-10 w-10 text-muted-foreground opacity-40" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                                  <Badge className="bg-card/90 text-foreground border-primary/30 text-xs">
                                    {event.game}
                                  </Badge>
                                  <Badge className="bg-primary/90 text-primary-foreground text-xs">
                                    <TypeIcon className="h-3 w-3 mr-1" />
                                    {event.type}
                                  </Badge>
                                </div>
                                {event.entryFee > 0 && (
                                  <div className="absolute top-2 right-2">
                                    <Badge className="bg-emerald-600/90 text-white text-xs">
                                      <DollarSign className="h-3 w-3 mr-0.5" />
                                      {(event.entryFee / 100).toFixed(0)}
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              <CardContent className="p-4 space-y-3 flex flex-col flex-1">
                                <h4 className="font-semibold text-foreground text-sm leading-tight">
                                  {event.title}
                                </h4>

                                {/* AI match score */}
                                <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/30 rounded-lg">
                                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">
                                        Match Score
                                      </span>
                                      <span
                                        className={`text-sm font-bold ${getMatchScoreColor(
                                          event.matchScore,
                                        )}`}
                                      >
                                        {event.matchScore}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-background/50 rounded-full overflow-hidden mt-1">
                                      <div
                                        className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                                        style={{
                                          width: `${event.matchScore}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-primary">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>{event.reason}</span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>
                                      {event.participants.length}/
                                      {event.maxParticipants}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{event.region || "Global"}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    {event.status}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-400" />
                                    <span className="text-amber-400 font-medium">
                                      Host trust
                                    </span>
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto"
                                  onClick={() =>
                                    onNavigate?.(`view-match-${event.sourceId}`)
                                  }
                                >
                                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                  View Match
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>
      )}

      <Card className="border-primary/30">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[230px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by game, title, or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="min-w-[220px] flex-1">
              <GameSelector
                initialSelectedGame={selectedGame}
                onGameSelected={setSelectedGame}
              />
            </div>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regionOptions
                  .filter((region) => region !== "all")
                  .map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={stakeBucket} onValueChange={setStakeBucket}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Stake Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stakes</SelectItem>
                <SelectItem value="low">$1 - $25</SelectItem>
                <SelectItem value="mid">$26 - $100</SelectItem>
                <SelectItem value="high">$100+</SelectItem>
              </SelectContent>
            </Select>

            {(selectedGame ||
              regionFilter !== "all" ||
              stakeBucket !== "all" ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3"
                onClick={() => {
                  setSelectedGame(null);
                  setRegionFilter("all");
                  setStakeBucket("all");
                  setSearchQuery("");
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-3 border-t border-border/50 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">
                Minimum Trust Score
              </Label>
              <span className="text-sm text-amber-400 font-medium">
                {trustScoreMin}%
              </span>
            </div>
            <Slider
              value={[trustScoreMin]}
              onValueChange={(value: number[]) =>
                setTrustScoreMin(value[0] ?? 0)
              }
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {selectedGame && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSelectedGame(null)}
            >
              Clear game filter
            </Button>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading lobbies...</div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No public lobbies found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const isHost = !!event.hostId && event.hostId === user?.id;
            const hostTrustScore = event.hostId
              ? (trustScoreByHost[event.hostId] ?? 0)
              : 0;
            return (
              <Card
                key={event.id}
                className="group hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 flex flex-col overflow-hidden"
              >
                {/* RAWG game cover banner */}
                <div className="relative h-24 bg-muted overflow-hidden shrink-0">
                  <img
                    src={eventCovers[event.game] ?? fillerBg}
                    alt={event.game}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {event.type === "tournament" ? (
                      <Badge className="bg-amber-600/90 text-white text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        Tournament
                      </Badge>
                    ) : event.type === "wager" ? (
                      <Badge className="bg-blue-600/90 text-white text-xs">
                        <Swords className="h-3 w-3 mr-1" />
                        Wager
                      </Badge>
                    ) : (
                      <Badge className="bg-card/80 text-foreground text-xs">
                        <Swords className="h-3 w-3 mr-1" />
                        Scrim
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4 space-y-3 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className="bg-card/90 text-foreground border-primary/30">
                          <Gamepad2 className="h-3 w-3 mr-1" />
                          {event.game}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {event.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className="bg-primary text-primary-foreground">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {Number(event.entryFee || 0)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>
                        {event.participants.length}/{event.maxParticipants}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{event.region || "Global"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {event.date || "TBD"} {event.time || ""}
                      </span>
                    </div>
                    <Badge variant="outline">{event.status}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span>Host trust</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-amber-400" />
                      <span className="text-amber-400 font-medium">
                        {hostTrustScore}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex items-center gap-1">
                      {isHost && (
                        <Badge className="bg-amber-600 text-white">Host</Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary hover:brightness-110 hover:scale-[1.02] text-primary-foreground group-hover:shadow-md transition-all duration-200"
                      onClick={() =>
                        onNavigate?.(`view-match-${event.sourceId}`)
                      }
                    >
                      View Match
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
