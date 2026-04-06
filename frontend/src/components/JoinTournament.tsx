import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
  ArrowLeft,
  Trophy,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  Target,
  Swords,
  Crown,
  ChevronRight,
  Loader2,
  Lock,
} from "lucide-react";
import { getTournament, registerTeamForTournament } from "../lib/api";

interface JoinTournamentProps {
  onNavigate: (tab: string) => void;
  tournamentId?: string;
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
  startAt: string | null;
  description: string | null;
  hostId: string | null;
  _count?: { teamParticipants: number };
  teamParticipants?: Array<{ id: string; teamId: string; team: { id: string; name: string } }>;
}

interface MyTeam {
  id: string;
  name: string;
  game: string;
  memberCount: number;
  ownerId: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function formatFormat(f: string) {
  const map: Record<string, string> = {
    single_elimination: "Single Elimination",
    double_elimination: "Double Elimination",
    round_robin: "Round Robin",
  };
  return map[f] ?? f;
}

export function JoinTournament({ onNavigate, tournamentId }: JoinTournamentProps) {
  const { user } = useAuth();
  const { currency, rates } = useCurrency();

  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [myTeams, setMyTeams] = useState<MyTeam[]>([]);
  const [loadingTournament, setLoadingTournament] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<"details" | "team" | "confirm" | "success">("details");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [agreeToRules, setAgreeToRules] = useState(false);
  const [agreeToFees, setAgreeToFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) { setLoadingTournament(false); return; }
    let cancelled = false;
    (async () => {
      setLoadingTournament(true);
      try {
        const data = await getTournament(tournamentId);
        if (!cancelled) setTournament(data.tournament ?? data);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message ?? "Failed to load tournament");
      } finally {
        if (!cancelled) setLoadingTournament(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tournamentId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoadingTeams(false); return; }
    let cancelled = false;
    (async () => {
      setLoadingTeams(true);
      try {
        const res = await fetch(`${API_URL}/teams/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled) {
          const teams: MyTeam[] = (data.teams ?? []).map((t: any) => ({
            id: t.id,
            name: t.name,
            game: t.game,
            memberCount: (t.members?.length ?? 0) + 1,
            ownerId: t.ownerId,
          }));
          setMyTeams(teams);
        }
      } catch { /* silently fail */ } finally {
        if (!cancelled) setLoadingTeams(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleConfirmRegister() {
    if (!tournamentId || !selectedTeamId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await registerTeamForTournament(tournamentId, selectedTeamId);
      setStep("success");
    } catch (e: any) {
      setSubmitError(e?.message ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingTournament) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground">Loading tournament...</span>
      </div>
    );
  }

  if (!tournamentId || loadError || !tournament) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-muted-foreground">{loadError ?? "No tournament selected."}</p>
        <Button variant="outline" onClick={() => onNavigate("tournaments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tournaments
        </Button>
      </div>
    );
  }

  const currentTeams = tournament._count?.teamParticipants ?? tournament.teamParticipants?.length ?? 0;
  const spotsRemaining = tournament.maxParticipants - currentTeams;
  const isFull = spotsRemaining <= 0;
  const entryFeeEur = tournament.entryFee / 100;
  const eligibleTeams = myTeams.filter((t) => t.memberCount >= tournament.teamSize);
  const selectedTeam = myTeams.find((t) => t.id === selectedTeamId) ?? null;
  const alreadyRegisteredTeamIds = new Set((tournament.teamParticipants ?? []).map((tp) => tp.teamId));

  // Step 1: Details
  if (step === "details") {
    return (
      <div className="page-transition max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => onNavigate("tournaments")} className="mb-4 hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Tournaments
          </Button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Join Tournament</h1>
              <p className="text-muted-foreground">Review details and register your team</p>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/10 to-transparent animate-fadeInUp">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-foreground">{tournament.name}</h2>
                  {isFull && <Badge className="bg-destructive text-destructive-foreground">Full</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Target className="h-4 w-4" />{tournament.game}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{tournament.teamSize}v{tournament.teamSize}</span>
                  {tournament.startAt && (
                    <><span>•</span><span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(tournament.startAt).toLocaleDateString()}</span></>
                  )}
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground shrink-0">{formatFormat(tournament.format)}</Badge>
            </div>
            {tournament.description && <p className="text-sm text-muted-foreground mb-4">{tournament.description}</p>}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Teams Registered</span>
                <span className="text-foreground">{currentTeams}/{tournament.maxParticipants}</span>
              </div>
              <Progress value={(currentTeams / tournament.maxParticipants) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {spotsRemaining > 0 ? `${spotsRemaining} spot${spotsRemaining !== 1 ? "s" : ""} remaining` : "Tournament is full"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-fadeInUp animate-delay-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Swords className="h-5 w-5 text-primary" />Tournament Format</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Format</span><span className="text-foreground font-medium">{formatFormat(tournament.format)}</span></div>
                <Separator />
                <div className="flex justify-between"><span>Team Size</span><span className="text-foreground font-medium">{tournament.teamSize} players</span></div>
                <Separator />
                <div className="flex justify-between"><span>Max Teams</span><span className="text-foreground font-medium">{tournament.maxParticipants}</span></div>
                {tournament.startAt && (
                  <><Separator /><div className="flex justify-between"><span>Starts</span><span className="text-foreground font-medium">{new Date(tournament.startAt).toLocaleString()}</span></div></>
                )}
              </CardContent>
            </Card>

            <Card className="animate-fadeInUp animate-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Teams must be registered before the tournament starts",
                  `Team size must be exactly ${tournament.teamSize} player${tournament.teamSize !== 1 ? "s" : ""}`,
                  "Both teams must submit match results; disputes resolved by the host",
                  "Host can override any match result",
                  "Winners advance automatically in the bracket",
                  "No roster changes after tournament starts",
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span>{rule}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/30 animate-fadeInUp animate-delay-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Entry Fee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {entryFeeEur === 0 ? "Free" : formatCurrencyFromEur(entryFeeEur, currency, rates)}
                  </div>
                  {entryFeeEur > 0 && <div className="text-sm text-muted-foreground">per team</div>}
                </div>
                {entryFeeEur > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Funds held in secure escrow until tournament completion</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="animate-fadeInUp animate-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-400" />Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline" className="capitalize">{tournament.status}</Badge></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="text-foreground font-medium">{formatFormat(tournament.format)}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Team Size</span><span className="text-foreground font-medium">{tournament.teamSize} players</span></div>
              </CardContent>
            </Card>

            <Button className="w-full h-12" disabled={isFull || tournament.status !== "upcoming"} onClick={() => setStep("team")}>
              <Users className="h-4 w-4 mr-2" />
              {isFull ? "Tournament Full" : "Select Team & Register"}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              <Lock className="h-3 w-3 inline mr-1" />Secure registration
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Team Selection
  if (step === "team") {
    return (
      <div className="page-transition max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setStep("details")} className="mb-4 hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Details
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Select Your Team</h1>
              <p className="text-muted-foreground">
                Pick a team with at least {tournament.teamSize} member{tournament.teamSize !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {loadingTeams ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
            <span className="text-muted-foreground">Loading your teams...</span>
          </div>
        ) : myTeams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Users className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">You do not have any teams yet.</p>
              <Button variant="outline" onClick={() => onNavigate("hubs")}>Create a Team</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myTeams.map((team) => {
              const isEligible = team.memberCount >= tournament.teamSize;
              const isAlreadyRegistered = alreadyRegisteredTeamIds.has(team.id);
              const isSelected = selectedTeamId === team.id;
              const disabled = !isEligible || isAlreadyRegistered;
              return (
                <Card
                  key={team.id}
                  className={`cursor-pointer transition-all duration-200 border-2 ${
                    disabled ? "opacity-50 cursor-not-allowed border-border/30"
                    : isSelected ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => !disabled && setSelectedTeamId(isSelected ? null : team.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}>
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{team.name}</h4>
                            {team.ownerId === user?.id && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{team.game}</span>
                            <span>•</span>
                            <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isAlreadyRegistered ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Already registered</Badge>
                        ) : !isEligible ? (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Needs {tournament.teamSize} members</Badge>
                        ) : isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {eligibleTeams.length === 0 && !loadingTeams && (
              <Card className="border-amber-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-400">
                    None of your teams have {tournament.teamSize} or more members. Invite players to your team first.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setStep("details")}>Cancel</Button>
          <Button onClick={() => setStep("confirm")} disabled={!selectedTeamId} className="min-w-[140px]">
            Continue<ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (step === "confirm") {
    const balanceDollars = (user?.wallet?.balance ?? 0) / 100;
    const canAfford = entryFeeEur === 0 || balanceDollars >= entryFeeEur;
    return (
      <div className="page-transition max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setStep("team")} className="mb-4 hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Team Selection
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Confirm Registration</h1>
              <p className="text-muted-foreground">Review and confirm your entry</p>
            </div>
          </div>
        </div>

        <Card className="mb-6 animate-fadeInUp">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Tournament Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tournament</span><span className="text-foreground font-medium">{tournament.name}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Game</span><span className="text-foreground">{tournament.game}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="text-foreground">{formatFormat(tournament.format)}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Team</span><span className="text-foreground font-medium">{selectedTeam?.name ?? "—"}</span></div>
            {tournament.startAt && (
              <><Separator /><div className="flex justify-between"><span className="text-muted-foreground">Starts</span><span className="text-foreground">{new Date(tournament.startAt).toLocaleString()}</span></div></>
            )}
          </CardContent>
        </Card>

        {entryFeeEur > 0 && (
          <Card className="mb-6 border-primary/30 animate-fadeInUp animate-delay-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Entry Fee</span><span className="text-foreground">{formatCurrencyFromEur(entryFeeEur, currency, rates)}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-foreground font-medium">Total Due</span><span className="text-primary font-medium text-lg">{formatCurrencyFromEur(entryFeeEur, currency, rates)}</span></div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Entry fee held in secure escrow</span>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Wallet balance: {formatCurrencyFromEur(balanceDollars, currency, rates)}</span>
                </div>
              </div>
              {!canAfford && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-xs text-destructive">
                      Insufficient balance — need {formatCurrencyFromEur(entryFeeEur - balanceDollars, currency, rates)} more
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full border-destructive/50 text-destructive" onClick={() => onNavigate("deposit-funds")}>
                    <DollarSign className="h-3 w-3 mr-1" />Deposit Funds
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 animate-fadeInUp animate-delay-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox id="rules" checked={agreeToRules} onCheckedChange={(v) => setAgreeToRules(v as boolean)} />
              <Label htmlFor="rules" className="text-sm cursor-pointer">I have read and agree to the tournament rules</Label>
            </div>
            {entryFeeEur > 0 && (
              <div className="flex items-start gap-3">
                <Checkbox id="fees" checked={agreeToFees} onCheckedChange={(v) => setAgreeToFees(v as boolean)} />
                <Label htmlFor="fees" className="text-sm cursor-pointer">I understand entry fees are non-refundable except on tournament cancellation</Label>
              </div>
            )}
          </CardContent>
        </Card>

        {submitError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />{submitError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setStep("team")}>Back</Button>
          <Button
            onClick={handleConfirmRegister}
            disabled={submitting || !agreeToRules || (entryFeeEur > 0 && (!agreeToFees || !canAfford))}
            className="min-w-[180px]"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registering...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" />Confirm Registration</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Success
  return (
    <div className="page-transition max-w-2xl mx-auto">
      <Card className="border-primary/30 animate-scaleIn">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 animate-bounce" />
          </div>
          <h2 className="text-foreground mb-2">Registration Successful!</h2>
          <p className="text-muted-foreground mb-6">
            <span className="text-foreground font-medium">{selectedTeam?.name}</span> is now registered for{" "}
            <span className="text-primary font-medium">{tournament.name}</span>
          </p>
          <div className="bg-muted/30 rounded-lg p-6 space-y-4 text-left mb-6">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tournament</span><span className="text-foreground font-medium">{tournament.name}</span></div>
            <Separator />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Team</span><span className="text-foreground font-medium">{selectedTeam?.name}</span></div>
            <Separator />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Format</span><span className="text-foreground">{formatFormat(tournament.format)}</span></div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-emerald-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Registered</Badge>
            </div>
          </div>

          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">What is next</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>The host will start the tournament once all teams register</li>
                  <li>View the bracket and schedule from the Tournaments page</li>
                  <li>Submit your match results after each game</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => onNavigate(`tournament-bracket-${tournament.id}`)}>
              <Trophy className="h-4 w-4 mr-2" />View Bracket
            </Button>
            <Button onClick={() => onNavigate("tournaments")}>Back to Tournaments</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
