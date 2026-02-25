import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { 
  ArrowLeft,
  Users,
  MessageCircle,
  Calendar,
  Trophy,
  Search,
  UserPlus,
  Bell,
  BellOff,
  Settings,
  LogOut,
  Crown,
  Shield,
  Star,
  Hash,
  Volume2,
  Video,
  Gamepad2,
  Flame,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Target,
  Zap
} from 'lucide-react';

interface HubPageProps {
  onNavigate?: (page: string) => void;
  hubId?: string;
  isJoined?: boolean;
}

export function HubPage({ onNavigate, hubId = '1', isJoined = true }: HubPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Mock hub data
  const hubData = {
    id: hubId,
    name: 'CS2 Competitive Hub',
    description: 'Elite competitive CS2 community for high-level scrims, tournaments, and team building. Join thousands of players pushing their limits.',
    banner: 'linear-gradient(135deg, rgba(229, 9, 20, 0.3) 0%, rgba(229, 9, 20, 0.1) 100%)',
    icon: '🎯',
    members: 15420,
    onlineMembers: 3240,
    founded: 'Mar 2023',
    category: 'CS2',
    tags: ['Competitive', 'Scrims', 'Tournaments', '18+'],
    stats: {
      totalMatches: 8450,
      activePlayers: 12300,
      avgMMR: 2650,
      totalPrizePool: 125000
    },
    channels: [
      { id: '1', name: 'general', type: 'text', online: 450, unread: 0 },
      { id: '2', name: 'looking-for-team', type: 'text', online: 230, unread: 12 },
      { id: '3', name: 'tournament-announcements', type: 'text', online: 890, unread: 3 },
      { id: '4', name: 'strategy-discussion', type: 'text', online: 340, unread: 0 },
      { id: '5', name: 'voice-lounge', type: 'voice', online: 124, unread: 0 },
      { id: '6', name: 'scrim-voice-1', type: 'voice', online: 10, unread: 0 }
    ],
    upcomingEvents: [
      { id: '1', title: 'Weekly Tournament Finals', time: '2h 30m', prize: 1500, participants: 64 },
      { id: '2', title: 'Community Scrim Night', time: '1d 4h', prize: 0, participants: 128 },
      { id: '3', title: 'Pro Player AMA', time: '2d 12h', prize: 0, participants: 450 }
    ],
    recentActivity: [
      { id: '1', type: 'tournament', title: 'Spring Championship concluded', time: '2h ago', icon: Trophy },
      { id: '2', type: 'member', title: 'ProGamer123 joined the hub', time: '4h ago', icon: UserPlus },
      { id: '3', type: 'match', title: '24 new scrims created', time: '6h ago', icon: Gamepad2 },
      { id: '4', type: 'achievement', title: 'Hub reached 15,000 members!', time: '1d ago', icon: Star }
    ],
    topMembers: [
      { id: '1', name: 'EsportsLegend', role: 'Owner', mmr: 3250, matches: 847, trustScore: 99.8, status: 'online' },
      { id: '2', name: 'ProGamerElite', role: 'Admin', mmr: 3180, matches: 723, trustScore: 99.5, status: 'online' },
      { id: '3', name: 'SkillMasterX', role: 'Moderator', mmr: 3150, matches: 692, trustScore: 98.9, status: 'in-game' },
      { id: '4', name: 'TeamCaptain', role: 'Member', mmr: 3100, matches: 645, trustScore: 99.2, status: 'online' },
      { id: '5', name: 'ProShooter99', role: 'Member', mmr: 3050, matches: 589, trustScore: 98.7, status: 'offline' }
    ],
    rules: [
      'Be respectful to all members',
      'No cheating or exploiting',
      'Minimum 2000 MMR to participate in ranked events',
      'English only in public channels',
      'Report toxic behavior to moderators'
    ]
  };

  const handleLeaveHub = () => {
    console.log('Leaving hub:', hubData.name);
    onNavigate?.('hubs');
  };

  const handleJoinHub = () => {
    console.log('Joining hub:', hubData.name);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'in-game': return 'bg-amber-500';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Owner':
        return <Badge className="bg-amber-600 text-white text-xs"><Crown className="h-3 w-3 mr-1" />Owner</Badge>;
      case 'Admin':
        return <Badge className="bg-red-600 text-white text-xs"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'Moderator':
        return <Badge className="bg-blue-600 text-white text-xs"><Shield className="h-3 w-3 mr-1" />Mod</Badge>;
      default:
        return null;
    }
  };

  const filteredMembers = hubData.topMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.('hubs')}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-foreground">Social Hub</h1>
          <p className="text-muted-foreground">Connect with the community</p>
        </div>
        {isJoined && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={notificationsEnabled ? 'border-primary/30 text-primary' : 'border-border'}
            >
              {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-border hover:bg-muted/50"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Hub Banner */}
      <Card className="border-primary/30 overflow-hidden animate-fadeInUp animate-delay-100">
        <div 
          className="h-32 sm:h-40 relative"
          style={{ background: hubData.banner }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>
        <CardContent className="relative -mt-16 sm:-mt-20 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Hub Icon */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-card border-4 border-card flex items-center justify-center text-5xl sm:text-6xl shadow-xl">
              {hubData.icon}
            </div>

            {/* Hub Info */}
            <div className="flex-1 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-foreground">{hubData.name}</h2>
                    <Badge variant="outline" className="text-xs">{hubData.category}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{hubData.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{hubData.members.toLocaleString()} members</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{hubData.onlineMembers.toLocaleString()} online</span>
                    </div>
                    <span>•</span>
                    <span>Founded {hubData.founded}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hubData.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {!isJoined ? (
                  <Button className="bg-primary hover:bg-primary/90 shrink-0" onClick={handleJoinHub}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Hub
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-red-600/30 text-red-400 hover:bg-red-500/10 shrink-0"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Hub
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                          Leave {hubData.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3">
                            <p>Are you sure you want to leave this hub?</p>
                            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                              <p className="text-sm text-foreground font-medium">You will lose:</p>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Access to {hubData.channels.length} channels</li>
                                <li>Notifications for upcoming events</li>
                                <li>Your hub member status and reputation</li>
                                <li>Connection to {hubData.members.toLocaleString()} community members</li>
                              </ul>
                            </div>
                            <p className="text-sm">You can rejoin at any time.</p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Stay in Hub</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLeaveHub}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, Leave Hub
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fadeInUp animate-delay-200">
        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Gamepad2 className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{(hubData.stats.totalMatches / 1000).toFixed(1)}k</div>
            <div className="text-xs text-muted-foreground">Total Matches</div>
          </CardContent>
        </Card>

        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{(hubData.stats.activePlayers / 1000).toFixed(1)}k</div>
            <div className="text-xs text-muted-foreground">Active Players</div>
          </CardContent>
        </Card>

        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{hubData.stats.avgMMR}</div>
            <div className="text-xs text-muted-foreground">Avg MMR</div>
          </CardContent>
        </Card>

        <Card className="hover-lift cursor-pointer transition-all duration-300">
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-emerald-400">${(hubData.stats.totalPrizePool / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground">Prize Pool</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fadeInUp animate-delay-300">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Hash className="h-4 w-4 mr-2" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-foreground">Upcoming Events</h3>
                </div>
                <Badge className="bg-primary/20 text-primary">
                  {hubData.upcomingEvents.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {hubData.upcomingEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover-lift cursor-pointer animate-fadeInLeft"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-foreground mb-1">{event.title}</div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Starts in {event.time}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{event.participants} participants</span>
                        </div>
                      </div>
                    </div>
                    {event.prize > 0 && (
                      <div className="text-right">
                        <div className="text-emerald-400 font-medium">${event.prize.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Prize</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <h3 className="text-foreground">Recent Activity</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {hubData.recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer animate-fadeInRight"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <activity.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-foreground">{activity.title}</div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Hub Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <h3 className="text-foreground">Hub Rules</h3>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {hubData.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3 animate-fadeInUp" style={{ animationDelay: `${index * 0.05}s` }}>
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text Channels */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Hash className="h-5 w-5 text-primary" />
                  <h3 className="text-foreground">Text Channels</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {hubData.channels.filter(ch => ch.type === 'text').map((channel, index) => (
                  <div
                    key={channel.id}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover-lift cursor-pointer animate-fadeInLeft"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{channel.name}</span>
                        {channel.unread > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            {channel.unread}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{channel.online}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Voice Channels */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-foreground">Voice Channels</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {hubData.channels.filter(ch => ch.type === 'voice').map((channel, index) => (
                  <div
                    key={channel.id}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover-lift cursor-pointer animate-fadeInRight"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-emerald-400" />
                        <span className="font-medium text-foreground">{channel.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{channel.online}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4 mt-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background"
            />
          </div>

          {/* Top Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-amber-400" />
                  <h3 className="text-foreground">Top Members</h3>
                </div>
                <Badge variant="outline">{filteredMembers.length} shown</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredMembers.map((member, index) => (
                <Card
                  key={member.id}
                  className="hover-lift cursor-pointer transition-all duration-300 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => onNavigate?.(`profile-${member.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-14 w-14">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(member.status)}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-medium text-foreground truncate">{member.name}</h4>
                          {getRoleBadge(member.role)}
                        </div>
                        <div className="flex items-center gap-3 text-sm flex-wrap">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{member.mmr} MMR</span>
                          </div>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{member.matches} matches</span>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">{member.trustScore}%</span>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10 shrink-0">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4 mt-6">
          {hubData.upcomingEvents.map((event, index) => (
            <Card
              key={event.id}
              className="hover-lift cursor-pointer transition-all duration-300 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-foreground">{event.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Starts in {event.time}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{event.participants} participants</span>
                      </div>
                      {event.prize > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-emerald-400" />
                            <span className="text-emerald-400">${event.prize.toLocaleString()} prize</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 shrink-0">
                    Join Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {hubData.upcomingEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No upcoming events</h3>
              <p className="text-sm text-muted-foreground">
                Check back later for new tournaments and community events
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}