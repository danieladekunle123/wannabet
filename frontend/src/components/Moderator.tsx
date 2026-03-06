import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Search, 
  Shield, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Gavel,
  TrendingUp,
  DollarSign,
  Trophy,
  Target,
  MessageSquare,
  Flag,
  Eye,
  UserX,
  AlertCircle,
  FileText,
  Activity,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ModeratorInvestigate from './ModeratorInvestigate';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface Player {
  id: string;
  username: string;
  trustScore: number;
  totalMatches: number;
  wins: number;
  losses: number;
  totalEarnings: number;
  mmr: number;
  accountCreated: string;
  lastActive: string;
  status: 'active' | 'suspended' | 'banned' | 'warned';
  reports: number;
}

interface Dispute {
  id: string;
  matchId: string;
  game: string;
  reporter: string;
  reported: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved';
  timestamp: string;
  wagerAmount: number;
}

export function Moderator() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [disputeFilter, setDisputeFilter] = useState('all');
  const [actionNote, setActionNote] = useState('');
  const [showInvestigate, setShowInvestigate] = useState(false);

  // Mock player data
  const players: Player[] = [
    {
      id: '1',
      username: 'ProGamer23',
      trustScore: 98.5,
      totalMatches: 245,
      wins: 178,
      losses: 67,
      totalEarnings: 3420,
      mmr: 2450,
      accountCreated: '2024-01-15',
      lastActive: '2 hours ago',
      status: 'active',
      reports: 0
    },
    {
      id: '2',
      username: 'ShadyPlayer99',
      trustScore: 45.2,
      totalMatches: 89,
      wins: 23,
      losses: 66,
      totalEarnings: -580,
      mmr: 1120,
      accountCreated: '2024-03-02',
      lastActive: '5 hours ago',
      status: 'warned',
      reports: 7
    },
    {
      id: '3',
      username: 'MidLaneKing',
      trustScore: 92.1,
      totalMatches: 312,
      wins: 198,
      losses: 114,
      totalEarnings: 5240,
      mmr: 2680,
      accountCreated: '2023-11-20',
      lastActive: '1 hour ago',
      status: 'active',
      reports: 1
    },
    {
      id: '4',
      username: 'ToxicRager',
      trustScore: 12.5,
      totalMatches: 156,
      wins: 45,
      losses: 111,
      totalEarnings: -1200,
      mmr: 890,
      accountCreated: '2024-02-10',
      lastActive: '3 days ago',
      status: 'suspended',
      reports: 23
    }
  ];

  // Mock dispute data
  const disputes: Dispute[] = [
    {
      id: 'D001',
      matchId: 'M12345',
      game: 'Valorant',
      reporter: 'ProGamer23',
      reported: 'ShadyPlayer99',
      reason: 'Result Dispute',
      description: 'Opponent claims they won but evidence shows otherwise. Match score was manipulated.',
      status: 'pending',
      timestamp: '30 minutes ago',
      wagerAmount: 50
    },
    {
      id: 'D002',
      matchId: 'M12340',
      game: 'CS2',
      reporter: 'MidLaneKing',
      reported: 'ToxicRager',
      reason: 'Unsporting Behavior',
      description: 'Player was toxic throughout the match and rage quit before completion.',
      status: 'reviewing',
      timestamp: '2 hours ago',
      wagerAmount: 100
    },
    {
      id: 'D003',
      matchId: 'M12338',
      game: 'League of Legends',
      reporter: 'TeamAlpha',
      reported: 'ShadyPlayer99',
      reason: 'Cheating Suspected',
      description: 'Suspicious gameplay patterns detected. Possible use of unauthorized software.',
      status: 'pending',
      timestamp: '5 hours ago',
      wagerAmount: 75
    }
  ];

  // Platform stats
  const [platformStats, setPlatformStats] = React.useState<any>({
    totalUsers: 0,
    activeToday: 0,
    totalMatches: 0,
    activeDisputes: 0,
    suspendedAccounts: 0,
    bannedAccounts: 0,
    totalEscrow: 0,
    totalWalletBalance: 0,
  });

  // fetch stats
  const { token } = useAuth();

  React.useEffect(() => {
    // reuse same endpoint as Admin
    (async () => {
      try {
        if (!token) return;
        const res = await fetch('http://localhost:4000/users/stats', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        const matchesByStatus = data.matchesByStatus || [];
        const totalMatches = matchesByStatus.reduce((sum: number, s: any) => sum + (s._count?.status || 0), 0);
        const finishedEntry = matchesByStatus.find((m: any) => m.status === 'finished' || m.status === 'completed');
        const cancelledEntry = matchesByStatus.find((m: any) => m.status === 'cancelled');
        const finishedCount = (finishedEntry?._count?.status || 0) + (cancelledEntry?._count?.status || 0);
        const activeMatches = Math.max(0, totalMatches - finishedCount);

        setPlatformStats(prev => ({
          ...prev,
          totalUsers: data.totalUsers || prev.totalUsers,
          totalMatches,
          activeToday: prev.activeToday,
          activeDisputes: prev.activeDisputes,
          suspendedAccounts: prev.suspendedAccounts,
          bannedAccounts: prev.bannedAccounts,
          totalEscrow: data.totalEscrow || 0,
          totalWalletBalance: data.totalWalletBalance || 0,
          activeMatches,
        }));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // Activity data for chart
  const activityData = [
    { day: 'Mon', matches: 145, disputes: 3 },
    { day: 'Tue', matches: 198, disputes: 5 },
    { day: 'Wed', matches: 212, disputes: 2 },
    { day: 'Thu', matches: 187, disputes: 4 },
    { day: 'Fri', matches: 234, disputes: 6 },
    { day: 'Sat', matches: 289, disputes: 8 },
    { day: 'Sun', matches: 256, disputes: 4 }
  ];

  // User status distribution
  const statusDistribution = [
    { name: 'Active', value: 94, color: '#10B981' },
    { name: 'Warned', value: 4, color: '#F59E0B' },
    { name: 'Suspended', value: 1.5, color: '#EF4444' },
    { name: 'Banned', value: 0.5, color: '#7F1D1D' }
  ];

  const filteredPlayers = players.filter(p => 
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDisputes = disputes.filter(d => {
    if (disputeFilter === 'all') return true;
    return d.status === disputeFilter;
  });

  const handleModAction = (playerId: string, action: 'warn' | 'suspend' | 'ban' | 'clear') => {
    (async () => {
      try {
        if (action === 'ban') {
          await banUser(playerId, actionNote || 'Banned by moderator');
          alert('User banned');
        } else if (action === 'suspend') {
          // default 7-day suspension
          const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          await banUser(playerId, actionNote || 'Suspended by moderator', expires);
          alert('User suspended for 7 days');
        } else if (action === 'clear') {
          await unbanUser(playerId);
          alert('Cleared reports / active bans for user');
        } else {
          // warn or other actions are logged locally for now
          console.log(`Action ${action} on player ${playerId} with note: ${actionNote}`);
        }
      } catch (err) {
        console.error(err);
        alert('Action failed');
      } finally {
        setActionNote('');
      }
    })();
  };

  async function banUser(userId: string, reason?: string, expiresAt?: string) {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`http://localhost:4000/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason, expiresAt }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to ban user');
    }
    return await res.json();
  }

  async function unbanUser(userId: string) {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`http://localhost:4000/users/${userId}/unban`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to unban user');
    }
    return await res.json();
  }

  // fetch player logs when selectedPlayer changes
  React.useEffect(() => {
    if (!selectedPlayer) return;
    (async () => {
      try {
        const res = await fetch(`http://localhost:4000/users/${selectedPlayer.id}/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPlayerLogs(data.logs || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [selectedPlayer, token]);

  const [playerLogs, setPlayerLogs] = React.useState<any[]>([]);

  const handleDisputeAction = (disputeId: string, action: 'approve' | 'deny' | 'investigate') => {
    console.log(`Dispute ${disputeId} action: ${action}`);
    if (action === 'investigate') {
      setShowInvestigate(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'warned': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'suspended': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'banned': return 'bg-red-900/20 text-red-300 border-red-900/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  // If showing investigation view, render that component
  if (showInvestigate) {
    return <ModeratorInvestigate onBack={() => setShowInvestigate(false)} />;
  }

  return (
    <div className="min-h-screen pt-16 lg:pl-64 bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Moderator Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Monitor players, resolve disputes, and maintain platform integrity</p>
          </div>
          <Badge className="bg-primary/20 text-primary border border-primary/30 text-lg px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {platformStats.activeDisputes} Active Disputes
          </Badge>
        </motion.div>

        {/* Platform Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="border-primary/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-blue-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{platformStats.totalUsers.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Activity className="h-8 w-8 text-emerald-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">{platformStats.activeToday.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Active Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Trophy className="h-8 w-8 text-purple-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-400">{platformStats.totalMatches.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Matches</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Flag className="h-8 w-8 text-amber-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-400">{platformStats.activeDisputes}</div>
                    <div className="text-xs text-muted-foreground">Active Disputes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-400">{platformStats.suspendedAccounts}</div>
                    <div className="text-xs text-muted-foreground">Suspended</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-900/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Ban className="h-8 w-8 text-red-300" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-300">{platformStats.bannedAccounts}</div>
                    <div className="text-xs text-muted-foreground">Banned</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-muted/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Activity className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="players" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4 mr-2" />
                Player Management
              </TabsTrigger>
              <TabsTrigger value="disputes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Gavel className="h-4 w-4 mr-2" />
                Dispute Resolution
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Activity */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Platform Activity (Last 7 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis dataKey="day" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#16171A', 
                            border: '1px solid rgba(229, 9, 20, 0.3)',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="matches" stroke="#E50914" strokeWidth={3} />
                        <Line type="monotone" dataKey="disputes" stroke="#F59E0B" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* User Status Distribution */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      User Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#16171A', 
                            border: '1px solid rgba(229, 9, 20, 0.3)',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Issues */}
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Recent Issues Requiring Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Alert className="border-red-500/30 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription>
                        <span className="font-semibold">High Priority:</span> Player "ToxicRager" has received 23 reports in the last 30 days.
                      </AlertDescription>
                    </Alert>
                    <Alert className="border-amber-500/30 bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <AlertDescription>
                        <span className="font-semibold">Medium Priority:</span> 5 disputes pending review for more than 24 hours.
                      </AlertDescription>
                    </Alert>
                    <Alert className="border-blue-500/30 bg-blue-500/10">
                      <AlertCircle className="h-4 w-4 text-blue-400" />
                      <AlertDescription>
                        <span className="font-semibold">Info:</span> Average dispute resolution time: 4.2 hours (Target: &lt;6 hours)
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Player Management Tab */}
            <TabsContent value="players" className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Search Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-muted/30 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Player List */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle>Player List ({filteredPlayers.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-3">
                        <AnimatePresence>
                          {filteredPlayers.map((player, index) => (
                            <motion.div
                              key={player.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => setSelectedPlayer(player)}
                              className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                                selectedPlayer?.id === player.id
                                  ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/20'
                                  : 'bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/20 text-primary">
                                      {player.username.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-semibold text-foreground">{player.username}</div>
                                    <div className="text-xs text-muted-foreground">ID: {player.id}</div>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(player.status)}>
                                  {player.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Trust:</span>
                                  <span className={`ml-1 font-semibold ${
                                    player.trustScore > 90 ? 'text-emerald-400' :
                                    player.trustScore > 70 ? 'text-amber-400' :
                                    'text-red-400'
                                  }`}>
                                    {player.trustScore}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Matches:</span>
                                  <span className="ml-1 font-semibold text-foreground">{player.totalMatches}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Reports:</span>
                                  <span className={`ml-1 font-semibold ${
                                    player.reports > 5 ? 'text-red-400' :
                                    player.reports > 0 ? 'text-amber-400' :
                                    'text-emerald-400'
                                  }`}>
                                    {player.reports}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Player Details & Actions */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle>Player Details & Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedPlayer ? (
                      <div className="space-y-6">
                        {/* Player Info */}
                        <div className="flex items-center gap-4 pb-4 border-b border-border/50">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                              {selectedPlayer.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-foreground">{selectedPlayer.username}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getStatusColor(selectedPlayer.status)}>
                                {selectedPlayer.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Trust: {selectedPlayer.trustScore}%
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <Trophy className="h-6 w-6 text-emerald-400" />
                                <div className="text-right">
                                  <div className="text-xl font-bold text-foreground">{selectedPlayer.wins}</div>
                                  <div className="text-xs text-muted-foreground">Wins</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <XCircle className="h-6 w-6 text-red-400" />
                                <div className="text-right">
                                  <div className="text-xl font-bold text-foreground">{selectedPlayer.losses}</div>
                                  <div className="text-xs text-muted-foreground">Losses</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <Target className="h-6 w-6 text-blue-400" />
                                <div className="text-right">
                                  <div className="text-xl font-bold text-foreground">{selectedPlayer.mmr}</div>
                                  <div className="text-xs text-muted-foreground">MMR</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <DollarSign className="h-6 w-6 text-amber-400" />
                                <div className="text-right">
                                  <div className={`text-xl font-bold ${selectedPlayer.totalEarnings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    ${Math.abs(selectedPlayer.totalEarnings)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Earnings</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Account Info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Account Created:</span>
                            <span className="text-foreground font-semibold">{selectedPlayer.accountCreated}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Active:</span>
                            <span className="text-foreground font-semibold">{selectedPlayer.lastActive}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Reports:</span>
                            <span className={`font-semibold ${
                              selectedPlayer.reports > 5 ? 'text-red-400' :
                              selectedPlayer.reports > 0 ? 'text-amber-400' :
                              'text-emerald-400'
                            }`}>
                              {selectedPlayer.reports}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Win Rate:</span>
                            <span className="text-foreground font-semibold">
                              {((selectedPlayer.wins / selectedPlayer.totalMatches) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Moderator Actions */}
                        <div className="space-y-3 pt-4 border-t border-border/50">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Gavel className="h-4 w-4 text-primary" />
                            Moderator Actions
                          </h4>
                          
                          <Textarea
                            placeholder="Add a note or reason for this action..."
                            value={actionNote}
                            onChange={(e) => setActionNote(e.target.value)}
                            className="bg-muted/30 border-border/50 focus:border-primary/50 min-h-[80px]"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Warn
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-card border-primary/30">
                                <DialogHeader>
                                  <DialogTitle>Confirm Warning</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to warn {selectedPlayer.username}? This will be logged in their account history.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button 
                                    className="bg-amber-500 hover:bg-amber-600"
                                    onClick={() => handleModAction(selectedPlayer.id, 'warn')}
                                  >
                                    Confirm Warning
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                                  <Clock className="h-4 w-4 mr-2" />
                                  Suspend
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-card border-primary/30">
                                <DialogHeader>
                                  <DialogTitle>Confirm Suspension</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to suspend {selectedPlayer.username}? They will be unable to access the platform for the suspension period.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button 
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleModAction(selectedPlayer.id, 'suspend')}
                                  >
                                    Confirm Suspension
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="border-red-900/50 text-red-300 hover:bg-red-900/10">
                                  <Ban className="h-4 w-4 mr-2" />
                                  Ban
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-card border-primary/30">
                                <DialogHeader>
                                  <DialogTitle>Confirm Permanent Ban</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to permanently ban {selectedPlayer.username}? This action cannot be easily reversed.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button 
                                    className="bg-red-900 hover:bg-red-950"
                                    onClick={() => handleModAction(selectedPlayer.id, 'ban')}
                                  >
                                    Confirm Ban
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button 
                              variant="outline" 
                              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => handleModAction(selectedPlayer.id, 'clear')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Clear Reports
                            </Button>
                          </div>

                          <Button className="w-full bg-primary hover:bg-primary/90">
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Profile
                          </Button>
                        
                        {/* Player Logs */}
                        <div className="pt-4">
                          <h5 className="font-semibold text-foreground mb-2">Player Logs</h5>
                          <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-muted/20 rounded">
                            {playerLogs.length === 0 ? (
                              <div className="text-xs text-muted-foreground">No logs</div>
                            ) : (
                              playerLogs.map((l) => (
                                <div key={l.id} className="text-xs text-muted-foreground">
                                  <div className="font-medium text-foreground">{l.type}</div>
                                  <div>{l.message}</div>
                                  <div className="text-[10px] text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                        <User className="h-16 w-16 mb-4 opacity-50" />
                        <p>Select a player to view details and take actions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Dispute Resolution Tab */}
            <TabsContent value="disputes" className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Gavel className="h-5 w-5 text-primary" />
                      Active Disputes
                    </CardTitle>
                    <Select value={disputeFilter} onValueChange={setDisputeFilter}>
                      <SelectTrigger className="w-[180px] bg-muted/30 border-border/50">
                        <SelectValue placeholder="Filter disputes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Disputes</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredDisputes.map((dispute, index) => (
                        <motion.div
                          key={dispute.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className="bg-muted/30 border-border/50 hover:border-primary/50 transition-all duration-300">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-foreground">Dispute #{dispute.id}</h4>
                                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                        {dispute.game}
                                      </Badge>
                                      <Badge className={
                                        dispute.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                        dispute.status === 'reviewing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                      }>
                                        {dispute.status}
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {dispute.timestamp}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        ${dispute.wagerAmount} at stake
                                      </span>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Match {dispute.matchId}
                                  </Badge>
                                </div>

                                {/* Dispute Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg">
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Reporter</div>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                          {dispute.reporter.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-semibold text-foreground">{dispute.reporter}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Reported Player</div>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                                          {dispute.reported.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-semibold text-foreground">{dispute.reported}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Reason */}
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Reason</div>
                                  <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Flag className="h-4 w-4 text-primary" />
                                    {dispute.reason}
                                  </div>
                                </div>

                                {/* Description */}
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Description</div>
                                  <p className="text-sm text-foreground bg-background/50 p-3 rounded-lg">
                                    {dispute.description}
                                  </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t border-border/50">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve Reporter
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-primary/30">
                                      <DialogHeader>
                                        <DialogTitle>Approve Reporter</DialogTitle>
                                        <DialogDescription>
                                          Approve {dispute.reporter}'s claim against {dispute.reported}. Funds will be awarded to the reporter.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline">Cancel</Button>
                                        <Button 
                                          className="bg-emerald-600 hover:bg-emerald-700"
                                          onClick={() => handleDisputeAction(dispute.id, 'approve')}
                                        >
                                          Confirm Approval
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Deny Claim
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-primary/30">
                                      <DialogHeader>
                                        <DialogTitle>Deny Claim</DialogTitle>
                                        <DialogDescription>
                                          Deny {dispute.reporter}'s claim. Funds will remain with {dispute.reported}.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline">Cancel</Button>
                                        <Button 
                                          className="bg-red-600 hover:bg-red-700"
                                          onClick={() => handleDisputeAction(dispute.id, 'deny')}
                                        >
                                          Confirm Denial
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>

                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                    onClick={() => handleDisputeAction(dispute.id, 'investigate')}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Investigate
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
