import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAuth } from "./AuthContext";
import {
  createTeam,
  getMyTeams,
  getTeamInvites,
  respondToTeamInvite,
  type TeamRecord,
  type TeamInvite,
} from "../services/teamsService";
import {
  Plus,
  Shield,
  Users,
  Trophy,
  Gamepad2,
  Crown,
  UserPlus,
} from "lucide-react";

interface TeamsPageProps {
  onNavigate?: (tab: string) => void;
}

export function TeamsPage({ onNavigate }: TeamsPageProps) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [myTeams, myInvites] = await Promise.all([
        getMyTeams(),
        getTeamInvites(),
      ]);
      setTeams(myTeams);
      setInvites(myInvites);
    } catch (err: any) {
      setError(err?.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const myTeamsCount = useMemo(() => teams.length, [teams]);

  const handleCreate = async () => {
    if (!name.trim() || !game.trim()) return;
    try {
      setCreating(true);
      setError(null);
      const created = await createTeam({
        name: name.trim(),
        game: game.trim(),
        description: description.trim(),
      });
      const id = created?.team?.id as string | undefined;
      setName("");
      setGame("");
      setDescription("");
      await fetchData();
      if (id) onNavigate?.(`team-detail-${id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleInviteAction = async (
    inviteId: string,
    action: "accepted" | "declined",
  ) => {
    try {
      setError(null);
      await respondToTeamInvite(inviteId, action);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to process invite");
    }
  };

  const roleBadge = (role?: string) => {
    if (role === "commander") return "Commander";
    if (role === "general") return "General";
    return "Colonel";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Create squads, manage roles, and run your Team Hub.
          </p>
        </div>
        <Badge className="bg-primary text-primary-foreground">
          <Users className="h-3.5 w-3.5 mr-1" /> {myTeamsCount} Teams
        </Badge>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teams">My Teams</TabsTrigger>
          <TabsTrigger value="create">Create Team</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">
                Loading teams...
              </CardContent>
            </Card>
          ) : teams.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">
                You are not in any teams yet.
              </CardContent>
            </Card>
          ) : (
            teams.map((team) => (
              <Card
                key={team.id}
                className="border-border/50 hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar className="h-11 w-11 border border-primary/30">
                        <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                          {team.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">
                            {team.name}
                          </h3>
                          <Badge className="bg-primary/20 text-primary border border-primary/30">
                            {roleBadge(team.myRole)}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Gamepad2 className="h-3.5 w-3.5" /> {team.game}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />{" "}
                            {team.memberCount ?? 0}
                          </span>
                        </div>
                        {team.description ? (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {team.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => onNavigate?.(`team-detail-${team.id}`)}
                    >
                      Open Team Hub
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card className="border-border/50">
            <CardHeader>
              <h3 className="text-xl font-semibold text-foreground">
                Create Team
              </h3>
              <p className="text-sm text-muted-foreground">
                Commander gets full permissions and a team group chat is created
                automatically.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Team Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Night Raiders"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Game</label>
                  <Input
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    placeholder="Valorant"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What your team is about..."
                  className="min-h-24"
                />
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2 text-foreground">
                  <Shield className="h-4 w-4 text-primary" /> Role hierarchy
                </div>
                <div>
                  <Crown className="inline h-3.5 w-3.5 mr-1 text-amber-400" />{" "}
                  Commander: full control
                </div>
                <div>
                  <UserPlus className="inline h-3.5 w-3.5 mr-1 text-blue-400" />{" "}
                  General: can post + invite
                </div>
                <div>
                  <Trophy className="inline h-3.5 w-3.5 mr-1 text-zinc-400" />{" "}
                  Colonel: read-only hub access
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={creating || !name.trim() || !game.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {creating ? "Creating..." : "Create Team"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          {invites.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-muted-foreground">
                No pending team invites.
              </CardContent>
            </Card>
          ) : (
            invites.map((invite) => (
              <Card key={invite.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {invite.team?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {invite.team?.game} • Invited by{" "}
                        {invite.sender?.username}
                      </p>
                      {invite.team?.description ? (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {invite.team.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() =>
                          handleInviteAction(invite.id, "accepted")
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-500/40 text-rose-300"
                        onClick={() =>
                          handleInviteAction(invite.id, "declined")
                        }
                      >
                        Decline
                      </Button>
                    </div>
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
