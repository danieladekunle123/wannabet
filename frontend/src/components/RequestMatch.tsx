import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Calendar as CalendarPicker } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  ArrowLeft,
  Search,
  Gamepad2,
  CalendarDays,
  DollarSign,
  Clock,
  Send,
  Star,
  Shield,
  Swords,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Target,
  Zap,
  Loader2,
} from "lucide-react";
import { GameSelector, type SelectedGameOption } from "./games/GameSelector";
import api from "../lib/api";
import { createMatchRequest } from "../services/eventsService";
import {
  buildMatchmakingRegionOptions,
  DEFAULT_MATCHMAKING_REGIONS,
} from "../lib/matchmakingRegions";
import { useAuth } from "./AuthContext";

interface RequestMatchProps {
  onNavigate: (tab: string) => void;
  preselectedOpponent?: string;
}

type OpponentOption = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  trustScore: number;
  games: string[];
  source: "friend" | "search";
};

function formatTrustScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function RequestMatch({
  onNavigate,
  preselectedOpponent,
}: RequestMatchProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"select" | "configure" | "confirm">(
    preselectedOpponent ? "configure" : "select",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOpponent, setSelectedOpponent] =
    useState<OpponentOption | null>(null);
  const [matchType, setMatchType] = useState<"casual" | "wager" | "scrim">(
    "casual",
  );
  const [selectedGame, setSelectedGame] = useState<SelectedGameOption | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [bestOf, setBestOf] = useState<number[]>([1]);
  const [region, setRegion] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    undefined,
  );
  const [startHour, setStartHour] = useState("08");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("PM");
  const [regionOptions, setRegionOptions] = useState<string[]>(
    DEFAULT_MATCHMAKING_REGIONS,
  );
  const [friends, setFriends] = useState<OpponentOption[]>([]);
  const [searchResults, setSearchResults] = useState<OpponentOption[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loadingPreselected, setLoadingPreselected] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [wagerChoice, setWagerChoice] = useState("10");
  const [customWagerAmount, setCustomWagerAmount] = useState("6");

  const normalizedSearchQuery = searchQuery.trim();
  const resolvedWagerAmount =
    wagerChoice === "custom" ? Number(customWagerAmount) : Number(wagerChoice);
  const customWagerInvalid =
    matchType === "wager" &&
    wagerChoice === "custom" &&
    (!Number.isFinite(resolvedWagerAmount) || resolvedWagerAmount <= 5);
  const formattedScheduledDate = scheduledDate
    ? scheduledDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select date";
  const scheduledTimeLabel = `${startHour}:${startMinute} ${startPeriod}`;

  const buildScheduledAtIso = () => {
    if (!scheduledDate) return null;
    const hourNum = Number(startHour);
    const minuteNum = Number(startMinute);
    if (!Number.isFinite(hourNum) || !Number.isFinite(minuteNum)) return null;

    let hour24 = hourNum % 12;
    if (startPeriod === "PM") {
      hour24 += 12;
    }

    const isoDate = new Date(
      scheduledDate.getFullYear(),
      scheduledDate.getMonth(),
      scheduledDate.getDate(),
      hour24,
      minuteNum,
      0,
      0,
    );

    return Number.isNaN(isoDate.getTime()) ? null : isoDate.toISOString();
  };

  const enrichOpponents = async (
    users: Array<{
      id: string;
      username: string;
      avatarUrl?: string | null;
      profileImageUrl?: string | null;
      profile?: { displayName?: string | null };
    }>,
    source: OpponentOption["source"],
  ) => {
    const deduped = Array.from(
      new Map(users.map((entry) => [entry.id, entry])).values(),
    );
    const hydrated = await Promise.all(
      deduped.map(async (entry) => {
        try {
          const data = await api.getPublicProfile(entry.id);
          const publicUser = data?.user;
          const games = Array.isArray(publicUser?.playerGames)
            ? publicUser.playerGames
                .map((gameEntry: any) => String(gameEntry?.game || "").trim())
                .filter((gameName: string) => gameName.length > 0)
                .slice(0, 3)
            : [];

          return {
            id: entry.id,
            username: entry.username,
            displayName:
              publicUser?.profile?.displayName ||
              entry.profile?.displayName ||
              entry.username,
            avatarUrl:
              publicUser?.profileImageUrl ||
              publicUser?.avatarUrl ||
              entry.profileImageUrl ||
              entry.avatarUrl ||
              null,
            trustScore: Number(publicUser?.profile?.trustScore ?? 0),
            games,
            source,
          } satisfies OpponentOption;
        } catch {
          return {
            id: entry.id,
            username: entry.username,
            displayName: entry.profile?.displayName || entry.username,
            avatarUrl: entry.profileImageUrl || entry.avatarUrl || null,
            trustScore: 0,
            games: [],
            source,
          } satisfies OpponentOption;
        }
      }),
    );

    return hydrated.filter((entry) => entry.id !== user?.id);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.getCountriesAndRegions();
        if (cancelled) return;
        const countries = Array.isArray(data?.countries) ? data.countries : [];
        const regions = Array.isArray(data?.regions) ? data.regions : [];
        const nextOptions = buildMatchmakingRegionOptions({
          countries,
          regions,
        });
        setRegionOptions(nextOptions);
        setRegion(
          (current) =>
            current || nextOptions[0] || DEFAULT_MATCHMAKING_REGIONS[0],
        );
      } catch {
        if (!cancelled) {
          setRegionOptions(DEFAULT_MATCHMAKING_REGIONS);
          setRegion((current) => current || DEFAULT_MATCHMAKING_REGIONS[0]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingFriends(true);
        const data = await api.getMyFriends();
        const rawFriends = Array.isArray(data?.friends) ? data.friends : [];
        const hydratedFriends = await enrichOpponents(rawFriends, "friend");
        if (!cancelled) {
          setFriends(hydratedFriends);
        }
      } catch {
        if (!cancelled) {
          setFriends([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingFriends(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!preselectedOpponent) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadingPreselected(true);
        const data = await api.getPublicProfile(preselectedOpponent);
        if (cancelled || !data?.user) return;
        const publicUser = data.user;
        const nextOpponent: OpponentOption = {
          id: publicUser.id,
          username: publicUser.username,
          displayName: publicUser.profile?.displayName || publicUser.username,
          avatarUrl: publicUser.profileImageUrl || publicUser.avatarUrl || null,
          trustScore: Number(publicUser.profile?.trustScore ?? 0),
          games: Array.isArray(publicUser.playerGames)
            ? publicUser.playerGames
                .map((entry: any) => String(entry?.game || "").trim())
                .filter((value: string) => value.length > 0)
                .slice(0, 3)
            : [],
          source: "search",
        };
        setSelectedOpponent(nextOpponent);
        setStep("configure");
      } catch {
        if (!cancelled) {
          setStep("select");
        }
      } finally {
        if (!cancelled) {
          setLoadingPreselected(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [preselectedOpponent]);

  useEffect(() => {
    const query = normalizedSearchQuery;
    if (query.length < 2) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const data = await api.searchUsers(query);
        const users = Array.isArray(data?.data?.users) ? data.data.users : [];
        const hydrated = await enrichOpponents(users, "search");
        if (cancelled) return;

        const friendIds = new Set(friends.map((entry) => entry.id));
        setSearchResults(hydrated.filter((entry) => !friendIds.has(entry.id)));
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchingUsers(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedSearchQuery, friends, user?.id]);

  const visibleFriends = useMemo(() => {
    if (!normalizedSearchQuery) return friends;
    const needle = normalizedSearchQuery.toLowerCase();
    return friends.filter((entry) => {
      return (
        entry.username.toLowerCase().includes(needle) ||
        entry.displayName.toLowerCase().includes(needle)
      );
    });
  }, [friends, normalizedSearchQuery]);

  const handleSelectOpponent = (player: OpponentOption) => {
    setSubmitError(null);
    setSelectedOpponent(player);
    setStep("configure");
  };

  const handleSendRequest = async () => {
    if (!selectedOpponent) {
      setSubmitError("Select an opponent first.");
      return;
    }
    if (!selectedGame?.name.trim()) {
      setSubmitError("Choose a game for this request.");
      return;
    }
    if (!region.trim()) {
      setSubmitError("Choose a region for this request.");
      return;
    }
    if (!scheduledDate) {
      setSubmitError("Choose a match date.");
      return;
    }
    if (matchType === "wager" && customWagerInvalid) {
      setSubmitError("Custom wagers must be above 5 EUR.");
      return;
    }

    const scheduledAtIso = buildScheduledAtIso();
    if (!scheduledAtIso) {
      setSubmitError("Select a valid date and time.");
      return;
    }

    try {
      setSendingRequest(true);
      setSubmitError(null);
      await createMatchRequest({
        recipientId: selectedOpponent.id,
        game: selectedGame.name.trim(),
        matchType,
        rounds: bestOf[0] ?? 1,
        region,
        scheduledDate: scheduledDate.toISOString().slice(0, 10),
        scheduledTime: scheduledTimeLabel,
        scheduledAt: scheduledAtIso,
        wagerAmount: matchType === "wager" ? resolvedWagerAmount : undefined,
        message: message.trim() || undefined,
      });
      setStep("confirm");
      window.setTimeout(() => {
        onNavigate("home");
      }, 3000);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to send match request.");
    } finally {
      setSendingRequest(false);
    }
  };

  // Step 1: Select Opponent
  if (step === "select") {
    return (
      <div className="page-transition max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => onNavigate("home")}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Swords className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Request Match</h1>
              <p className="text-muted-foreground">
                Challenge a real player from your friends list or search the
                platform
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 animate-fadeInUp">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search accounts by username or display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loadingPreselected && (
          <Card className="mb-6 animate-fadeInUp">
            <CardContent className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading selected opponent...
            </CardContent>
          </Card>
        )}

        {/* Friends */}
        <Card className="mb-6 animate-fadeInUp animate-delay-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Friends</span>
            </CardTitle>
            <CardDescription>
              Send a match request to people already in your network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingFriends ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/20 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading friends...
              </div>
            ) : visibleFriends.length > 0 ? (
              visibleFriends.map((player, index) => (
                <div
                  key={player.id}
                  className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-300 cursor-pointer hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleSelectOpponent(player)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <Avatar className="h-12 w-12 border-2 border-primary/30">
                        <AvatarImage src={player.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {player.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-foreground truncate">
                            {player.displayName}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            @{player.username}
                          </Badge>
                          {player.trustScore >= 99 && (
                            <Badge className="bg-emerald-600 text-white">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-amber-400" />
                            {formatTrustScore(player.trustScore)}% Trust
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Friend
                          </span>
                        </div>
                        {player.games.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2 flex-wrap">
                            {player.games.map((gameName) => (
                              <Badge
                                key={gameName}
                                variant="outline"
                                className="text-xs"
                              >
                                {gameName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button className="shrink-0">Request Match</Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No friends match your search yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        <Card className="animate-fadeInUp animate-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>Search Accounts</span>
            </CardTitle>
            <CardDescription>
              Find any real account on WannaBet by username or display name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {normalizedSearchQuery.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Type at least 2 characters to search accounts.</p>
              </div>
            ) : searchingUsers ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/20 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching accounts...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((player) => (
                <div
                  key={player.id}
                  className="p-3 bg-muted/20 rounded-lg hover:bg-muted/40 transition-all duration-300 cursor-pointer"
                  onClick={() => handleSelectOpponent(player)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={player.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {player.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-foreground text-sm truncate">
                            {player.displayName}
                          </h4>
                          <Badge variant="outline" className="text-[10px]">
                            @{player.username}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-amber-400" />
                            {formatTrustScore(player.trustScore)}%
                          </span>
                          <span>•</span>
                          <span>
                            {player.source === "friend" ? "Friend" : "Account"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No accounts found matching "{searchQuery}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Configure Match
  if (step === "configure") {
    return (
      <div className="page-transition max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setStep("select")}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Change Opponent
          </Button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Configure Match</h1>
              <p className="text-muted-foreground">
                Set up your challenge details
              </p>
            </div>
          </div>
        </div>

        {/* Selected Opponent Card */}
        <Card className="mb-6 border-primary/30 animate-fadeInUp">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={selectedOpponent?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {selectedOpponent?.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-foreground">
                    {selectedOpponent?.displayName}
                  </h3>
                  <Badge variant="outline">@{selectedOpponent?.username}</Badge>
                  <Badge className="bg-primary/15 text-primary border border-primary/30">
                    {selectedOpponent?.source === "friend"
                      ? "Friend"
                      : "Platform Search"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-amber-400" />
                    {formatTrustScore(selectedOpponent?.trustScore ?? 0)}% Trust
                  </span>
                  {selectedOpponent?.games?.length ? (
                    <span>{selectedOpponent.games.join(", ")}</span>
                  ) : null}
                </div>
              </div>

              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  Challenging
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Configuration */}
          <div className="space-y-6">
            <Card className="animate-fadeInUp animate-delay-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <span>Match Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={matchType === "casual" ? "default" : "outline"}
                    onClick={() => setMatchType("casual")}
                    className="flex-col h-auto py-3"
                  >
                    <Gamepad2 className="h-5 w-5 mb-1" />
                    <span className="text-xs">Casual</span>
                  </Button>
                  <Button
                    variant={matchType === "wager" ? "default" : "outline"}
                    onClick={() => setMatchType("wager")}
                    className="flex-col h-auto py-3"
                  >
                    <DollarSign className="h-5 w-5 mb-1" />
                    <span className="text-xs">Wager</span>
                  </Button>
                  <Button
                    variant={matchType === "scrim" ? "default" : "outline"}
                    onClick={() => setMatchType("scrim")}
                    className="flex-col h-auto py-3"
                  >
                    <Swords className="h-5 w-5 mb-1" />
                    <span className="text-xs">Scrim</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game">Game</Label>
                  <GameSelector
                    initialSelectedGame={selectedGame}
                    onGameSelected={setSelectedGame}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bestof">Best Of</Label>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rounds</span>
                      <Badge className="bg-primary text-primary-foreground">
                        Best of {bestOf[0]}
                      </Badge>
                    </div>
                    <Slider
                      id="bestof"
                      value={bestOf}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value: number[]) =>
                        setBestOf([value[0] ?? 1])
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionOptions.map((regionOption) => (
                        <SelectItem key={regionOption} value={regionOption}>
                          {regionOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Match Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="scheduled-date"
                        variant="outline"
                        className="w-full justify-between bg-muted/50 border-muted text-foreground hover:bg-muted/70"
                      >
                        <span className="truncate text-left">
                          {formattedScheduledDate}
                        </span>
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-auto p-0 bg-card border-border"
                    >
                      <CalendarPicker
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        className="rounded-md bg-card"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Match Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="scheduled-time"
                        variant="outline"
                        className="w-full justify-between bg-muted/50 border-muted text-foreground hover:bg-muted/70"
                      >
                        <span>{scheduledTimeLabel}</span>
                        <Clock className="h-4 w-4 text-primary" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-[min(260px,calc(100vw-2rem))] p-3 bg-card border-border"
                    >
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Choose match start time
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={startHour}
                            onValueChange={setStartHour}
                          >
                            <SelectTrigger className="bg-muted/50 border-muted">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) =>
                                String(i + 1).padStart(2, "0"),
                              ).map((hour) => (
                                <SelectItem key={hour} value={hour}>
                                  {hour}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={startMinute}
                            onValueChange={setStartMinute}
                          >
                            <SelectTrigger className="bg-muted/50 border-muted">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "00",
                                "05",
                                "10",
                                "15",
                                "20",
                                "25",
                                "30",
                                "35",
                                "40",
                                "45",
                                "50",
                                "55",
                              ].map((minute) => (
                                <SelectItem key={minute} value={minute}>
                                  {minute}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={startPeriod}
                            onValueChange={(value) =>
                              setStartPeriod(value as "AM" | "PM")
                            }
                          >
                            <SelectTrigger className="bg-muted/50 border-muted">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                          Selected: {scheduledTimeLabel}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wager & Message */}
          <div className="space-y-6">
            {matchType === "wager" && (
              <Card className="animate-fadeInUp animate-delay-200 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span>Wager Amount</span>
                  </CardTitle>
                  <CardDescription>
                    Set the stakes for this match
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Choose Amount</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {["10", "25", "50", "100", "custom"].map((amount) => (
                        <Button
                          key={amount}
                          variant={
                            wagerChoice === amount ? "default" : "outline"
                          }
                          onClick={() => setWagerChoice(amount)}
                          size="sm"
                        >
                          {amount === "custom" ? "Custom" : `€${amount}`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {wagerChoice === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-wager">Custom Amount (EUR)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="custom-wager"
                          type="number"
                          value={customWagerAmount}
                          onChange={(e) => setCustomWagerAmount(e.target.value)}
                          className="pl-10"
                          min="6"
                          step="1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Custom wagers must be above 5 EUR.
                      </p>
                    </div>
                  )}

                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Wager Amount
                      </span>
                      <span className="text-foreground">
                        €{resolvedWagerAmount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Platform Fee (5%)
                      </span>
                      <span className="text-foreground">
                        €{((resolvedWagerAmount || 0) * 0.05).toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-foreground">
                        Potential Winnings
                      </span>
                      <span className="text-emerald-400">
                        €{((resolvedWagerAmount || 0) * 1.95).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="animate-fadeInUp animate-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Challenge Message</span>
                </CardTitle>
                <CardDescription>
                  Add a message to your opponent (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Ready to prove you're the best? Let's settle this..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {message.length}/200 characters
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 animate-fadeInUp animate-delay-400">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="text-foreground">Match Request Guidelines</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Opponent has 24 hours to accept or decline</li>
                      <li>
                        • Funds will be held in escrow until match completion
                      </li>
                      <li>• Both players must agree on match results</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        {submitError && (
          <div className="mt-6 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {submitError}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setStep("select")}>
            Cancel
          </Button>
          <Button
            onClick={handleSendRequest}
            disabled={
              !selectedGame?.name ||
              !region ||
              !scheduledDate ||
              sendingRequest ||
              customWagerInvalid
            }
            className="min-w-[140px]"
          >
            {sendingRequest ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Challenge
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  return (
    <div className="page-transition max-w-2xl mx-auto">
      <Card className="border-primary/30 animate-scaleIn">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary animate-bounce" />
          </div>

          <h2 className="text-foreground mb-2">Challenge Sent!</h2>
          <p className="text-muted-foreground mb-6">
            Your match request has been sent to{" "}
            <span className="text-primary font-medium">
              {selectedOpponent?.displayName}
            </span>
          </p>

          <div className="bg-muted/30 rounded-lg p-6 space-y-4 text-left mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Match Type</span>
              <span className="text-foreground capitalize">{matchType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Game</span>
              <span className="text-foreground">{selectedGame?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Best Of</span>
              <span className="text-foreground">{bestOf[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Region</span>
              <span className="text-foreground">{region}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">{formattedScheduledDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="text-foreground">{scheduledTimeLabel}</span>
            </div>
            {matchType === "wager" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wager</span>
                <span className="text-emerald-400">€{resolvedWagerAmount}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-amber-600 text-white">
                <Clock className="h-3 w-3 mr-1" />
                Pending Response
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => onNavigate("messages")}>
              <Zap className="h-4 w-4 mr-2" />
              Message Player
            </Button>
            <Button onClick={() => onNavigate("home")}>Back to Home</Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            You'll receive a notification when {selectedOpponent?.displayName}{" "}
            responds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
