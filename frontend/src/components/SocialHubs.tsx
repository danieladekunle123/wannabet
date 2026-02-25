import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Users, Crown, Shield, Plus, Search, Settings, UserPlus, LogOut, Star, Trophy, TrendingUp } from 'lucide-react';
import { InfoDialog } from './InfoDialog';

interface SocialHubsProps {
  onNavigate?: (tab: string) => void;
}

export function SocialHubs({ onNavigate }: SocialHubsProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');

  const myTeams = [
    {
      id: 1,
      name: 'Phoenix Elite',
      game: 'CS2',
      role: 'Captain',
      members: 5,
      wins: 127,
      losses: 43,
      winRate: 74.7,
      avatar: 'PE',
    },
    {
      id: 2,
      name: 'Valorant Vipers',
      game: 'Valorant',
      role: 'Member',
      members: 5,
      wins: 89,
      losses: 51,
      winRate: 63.6,
      avatar: 'VV',
    },
  ];

  const socialHubs = [
    {
      id: 1,
      name: 'CS2 Competitive Hub',
      members: 15420,
      online: 3240,
      description: 'Competitive CS2 players looking for scrims and tournaments',
      joined: true,
    },
    {
      id: 2,
      name: 'Valorant Pro Scene',
      members: 12850,
      online: 2890,
      description: 'High-level Valorant discussions and team recruitment',
      joined: true,
    },
    {
      id: 3,
      name: 'Tournament Grinders',
      members: 8940,
      online: 1560,
      description: 'Dedicated tournament players across all games',
      joined: false,
    },
  ];

  const teamInvites = [
    {
      id: 1,
      teamName: 'Apex Legends',
      game: 'Apex Legends',
      invitedBy: 'ProGamer123',
      message: 'Join us for ranked push!',
    },
    {
      id: 2,
      teamName: 'Rocket League Champions',
      game: 'Rocket League',
      invitedBy: 'CarSoccerPro',
      message: 'Need one more for tournaments',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="mb-2">Teams & Social Hubs</h1>
          <p className="text-muted-foreground">
            Manage your teams and connect with the community
          </p>
        </div>
        <InfoDialog
          title="About Social Hubs"
          description="Social Hubs are community spaces where you can form teams, find teammates, and join larger gaming communities. Create or join teams to compete together in team-based matches and tournaments."
          tips={[
            "Join hubs related to your favorite games to find teammates",
            "Create a team to compete in team tournaments with consistent squad",
            "Team captains can manage rosters, invite players, and enter team events",
            "Hub members can chat, organize matches, and share strategies",
            "Build your team's reputation with wins to attract better players"
          ]}
        />
      </div>

      {/* Team Invites */}
      {teamInvites.length > 0 && (
        <Card className="border-primary/50 hover-lift bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-primary" />
                Team Invites
              </span>
              <Badge className="bg-primary text-primary-foreground animate-pulse">
                {teamInvites.length} New
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamInvites.map((invite, index) => (
              <div
                key={invite.id}
                className="p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-all duration-300 hover-lift hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 group animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{invite.teamName}</h4>
                      <p className="text-sm text-muted-foreground">{invite.game}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">From: </span>
                      <span className="text-primary group-hover:font-medium transition-all">{invite.invitedBy}</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic group-hover:text-foreground transition-colors">"{invite.message}"</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-110 transition-transform duration-300 hover:shadow-lg hover:shadow-primary/30"
                      onClick={() => onNavigate?.('team-invites')}
                    >
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:scale-110 transition-transform duration-300 hover:border-destructive"
                      onClick={() => onNavigate?.('team-invites')}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teams">My Teams</TabsTrigger>
          <TabsTrigger value="hubs">Social Hubs</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          {/* Create Team */}
          <Card className="border-border/50 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>My Teams</span>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => onNavigate?.('create-team-hub')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </CardTitle>
              <CardDescription>
                Teams you've created or joined
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myTeams.map((team, index) => (
                <Card
                  key={team.id}
                  className="border-border/50 hover-lift cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => onNavigate?.('team-page')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="h-16 w-16 border-2 border-primary/50">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                            {team.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-foreground">{team.name}</h3>
                            {team.role === 'Captain' && (
                              <Badge className="bg-amber-600 text-white text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Captain
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {team.game}
                            </Badge>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{team.members} members</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <Trophy className="h-4 w-4 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">{team.wins}W</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-red-400 font-medium">{team.losses}L</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="text-primary font-medium">{team.winRate}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border hover:bg-muted/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate?.('team-settings');
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {myTeams.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No teams yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create or join a team to start competing together
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => onNavigate?.('create-team-hub')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Team
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hubs" className="space-y-6">
          {/* Search Hubs */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search social hubs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Hubs List */}
          <Card className="border-border/50 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <div>Discover Social Hubs</div>
                  <CardDescription className="mt-1">
                    Join communities to find teammates and discuss strategies
                  </CardDescription>
                </div>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => onNavigate?.('create-team-hub')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hub
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialHubs.map((hub, index) => (
                <Card
                  key={hub.id}
                  className="border-border/50 hover-lift cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => onNavigate?.(`hub-${hub.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-foreground">{hub.name}</h3>
                          {hub.joined && (
                            <Badge className="bg-emerald-600 text-white text-xs">
                              Joined
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{hub.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{hub.members.toLocaleString()} members</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{hub.online.toLocaleString()} online</span>
                          </div>
                        </div>
                      </div>
                      {hub.joined ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-primary/30 hover:bg-primary/10 ml-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate?.(`hub-${hub.id}`);
                          }}
                        >
                          View Hub
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-primary-foreground ml-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate?.(`hub-${hub.id}`);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Join
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Hub Benefits */}
          <Card className="border-border/50 hover-lift bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-primary" />
                Hub Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h4 className="font-medium text-foreground">Find Teammates</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect with players of similar skill levels
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h4 className="font-medium text-foreground">Exclusive Events</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access hub-exclusive tournaments and scrims
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h4 className="font-medium text-foreground">Community Support</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get help and advice from experienced players
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
