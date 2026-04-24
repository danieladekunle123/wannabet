import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import {
  buildMatchmakingRegionOptions,
  DEFAULT_MATCHMAKING_REGIONS,
} from "../lib/matchmakingRegions";

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
import { Calendar as CalendarPicker } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Slider } from "./ui/slider";
import {
  Trophy,
  Target,
  Users,
  DollarSign,
  Shield,
  Clock,
  Gamepad2,
  Star,
  Settings,
  MapPin,
  Swords,
  Zap,
  Lock,
  Award,
  Flag,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { GameSelector, type SelectedGameOption } from "./games/GameSelector";

const CREATE_MATCH_DRAFT_KEY = "wannabet.createMatchDraft.v1";
const ALL_REGIONS_OPTION = "All Regions";

interface CreateMatchDraft {
  matchType: "tournament" | "scrim" | "wager" | "custom";
  selectedGame: SelectedGameOption | null;
  entryFee: number;
  participants: number;
  teamSize: number;
  startDate: string | null;
  startHour: string;
  startMinute: string;
  startPeriod: string;
  scheduleMatch: boolean;
  region: string;
  requireEscrow: boolean;
  privateMatch: boolean;
  matchTitle: string;
  description: string;
  tournamentFormat: string;
  minimumTrustScore: string;
}

interface CreateMatchProps {
  onNavigate: (page: string) => void;
  initialTab?: "tournament" | "scrim" | "wager" | "custom";
}

export function CreateMatch({
  onNavigate,
  initialTab = "tournament",
}: CreateMatchProps) {
  const PLATFORM_FEE_RATE = 0.125;

  const [matchType, setMatchType] = useState<
    "tournament" | "scrim" | "wager" | "custom"
  >(initialTab);
  const [selectedGame, setSelectedGame] = useState<SelectedGameOption | null>(
    null,
  );
  const [matchTitle, setMatchTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tournamentFormat, setTournamentFormat] = useState("single-elim");
  const [minimumTrustScore, setMinimumTrustScore] = useState("90");
  const [entryFee, setEntryFee] = useState([25]);
  const [participants, setParticipants] = useState([12]);
  const [teamSize, setTeamSize] = useState([5]);
  const [scheduleMatch, setScheduleMatch] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [startHour, setStartHour] = useState("07");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("PM");
  const [region, setRegion] = useState(ALL_REGIONS_OPTION);
  const [regionOptions, setRegionOptions] = useState<string[]>([
    ALL_REGIONS_OPTION,
    ...DEFAULT_MATCHMAKING_REGIONS,
  ]);
  const [requireEscrow, setRequireEscrow] = useState(true);
  const [privateMatch, setPrivateMatch] = useState(false);

  const participantCount = participants[0];
  const grossPrizePool = entryFee[0] * participantCount;
  const estimatedPrizePool = grossPrizePool * (1 - PLATFORM_FEE_RATE);
  const formattedStartDate = startDate
    ? startDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select date";
  const formattedStartTime = `${startHour}:${startMinute} ${startPeriod}`;

  const { refreshUser } = useAuth();
  const { currency, rates } = useCurrency();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CREATE_MATCH_DRAFT_KEY);
      if (!raw) return;

      const draft = JSON.parse(raw) as Partial<CreateMatchDraft>;

      if (
        draft.matchType === "tournament" ||
        draft.matchType === "scrim" ||
        draft.matchType === "wager" ||
        draft.matchType === "custom"
      ) {
        setMatchType(draft.matchType);
      }

      if (typeof draft.matchTitle === "string") setMatchTitle(draft.matchTitle);
      if (typeof draft.description === "string")
        setDescription(draft.description);
      if (typeof draft.tournamentFormat === "string") {
        setTournamentFormat(draft.tournamentFormat);
      }
      if (typeof draft.minimumTrustScore === "string") {
        setMinimumTrustScore(draft.minimumTrustScore);
      }

      if (draft.selectedGame?.name) {
        setSelectedGame(draft.selectedGame);
      }

      if (
        typeof draft.entryFee === "number" &&
        Number.isFinite(draft.entryFee)
      ) {
        setEntryFee([Math.min(500, Math.max(5, draft.entryFee))]);
      }
      if (
        typeof draft.participants === "number" &&
        Number.isFinite(draft.participants)
      ) {
        const POWER_OF_2 = [4, 8, 16, 32, 64, 128];
        const nearest = POWER_OF_2.reduce((best, val) =>
          Math.abs(val - draft.participants) <
          Math.abs(best - draft.participants)
            ? val
            : best,
        );
        setParticipants([nearest]);
      }
      if (
        typeof draft.teamSize === "number" &&
        Number.isFinite(draft.teamSize)
      ) {
        setTeamSize([Math.min(20, Math.max(1, draft.teamSize))]);
      }

      if (typeof draft.startDate === "string" && draft.startDate) {
        const parsedDate = new Date(draft.startDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          setStartDate(parsedDate);
        }
      }

      if (typeof draft.startHour === "string") setStartHour(draft.startHour);
      if (typeof draft.startMinute === "string")
        setStartMinute(draft.startMinute);
      if (draft.startPeriod === "AM" || draft.startPeriod === "PM") {
        setStartPeriod(draft.startPeriod);
      }
      if (typeof draft.scheduleMatch === "boolean") {
        setScheduleMatch(draft.scheduleMatch);
      }

      if (typeof draft.region === "string" && draft.region.trim()) {
        setRegion(draft.region);
      }

      if (typeof draft.requireEscrow === "boolean") {
        setRequireEscrow(draft.requireEscrow);
      }
      if (typeof draft.privateMatch === "boolean") {
        setPrivateMatch(draft.privateMatch);
      }
    } catch (err) {
      console.error("Failed to load create match draft", err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.getCountriesAndRegions();
        if (cancelled) return;

        const countries = Array.isArray(data.countries) ? data.countries : [];
        const regions = Array.isArray(data.regions) ? data.regions : [];
        const options = [
          ALL_REGIONS_OPTION,
          ...buildMatchmakingRegionOptions({ countries, regions }),
        ];
        const uniqueOptions = Array.from(new Set(options));

        setRegionOptions(uniqueOptions);
        setRegion((current) =>
          uniqueOptions.includes(current) ? current : uniqueOptions[0],
        );
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveDraft = () => {
    try {
      const draft: CreateMatchDraft = {
        matchType,
        selectedGame,
        entryFee: entryFee[0],
        participants: participantCount,
        teamSize: teamSize[0],
        startDate: startDate ? startDate.toISOString() : null,
        startHour,
        startMinute,
        startPeriod,
        scheduleMatch,
        region,
        requireEscrow,
        privateMatch,
        matchTitle,
        description,
        tournamentFormat,
        minimumTrustScore,
      };

      window.localStorage.setItem(
        CREATE_MATCH_DRAFT_KEY,
        JSON.stringify(draft),
      );
      onNavigate("home");
    } catch (err) {
      console.error("Failed to save create match draft", err);
    }
  };

  const matchTypes = [
    {
      id: "tournament",
      title: "Tournament",
      description: "Competitive bracket-style competition",
      icon: Trophy,
      color: "text-amber-400",
      bgColor: "bg-amber-600/10",
      borderColor: "border-amber-600/30",
    },
    {
      id: "scrim",
      title: "Scrim",
      description: "Practice match with no entry fee",
      icon: Target,
      color: "text-blue-400",
      bgColor: "bg-blue-600/10",
      borderColor: "border-blue-600/30",
    },
    {
      id: "wager",
      title: "Wager Match",
      description: "Head-to-head with real stakes",
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-600/10",
      borderColor: "border-emerald-600/30",
    },
    {
      id: "custom",
      title: "Custom Lobby",
      description: "Fully customizable match settings",
      icon: Settings,
      color: "text-purple-400",
      bgColor: "bg-purple-600/10",
      borderColor: "border-purple-600/30",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeInUp max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create Match
          </h1>
          <p className="text-muted-foreground">
            Set up your perfect competitive experience
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => onNavigate("home")}
          className="hover:bg-muted"
        >
          Cancel
        </Button>
      </div>

      {/* Match Type Selection */}
      <Card className="border-primary/20 animate-fadeInUp animate-delay-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Select Match Type
          </CardTitle>
          <CardDescription>
            Choose the format that fits your gameplay style
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {matchTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-300 hover-lift ${
                    matchType === type.id
                      ? `${type.borderColor} border-2 ${type.bgColor}`
                      : "border-muted hover:border-primary/30"
                  }`}
                  onClick={() => setMatchType(type.id as any)}
                >
                  <CardContent className="p-4 text-center">
                    <div
                      className={`w-12 h-12 mx-auto mb-3 rounded-full ${type.bgColor} flex items-center justify-center`}
                    >
                      <Icon className={`h-6 w-6 ${type.color}`} />
                    </div>
                    <h3 className="font-semibold mb-1">{type.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                    {matchType === type.id && (
                      <Badge className="mt-3 bg-primary text-primary-foreground">
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Selection */}
          <Card className="animate-fadeInUp animate-delay-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                Game & Basic Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="game">Select Game</Label>
                <GameSelector
                  initialSelectedGame={selectedGame}
                  onGameSelected={setSelectedGame}
                />
              </div>

              <div>
                <Label htmlFor="match-title">Match Title</Label>
                <Input
                  id="match-title"
                  placeholder="e.g., Championship Finals 2025"
                  className="bg-muted/50 border-muted"
                  value={matchTitle}
                  onChange={(e) => setMatchTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your match, rules, and any special requirements..."
                  className="bg-muted/50 border-muted min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger
                    id="region"
                    className="bg-muted/50 border-muted"
                  >
                    <SelectValue />
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
            </CardContent>
          </Card>

          {/* Match Settings */}
          <Card className="animate-fadeInUp animate-delay-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Match Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Entry Fee - Only show for non-scrim matches */}
              {matchType !== "scrim" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Entry Fee</Label>
                    <Badge className="bg-emerald-600 text-white">
                      {formatCurrencyFromEur(entryFee[0], currency, rates)}
                    </Badge>
                  </div>
                  <Slider
                    value={entryFee}
                    onValueChange={setEntryFee}
                    min={5}
                    max={500}
                    step={5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrencyFromEur(5, currency, rates)}</span>
                    <span>{formatCurrencyFromEur(500, currency, rates)}</span>
                  </div>
                </div>
              )}

              {/* Prize Pool - Only for tournaments */}
              {matchType === "tournament" && (
                <div className="p-4 bg-amber-600/10 border border-amber-600/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-400" />
                      <span className="font-semibold">
                        Estimated Prize Pool
                      </span>
                    </div>
                    <span className="text-lg font-bold text-amber-400">
                      {formatCurrencyFromEur(
                        estimatedPrizePool,
                        currency,
                        rates,
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {participantCount} participants after a{" "}
                    {(PLATFORM_FEE_RATE * 100).toFixed(1)}% platform fee
                  </p>
                </div>
              )}

              {/* Match Format - Only for tournaments */}
              {matchType === "tournament" && (
                <div>
                  <Label className="mb-2 block">Tournament Format</Label>
                  <RadioGroup
                    value={tournamentFormat}
                    onValueChange={setTournamentFormat}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="single-elim" id="single-elim" />
                      <Label
                        htmlFor="single-elim"
                        className="cursor-pointer flex-1"
                      >
                        <div className="font-medium">Single Elimination</div>
                        <div className="text-xs text-muted-foreground">
                          One loss and you're out
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="double-elim" id="double-elim" />
                      <Label
                        htmlFor="double-elim"
                        className="cursor-pointer flex-1"
                      >
                        <div className="font-medium">Double Elimination</div>
                        <div className="text-xs text-muted-foreground">
                          Second chance bracket
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="round-robin" id="round-robin" />
                      <Label
                        htmlFor="round-robin"
                        className="cursor-pointer flex-1"
                      >
                        <div className="font-medium">Round Robin</div>
                        <div className="text-xs text-muted-foreground">
                          Everyone plays everyone
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Team Size + Participants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="team-size">Team Size</Label>
                  <div id="team-size" className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span className="text-foreground font-medium">
                        {teamSize[0]}v{teamSize[0]}
                      </span>
                      <span>20</span>
                    </div>
                    <Slider
                      value={teamSize}
                      onValueChange={setTeamSize}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="participants">
                    {matchType === "tournament"
                      ? "Number of Teams"
                      : "Participants"}
                  </Label>
                  {matchType === "tournament" ? (
                    <div className="mt-2 space-y-2">
                      <Select
                        value={String(participantCount)}
                        onValueChange={(v) => setParticipants([Number(v)])}
                      >
                        <SelectTrigger
                          id="participants"
                          className="bg-muted/50 border-muted"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[4, 8, 16, 32, 64, 128].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} teams
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Must be a power of 2
                      </p>
                    </div>
                  ) : (
                    <div id="participants" className="space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>2</span>
                        <span className="text-foreground font-medium">
                          {participantCount}
                        </span>
                        <span>128</span>
                      </div>
                      <Slider
                        value={participants}
                        onValueChange={setParticipants}
                        min={2}
                        max={128}
                        step={1}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Start Time */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">
                      Schedule Start Time
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Set a specific date and time for this match
                    </div>
                  </div>
                  <Switch
                    checked={scheduleMatch}
                    onCheckedChange={setScheduleMatch}
                  />
                </div>

                {!scheduleMatch && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
                    <Zap className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-300">
                      This match starts <strong>on demand</strong> — once an
                      opponent joins, you can start it anytime using the{" "}
                      <strong>Start Match</strong> button.
                    </p>
                  </div>
                )}

                {scheduleMatch && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="start-date"
                            variant="outline"
                            className="mt-2 w-full justify-between bg-muted/50 border-muted text-foreground hover:bg-muted/70"
                          >
                            <span className="truncate text-left">
                              {formattedStartDate}
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
                            selected={startDate}
                            onSelect={setStartDate}
                            className="rounded-md bg-card"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="start-time">Start Time</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="start-time"
                            variant="outline"
                            className="mt-2 w-full justify-between bg-muted/50 border-muted text-foreground hover:bg-muted/70"
                          >
                            <span>{formattedStartTime}</span>
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
                                onValueChange={setStartPeriod}
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
                              Selected: {formattedStartTime}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Security & Privacy */}
        <div className="space-y-6">
          {/* Security Settings */}
          <Card className="animate-fadeInUp animate-delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security & Trust
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">Require Escrow</div>
                  <div className="text-xs text-muted-foreground">
                    Players deposit funds before match
                  </div>
                </div>
                <Switch
                  checked={requireEscrow}
                  onCheckedChange={setRequireEscrow}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">Private Match</div>
                  <div className="text-xs text-muted-foreground">
                    Invite only, not publicly listed
                  </div>
                </div>
                <Switch
                  checked={privateMatch}
                  onCheckedChange={setPrivateMatch}
                />
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm mb-2 block">
                  Minimum Trust Score
                </Label>
                <Select
                  value={minimumTrustScore}
                  onValueChange={setMinimumTrustScore}
                >
                  <SelectTrigger className="bg-background border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Requirement</SelectItem>
                    <SelectItem value="70">70% - Basic</SelectItem>
                    <SelectItem value="85">85% - Verified</SelectItem>
                    <SelectItem value="90">90% - Trusted</SelectItem>
                    <SelectItem value="95">95% - Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Your Trust Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "98%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-primary">98%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Preview */}
          <Card className="animate-fadeInUp animate-delay-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Match Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge className="bg-primary text-primary-foreground">
                  {matchTypes.find((t) => t.id === matchType)?.title}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">Game</span>
                <span className="font-semibold text-foreground max-w-[55%] truncate text-right">
                  {selectedGame?.name || "Not selected"}
                </span>
              </div>

              {matchType !== "scrim" && (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm text-muted-foreground">
                    Entry Fee
                  </span>
                  <span className="font-semibold text-emerald-400">
                    {formatCurrencyFromEur(entryFee[0], currency, rates)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">Team Size</span>
                <span className="font-semibold">
                  {teamSize[0]}v{teamSize[0]}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">
                  Participants
                </span>
                <span className="font-semibold">{participantCount}</span>
              </div>

              {matchType === "tournament" && (
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="text-sm text-muted-foreground">
                    Est. Prize Pool
                  </span>
                  <span className="font-semibold text-amber-400">
                    {formatCurrencyFromEur(estimatedPrizePool, currency, rates)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">Escrow</span>
                <Badge
                  className={requireEscrow ? "bg-emerald-600" : "bg-muted"}
                >
                  {requireEscrow ? "Required" : "Optional"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm text-muted-foreground">
                  Visibility
                </span>
                <Badge className={!privateMatch ? "bg-blue-600" : "bg-muted"}>
                  {privateMatch ? "Private" : "Public"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <Card className="border-primary/20 animate-fadeInUp animate-delay-600">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="leading-tight">
                Your match will be reviewed before going live
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="flex-1 sm:flex-none"
              >
                Save as Draft
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none"
                disabled={!selectedGame?.name}
                onClick={async () => {
                  try {
                    const stake = matchType === "scrim" ? 0 : entryFee[0] * 100;
                    const gameName = selectedGame?.name?.trim() || "";
                    if (!gameName) return;

                    let startAtIso: string | undefined;
                    let joinDeadlineAtIso: string | undefined;
                    if (scheduleMatch) {
                      const [hourPart, minutePart] = [
                        Number(startHour),
                        Number(startMinute),
                      ];
                      const startAtDate = startDate
                        ? new Date(startDate)
                        : null;
                      if (
                        startAtDate &&
                        Number.isFinite(hourPart) &&
                        Number.isFinite(minutePart)
                      ) {
                        let hour24 = hourPart % 12;
                        if (startPeriod === "PM") hour24 += 12;
                        startAtDate.setHours(hour24, minutePart, 0, 0);
                      }
                      startAtIso = startAtDate?.toISOString();
                      joinDeadlineAtIso = startAtDate
                        ? new Date(
                            startAtDate.getTime() - 24 * 60 * 60 * 1000,
                          ).toISOString()
                        : undefined;
                    }

                    const normalizedRegion =
                      region === ALL_REGIONS_OPTION ? "Global" : region;
                    const normalizedTitle =
                      matchTitle.trim() ||
                      `${gameName} ${matchType === "tournament" ? "Tournament" : "Match"}`;

                    let sourceId: string | null = null;

                    if (matchType === "tournament") {
                      const tournamentRes = await api.createTournament({
                        name: normalizedTitle,
                        game: gameName,
                        description: description.trim() || undefined,
                        entryFee: entryFee[0] * 100,
                        startAt: startAtIso,
                        participantCount,
                        teamSize: teamSize[0],
                        region: normalizedRegion,
                        tournamentFormat,
                        joinDeadlineAt: joinDeadlineAtIso,
                      });
                      sourceId = tournamentRes?.tournament?.id || null;
                    } else {
                      const matchRes = await api.createMatch({
                        game: gameName,
                        stake,
                        matchType,
                        title: normalizedTitle,
                        description: description.trim() || undefined,
                        participantCount,
                        teamSize: teamSize[0],
                        region: normalizedRegion,
                        tournamentFormat,
                        startAt: startAtIso,
                        joinDeadlineAt: joinDeadlineAtIso,
                        privateMatch,
                      });
                      sourceId = matchRes?.match?.id || null;
                    }

                    // refresh global user to update balances
                    await refreshUser?.();
                    // navigate to view the newly created match
                    if (sourceId) {
                      if (matchType === "tournament") {
                        onNavigate(`tournament-bracket-${sourceId}`);
                      } else {
                        onNavigate(`view-match-${sourceId}`);
                      }
                    } else {
                      onNavigate(
                        matchType === "tournament"
                          ? "tournaments"
                          : "view-match",
                      );
                    }
                  } catch (err: any) {
                    console.error("Failed to create match", err);
                    const message =
                      err?.message ||
                      err?.error ||
                      "Failed to create match. Please try again.";
                    window.alert(message);
                  }
                }}
              >
                <Flag className="h-4 w-4 mr-2" />
                Create Match
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
