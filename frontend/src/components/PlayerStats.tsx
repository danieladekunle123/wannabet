import React, { useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { UserAvatar } from './UserAvatar';
import { 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Target,
  Zap,
  Award,
  Gamepad2,
  Clock,
  Star,
  ChevronUp,
  ChevronDown,
  Flame,
  Crown,
  Swords,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface PlayerStatsProps {
  onNavigate?: (tab: string) => void;
}

export function PlayerStats({ onNavigate }: PlayerStatsProps = {}) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { user } = useAuth();
  const displayName = user?.profile?.displayName ?? user?.username ?? 'You';

  // Handle period change with transition
  const handlePeriodChange = (period: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedPeriod(period);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  // Data based on selected period
  const getMMRData = () => {
    switch (selectedPeriod) {
      case '7d':
        return [
          { date: 'Mon', mmr: 2380, games: 3 },
          { date: 'Tue', mmr: 2395, games: 4 },
          { date: 'Wed', mmr: 2410, games: 5 },
          { date: 'Thu', mmr: 2425, games: 4 },
          { date: 'Fri', mmr: 2438, games: 6 },
          { date: 'Sat', mmr: 2445, games: 5 },
          { date: 'Sun', mmr: 2450, games: 4 }
        ];
      case '30d':
        return [
          { date: 'Week 1', mmr: 2100, games: 15 },
          { date: 'Week 2', mmr: 2180, games: 18 },
          { date: 'Week 3', mmr: 2250, games: 22 },
          { date: 'Week 4', mmr: 2320, games: 20 },
          { date: 'Week 5', mmr: 2380, games: 25 },
          { date: 'Week 6', mmr: 2450, games: 27 }
        ];
      case '3mo':
        return [
          { date: 'Month 1', mmr: 1950, games: 65 },
          { date: 'Month 2', mmr: 2150, games: 72 },
          { date: 'Month 3', mmr: 2450, games: 78 }
        ];
      case '6mo':
        return [
          { date: 'Jan', mmr: 1850, games: 58 },
          { date: 'Feb', mmr: 1980, games: 67 },
          { date: 'Mar', mmr: 2120, games: 73 },
          { date: 'Apr', mmr: 2240, games: 75 },
          { date: 'May', mmr: 2350, games: 80 },
          { date: 'Jun', mmr: 2450, games: 85 }
        ];
      case '1y':
        return [
          { date: 'Jan', mmr: 1650, games: 52 },
          { date: 'Feb', mmr: 1720, games: 58 },
          { date: 'Mar', mmr: 1820, games: 63 },
          { date: 'Apr', mmr: 1950, games: 68 },
          { date: 'May', mmr: 2080, games: 72 },
          { date: 'Jun', mmr: 2150, games: 75 },
          { date: 'Jul', mmr: 2220, games: 78 },
          { date: 'Aug', mmr: 2310, games: 80 },
          { date: 'Sep', mmr: 2380, games: 82 },
          { date: 'Oct', mmr: 2420, games: 84 },
          { date: 'Nov', mmr: 2440, games: 85 },
          { date: 'Dec', mmr: 2450, games: 86 }
        ];
      case 'all':
        return [
          { date: '2023 Q1', mmr: 1200, games: 145 },
          { date: '2023 Q2', mmr: 1450, games: 178 },
          { date: '2023 Q3', mmr: 1720, games: 203 },
          { date: '2023 Q4', mmr: 1980, games: 225 },
          { date: '2024 Q1', mmr: 2180, games: 248 },
          { date: '2024 Q2', mmr: 2350, games: 265 },
          { date: '2024 Q3', mmr: 2420, games: 280 },
          { date: '2024 Q4', mmr: 2450, games: 295 }
        ];
      default:
        return [
          { date: 'Week 1', mmr: 2100, games: 15 },
          { date: 'Week 2', mmr: 2180, games: 18 },
          { date: 'Week 3', mmr: 2250, games: 22 },
          { date: 'Week 4', mmr: 2320, games: 20 },
          { date: 'Week 5', mmr: 2380, games: 25 },
          { date: 'Week 6', mmr: 2450, games: 27 }
        ];
    }
  };

  const mmrData = getMMRData();

  // Win/Loss Data based on period
  const getWinLossData = () => {
    switch (selectedPeriod) {
      case '7d':
        return [
          { period: 'Mon', wins: 3, losses: 0 },
          { period: 'Tue', wins: 4, losses: 1 },
          { period: 'Wed', wins: 5, losses: 1 },
          { period: 'Thu', wins: 3, losses: 2 },
          { period: 'Fri', wins: 6, losses: 0 },
          { period: 'Sat', wins: 5, losses: 1 },
          { period: 'Sun', wins: 4, losses: 1 }
        ];
      case '30d':
        return [
          { period: 'Week 1', wins: 11, losses: 4 },
          { period: 'Week 2', wins: 14, losses: 4 },
          { period: 'Week 3', wins: 17, losses: 5 },
          { period: 'Week 4', wins: 15, losses: 5 }
        ];
      case '3mo':
        return [
          { period: 'Month 1', wins: 48, losses: 17 },
          { period: 'Month 2', wins: 54, losses: 18 },
          { period: 'Month 3', wins: 58, losses: 16 }
        ];
      case '6mo':
        return [
          { period: 'Jan', wins: 45, losses: 12 },
          { period: 'Feb', wins: 52, losses: 15 },
          { period: 'Mar', wins: 48, losses: 18 },
          { period: 'Apr', wins: 61, losses: 14 },
          { period: 'May', wins: 58, losses: 16 },
          { period: 'Jun', wins: 67, losses: 13 }
        ];
      case '1y':
        return [
          { period: 'Jan', wins: 45, losses: 12 },
          { period: 'Feb', wins: 52, losses: 15 },
          { period: 'Mar', wins: 48, losses: 18 },
          { period: 'Apr', wins: 61, losses: 14 },
          { period: 'May', wins: 58, losses: 16 },
          { period: 'Jun', wins: 67, losses: 13 },
          { period: 'Jul', wins: 55, losses: 17 },
          { period: 'Aug', wins: 62, losses: 14 },
          { period: 'Sep', wins: 58, losses: 19 },
          { period: 'Oct', wins: 64, losses: 12 },
          { period: 'Nov', wins: 59, losses: 15 },
          { period: 'Dec', wins: 71, losses: 11 }
        ];
      case 'all':
        return [
          { period: '2023 Q1', wins: 112, losses: 33 },
          { period: '2023 Q2', wins: 145, losses: 38 },
          { period: '2023 Q3', wins: 158, losses: 45 },
          { period: '2023 Q4', wins: 168, losses: 42 },
          { period: '2024 Q1', wins: 175, losses: 40 },
          { period: '2024 Q2', wins: 182, losses: 38 },
          { period: '2024 Q3', wins: 188, losses: 42 },
          { period: '2024 Q4', wins: 195, losses: 37 }
        ];
      default:
        return [
          { period: 'Week 1', wins: 11, losses: 4 },
          { period: 'Week 2', wins: 14, losses: 4 },
          { period: 'Week 3', wins: 17, losses: 5 },
          { period: 'Week 4', wins: 15, losses: 5 }
        ];
    }
  };

  const winLossData = getWinLossData();

  // Earnings Data based on period
  const getEarningsData = () => {
    switch (selectedPeriod) {
      case '7d':
        return [
          { period: 'Mon', earnings: 75 },
          { period: 'Tue', earnings: 120 },
          { period: 'Wed', earnings: 150 },
          { period: 'Thu', earnings: 95 },
          { period: 'Fri', earnings: 180 },
          { period: 'Sat', earnings: 145 },
          { period: 'Sun', earnings: 110 }
        ];
      case '30d':
        return [
          { period: 'Week 1', earnings: 285 },
          { period: 'Week 2', earnings: 420 },
          { period: 'Week 3', earnings: 515 },
          { period: 'Week 4', earnings: 380 }
        ];
      case '3mo':
        return [
          { period: 'Month 1', earnings: 1450 },
          { period: 'Month 2', earnings: 1680 },
          { period: 'Month 3', earnings: 1870 }
        ];
      case '6mo':
        return [
          { period: 'Jan', earnings: 850 },
          { period: 'Feb', earnings: 1120 },
          { period: 'Mar', earnings: 950 },
          { period: 'Apr', earnings: 1340 },
          { period: 'May', earnings: 1580 },
          { period: 'Jun', earnings: 1890 }
        ];
      case '1y':
        return [
          { period: 'Jan', earnings: 850 },
          { period: 'Feb', earnings: 1120 },
          { period: 'Mar', earnings: 950 },
          { period: 'Apr', earnings: 1340 },
          { period: 'May', earnings: 1580 },
          { period: 'Jun', earnings: 1890 },
          { period: 'Jul', earnings: 1650 },
          { period: 'Aug', earnings: 1820 },
          { period: 'Sep', earnings: 1740 },
          { period: 'Oct', earnings: 2150 },
          { period: 'Nov', earnings: 1980 },
          { period: 'Dec', earnings: 2340 }
        ];
      case 'all':
        return [
          { period: '2023 Q1', earnings: 2450 },
          { period: '2023 Q2', earnings: 3280 },
          { period: '2023 Q3', earnings: 4150 },
          { period: '2023 Q4', earnings: 4890 },
          { period: '2024 Q1', earnings: 5420 },
          { period: '2024 Q2', earnings: 6180 },
          { period: '2024 Q3', earnings: 6850 },
          { period: '2024 Q4', earnings: 7520 }
        ];
      default:
        return [
          { period: 'Week 1', earnings: 285 },
          { period: 'Week 2', earnings: 420 },
          { period: 'Week 3', earnings: 515 },
          { period: 'Week 4', earnings: 380 }
        ];
    }
  };

  const earningsData = getEarningsData();

  // Game Distribution
  const gameDistribution = [
    { name: 'Valorant', value: 45, color: '#E50914' },
    { name: 'CS2', value: 30, color: '#F59E0B' },
    { name: 'League of Legends', value: 18, color: '#3B82F6' },
    { name: 'Apex Legends', value: 7, color: '#8B5CF6' }
  ];

  // Performance Metrics Radar
  const performanceData = [
    { metric: 'Accuracy', value: 85, fullMark: 100 },
    { metric: 'Teamwork', value: 92, fullMark: 100 },
    { metric: 'Strategy', value: 78, fullMark: 100 },
    { metric: 'Consistency', value: 88, fullMark: 100 },
    { metric: 'Adaptability', value: 82, fullMark: 100 },
    { metric: 'Leadership', value: 75, fullMark: 100 }
  ];

  // Recent Matches
  const recentMatches = [
    { id: 1, game: 'Valorant', mode: '5v5 Ranked', result: 'win', score: '13-8', earnings: 75, mmrChange: +18, date: '2 hours ago' },
    { id: 2, game: 'CS2', mode: 'Competitive', result: 'win', score: '16-12', earnings: 50, mmrChange: +15, date: '5 hours ago' },
    { id: 3, game: 'Valorant', mode: 'Tournament', result: 'loss', score: '11-13', earnings: -30, mmrChange: -12, date: '1 day ago' },
    { id: 4, game: 'LoL', mode: 'Solo Queue', result: 'win', score: 'Victory', earnings: 40, mmrChange: +20, date: '1 day ago' },
    { id: 5, game: 'CS2', mode: '1v1 Wager', result: 'win', score: '16-9', earnings: 100, mmrChange: +22, date: '2 days ago' },
    { id: 6, game: 'Valorant', mode: 'Scrimmage', result: 'loss', score: '9-13', earnings: 0, mmrChange: -8, date: '2 days ago' }
  ];

  // Achievements
  const achievements = [
    { id: 1, name: 'First Blood Master', description: 'Get 100 first bloods', icon: Zap, progress: 87, color: 'text-amber-400' },
    { id: 2, name: 'Win Streak Legend', description: 'Win 10 games in a row', icon: Flame, progress: 100, color: 'text-primary' },
    { id: 3, name: 'MVP Champion', description: 'Be MVP 50 times', icon: Crown, progress: 64, color: 'text-yellow-400' },
    { id: 4, name: 'Tournament Victor', description: 'Win 5 tournaments', icon: Trophy, progress: 60, color: 'text-emerald-400' }
  ];

  const CustomTooltip = useMemo(() => {
    return ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-card border border-primary/30 rounded-lg p-3 shadow-lg">
            <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-xs" style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Player Info */}
      <Card className="border-primary/30 transition-all duration-300 overflow-hidden relative">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <UserAvatar
                className="w-20 h-20"
                name={displayName}
                username={user?.username}
                imageUrl={user?.profileImageUrl || user?.avatarUrl}
                fallbackClassName="bg-gradient-to-br from-primary to-amber-500 text-3xl font-bold text-white"
              />
              <div>
                <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className="bg-primary text-primary-foreground">
                    <Shield className="h-3 w-3 mr-1" />
                    Elite Player
                  </Badge>
                  <Badge className="bg-emerald-600 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    98.5% Trust
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="text-center bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Trophy className="h-4 w-4 text-emerald-400" />
                  <div className="text-2xl font-bold text-emerald-400">127</div>
                </div>
                <div className="text-xs text-muted-foreground">Total Wins</div>
              </div>
              <div className="text-center bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <div className="text-2xl font-bold text-blue-400">2,450</div>
                </div>
                <div className="text-xs text-muted-foreground">MMR Rating</div>
              </div>
              <div className="text-center bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <DollarSign className="h-4 w-4 text-amber-400" />
                  <div className="text-2xl font-bold text-amber-400">$1,240</div>
                </div>
                <div className="text-xs text-muted-foreground">Total Earned</div>
              </div>
              <div className="text-center bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Target className="h-4 w-4 text-purple-400" />
                  <div className="text-2xl font-bold text-purple-400">72%</div>
                </div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Performance Analytics</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '3mo', label: '3 Months' },
            { value: '6mo', label: '6 Months' },
            { value: '1y', label: '1 Year' },
            { value: 'all', label: 'All Time' }
          ].map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(period.value)}
              className={`transition-all duration-300 ${
                selectedPeriod === period.value 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg scale-105' 
                  : 'hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500 ${
        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        {/* MMR Progression */}
        <Card className="transition-all duration-500 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <span>MMR Progression</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {selectedPeriod === '7d' && '7 Days'}
                {selectedPeriod === '30d' && '30 Days'}
                {selectedPeriod === '3mo' && '3 Months'}
                {selectedPeriod === '6mo' && '6 Months'}
                {selectedPeriod === '1y' && '1 Year'}
                {selectedPeriod === 'all' && 'All Time'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mmrData} key={selectedPeriod}>
                <defs>
                  <linearGradient id="colorMMR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="mmr" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMMR)"
                  animationDuration={1000}
                  animationBegin={0}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Chart */}
        <Card className="transition-all duration-500 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-emerald-400" />
              <span>Win/Loss History</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {selectedPeriod === '7d' && '7 Days'}
                {selectedPeriod === '30d' && '30 Days'}
                {selectedPeriod === '3mo' && '3 Months'}
                {selectedPeriod === '6mo' && '6 Months'}
                {selectedPeriod === '1y' && '1 Year'}
                {selectedPeriod === 'all' && 'All Time'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={winLossData} key={selectedPeriod}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="period" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="wins" 
                  fill="#10B981" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                  animationBegin={0}
                  isAnimationActive={true}
                />
                <Bar 
                  dataKey="losses" 
                  fill="#EF4444" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                  animationBegin={0}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Game Distribution Pie Chart */}
        <Card className="transition-all duration-500 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gamepad2 className="h-5 w-5 text-purple-400" />
              <span>Game Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart key={selectedPeriod}>
                <Pie
                  data={gameDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                  animationBegin={0}
                  isAnimationActive={true}
                >
                  {gameDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card className="transition-all duration-500 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-amber-400" />
              <span>Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData} key={selectedPeriod}>
                <PolarGrid stroke="#2a2a2a" />
                <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <PolarRadiusAxis stroke="#9CA3AF" />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#E50914" 
                  fill="#E50914" 
                  fillOpacity={0.6}
                  animationDuration={1000}
                  animationBegin={0}
                  isAnimationActive={true}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart - Full Width */}
      <Card className={`transition-all duration-500 hover-lift ${
        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-amber-400" />
            <span>Earnings Over Time</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {selectedPeriod === '7d' && '7 Days'}
              {selectedPeriod === '30d' && '30 Days'}
              {selectedPeriod === '3mo' && '3 Months'}
              {selectedPeriod === '6mo' && '6 Months'}
              {selectedPeriod === '1y' && '1 Year'}
              {selectedPeriod === 'all' && 'All Time'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData} key={selectedPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="period" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#F59E0B" 
                strokeWidth={3}
                dot={{ fill: '#F59E0B', r: 5 }}
                activeDot={{ r: 8 }}
                animationDuration={1000}
                animationBegin={0}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-amber-400" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div 
                key={achievement.id}
                className="bg-muted/30 rounded-lg p-4 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-muted/50 ${achievement.color}`}>
                    <achievement.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{achievement.name}</h4>
                      {achievement.progress === 100 && (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                    <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-1000 ease-out"
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{achievement.progress}% Complete</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Swords className="h-5 w-5 text-primary" />
            <span>Recent Matches</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMatches.map((match, index) => (
              <div 
                key={match.id}
                className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4 flex-1">
                    {match.result === 'win' ? (
                      <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-foreground">{match.game}</span>
                        <Badge variant="outline" className="text-xs">{match.mode}</Badge>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <span>Score: {match.score}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {match.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <div className={`font-semibold flex items-center ${
                        match.earnings >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        <DollarSign className="h-4 w-4" />
                        {match.earnings >= 0 ? '+' : ''}{match.earnings}
                      </div>
                      <div className="text-xs text-muted-foreground">Credits</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold flex items-center justify-end ${
                        match.mmrChange >= 0 ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {match.mmrChange >= 0 ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {Math.abs(match.mmrChange)}
                      </div>
                      <div className="text-xs text-muted-foreground">MMR</div>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onNavigate?.('view-match')}
                >
                  View Match Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}