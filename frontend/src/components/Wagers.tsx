import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, Trophy, Target, Calendar, User } from 'lucide-react';
import { InfoDialog } from './InfoDialog';

interface WagersProps {
  onNavigate?: (tab: string) => void;
}

interface Wager {
  id: string;
  title: string;
  game: string;
  amount: number;
  opponent: string;
  status: 'active' | 'completed' | 'disputed' | 'cancelled';
  result?: 'win' | 'loss';
  createdAt: string;
  completedAt?: string;
  type: 'match' | 'tournament' | 'challenge';
  escrowStatus: 'pending' | 'locked' | 'released';
}

export function Wagers({ onNavigate }: WagersProps = {}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGame, setFilterGame] = useState('all');

  const wagers: Wager[] = [
    {
      id: '1',
      title: 'Valorant 1v1 Duel',
      game: 'Valorant',
      amount: 50,
      opponent: 'ProGamer23',
      status: 'active',
      createdAt: '2h ago',
      type: 'match',
      escrowStatus: 'locked'
    },
    {
      id: '2',
      title: 'CS2 Team Match',
      game: 'CS2',
      amount: 200,
      opponent: 'Team Alpha',
      status: 'completed',
      result: 'win',
      createdAt: '1 day ago',
      completedAt: '23h ago',
      type: 'match',
      escrowStatus: 'released'
    },
    {
      id: '3',
      title: 'LoL Ranked Challenge',
      game: 'League of Legends',
      amount: 25,
      opponent: 'MidLaneKing',
      status: 'completed',
      result: 'loss',
      createdAt: '2 days ago',
      completedAt: '2 days ago',
      type: 'challenge',
      escrowStatus: 'released'
    },
    {
      id: '4',
      title: 'Valorant Tournament Entry',
      game: 'Valorant',
      amount: 75,
      opponent: 'Tournament Pool',
      status: 'disputed',
      createdAt: '3 days ago',
      type: 'tournament',
      escrowStatus: 'locked'
    },
    {
      id: '5',
      title: 'CS2 Aim Duel',
      game: 'CS2',
      amount: 15,
      opponent: 'AimGod',
      status: 'cancelled',
      createdAt: '1 week ago',
      type: 'challenge',
      escrowStatus: 'released'
    },
    {
      id: '6',
      title: 'LoL ARAM Series',
      game: 'League of Legends',
      amount: 30,
      opponent: 'ARAMChamp',
      status: 'completed',
      result: 'win',
      createdAt: '1 week ago',
      completedAt: '6 days ago',
      type: 'match',
      escrowStatus: 'released'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-600 text-white';
      case 'completed': return 'bg-emerald-600 text-white';
      case 'disputed': return 'bg-amber-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'disputed': return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'match': return <Target className="h-4 w-4" />;
      case 'tournament': return <Trophy className="h-4 w-4" />;
      case 'challenge': return <TrendingUp className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getEscrowStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-600 text-white';
      case 'locked': return 'bg-emerald-600 text-white';
      case 'released': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredWagers = wagers.filter(wager => {
    const statusMatch = filterStatus === 'all' || wager.status === filterStatus;
    const gameMatch = filterGame === 'all' || wager.game === filterGame;
    return statusMatch && gameMatch;
  });

  const stats = {
    totalWagered: wagers.reduce((sum, w) => sum + w.amount, 0),
    totalWon: wagers.filter(w => w.result === 'win').reduce((sum, w) => sum + w.amount, 0),
    activeWagers: wagers.filter(w => w.status === 'active').length,
    winRate: (wagers.filter(w => w.result === 'win').length / wagers.filter(w => w.result).length * 100) || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Wagers</h1>
            <p className="text-muted-foreground">Track your gaming bets and earnings</p>
          </div>
          <InfoDialog
            title="About Wagers"
            description="Wagers are direct bets on your gaming performance. Create challenges for other players or accept existing wagers. All funds are held in secure escrow until the match is complete and verified."
            tips={[
              "All wager funds are locked in escrow for security - no one can back out",
              "Disputes are handled by our fair resolution system with evidence review",
              "Check opponent's trust score and history before accepting wagers",
              "Screenshot your results immediately for proof if disputes arise",
              "Start small and build your reputation with successful wagers"
            ]}
          />
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => onNavigate?.('create-wager')}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Create Wager
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Wagered</span>
            </div>
            <div className="text-2xl font-semibold text-foreground mt-1">
              ${stats.totalWagered}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-muted-foreground">Total Won</span>
            </div>
            <div className="text-2xl font-semibold text-emerald-400 mt-1">
              ${stats.totalWon}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <div className="text-2xl font-semibold text-blue-400 mt-1">
              {stats.activeWagers}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-muted-foreground">Win Rate</span>
            </div>
            <div className="text-2xl font-semibold text-amber-400 mt-1">
              {stats.winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterGame} onValueChange={setFilterGame}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Games</SelectItem>
            <SelectItem value="Valorant">Valorant</SelectItem>
            <SelectItem value="CS2">CS2</SelectItem>
            <SelectItem value="League of Legends">League of Legends</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Wagers List */}
      <div className="space-y-4">
        {filteredWagers.map((wager) => (
          <Card key={wager.id} className="hover:border-primary/50 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(wager.type)}
                    <div>
                      <h3 className="font-medium text-foreground">{wager.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{wager.game}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>vs {wager.opponent}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-foreground">
                        ${wager.amount}
                      </div>
                      <Badge className={`text-xs ${getEscrowStatusColor(wager.escrowStatus)}`}>
                        {wager.escrowStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {wager.result && (
                    <div className="flex items-center space-x-1">
                      {wager.result === 'win' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">+${wager.amount}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-400" />
                          <span className="text-red-400 font-medium">-${wager.amount}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(wager.status)}`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(wager.status)}
                        <span className="capitalize">{wager.status}</span>
                      </div>
                    </Badge>
                  </div>

                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{wager.createdAt}</span>
                    </div>
                    {wager.completedAt && (
                      <div className="text-xs">
                        Completed {wager.completedAt}
                      </div>
                    )}
                  </div>

                  {wager.status === 'disputed' && (
                    <Button variant="outline" size="sm" className="border-amber-500 text-amber-500 hover:bg-amber-500/10">
                      View Dispute
                    </Button>
                  )}
                  {wager.status === 'active' && (
                    <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                      View Match
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWagers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No wagers found</h3>
            <p className="text-muted-foreground mb-4">
              {filterStatus !== 'all' || filterGame !== 'all' 
                ? 'Try adjusting your filters to see more results.'
                : 'Create your first wager to start competing and earning.'}
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => onNavigate?.('create-wager')}
            >
              Create Wager
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}