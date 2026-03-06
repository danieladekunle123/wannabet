import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ArrowLeft, Gamepad2, Users, DollarSign, Trophy, Clock, Shield, Star, MapPin, Swords, AlertCircle, CheckCircle2 } from 'lucide-react';

interface JoinMatchProps {
  onNavigate: (tab: string) => void;
}

export function JoinMatch({ onNavigate }: JoinMatchProps) {
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [selectedTeammates, setSelectedTeammates] = useState<string[]>([]);

  // Mock match data - in real app this would come from props or API
  const match = {
    id: 'match-1',
    game: 'Valorant',
    mode: 'Ranked 5v5',
    map: 'Ascent',
    region: 'NA East',
    host: 'ProGamer23',
    hostRank: 'Diamond III',
    entryFee: 25,
    prizePool: 250,
    slots: { total: 10, filled: 7, remaining: 3 },
    startTime: 'Starting in 15 minutes',
    requirements: {
      minMMR: 2500,
      minTrustScore: 95,
      minMatches: 100,
    },
    rules: [
      'No cheating or exploits allowed',
      'Must use in-game voice chat',
      'No toxic behavior or harassment',
      'Match disputes will be reviewed by moderators',
      'Entry fee is non-refundable after match starts',
    ],
    teamComposition: '5v5',
    currentPlayers: [
      { name: 'ProGamer23', rank: 'Diamond III', trust: 99.2, role: 'Host' },
      { name: 'SkillMaster', rank: 'Diamond II', trust: 98.5, role: 'Player' },
      { name: 'AceShooter', rank: 'Diamond I', trust: 97.8, role: 'Player' },
      { name: 'TeamPlayer99', rank: 'Platinum III', trust: 96.5, role: 'Player' },
      { name: 'EliteGamer', rank: 'Diamond II', trust: 98.1, role: 'Player' },
      { name: 'TopFragger', rank: 'Diamond I', trust: 97.3, role: 'Player' },
      { name: 'ClutchKing', rank: 'Platinum II', trust: 95.8, role: 'Player' },
    ]
  };

  const { user } = useAuth();
  const userStats = {
    mmr: 2650,
    trustScore: 98.5,
    matchesPlayed: 247,
    winRate: 64,
    credits: user?.wallet?.balance ?? 0,
  };

  const meetsRequirements = 
    userStats.mmr >= match.requirements.minMMR &&
    userStats.trustScore >= match.requirements.minTrustScore &&
    userStats.matchesPlayed >= match.requirements.minMatches;

  const canAfford = userStats.credits >= match.entryFee;

  const availableFriends = [
    { id: '1', name: 'Friend1Pro', rank: 'Diamond I', online: true, mmr: 2700 },
    { id: '2', name: 'BuddyGamer', rank: 'Platinum III', online: true, mmr: 2550 },
    { id: '3', name: 'SquadMate', rank: 'Diamond II', online: false, mmr: 2680 },
  ];

  const handleJoinMatch = () => {
    // In a real app, this would call an API
    console.log('Joining match:', match.id);
    console.log('With teammates:', selectedTeammates);
    onNavigate('lobbies');
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate('lobbies')}
            className="hover:bg-muted transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-foreground">Join Match</h1>
            <p className="text-muted-foreground">Review match details and confirm entry</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Details */}
          <Card className="animate-fadeInLeft hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Gamepad2 className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>{match.game} - {match.mode}</CardTitle>
                    <CardDescription>Hosted by {match.host}</CardDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  {match.startTime}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Map</div>
                  <div className="font-medium text-foreground flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-primary" />
                    {match.map}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Region</div>
                  <div className="font-medium text-foreground">{match.region}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Entry Fee</div>
                  <div className="font-medium text-emerald-400 flex items-center">
                    <DollarSign className="h-4 w-4" />
                    {match.entryFee}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Prize Pool</div>
                  <div className="font-medium text-amber-400 flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    ${match.prizePool}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Players */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-foreground">Current Players</h3>
                  <Badge variant="secondary">
                    {match.slots.filled}/{match.slots.total} Slots
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {match.currentPlayers.map((player, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground text-sm">{player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.rank}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {player.role === 'Host' && (
                          <Badge className="bg-amber-600 text-white text-xs">Host</Badge>
                        )}
                        <div className="flex items-center text-xs text-amber-400">
                          <Star className="h-3 w-3 mr-1" />
                          {player.trust}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Empty slots */}
                  {Array.from({ length: match.slots.remaining }).map((_, index) => (
                    <div 
                      key={`empty-${index}`}
                      className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-border bg-muted/10"
                    >
                      <div className="text-sm text-muted-foreground">Available Slot</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Rules */}
          <Card className="animate-fadeInLeft animate-delay-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Match Rules & Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Minimum Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg ${userStats.mmr >= match.requirements.minMMR ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                    <div className="text-xs text-muted-foreground mb-1">MMR Required</div>
                    <div className="font-medium text-foreground flex items-center justify-between">
                      <span>{match.requirements.minMMR}+</span>
                      {userStats.mmr >= match.requirements.minMMR ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Your MMR: {userStats.mmr}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${userStats.trustScore >= match.requirements.minTrustScore ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                    <div className="text-xs text-muted-foreground mb-1">Trust Score</div>
                    <div className="font-medium text-foreground flex items-center justify-between">
                      <span>{match.requirements.minTrustScore}%+</span>
                      {userStats.trustScore >= match.requirements.minTrustScore ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Your Score: {userStats.trustScore}%</div>
                  </div>
                  <div className={`p-3 rounded-lg ${userStats.matchesPlayed >= match.requirements.minMatches ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                    <div className="text-xs text-muted-foreground mb-1">Matches Played</div>
                    <div className="font-medium text-foreground flex items-center justify-between">
                      <span>{match.requirements.minMatches}+</span>
                      {userStats.matchesPlayed >= match.requirements.minMatches ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Your Matches: {userStats.matchesPlayed}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Rules</h4>
                <ul className="space-y-2">
                  {match.rules.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                      <div className="mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="rules" 
                  checked={agreedToRules}
                  onCheckedChange={(checked) => setAgreedToRules(checked as boolean)}
                />
                <Label 
                  htmlFor="rules" 
                  className="text-sm text-foreground cursor-pointer"
                >
                  I have read and agree to all match rules and requirements
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Invite Friends (Optional) */}
          <Card className="animate-fadeInLeft animate-delay-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Invite Friends (Optional)</span>
              </CardTitle>
              <CardDescription>Invite friends to join this match with you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableFriends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={friend.id}
                        checked={selectedTeammates.includes(friend.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTeammates([...selectedTeammates, friend.id]);
                          } else {
                            setSelectedTeammates(selectedTeammates.filter(id => id !== friend.id));
                          }
                        }}
                        disabled={!friend.online || friend.mmr < match.requirements.minMMR}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {friend.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground text-sm flex items-center space-x-2">
                          <span>{friend.name}</span>
                          {friend.online && (
                            <div className="h-2 w-2 bg-emerald-400 rounded-full" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{friend.rank} • MMR: {friend.mmr}</div>
                      </div>
                    </div>
                    {friend.mmr < match.requirements.minMMR && (
                      <Badge variant="secondary" className="text-xs">
                        Below Min MMR
                      </Badge>
                    )}
                    {!friend.online && (
                      <Badge variant="secondary" className="text-xs">
                        Offline
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-20 self-start">
          {/* Summary Card */}
          <Card className="animate-fadeInRight">
            <CardHeader>
              <CardTitle>Match Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entry Fee</span>
                  <span className="font-medium text-foreground">{match.entryFee} credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Potential Prize</span>
                  <span className="font-medium text-amber-400">${match.prizePool}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className={`font-medium ${canAfford ? 'text-emerald-400' : 'text-destructive'}`}>
                    {userStats.credits} credits
                  </span>
                </div>
                {selectedTeammates.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Friends Invited</span>
                    <span className="font-medium text-primary">{selectedTeammates.length}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                {!meetsRequirements && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-destructive">
                        You don't meet all requirements for this match
                      </div>
                    </div>
                  </div>
                )}
                {!canAfford && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-destructive">
                        Insufficient credits. Need {match.entryFee - userStats.credits} more credits
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                disabled={!meetsRequirements || !canAfford || !agreedToRules}
                onClick={handleJoinMatch}
              >
                <Swords className="h-4 w-4 mr-2" />
                Confirm & Join Match
              </Button>

              {(!meetsRequirements || !canAfford || !agreedToRules) && (
                <p className="text-xs text-center text-muted-foreground">
                  {!agreedToRules 
                    ? 'Please agree to the match rules' 
                    : !canAfford 
                      ? 'Add credits to your wallet' 
                      : 'Requirements not met'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
