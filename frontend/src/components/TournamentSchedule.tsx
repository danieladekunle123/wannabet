import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Clock, 
  ArrowLeft, 
  Calendar,
  Trophy,
  PlayCircle,
  CheckCircle2,
  Users,
  MapPin
} from 'lucide-react';

interface TournamentScheduleProps {
  onNavigate?: (tab: string) => void;
}

// Tournament rounds schedule data
const scheduleRounds = [
  {
    id: 1,
    name: 'Round 1',
    subtitle: 'Opening Round',
    date: 'Oct 1 at 12:00 PM EST',
    timestamp: 'Oct 1, 2025 12:00 PM EST',
    status: 'completed',
    matches: [
      { id: 1, team1: 'Team Phoenix', team2: 'Shadow Reapers', score: '2-0', time: '12:00 PM' },
      { id: 2, team1: 'Cyber Warriors', team2: 'Storm Raiders', score: '2-1', time: '12:00 PM' },
      { id: 3, team1: 'Alpha Squad', team2: 'Viper Squad', score: '2-0', time: '12:30 PM' },
      { id: 4, team1: 'Elite Gaming', team2: 'Blue Force', score: '2-1', time: '12:30 PM' },
      { id: 5, team1: 'Night Hawks', team2: 'Fire Dragons', score: '2-0', time: '1:00 PM' },
      { id: 6, team1: 'Thunder Wolves', team2: 'Ice Warriors', score: '2-1', time: '1:00 PM' },
      { id: 7, team1: 'Crimson Tide', team2: 'Shadow Knights', score: '2-0', time: '1:30 PM' },
      { id: 8, team1: 'Golden Eagles', team2: 'Steel Legion', score: '2-1', time: '1:30 PM' }
    ]
  },
  {
    id: 2,
    name: 'Quarterfinals',
    subtitle: 'Top 8 Teams',
    date: 'Oct 2 at 6:00 PM EST',
    timestamp: 'Oct 2, 2025 6:00 PM EST',
    status: 'completed',
    matches: [
      { id: 9, team1: 'Team Phoenix', team2: 'Shadow Reapers', score: '2-0', time: '6:00 PM' },
      { id: 10, team1: 'Cyber Warriors', team2: 'Storm Raiders', score: '2-1', time: '6:00 PM' },
      { id: 11, team1: 'Alpha Squad', team2: 'Viper Squad', score: '2-0', time: '6:30 PM' },
      { id: 12, team1: 'Elite Gaming', team2: 'Blue Force', score: '2-1', time: '6:30 PM' }
    ]
  },
  {
    id: 3,
    name: 'Semifinals',
    subtitle: 'Final Four',
    date: 'Oct 3 at 8:00 PM EST',
    timestamp: 'Oct 3, 2025 8:00 PM EST',
    status: 'completed',
    matches: [
      { id: 13, team1: 'Team Phoenix', team2: 'Cyber Warriors', score: '2-0', time: '8:00 PM' },
      { id: 14, team1: 'Alpha Squad', team2: 'Elite Gaming', score: '2-1', time: '8:30 PM' }
    ]
  },
  {
    id: 4,
    name: 'Finals',
    subtitle: 'Championship Match',
    date: 'Oct 3 at 10:00 PM EST',
    timestamp: 'Oct 3, 2025 10:00 PM EST',
    status: 'live',
    matches: [
      { id: 15, team1: 'Team Phoenix', team2: 'Alpha Squad', score: '2-1', time: '10:00 PM' }
    ]
  }
];

export function TournamentSchedule({ onNavigate }: TournamentScheduleProps) {
  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate?.('tournament-bracket')}
        className="mb-4 hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tournament
      </Button>

      {/* Header */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                Tournament Schedule
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-3">
                Match times and rounds for WannaBet? Championship 2025
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-600 text-white text-xs">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Finals Live Now
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  Valorant
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  16 Teams
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Rounds */}
      <div className="space-y-4">
        {scheduleRounds.map((round, roundIndex) => (
          <Card 
            key={round.id} 
            className={`animate-fadeInUp transition-all duration-300 ${
              round.status === 'live' 
                ? 'border-primary/50 bg-gradient-to-r from-primary/5 to-transparent' 
                : ''
            }`}
            style={{ animationDelay: `${roundIndex * 0.1}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    round.status === 'live' 
                      ? 'bg-primary text-primary-foreground' 
                      : round.status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {round.status === 'live' ? (
                      <PlayCircle className="h-5 w-5 animate-pulse" />
                    ) : round.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      {round.name}
                      {round.status === 'live' && (
                        <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 animate-pulse">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </span>
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">{round.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="hidden sm:inline">{round.timestamp}</span>
                    <span className="sm:hidden">{round.date}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {round.matches.map((match, matchIndex) => (
                  <div 
                    key={match.id}
                    className={`p-3 rounded-lg border transition-all duration-300 hover:border-primary/50 hover:bg-muted/30 cursor-pointer ${
                      round.status === 'live' && matchIndex === 0
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground shrink-0 w-16 sm:w-20">
                          {match.time}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {match.team1} <span className="text-muted-foreground">vs</span> {match.team2}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {round.status === 'completed' ? (
                          <Badge variant="outline" className="text-xs">
                            {match.score}
                          </Badge>
                        ) : round.status === 'live' && matchIndex === 0 ? (
                          <Badge className="bg-primary text-primary-foreground text-xs animate-pulse">
                            LIVE
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Scheduled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <Card className="animate-fadeInUp animate-delay-400">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <Trophy className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-2">Tournament Information</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• All times are in Eastern Standard Time (EST)</p>
                <p>• Matches are best of 3 (BO3) format except Finals which is best of 5 (BO5)</p>
                <p>• Stream available on the official WannaBet? Twitch channel</p>
                <p>• Check-in opens 30 minutes before each match</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
