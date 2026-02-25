import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Clock, 
  Star,
  Crown,
  ArrowLeft,
  Calendar,
  Shield,
  Target
} from 'lucide-react';

interface TournamentBracketProps {
  onNavigate?: (tab: string) => void;
}

// Type definitions for bracket data
interface Team {
  name: string;
  score?: number;
}

interface Match {
  id: string | number;
  date: string;
  teams: [Team, Team];
}

interface Round {
  title: string;
  matches: Match[];
}

// Tournament bracket data
const rounds: Round[] = [
  {
    title: 'Quarter Finals',
    matches: [
      {
        id: 1,
        date: '6 hours ago',
        teams: [
          { name: 'Team Phoenix', score: 2 },
          { name: 'Shadow Reapers', score: 0 }
        ]
      },
      {
        id: 2,
        date: '6 hours ago',
        teams: [
          { name: 'Cyber Warriors', score: 2 },
          { name: 'Storm Raiders', score: 1 }
        ]
      },
      {
        id: 3,
        date: '7 hours ago',
        teams: [
          { name: 'Alpha Squad', score: 2 },
          { name: 'Viper Squad', score: 0 }
        ]
      },
      {
        id: 4,
        date: '7 hours ago',
        teams: [
          { name: 'Elite Gaming', score: 2 },
          { name: 'Blue Force', score: 1 }
        ]
      }
    ]
  },
  {
    title: 'Semi Finals',
    matches: [
      {
        id: 5,
        date: '2 hours ago',
        teams: [
          { name: 'Team Phoenix', score: 2 },
          { name: 'Cyber Warriors', score: 0 }
        ]
      },
      {
        id: 6,
        date: '3 hours ago',
        teams: [
          { name: 'Alpha Squad', score: 2 },
          { name: 'Elite Gaming', score: 1 }
        ]
      }
    ]
  },
  {
    title: 'Grand Finals',
    matches: [
      {
        id: 7,
        date: 'Live Now',
        teams: [
          { name: 'Team Phoenix', score: 2 },
          { name: 'Alpha Squad', score: 1 }
        ]
      }
    ]
  }
];

// Tournament metadata
const tournament = {
  name: 'WannaBet? Championship 2025',
  game: 'Valorant',
  prizePool: 10000,
  participants: 16,
  status: 'Live',
  startDate: 'Oct 1, 2025',
  format: 'Single Elimination',
  entryFee: 50
};

const prizes = [
  { place: '1st Place', amount: 5000, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Crown },
  { place: '2nd Place', amount: 3000, color: 'text-slate-400', bg: 'bg-slate-500/10', icon: Shield },
  { place: '3rd-4th', amount: 1000, color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Star },
  { place: '5th-8th', amount: 250, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Trophy }
];

// Team avatar and color mapping for styling
const teamStyles: Record<string, { avatar: string; color: string }> = {
  'Team Phoenix': { avatar: 'TP', color: 'from-orange-500 to-red-600' },
  'Shadow Reapers': { avatar: 'SR', color: 'from-gray-500 to-slate-600' },
  'Cyber Warriors': { avatar: 'CW', color: 'from-purple-500 to-pink-600' },
  'Storm Raiders': { avatar: 'SR', color: 'from-indigo-500 to-violet-600' },
  'Alpha Squad': { avatar: 'AS', color: 'from-blue-500 to-cyan-600' },
  'Viper Squad': { avatar: 'VS', color: 'from-lime-500 to-green-600' },
  'Elite Gaming': { avatar: 'EG', color: 'from-green-500 to-emerald-600' },
  'Blue Force': { avatar: 'BF', color: 'from-yellow-500 to-amber-600' },
};

// Match Card Component
interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const isLive = match.date === 'Live Now';
  const [team1, team2] = match.teams;

  const t1Score = team1?.score ?? 0;
  const t2Score = team2?.score ?? 0;
  const t1Won = t1Score > t2Score;
  const t2Won = t2Score > t1Score;

  const T1 = team1?.name ? teamStyles[team1.name] : null;
  const T2 = team2?.name ? teamStyles[team2.name] : null;

  return (
    <div
      className={`relative w-full bg-card rounded-lg border overflow-hidden min-w-[280px]
                  ${isLive ? 'border-primary' : 'border-border'}`}
    >
      {/* Header */}
      <div className="bg-muted/30 px-3 py-1.5 border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{match.date}</span>
        {isLive && (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground animate-pulse">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            LIVE
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="p-2.5 space-y-2">
        {/* Team 1 */}
        <div className={`flex items-center justify-between px-2.5 py-2 rounded
                         ${t1Won ? 'bg-primary/10 border border-primary/30' : 'bg-muted/20 opacity-70'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {T1 && (
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${T1.color} flex items-center justify-center shadow-md shrink-0`}>
                <span className="text-white text-xs font-bold">
                  {T1.avatar}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`text-sm truncate ${t1Won ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {team1?.name ?? '—'}
              </span>
              {t1Won && <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
            </div>
          </div>
          <span className={`text-base font-bold ml-2 shrink-0 ${t1Won ? 'text-primary' : 'text-muted-foreground'}`}>
            {t1Score}
          </span>
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between px-2.5 py-2 rounded
                         ${t2Won ? 'bg-primary/10 border border-primary/30' : 'bg-muted/20 opacity-70'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {T2 && (
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${T2.color} flex items-center justify-center shadow-md shrink-0`}>
                <span className="text-white text-xs font-bold">
                  {T2.avatar}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`text-sm truncate ${t2Won ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {team2?.name ?? '—'}
              </span>
              {t2Won && <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
            </div>
          </div>
          <span className={`text-base font-bold ml-2 shrink-0 ${t2Won ? 'text-primary' : 'text-muted-foreground'}`}>
            {t2Score}
          </span>
        </div>
      </div>
    </div>
  );
};

// Custom Bracket Component
const CustomBracket = () => {
  return (
    <div className="flex gap-8 items-center min-w-max py-6 px-4">
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} className="flex flex-col">
          {/* Round Title */}
          <div className="text-center mb-6 font-bold text-sm bg-muted border border-border rounded-lg px-4 py-2 whitespace-nowrap">
            {round.title}
          </div>
          
          {/* Matches Container */}
          <div 
            className="flex flex-col gap-4"
            style={{
              justifyContent: 'space-around',
              minHeight: roundIndex === 0 ? 'auto' : roundIndex === 1 ? '520px' : '280px'
            }}
          >
            {round.matches.map((match) => (
              <div key={match.id} className="relative">
                <MatchCard match={match} />
                
                {/* Connector lines to next round */}
                {roundIndex < rounds.length - 1 && (
                  <svg 
                    className="absolute left-full top-1/2 pointer-events-none"
                    width="32"
                    height="2"
                    style={{ transform: 'translateY(-50%)' }}
                  >
                    <line 
                      x1="0" 
                      y1="1" 
                      x2="32" 
                      y2="1" 
                      stroke="hsl(var(--border))" 
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Main page component with tournament info and bracket
export function TournamentBracket({ onNavigate }: TournamentBracketProps) {
  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate?.('tournaments')}
        className="mb-4 hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tournaments
      </Button>

      {/* Tournament Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shrink-0 shadow-lg">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {tournament.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {tournament.game}
                  </Badge>
                  <Badge className="bg-emerald-600 text-white animate-pulse text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      {tournament.status}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {tournament.format}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
                    <span className="text-muted-foreground">Prize:</span>
                    <span className="font-semibold text-amber-400">${tournament.prizePool.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 shrink-0" />
                    <span className="text-muted-foreground">Teams:</span>
                    <span className="font-semibold text-foreground">{tournament.participants}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 shrink-0" />
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="font-semibold text-foreground">${tournament.entryFee}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 shrink-0" />
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-semibold text-foreground">{tournament.startDate}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 w-full sm:w-auto"
            >
              <Star className="h-4 w-4 mr-2" />
              Follow Tournament
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prize Distribution */}
      <Card className="animate-fadeInUp animate-delay-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Trophy className="h-5 w-5 text-amber-400" />
            <span>Prize Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {prizes.map((prize, index) => (
              <div 
                key={prize.place}
                className={`${prize.bg} rounded-lg p-3 sm:p-4 text-center transition-all duration-300 hover-lift animate-fadeInUp`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center mb-2">
                  <prize.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${prize.color}`} />
                </div>
                <div className={`${prize.color} font-semibold mb-1 sm:mb-2 text-xs sm:text-sm`}>{prize.place}</div>
                <div className="text-lg sm:text-2xl font-bold text-foreground">${prize.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tournament Bracket - Horizontal Scrolling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="text-lg sm:text-xl">Tournament Bracket</span>
            </div>
            <Badge variant="outline" className="text-xs w-fit">
              <span className="hidden sm:inline">← Scroll horizontally →</span>
              <span className="sm:hidden">← Swipe to scroll →</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Enhanced horizontal scrolling container */}
          <div 
            className="overflow-x-auto overflow-y-hidden pb-4 px-3 sm:px-6 bracket-scroll-container relative"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--primary) var(--card)',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'auto',
              touchAction: 'pan-x pan-y',
              overscrollBehaviorX: 'contain',
              width: '100%'
            }}
          >
            <CustomBracket />
          </div>

          {/* Mobile scroll hint */}
          <div className="sm:hidden text-center px-3 pb-3">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Swipe left/right to view all rounds
              </span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Schedule - Clickable */}
      <Card className="animate-fadeInUp animate-delay-300 transition-all duration-300 hover:border-primary/50 group">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div 
              className="flex items-start space-x-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => onNavigate?.('tournament-schedule')}
            >
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
                  Tournament Schedule
                </h4>
                <p className="text-sm text-muted-foreground">
                  View full match schedule and times
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate?.('tournament-schedule')}
              className="shrink-0 h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 rotate-180 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
