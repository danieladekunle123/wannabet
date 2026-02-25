import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  MapPin, 
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  Target,
  Swords,
  Star,
  Flame,
  UserPlus,
  UserMinus,
  Zap,
  Award,
  Lock,
  Unlock,
  Crown,
  ChevronRight
} from 'lucide-react';

interface JoinTournamentProps {
  onNavigate: (tab: string) => void;
  tournamentId?: string;
}

export function JoinTournament({ onNavigate, tournamentId }: JoinTournamentProps) {
  const [step, setStep] = useState<'details' | 'team' | 'confirm' | 'success'>('details');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [agreeToRules, setAgreeToRules] = useState(false);
  const [agreeToFees, setAgreeToFees] = useState(false);

  // Mock tournament data
  const tournament = {
    id: tournamentId || '1',
    name: 'Elite Championship Series',
    game: 'Counter-Strike 2',
    format: 'Single Elimination',
    teamSize: 5,
    maxTeams: 16,
    currentTeams: 12,
    entryFee: 50,
    prizePool: 2500,
    startDate: 'Oct 5, 2025',
    startTime: '6:00 PM EST',
    region: 'NA East',
    duration: '2 days',
    organizer: 'ProGaming League',
    organizerTrust: 99.5,
    rules: [
      'All matches best of 3 (Finals best of 5)',
      'Standard competitive ruleset',
      'No cheating or exploits - instant disqualification',
      'Teams must check in 30 minutes before match time',
      'Disputes handled by tournament admins',
      'Prize distribution within 48 hours of completion'
    ],
    requirements: [
      'Minimum team average MMR: 2000',
      'All players must have verified accounts',
      'Team captain must have 95%+ trust score',
      'No roster changes after registration closes'
    ],
    prizeDistribution: [
      { place: '1st', amount: 1250, percentage: 50 },
      { place: '2nd', amount: 750, percentage: 30 },
      { place: '3rd', amount: 375, percentage: 15 },
      { place: '4th', amount: 125, percentage: 5 }
    ],
    schedule: [
      { round: 'Round 1', date: 'Oct 5', time: '6:00 PM EST' },
      { round: 'Quarterfinals', date: 'Oct 5', time: '8:30 PM EST' },
      { round: 'Semifinals', date: 'Oct 6', time: '6:00 PM EST' },
      { round: 'Finals', date: 'Oct 6', time: '8:30 PM EST' }
    ]
  };

  // Mock available players for team selection
  const availablePlayers = [
    { id: '1', name: 'YouAreHere', mmr: 2450, role: 'Captain', trust: 98.5, selected: true },
    { id: '2', name: 'SkillMasterX', mmr: 2720, role: 'Rifler', trust: 98.9, selected: false },
    { id: '3', name: 'ProGamerElite', mmr: 2850, role: 'AWPer', trust: 99.5, selected: false },
    { id: '4', name: 'TeamCaptain', mmr: 2650, role: 'Support', trust: 99.2, selected: false },
    { id: '5', name: 'EsportsLegend', mmr: 3100, role: 'Entry', trust: 99.8, selected: false },
    { id: '6', name: 'CompetitivePro', mmr: 2580, role: 'Lurker', trust: 97.8, selected: false },
  ];

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else if (prev.length < tournament.teamSize) {
        return [...prev, playerId];
      }
      return prev;
    });
  };

  const getTeamStats = () => {
    const team = availablePlayers.filter(p => 
      p.id === '1' || selectedPlayers.includes(p.id)
    );
    const avgMMR = team.reduce((sum, p) => sum + p.mmr, 0) / team.length;
    const avgTrust = team.reduce((sum, p) => sum + p.trust, 0) / team.length;
    return { avgMMR: Math.round(avgMMR), avgTrust: avgTrust.toFixed(1), teamSize: team.length };
  };

  const teamStats = getTeamStats();
  const spotsRemaining = tournament.maxTeams - tournament.currentTeams;
  const registrationClosing = spotsRemaining <= 4;

  // Step 1: Tournament Details
  if (step === 'details') {
    return (
      <div className="page-transition max-w-5xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('tournaments')}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Join Tournament</h1>
              <p className="text-muted-foreground">Review details and register your team</p>
            </div>
          </div>
        </div>

        {/* Tournament Header Card */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/10 to-transparent animate-fadeInUp">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-foreground">{tournament.name}</h2>
                  {registrationClosing && (
                    <Badge className="bg-amber-600 text-white animate-pulse">
                      <Flame className="h-3 w-3 mr-1" />
                      Filling Fast
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {tournament.game}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {tournament.teamSize}v{tournament.teamSize}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {tournament.startDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {tournament.region}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <Badge className="bg-primary text-primary-foreground mb-2">
                  {tournament.format}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  by {tournament.organizer}
                </div>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <Star className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-amber-400">{tournament.organizerTrust}%</span>
                </div>
              </div>
            </div>

            {/* Registration Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Teams Registered</span>
                <span className="text-foreground">
                  {tournament.currentTeams}/{tournament.maxTeams}
                </span>
              </div>
              <Progress 
                value={(tournament.currentTeams / tournament.maxTeams) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prize Pool */}
            <Card className="animate-fadeInUp animate-delay-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <span>Prize Pool</span>
                </CardTitle>
                <CardDescription>Prize distribution breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-emerald-600/10 border border-emerald-600/30 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                      ${tournament.prizePool.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Prize Pool
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {tournament.prizeDistribution.map((prize, index) => (
                    <div 
                      key={prize.place}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-amber-600 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index === 0 && <Crown className="h-4 w-4" />}
                          {index > 0 && <span className="text-xs">{index + 1}</span>}
                        </div>
                        <div>
                          <div className="text-foreground font-medium">{prize.place} Place</div>
                          <div className="text-xs text-muted-foreground">{prize.percentage}% of pool</div>
                        </div>
                      </div>
                      <div className="text-emerald-400 font-medium">
                        ${prize.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card className="animate-fadeInUp animate-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Tournament Schedule</span>
                </CardTitle>
                <CardDescription>Match times and rounds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tournament.schedule.map((round, index) => (
                    <div 
                      key={round.round}
                      className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/40 hover:border-primary/30 border border-transparent transition-all duration-300 group"
                      onClick={() => onNavigate?.('tournament-schedule')}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium shrink-0 group-hover:bg-primary/30 transition-colors duration-300">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-medium group-hover:text-primary transition-colors duration-300">{round.round}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {round.date} at {round.time}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rules & Requirements */}
            <Card className="animate-fadeInUp animate-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Rules & Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-foreground font-medium mb-3 flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-amber-400" />
                    Entry Requirements
                  </h4>
                  <ul className="space-y-2">
                    {tournament.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="text-foreground font-medium mb-3 flex items-center">
                    <Info className="h-4 w-4 mr-2 text-blue-400" />
                    Tournament Rules
                  </h4>
                  <ul className="space-y-2">
                    {tournament.rules.map((rule, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                        <span className="text-muted-foreground">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Info & Actions */}
          <div className="space-y-6">
            {/* Entry Fee */}
            <Card className="border-primary/30 animate-fadeInUp animate-delay-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>Entry Fee</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <div className="text-center mb-3">
                    <div className="text-3xl font-bold text-primary mb-1">
                      ${tournament.entryFee}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per team
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry Fee</span>
                      <span className="text-foreground">${tournament.entryFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee (10%)</span>
                      <span className="text-foreground">${(tournament.entryFee * 0.1).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span className="text-foreground">Total Due</span>
                      <span className="text-primary">${(tournament.entryFee * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      Funds held in secure escrow until tournament completion
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      Full refund if tournament is cancelled
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="animate-fadeInUp animate-delay-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  <span>Quick Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground font-medium">{tournament.duration}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Format</span>
                  <span className="text-foreground font-medium">{tournament.format}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="text-foreground font-medium">30 min before</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team Size</span>
                  <span className="text-foreground font-medium">{tournament.teamSize} players</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <Button 
              className="w-full h-12"
              onClick={() => setStep('team')}
            >
              <Users className="h-4 w-4 mr-2" />
              Select Team & Register
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              <Lock className="h-3 w-3 inline mr-1" />
              Secure registration powered by escrow
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Team Selection
  if (step === 'team') {
    return (
      <div className="page-transition max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setStep('details')}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Build Your Team</h1>
              <p className="text-muted-foreground">Select {tournament.teamSize} players for {tournament.name}</p>
            </div>
          </div>
        </div>

        {/* Team Stats Card */}
        <Card className="mb-6 border-primary/30 animate-fadeInUp">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {teamStats.teamSize}/{tournament.teamSize}
                </div>
                <div className="text-xs text-muted-foreground">Players Selected</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {teamStats.avgMMR}
                </div>
                <div className="text-xs text-muted-foreground">Average MMR</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  {teamStats.avgTrust}%
                </div>
                <div className="text-xs text-muted-foreground">Trust Score</div>
              </div>
            </div>

            {teamStats.avgMMR < 2000 && teamStats.teamSize === tournament.teamSize && (
              <div className="mt-4 bg-amber-600/10 border border-amber-600/30 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-400">
                  Team average MMR is below the minimum requirement of 2000
                </p>
              </div>
            )}

            {teamStats.teamSize === tournament.teamSize && teamStats.avgMMR >= 2000 && (
              <div className="mt-4 bg-emerald-600/10 border border-emerald-600/30 rounded-lg p-3 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-400">
                  Team meets all requirements!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Player Selection */}
        <Card className="mb-6 animate-fadeInUp animate-delay-100">
          <CardHeader>
            <CardTitle>Available Players</CardTitle>
            <CardDescription>
              Select {tournament.teamSize - 1} more {tournament.teamSize - 1 === 1 ? 'player' : 'players'} from your friends list
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availablePlayers.map((player, index) => {
              const isYou = player.id === '1';
              const isSelected = isYou || selectedPlayers.includes(player.id);
              const canSelect = selectedPlayers.length < tournament.teamSize - 1 || isSelected;

              return (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    isSelected
                      ? 'bg-primary/10 border-primary/30'
                      : canSelect
                      ? 'bg-muted/20 border-muted hover:bg-muted/40 cursor-pointer'
                      : 'bg-muted/10 border-muted opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => !isYou && canSelect && handlePlayerToggle(player.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 border-2 border-primary/30">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {player.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-foreground font-medium truncate">{player.name}</h4>
                          {isYou && (
                            <Badge className="bg-primary text-primary-foreground">
                              <Crown className="h-3 w-3 mr-1" />
                              You (Captain)
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{player.role}</span>
                          <span>•</span>
                          <span>{player.mmr} MMR</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-amber-400" />
                            {player.trust}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-4">
                      {isYou ? (
                        <Badge variant="outline" className="border-primary text-primary">
                          <Lock className="h-3 w-3 mr-1" />
                          Captain
                        </Badge>
                      ) : isSelected ? (
                        <Button size="sm" variant="outline" className="border-primary text-primary">
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      ) : canSelect ? (
                        <Button size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      ) : (
                        <Badge variant="outline">Team Full</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setStep('details')}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setStep('confirm')}
            disabled={teamStats.teamSize !== tournament.teamSize || teamStats.avgMMR < 2000}
            className="min-w-[140px]"
          >
            Continue to Payment
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (step === 'confirm') {
    const totalFee = tournament.entryFee * 1.1;
    const selectedTeam = availablePlayers.filter(p => 
      p.id === '1' || selectedPlayers.includes(p.id)
    );

    return (
      <div className="page-transition max-w-3xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setStep('team')}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team Selection
          </Button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Confirm Registration</h1>
              <p className="text-muted-foreground">Review and confirm your tournament entry</p>
            </div>
          </div>
        </div>

        {/* Tournament Summary */}
        <Card className="mb-6 animate-fadeInUp">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span>Tournament Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tournament</span>
              <span className="text-foreground font-medium">{tournament.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Game</span>
              <span className="text-foreground">{tournament.game}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span className="text-foreground">{tournament.startDate} at {tournament.startTime}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format</span>
              <span className="text-foreground">{tournament.format}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prize Pool</span>
              <span className="text-emerald-400 font-medium">${tournament.prizePool.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Team Roster */}
        <Card className="mb-6 animate-fadeInUp animate-delay-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Team Roster</span>
            </CardTitle>
            <CardDescription>
              Average MMR: {teamStats.avgMMR} • Trust Score: {teamStats.avgTrust}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedTeam.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg"
              >
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {player.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-foreground text-sm font-medium truncate">{player.name}</h4>
                    {player.id === '1' && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Captain
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {player.role} • {player.mmr} MMR
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <Star className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-amber-400">{player.trust}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="mb-6 border-primary/30 animate-fadeInUp animate-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Payment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entry Fee</span>
                <span className="text-foreground">${tournament.entryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee (10%)</span>
                <span className="text-foreground">${(tournament.entryFee * 0.1).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-foreground font-medium">Total Due</span>
                <span className="text-primary font-medium text-lg">${totalFee.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <div className="flex items-start space-x-2 mb-2">
                <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Entry fee will be held in secure escrow until tournament completion</span>
              </div>
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Available wallet balance: $2,450.00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Agreement */}
        <Card className="mb-6 animate-fadeInUp animate-delay-300">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="rules" 
                checked={agreeToRules}
                onCheckedChange={(checked) => setAgreeToRules(checked as boolean)}
              />
              <div className="flex-1">
                <Label 
                  htmlFor="rules" 
                  className="text-sm cursor-pointer"
                >
                  I have read and agree to the tournament rules and requirements
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox 
                id="fees" 
                checked={agreeToFees}
                onCheckedChange={(checked) => setAgreeToFees(checked as boolean)}
              />
              <div className="flex-1">
                <Label 
                  htmlFor="fees" 
                  className="text-sm cursor-pointer"
                >
                  I understand that entry fees are non-refundable except in case of tournament cancellation
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setStep('team')}
          >
            Back
          </Button>
          <Button
            onClick={() => setStep('success')}
            disabled={!agreeToRules || !agreeToFees}
            className="min-w-[180px]"
          >
            <Zap className="h-4 w-4 mr-2" />
            Confirm & Pay ${totalFee.toFixed(2)}
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Success
  return (
    <div className="page-transition max-w-2xl mx-auto">
      <Card className="border-primary/30 animate-scaleIn">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 animate-bounce" />
          </div>
          
          <h2 className="text-foreground mb-2">Registration Successful!</h2>
          <p className="text-muted-foreground mb-6">
            You're all set for <span className="text-primary font-medium">{tournament.name}</span>
          </p>

          <div className="bg-muted/30 rounded-lg p-6 space-y-4 text-left mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tournament</span>
              <span className="text-foreground font-medium">{tournament.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Time</span>
              <span className="text-foreground">{tournament.startDate} at {tournament.startTime}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Team Size</span>
              <span className="text-foreground">{tournament.teamSize} players</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-in Opens</span>
              <span className="text-foreground">30 minutes before</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-emerald-600 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Registered
              </Badge>
            </div>
          </div>

          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <p className="text-blue-400 font-medium mb-1">Important Reminders</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Check in 30 minutes before your first match</li>
                  <li>• You'll receive notifications for upcoming matches</li>
                  <li>• View the bracket and schedule anytime</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => onNavigate('tournament-bracket')}
            >
              <Trophy className="h-4 w-4 mr-2" />
              View Bracket
            </Button>
            <Button
              onClick={() => onNavigate('tournaments')}
            >
              Back to Tournaments
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            A confirmation email has been sent with all tournament details
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
