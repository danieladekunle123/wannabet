import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  ArrowLeft,
  Save,
  Users,
  Shield,
  DollarSign,
  Trash2,
  Upload,
  Crown,
  UserPlus,
  UserMinus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Settings,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  X,
  Copy,
} from "lucide-react";

interface TeamSettingsProps {
  onNavigate?: (page: string) => void;
}

export function TeamSettings({ onNavigate }: TeamSettingsProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [teamName, setTeamName] = useState("Team Phoenix");
  const [teamTag, setTeamTag] = useState("PHX");
  const [teamDescription, setTeamDescription] = useState(
    "Elite competitive esports team focused on CS2 and Valorant. Dominating the scene since 2023.",
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [autoAcceptMMR, setAutoAcceptMMR] = useState(2000);
  const [prizeSplit, setPrizeSplit] = useState([20, 20, 20, 20, 20]); // Equal split by default
  const [inviteEmail, setInviteEmail] = useState("");

  // Mock roster data
  const roster = [
    {
      id: "1",
      name: "PhoenixLeader",
      role: "Captain",
      joinDate: "Jan 2023",
      matches: 156,
      contribution: 20,
      canRemove: false,
    },
    {
      id: "2",
      name: "BlazeFury",
      role: "Member",
      joinDate: "Feb 2023",
      matches: 142,
      contribution: 20,
      canRemove: true,
    },
    {
      id: "3",
      name: "EmberStrike",
      role: "Member",
      joinDate: "Mar 2023",
      matches: 138,
      contribution: 20,
      canRemove: true,
    },
    {
      id: "4",
      name: "InfernoShot",
      role: "Member",
      joinDate: "Apr 2023",
      matches: 129,
      contribution: 20,
      canRemove: true,
    },
    {
      id: "5",
      name: "PyroTactic",
      role: "Member",
      joinDate: "May 2023",
      matches: 145,
      contribution: 20,
      canRemove: true,
    },
  ];

  const [pendingInvites, setPendingInvites] = useState([
    { id: "1", email: "newplayer@example.com", sentDate: "2h ago" },
    { id: "2", email: "progamer123@example.com", sentDate: "1d ago" },
  ]);

  const handleSaveProfile = () => {
    console.log("Saving profile:", { teamName, teamTag, teamDescription });
    // Show success toast
  };

  const handleSendInvite = () => {
    if (inviteEmail) {
      console.log("Sending invite to:", inviteEmail);
      setPendingInvites([
        ...pendingInvites,
        {
          id: Date.now().toString(),
          email: inviteEmail,
          sentDate: "Just now",
        },
      ]);
      setInviteEmail("");
    }
  };

  const handleRemoveInvite = (id: string) => {
    setPendingInvites(pendingInvites.filter((invite) => invite.id !== id));
  };

  const handleRemoveMember = (memberId: string) => {
    console.log("Removing member:", memberId);
  };

  const handlePromoteToCaptain = (memberId: string) => {
    console.log("Promoting to captain:", memberId);
  };

  const handleDisbandTeam = () => {
    console.log("Disbanding team");
    onNavigate?.("hubs");
  };

  return (
    <div className="space-y-6 animate-fadeInUp max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.("team-page")}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-foreground">Team Settings</h1>
          <p className="text-muted-foreground">
            Manage your team configuration and roster
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={handleSaveProfile}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="animate-fadeInUp animate-delay-100"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted/50 h-auto">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Settings className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="roster"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="h-4 w-4 mr-2" />
            Roster
          </TabsTrigger>
          <TabsTrigger
            value="privacy"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h3 className="text-foreground">Team Identity</h3>
              <p className="text-sm text-muted-foreground">
                Update your team's basic information
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Logo */}
              <div className="space-y-2">
                <Label>Team Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center text-4xl">
                    🔥
                  </div>
                  <div className="flex-1">
                    <Button
                      variant="outline"
                      className="border-primary/30 hover:bg-primary/10"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: 512x512px, PNG or JPG, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Team Banner */}
              <div className="space-y-2">
                <Label>Team Banner</Label>
                <div className="space-y-3">
                  <div className="h-32 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Banner
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: 1920x400px, PNG or JPG, max 5MB
                  </p>
                </div>
              </div>

              <Separator />

              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="bg-input-background"
                />
                <p className="text-xs text-muted-foreground">
                  Your team's display name (3-30 characters)
                </p>
              </div>

              {/* Team Tag */}
              <div className="space-y-2">
                <Label htmlFor="teamTag">Team Tag</Label>
                <Input
                  id="teamTag"
                  value={teamTag}
                  onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                  placeholder="PHX"
                  maxLength={5}
                  className="bg-input-background"
                />
                <p className="text-xs text-muted-foreground">
                  Short identifier for your team (2-5 characters)
                </p>
              </div>

              {/* Team Description */}
              <div className="space-y-2">
                <Label htmlFor="teamDescription">Team Description</Label>
                <Textarea
                  id="teamDescription"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Tell people about your team..."
                  rows={4}
                  className="bg-input-background resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {teamDescription.length}/500 characters
                </p>
              </div>

              {/* Preferred Games */}
              <div className="space-y-2">
                <Label>Preferred Games</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "CS2",
                    "Valorant",
                    "League of Legends",
                    "Dota 2",
                    "Rocket League",
                  ].map((game) => (
                    <Badge
                      key={game}
                      className="cursor-pointer hover:bg-primary/90 transition-colors"
                      variant={
                        ["CS2", "Valorant"].includes(game)
                          ? "default"
                          : "outline"
                      }
                    >
                      {game}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roster Management Tab */}
        <TabsContent value="roster" className="space-y-6 mt-6">
          {/* Invite New Members */}
          <Card>
            <CardHeader>
              <h3 className="text-foreground">Invite New Members</h3>
              <p className="text-sm text-muted-foreground">
                Send invitations to players
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter player email or username"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-input-background flex-1"
                />
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleSendInvite}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>

              {/* Invite Link */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <Label className="text-sm mb-2 block">Team Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    value="https://wannabet.gg/team/invite/PHX-ABC123"
                    readOnly
                    className="bg-input-background"
                  />
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this link to invite players directly
                </p>
              </div>

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">
                    Pending Invites ({pendingInvites.length})
                  </Label>
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground text-sm">
                          {invite.email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Sent {invite.sentDate}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveInvite(invite.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Roster */}
          <Card>
            <CardHeader>
              <h3 className="text-foreground">
                Current Roster ({roster.length}/5)
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your team members
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {roster.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {member.name}
                          </span>
                          {member.role === "Captain" && (
                            <Badge className="bg-amber-600 text-white text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Captain
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Joined {member.joinDate} • {member.matches} matches
                        </div>
                      </div>
                    </div>

                    {member.canRemove && (
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-600/30 text-amber-400 hover:bg-amber-500/10"
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Promote
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Transfer Team Captain Role?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will transfer all captain privileges to{" "}
                                {member.name}. You will become a regular member.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handlePromoteToCaptain(member.id)
                                }
                                className="bg-amber-600 hover:bg-amber-700"
                              >
                                Transfer Role
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-600/30 text-red-400 hover:bg-red-500/10"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove Team Member?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {member.name}{" "}
                                from the team? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove Member
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h3 className="text-foreground">Team Visibility</h3>
              <p className="text-sm text-muted-foreground">
                Control who can see and join your team
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Private Team */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base">Private Team</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Only invited players can see and join this team
                  </p>
                </div>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>

              {/* Require Approval */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base">Require Join Approval</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Captain must approve all join requests
                  </p>
                </div>
                <Switch
                  checked={requireApproval}
                  onCheckedChange={setRequireApproval}
                />
              </div>

              <Separator />

              {/* Auto-Accept MMR */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Minimum MMR for Auto-Accept</Label>
                  <p className="text-sm text-muted-foreground">
                    Players with MMR above this threshold will be automatically
                    accepted
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Current: {autoAcceptMMR} MMR
                    </span>
                    <Badge variant="outline">
                      {autoAcceptMMR >= 2500
                        ? "Elite"
                        : autoAcceptMMR >= 2000
                          ? "Advanced"
                          : "Intermediate"}
                    </Badge>
                  </div>
                  <Slider
                    value={[autoAcceptMMR]}
                    onValueChange={(value) => setAutoAcceptMMR(value[0])}
                    min={1000}
                    max={3500}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1000</span>
                    <span>2000</span>
                    <span>3000</span>
                    <span>3500</span>
                  </div>
                </div>
              </div>

              {/* Match History Visibility */}
              <div className="space-y-2">
                <Label>Match History Visibility</Label>
                <Select defaultValue="public">
                  <SelectTrigger className="bg-input-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>Public - Anyone can view</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="members">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Members Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        <span>Private - Hidden</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h3 className="text-foreground">Prize Distribution</h3>
              <p className="text-sm text-muted-foreground">
                Configure how winnings are split among team members
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prize Split Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Distribution Method</Label>
                  <Badge className="bg-emerald-600 text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <Select defaultValue="equal">
                  <SelectTrigger className="bg-input-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">
                      Equal Split (20% each)
                    </SelectItem>
                    <SelectItem value="custom">Custom Percentages</SelectItem>
                    <SelectItem value="performance">
                      Performance-Based
                    </SelectItem>
                    <SelectItem value="captain">Captain Decides</SelectItem>
                  </SelectContent>
                </Select>

                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-emerald-400 mb-1">
                        Current Split: Equal Distribution
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Each team member receives 20% of all prize winnings
                        automatically after matches.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Team Wallet */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Team Wallet</Label>
                  <p className="text-sm text-muted-foreground">
                    Shared funds for tournament entries and team expenses
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="text-sm text-muted-foreground mb-1">
                      Balance
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">
                      $1,245
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="text-sm text-muted-foreground mb-1">
                      Pending
                    </div>
                    <div className="text-2xl font-bold text-amber-400">
                      $850
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="text-sm text-muted-foreground mb-1">
                      Total Earned
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      $48.5k
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-primary/30 hover:bg-primary/10"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Add Funds
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-primary/30 hover:bg-primary/10"
                  >
                    Withdraw
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Auto-Deposit */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-base">
                    Auto-Deposit Tournament Fees
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically use team wallet for tournament entries
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-600/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-red-400">Danger Zone</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Irreversible actions
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-red-600/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disband Team
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Disband Team Phoenix?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>
                          This action cannot be undone. This will permanently:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Remove all team members</li>
                          <li>Cancel all scheduled matches</li>
                          <li>Delete team history and statistics</li>
                          <li>Distribute remaining funds to members</li>
                        </ul>
                        <p className="font-medium text-foreground">
                          Current team wallet balance ($1,245) will be split
                          equally among members.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisbandTeam}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Disband Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-muted-foreground">
                  Disbanding the team will permanently delete all data. Make
                  sure to withdraw any funds first.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
