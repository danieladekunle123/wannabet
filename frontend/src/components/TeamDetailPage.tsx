import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  createTeamPost,
  deleteTeam,
  getTeam,
  getTeamPosts,
  inviteToTeam,
  leaveTeam,
  removeTeamMember,
  updateMemberRole,
  type TeamPost,
  type TeamRecord,
  type TeamRole,
} from "../services/teamsService";
import {
  ArrowLeft,
  Crown,
  Gamepad2,
  MessageCircle,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

interface TeamDetailPageProps {
  teamId: string;
  onNavigate?: (tab: string, query?: string) => void;
}

const roleOrder: TeamRole[] = ["commander", "general", "colonel"];

function roleBadge(role: TeamRole) {
  if (role === "commander") return "Commander";
  if (role === "general") return "General";
  return "Colonel";
}

export function TeamDetailPage({ teamId, onNavigate }: TeamDetailPageProps) {
  const [team, setTeam] = useState<TeamRecord | null>(null);
  const [posts, setPosts] = useState<TeamPost[]>([]);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  const [inviteUserId, setInviteUserId] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [busy, setBusy] = useState(false);

  const sortedMembers = useMemo(() => {
    const items = [...(team?.members || [])];
    items.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
    return items;
  }, [team?.members]);

  const refresh = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      setOperationError(null);
      console.log("Team ID:", teamId);

      const teamData = await getTeam(teamId);
      setTeam(teamData);

      try {
        const postsData = await getTeamPosts(teamId);
        setPosts(postsData.posts);
        setCanPost(postsData.canPost);
      } catch (err: any) {
        setPosts([]);
        setCanPost(false);
        setOperationError(err?.message || "Failed to load team posts");
      }
    } catch (err: any) {
      setTeam(null);
      setPosts([]);
      setCanPost(false);
      setFetchError("Team not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [teamId]);

  const doAction = async (fn: () => Promise<unknown>) => {
    try {
      setBusy(true);
      setOperationError(null);
      await fn();
      await refresh();
    } catch (err: any) {
      setOperationError(err?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading team...</div>;
  }

  if (fetchError || !team) {
    return (
      <div className="py-10 text-center">
        <p className="text-rose-300">Team not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate?.("hubs")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
            <p className="text-sm text-muted-foreground">Team Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary border border-primary/30">
            {roleBadge(team.myRole || "colonel")}
          </Badge>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() =>
              onNavigate?.("messages", team.chatId || `team:${team.id}`)
            }
          >
            <MessageCircle className="h-4 w-4 mr-2" /> Team Chat
          </Button>
        </div>
      </div>

      {operationError ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {operationError}
        </div>
      ) : null}

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Gamepad2 className="h-4 w-4" /> {team.game}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />{" "}
              {team.memberCount ?? team.members?.length ?? 0} members
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4" /> Commander controls roles
            </span>
          </div>
          {team.description ? (
            <p className="text-sm text-muted-foreground mt-2">
              {team.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="hub" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hub">Team Hub</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="hub" className="space-y-4">
          {canPost ? (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-foreground">
                  Create Team Post
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Post title"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
                <Textarea
                  className="min-h-24"
                  placeholder="Share updates, plans, and announcements"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <Button
                  disabled={busy || !postTitle.trim() || !postContent.trim()}
                  onClick={() =>
                    doAction(async () => {
                      await createTeamPost(team.id, {
                        title: postTitle.trim(),
                        content: postContent.trim(),
                      });
                      setPostTitle("");
                      setPostContent("");
                    })
                  }
                >
                  Publish Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Colonels can read posts only. Commander and General can publish
                posts.
              </CardContent>
            </Card>
          )}

          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                No posts yet.
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-foreground">
                      {post.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                    {post.content}
                  </p>
                  <div className="text-xs text-muted-foreground mt-3">
                    by {post.author?.username || "Unknown"}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-foreground">Team Members</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedMembers.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {member.username ||
                        member.user?.username ||
                        member.userId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {roleBadge(member.role)}
                    </div>
                  </div>

                  {team.canManageTeam && member.userId !== team.ownerId ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                        value={member.role}
                        onChange={(e) =>
                          void doAction(() =>
                            updateMemberRole(
                              team.id,
                              member.userId,
                              e.target.value as TeamRole,
                            ),
                          )
                        }
                      >
                        <option value="general">General</option>
                        <option value="colonel">Colonel</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-rose-500/40 text-rose-300"
                        onClick={() =>
                          void doAction(() =>
                            removeTeamMember(team.id, member.userId),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ) : member.userId === team.ownerId ? (
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Crown className="h-3.5 w-3.5 mr-1" /> Commander
                    </Badge>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          {team.canPost ? (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-foreground">Invite Member</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  placeholder="Receiver username or user id"
                />
                <Button
                  disabled={busy || !inviteUserId.trim()}
                  onClick={() =>
                    void doAction(async () => {
                      await inviteToTeam(team.id, inviteUserId.trim());
                      setInviteUserId("");
                    })
                  }
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Send Invite
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {team.myRole !== "commander" ? (
              <Button
                variant="outline"
                onClick={() => void doAction(() => leaveTeam(team.id))}
              >
                Leave Team
              </Button>
            ) : null}

            {team.canManageTeam ? (
              <Button
                variant="outline"
                className="border-rose-500/40 text-rose-300"
                onClick={() =>
                  void doAction(async () => {
                    await deleteTeam(team.id);
                    onNavigate?.("hubs");
                  })
                }
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Team
              </Button>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
