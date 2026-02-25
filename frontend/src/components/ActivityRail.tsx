import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Users, UserPlus, Trophy, AlertTriangle, DollarSign, Crown, Clock, CheckCircle, XCircle, TrendingUp, Shield, ArrowRight } from 'lucide-react';

interface ActivityRailProps {
  onNavigate?: (tab: string) => void;
}

export function ActivityRail({ onNavigate }: ActivityRailProps = {}) {
  const friendsOnline = [
    { name: 'ProGamer23', status: 'In Match', game: 'Valorant' },
    { name: 'SkillMaster', status: 'Looking for Game', game: 'CS2' },
    { name: 'TeamLeader', status: 'In Lobby', game: 'LoL' },
    { name: 'AimBot99', status: 'Available', game: null },
    { name: 'RankClimber', status: 'In Tournament', game: 'Valorant' }
  ];

  const recentResults = [
    { match: 'Valorant 1v1', result: 'win', credits: 45, opponent: 'Player123' },
    { match: 'CS2 5v5', result: 'loss', credits: -30, opponent: 'TeamAlpha' },
    { match: 'LoL Solo', result: 'win', credits: 20, opponent: 'MidLaner' },
    { match: 'Valorant Team', result: 'win', credits: 75, opponent: 'ProTeam' }
  ];

  const notifications = [
    { 
      type: 'invite', 
      message: 'ProGamer23 invited you to a CS2 match', 
      time: '2m ago',
      action: 'Join'
    },
    { 
      type: 'dispute', 
      message: 'Dispute resolved in your favor', 
      time: '1h ago',
      credits: 50
    },
    { 
      type: 'payout', 
      message: 'Tournament winnings deposited', 
      time: '3h ago',
      credits: 150
    },
    { 
      type: 'friend', 
      message: 'SkillMaster is now online', 
      time: '5m ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Match': return 'text-primary';
      case 'Looking for Game': return 'text-emerald-400';
      case 'In Lobby': return 'text-amber-400';
      case 'In Tournament': return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invite': return <UserPlus className="h-4 w-4 text-blue-400" />;
      case 'dispute': return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'payout': return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'friend': return <Users className="h-4 w-4 text-blue-400" />;
      default: return <Trophy className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="w-80 space-y-4">
      {/* Friends Online */}
      <Card className="animate-fadeInUp hover-lift transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Friends Online</span>
            <Badge className="bg-emerald-600 text-white text-xs">
              {friendsOnline.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {friendsOnline.map((friend, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div>
                  <div className="text-sm text-foreground">{friend.name}</div>
                  <div className={`text-xs ${getStatusColor(friend.status)}`}>
                    {friend.status}
                    {friend.game && ` • ${friend.game}`}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10 hover:scale-110 transition-all duration-300">
                Invite
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Results */}
      <Card className="animate-fadeInUp animate-delay-100 hover-lift transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>Recent Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentResults.map((result, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => onNavigate?.('view-match')}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {result.result === 'win' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-sm text-foreground truncate">{result.match}</div>
                  <div className="text-xs text-muted-foreground">vs {result.opponent}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={`text-xs ${
                    result.credits > 0 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {result.credits > 0 ? '+' : ''}{result.credits}
                </Badge>
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 text-xs"
            onClick={() => onNavigate?.('view-match')}
          >
            View Match Details
          </Button>
        </CardContent>
      </Card>

      {/* Team Invites */}
      <Card className="animate-fadeInUp animate-delay-150 hover-lift transition-all duration-300 border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Team Invites</span>
            </div>
            <Badge className="bg-primary text-primary-foreground animate-pulse">
              3
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-primary/20 hover:border-primary/40 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">Apex Predators</div>
              <div className="text-xs text-muted-foreground">Invited by CommanderZero</div>
            </div>
            <Badge variant="outline" className="shrink-0 ml-2">
              Diamond
            </Badge>
          </div>
          
          <Button 
            variant="default" 
            size="sm" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            onClick={() => onNavigate?.('team-invites')}
          >
            <span>View All Invites</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="animate-fadeInUp animate-delay-200 hover-lift transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notif, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start space-x-2">
                {getNotificationIcon(notif.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground">{notif.message}</div>
                  <div className="text-xs text-muted-foreground">{notif.time}</div>
                </div>
                {notif.credits && (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    +${notif.credits}
                  </Badge>
                )}
                {notif.action && (
                  <Button variant="outline" size="sm" className="text-xs border-primary/50 text-primary hover:bg-primary/10 hover:scale-110 transition-all duration-300">
                    {notif.action}
                  </Button>
                )}
              </div>
              {i < notifications.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="animate-fadeInUp animate-delay-300 hover-lift transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Your Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <Trophy className="h-4 w-4 text-emerald-400" />
                <div className="text-lg font-semibold text-emerald-400">127</div>
              </div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <TrendingUp className="h-4 w-4 text-foreground" />
                <div className="text-lg font-semibold text-foreground">2,450</div>
              </div>
              <div className="text-xs text-muted-foreground">MMR</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <DollarSign className="h-4 w-4 text-amber-400" />
                <div className="text-lg font-semibold text-amber-400">$1,240</div>
              </div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <div className="text-lg font-semibold text-primary">98.5%</div>
              </div>
              <div className="text-xs text-muted-foreground">Trust</div>
            </div>
          </div>
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-1 group"
            size="sm"
            onClick={() => onNavigate?.('stats')}
          >
            <span>View Full Stats</span>
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}