import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  Trophy,
  Swords,
  Star,
  Shield,
  TrendingUp,
  Calendar,
  Hash,
  CheckCircle2,
} from "lucide-react";

interface JoinHubProps {
  onNavigate: (tab: string) => void;
}

export function JoinHub({ onNavigate }: JoinHubProps) {
  const [agreedToRules, setAgreedToRules] = useState(false);

  // Mock hub data - in real app this would come from props or API
  const hub = {
    id: "hub-1",
    name: "Pro Valorant Grinders",
    game: "Valorant",
    description:
      "High-level Valorant discussions, team recruitment, and competitive scrims. Join us to improve your skills and find dedicated teammates.",
    banner: "valorant",
    members: {
      total: 2890,
      online: 456,
    },
    verified: true,
    founded: "March 2024",
    category: "Competitive",
    rules: [
      "Be respectful to all members",
      "No spam or self-promotion",
      "Stay on topic in designated channels",
      "No cheating discussions or exploits",
      "Follow Discord Community Guidelines",
      "English language only in main channels",
    ],
    stats: {
      activeMatches: 24,
      tournaments: 8,
      averageSkill: "Diamond+",
      region: "Multi-Region",
    },
    features: [
      { icon: MessageCircle, label: "Active Chat", value: "24/7" },
      { icon: Trophy, label: "Tournaments", value: "Weekly" },
      { icon: Swords, label: "Daily Scrims", value: "50+" },
      { icon: Users, label: "LFG System", value: "Active" },
    ],
    staff: [
      { name: "AdminPro", role: "Owner", trust: 99.8 },
      { name: "ModMaster", role: "Admin", trust: 99.2 },
      { name: "HelperOne", role: "Moderator", trust: 98.5 },
      { name: "HelperTwo", role: "Moderator", trust: 98.1 },
    ],
    topMembers: [
      { name: "ProGamer23", rank: "Radiant", matches: 847, trust: 99.5 },
      { name: "SkillMaster", rank: "Immortal 3", matches: 723, trust: 99.1 },
      { name: "AceShooter", rank: "Immortal 2", matches: 692, trust: 98.7 },
      { name: "ClutchKing", rank: "Immortal 1", matches: 645, trust: 98.3 },
      { name: "TeamPlayer", rank: "Diamond 3", matches: 589, trust: 97.9 },
    ],
    recentActivity: [
      {
        type: "tournament",
        title: "Weekly Cup #12",
        participants: 32,
        time: "2 hours ago",
      },
      {
        type: "match",
        title: "Ranked Scrim Session",
        participants: 10,
        time: "4 hours ago",
      },
      {
        type: "member",
        title: "New Member Welcome Event",
        participants: 15,
        time: "6 hours ago",
      },
    ],
    channels: [
      { name: "general", category: "Text Channels", members: 1240 },
      { name: "looking-for-group", category: "Text Channels", members: 890 },
      { name: "strategy-discussion", category: "Text Channels", members: 567 },
      { name: "tournament-info", category: "Text Channels", members: 432 },
      { name: "match-results", category: "Text Channels", members: 321 },
    ],
  };

  const handleJoinHub = () => {
    // In a real app, this would call an API
    console.log("Joining hub:", hub.id);
    onNavigate("hubs");
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("hubs")}
            className="hover:bg-muted transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-foreground">Join Social Hub</h1>
            <p className="text-muted-foreground">
              Review hub details before joining
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hub Header */}
          <Card className="animate-fadeInLeft hover-lift">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
              <Trophy className="h-16 w-16 text-primary opacity-50" />
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <CardTitle className="text-2xl">{hub.name}</CardTitle>
                    {hub.verified && (
                      <Badge className="bg-blue-600 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {hub.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-foreground">
                    {hub.members.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Members
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-emerald-400">
                    {hub.members.online}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Online Now
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-foreground">
                    {hub.stats.averageSkill}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg. Skill
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="font-medium text-foreground">
                    {hub.stats.region}
                  </div>
                  <div className="text-xs text-muted-foreground">Region</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {hub.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-3 bg-primary/5 rounded-lg border border-primary/20"
                  >
                    <feature.icon className="h-5 w-5 text-primary mb-2" />
                    <div className="text-xs font-medium text-foreground">
                      {feature.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {feature.value}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Card className="animate-fadeInLeft animate-delay-100">
            <Tabs defaultValue="overview" className="w-full">
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted/50 h-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="channels">Channels</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-3 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-primary" />
                      Hub Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          Category
                        </div>
                        <div className="font-medium text-foreground">
                          {hub.category}
                        </div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          Founded
                        </div>
                        <div className="font-medium text-foreground">
                          {hub.founded}
                        </div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          Active Matches
                        </div>
                        <div className="font-medium text-emerald-400">
                          {hub.stats.activeMatches} Live
                        </div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          Tournaments
                        </div>
                        <div className="font-medium text-amber-400">
                          {hub.stats.tournaments} Running
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium text-foreground mb-3 flex items-center">
                      <Star className="h-4 w-4 mr-2 text-primary" />
                      Staff Team
                    </h3>
                    <div className="space-y-2">
                      {hub.staff.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground text-sm">
                                {member.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.role}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-amber-400">
                            <Star className="h-3 w-3 mr-1" />
                            {member.trust}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-3">
                      Top Members
                    </h3>
                    <div className="space-y-2">
                      {hub.topMembers.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                index < 3
                                  ? "bg-amber-600 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              #{index + 1}
                            </div>
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground text-sm">
                                {member.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.rank}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {member.matches} matches
                            </div>
                            <div className="flex items-center text-xs text-amber-400 justify-end">
                              <Star className="h-3 w-3 mr-1" />
                              {member.trust}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-3">
                      Recent Activity
                    </h3>
                    <div className="space-y-2">
                      {hub.recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300"
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              activity.type === "tournament"
                                ? "bg-amber-600/20"
                                : activity.type === "match"
                                  ? "bg-primary/20"
                                  : "bg-emerald-600/20"
                            }`}
                          >
                            {activity.type === "tournament" && (
                              <Trophy className="h-4 w-4 text-amber-400" />
                            )}
                            {activity.type === "match" && (
                              <Swords className="h-4 w-4 text-primary" />
                            )}
                            {activity.type === "member" && (
                              <Users className="h-4 w-4 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-foreground text-sm">
                              {activity.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {activity.participants} participants •{" "}
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="channels" className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-3">
                      Available Channels
                    </h3>
                    <div className="space-y-2">
                      {hub.channels.map((channel, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300"
                        >
                          <div className="flex items-center space-x-3">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-foreground text-sm">
                                {channel.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {channel.category}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {channel.members} members
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Hub Rules */}
          <Card className="animate-fadeInLeft animate-delay-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Hub Rules</span>
              </CardTitle>
              <CardDescription>
                Please read and agree to the hub rules before joining
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {hub.rules.map((rule, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-3 text-sm text-muted-foreground"
                  >
                    <div className="mt-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="hub-rules"
                  checked={agreedToRules}
                  onCheckedChange={(checked) =>
                    setAgreedToRules(checked as boolean)
                  }
                />
                <Label
                  htmlFor="hub-rules"
                  className="text-sm text-foreground cursor-pointer"
                >
                  I have read and agree to all hub rules and community
                  guidelines
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-20 self-start">
          {/* Join Card */}
          <Card className="animate-fadeInRight">
            <CardHeader>
              <CardTitle>Join Hub</CardTitle>
              <CardDescription>Become part of this community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Game</span>
                  <Badge className="bg-primary text-primary-foreground">
                    {hub.game}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-medium text-foreground">
                    {hub.members.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Currently Online
                  </span>
                  <span className="font-medium text-emerald-400">
                    {hub.members.online}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Verification</span>
                  {hub.verified ? (
                    <Badge className="bg-blue-600 text-white text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Not verified</span>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-start space-x-2 p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    Free to join - Start connecting with players immediately
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                disabled={!agreedToRules}
                onClick={handleJoinHub}
              >
                <Users className="h-4 w-4 mr-2" />
                Join {hub.name}
              </Button>

              {!agreedToRules && (
                <p className="text-xs text-center text-muted-foreground">
                  Please agree to the hub rules to continue
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="animate-fadeInRight animate-delay-100">
            <CardHeader>
              <CardTitle className="text-base">Hub Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Swords className="h-4 w-4" />
                  <span>Active Matches</span>
                </div>
                <span className="font-medium text-emerald-400">
                  {hub.stats.activeMatches}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <span>Tournaments</span>
                </div>
                <span className="font-medium text-amber-400">
                  {hub.stats.tournaments}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>Text Channels</span>
                </div>
                <span className="font-medium text-foreground">
                  {hub.channels.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Skill Level</span>
                </div>
                <span className="font-medium text-foreground">
                  {hub.stats.averageSkill}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
