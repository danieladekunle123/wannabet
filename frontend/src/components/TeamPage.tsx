import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyFromEur } from "../utils/formatCurrency";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MessageCircle,
  Shield,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import {
  getMyTeams,
  getTeamProfile,
  type TeamProfile,
} from "../services/teamsService";

interface TeamPageProps {
  onNavigate?: (page: string) => void;
  teamId?: string;
  isOwnTeam?: boolean;
}

function roleLabel(role?: string) {
  if (role === "commander") return "Commander";
  if (role === "general") return "General";
  return "Colonel";
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export function TeamPage({
  onNavigate,
  teamId,
  isOwnTeam = true,
}: TeamPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [resolvedTeamId, setResolvedTeamId] = useState<string | null>(
    teamId || null,
  );
  const [team, setTeam] = useState<TeamProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currency, rates } = useCurrency();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (teamId) {
          setResolvedTeamId(teamId);
          return;
        }
        const myTeams = await getMyTeams();
        if (!cancelled) {
          setResolvedTeamId(myTeams[0]?.id || null);
        }
      } catch {
        if (!cancelled) {
          setResolvedTeamId(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  useEffect(() => {
    if (!resolvedTeamId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Team ID:", resolvedTeamId);
        const data = await getTeamProfile(resolvedTeamId);
        if (!cancelled) {
          setTeam(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load team profile");
          setTeam(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedTeamId]);

  const stats = useMemo(() => {
    const matches = team?.matches || [];
    const completed = matches.filter(
      (match) => match.result === "win" || match.result === "loss",
    );
    const wins = completed.filter((match) => match.result === "win").length;
    const losses = completed.filter((match) => match.result === "loss").length;
    const matchesPlayed = completed.length;
    const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
    const earnings = completed.reduce(
      (sum, match) => sum + Number(match.earnings || 0),
      0,
    );

    return {
      wins,
      losses,
      matchesPlayed,
      winRate,
      earnings,
    };
  }, [team?.matches]);

  const upcomingMatches = useMemo(
    () =>
      (team?.matches || [])
        .filter(
          (match) => match.status === "upcoming" || match.status === "ongoing",
        )
        .slice(0, 6),
    [team?.matches],
  );

  const recentMatches = useMemo(
    () =>
      (team?.matches || [])
        .filter((match) => match.result === "win" || match.result === "loss")
        .slice(0, 10),
    [team?.matches],
  );

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground">Loading team profile...</div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate?.("hubs")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-foreground">Team Profile</h2>
        </div>
        <Card>
          <CardContent className="p-4 text-sm text-rose-300">
            {error || "No team data found."}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.("hubs")}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-foreground">Team Profile</h1>
          <p className="text-muted-foreground">Live team data from backend</p>
        </div>
      </div>

      <Card className="border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-20 w-20 border border-primary/30">
              <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                {team.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-foreground">{team.name}</h2>
                <Badge className="bg-primary/20 text-primary border border-primary/30">
                  {roleLabel(team.myRole)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {team.description || "No description"}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span>Game: {team.game}</span>
                <span>•</span>
                <span>Created: {dateLabel(team.createdAt)}</span>
                <span>•</span>
                <span>{team.members.length} members</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-primary/30 hover:bg-primary/10"
                onClick={() => onNavigate?.("messages")}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Team Chat
              </Button>
              {isOwnTeam && team.canManageTeam ? (
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => onNavigate?.("team-settings")}
                >
                  Manage Team
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {stats.wins}
            </div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {stats.losses}
            </div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrencyFromEur(stats.earnings, currency, rates)}
            </div>
            <div className="text-xs text-muted-foreground">Earnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {stats.matchesPlayed}
            </div>
            <div className="text-xs text-muted-foreground">Matches Played</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted/50 h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="hub">Team Hub</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h3 className="text-foreground">Upcoming Matches</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMatches.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No upcoming matches
                </div>
              ) : (
                upcomingMatches.map((match) => (
                  <div key={match.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-foreground">
                          vs {match.opponent || "TBD"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dateLabel(match.createdAt)}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {match.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-foreground">Recent Matches</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentMatches.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No recent matches
                </div>
              ) : (
                recentMatches.slice(0, 5).map((match) => (
                  <div key={match.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            match.result === "win"
                              ? "bg-emerald-600 text-white"
                              : "bg-red-600 text-white"
                          }
                        >
                          {match.result.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="font-medium text-foreground">
                            vs {match.opponent || "TBD"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {match.score || "No score submitted"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{dateLabel(match.createdAt)}</div>
                        {match.earnings > 0 ? (
                          <div className="text-emerald-400">
                            +
                            {formatCurrencyFromEur(
                              match.earnings,
                              currency,
                              rates,
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-foreground">Team Hub Preview</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.latestPosts.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No posts yet
                </div>
              ) : (
                team.latestPosts.slice(0, 3).map((post) => (
                  <div key={post.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="font-medium text-foreground">
                      {post.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {post.content}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {post.author?.username || "Unknown"} •{" "}
                      {dateLabel(post.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4 mt-6">
          {team.members.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                No members found.
              </CardContent>
            </Card>
          ) : (
            team.members.map((member) => (
              <Card key={member.userId}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground">
                          {member.username}
                        </h4>
                        <Badge variant="outline">
                          {roleLabel(member.role)}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span>Wins: {member.stats.wins}</span>
                        <span>Losses: {member.stats.losses}</span>
                        <span>
                          Earnings:{" "}
                          {formatCurrencyFromEur(
                            Number(member.stats.earnings || 0),
                            currency,
                            rates,
                          )}
                        </span>
                        <span>MMR: {member.stats.mmr ?? "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="matches" className="space-y-4 mt-6">
          {team.matches.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                No matches found.
              </CardContent>
            </Card>
          ) : (
            team.matches.map((match) => (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">
                        vs {match.opponent || "TBD"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dateLabel(match.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          match.result === "win"
                            ? "bg-emerald-600 text-white"
                            : match.result === "loss"
                              ? "bg-red-600 text-white"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {match.result.toUpperCase()}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {match.score || "No score"}
                      </div>
                      {match.earnings > 0 ? (
                        <div className="text-xs text-emerald-400 mt-1">
                          +
                          {formatCurrencyFromEur(
                            match.earnings,
                            currency,
                            rates,
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="hub" className="space-y-4 mt-6">
          {team.latestPosts.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                No team hub posts yet.
              </CardContent>
            </Card>
          ) : (
            team.latestPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="font-medium text-foreground">
                    {post.title}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                    {post.content}
                  </div>
                  <div className="text-xs text-muted-foreground mt-3">
                    {post.author?.username || "Unknown"} •{" "}
                    {dateLabel(post.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
