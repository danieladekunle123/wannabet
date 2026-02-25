import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft, 
  Search, 
  Gamepad2, 
  DollarSign, 
  Clock, 
  MapPin, 
  Trophy,
  Send,
  Star,
  Shield,
  Swords,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';

interface RequestMatchProps {
  onNavigate: (tab: string) => void;
  preselectedOpponent?: string;
}

export function RequestMatch({ onNavigate, preselectedOpponent }: RequestMatchProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'confirm'>(preselectedOpponent ? 'configure' : 'select');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState<any>(preselectedOpponent ? mockPlayers[0] : null);
  const [matchType, setMatchType] = useState('casual');
  const [game, setGame] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [wagerAmount, setWagerAmount] = useState('10');
  const [message, setMessage] = useState('');
  const [bestOf, setBestOf] = useState('1');
  const [region, setRegion] = useState('');

  // Mock data for recent opponents and search results
  const mockPlayers = [
    { 
      id: '1', 
      name: 'ProGamerElite', 
      avatar: '', 
      mmr: 2850, 
      winRate: 68.5, 
      lastPlayed: '2 hours ago',
      trustScore: 99.2,
      status: 'online',
      games: ['CS2', 'Valorant']
    },
    { 
      id: '2', 
      name: 'SkillMasterX', 
      avatar: '', 
      mmr: 2720, 
      winRate: 64.2, 
      lastPlayed: '1 day ago',
      trustScore: 98.5,
      status: 'online',
      games: ['CS2', 'Dota 2']
    },
    { 
      id: '3', 
      name: 'EsportsLegend', 
      avatar: '', 
      mmr: 3100, 
      winRate: 72.8, 
      lastPlayed: '3 days ago',
      trustScore: 99.8,
      status: 'away',
      games: ['CS2', 'Valorant', 'League of Legends']
    },
    { 
      id: '4', 
      name: 'TeamCaptain', 
      avatar: '', 
      mmr: 2650, 
      winRate: 61.4, 
      lastPlayed: 'Never',
      trustScore: 97.8,
      status: 'offline',
      games: ['CS2', 'Overwatch 2']
    },
  ];

  const filteredPlayers = mockPlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOpponent = (player: any) => {
    setSelectedOpponent(player);
    setStep('configure');
  };

  const handleSendRequest = () => {
    // Here would be the actual request sending logic
    setStep('confirm');
    
    // Auto-redirect after 3 seconds
    setTimeout(() => {
      onNavigate('home');
    }, 3000);
  };

  // Step 1: Select Opponent
  if (step === 'select') {
    return (
      <div className="page-transition max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('home')}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Swords className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Request Match</h1>
              <p className="text-muted-foreground">Challenge a player to a match</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 animate-fadeInUp">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search players by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Opponents */}
        <Card className="mb-6 animate-fadeInUp animate-delay-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Recent Opponents</span>
            </CardTitle>
            <CardDescription>Players you've competed against recently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredPlayers.slice(0, 3).map((player, index) => (
              <div
                key={player.id}
                className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-300 cursor-pointer hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleSelectOpponent(player)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-primary/30">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {player.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                        player.status === 'online' ? 'bg-emerald-500' : 
                        player.status === 'away' ? 'bg-amber-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-foreground truncate">{player.name}</h4>
                        {player.trustScore > 99 && (
                          <Badge className="bg-emerald-600 text-white">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Trophy className="h-3 w-3 mr-1" />
                          {player.mmr} MMR
                        </span>
                        <span className="text-emerald-400">{player.winRate}% WR</span>
                        <span className="flex items-center">
                          <Star className="h-3 w-3 mr-1 text-amber-400" />
                          {player.trustScore}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        {player.games.slice(0, 3).map((game) => (
                          <Badge key={game} variant="outline" className="text-xs">
                            {game}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button className="shrink-0 ml-4">
                    Challenge
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* All Players */}
        <Card className="animate-fadeInUp animate-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>All Players</span>
            </CardTitle>
            <CardDescription>Search for any player on WannaBet?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="p-3 bg-muted/20 rounded-lg hover:bg-muted/40 transition-all duration-300 cursor-pointer"
                  onClick={() => handleSelectOpponent(player)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 border border-primary/20">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {player.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="min-w-0 flex-1">
                        <h4 className="text-foreground text-sm truncate">{player.name}</h4>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{player.mmr} MMR</span>
                          <span>•</span>
                          <span className={player.status === 'online' ? 'text-emerald-400' : ''}>
                            {player.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No players found matching "{searchQuery}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Configure Match
  if (step === 'configure') {
    return (
      <div className="page-transition max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setStep('select')}
            className="mb-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Change Opponent
          </Button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Configure Match</h1>
              <p className="text-muted-foreground">Set up your challenge details</p>
            </div>
          </div>
        </div>

        {/* Selected Opponent Card */}
        <Card className="mb-6 border-primary/30 animate-fadeInUp">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={selectedOpponent?.avatar} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {selectedOpponent?.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-foreground">{selectedOpponent?.name}</h3>
                  <Badge className={`${
                    selectedOpponent?.status === 'online' ? 'bg-emerald-600' :
                    selectedOpponent?.status === 'away' ? 'bg-amber-600' : 'bg-gray-600'
                  } text-white`}>
                    {selectedOpponent?.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Trophy className="h-3 w-3 mr-1" />
                    {selectedOpponent?.mmr} MMR
                  </span>
                  <span className="text-emerald-400">{selectedOpponent?.winRate}% Win Rate</span>
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-amber-400" />
                    {selectedOpponent?.trustScore}% Trust
                  </span>
                </div>
              </div>

              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  Challenging
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Configuration */}
          <div className="space-y-6">
            <Card className="animate-fadeInUp animate-delay-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <span>Match Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={matchType === 'casual' ? 'default' : 'outline'}
                    onClick={() => setMatchType('casual')}
                    className="flex-col h-auto py-3"
                  >
                    <Gamepad2 className="h-5 w-5 mb-1" />
                    <span className="text-xs">Casual</span>
                  </Button>
                  <Button
                    variant={matchType === 'wager' ? 'default' : 'outline'}
                    onClick={() => setMatchType('wager')}
                    className="flex-col h-auto py-3"
                  >
                    <DollarSign className="h-5 w-5 mb-1" />
                    <span className="text-xs">Wager</span>
                  </Button>
                  <Button
                    variant={matchType === 'scrim' ? 'default' : 'outline'}
                    onClick={() => setMatchType('scrim')}
                    className="flex-col h-auto py-3"
                  >
                    <Swords className="h-5 w-5 mb-1" />
                    <span className="text-xs">Scrim</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game">Game</Label>
                  <Select value={game} onValueChange={setGame}>
                    <SelectTrigger id="game">
                      <SelectValue placeholder="Select game" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cs2">Counter-Strike 2</SelectItem>
                      <SelectItem value="valorant">Valorant</SelectItem>
                      <SelectItem value="dota2">Dota 2</SelectItem>
                      <SelectItem value="lol">League of Legends</SelectItem>
                      <SelectItem value="ow2">Overwatch 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode">Game Mode</Label>
                  <Select value={gameMode} onValueChange={setGameMode}>
                    <SelectTrigger id="mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1v1">1v1</SelectItem>
                      <SelectItem value="2v2">2v2</SelectItem>
                      <SelectItem value="5v5">5v5</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="wingman">Wingman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bestof">Best Of</Label>
                  <Select value={bestOf} onValueChange={setBestOf}>
                    <SelectTrigger id="bestof">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Best of 1 (BO1)</SelectItem>
                      <SelectItem value="3">Best of 3 (BO3)</SelectItem>
                      <SelectItem value="5">Best of 5 (BO5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="na-east">NA East</SelectItem>
                      <SelectItem value="na-west">NA West</SelectItem>
                      <SelectItem value="eu-west">EU West</SelectItem>
                      <SelectItem value="eu-east">EU East</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                      <SelectItem value="oce">Oceania</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wager & Message */}
          <div className="space-y-6">
            {matchType === 'wager' && (
              <Card className="animate-fadeInUp animate-delay-200 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span>Wager Amount</span>
                  </CardTitle>
                  <CardDescription>Set the stakes for this match</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wager">Amount (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="wager"
                        type="number"
                        value={wagerAmount}
                        onChange={(e) => setWagerAmount(e.target.value)}
                        className="pl-10"
                        min="5"
                        max="10000"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Min: $5 • Max: $10,000 • Available Balance: $2,450.00
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {['10', '25', '50', '100'].map((amount) => (
                      <Button
                        key={amount}
                        variant={wagerAmount === amount ? 'default' : 'outline'}
                        onClick={() => setWagerAmount(amount)}
                        size="sm"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Wager Amount</span>
                      <span className="text-foreground">${wagerAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee (5%)</span>
                      <span className="text-foreground">${(parseFloat(wagerAmount) * 0.05).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-foreground">Potential Winnings</span>
                      <span className="text-emerald-400">${(parseFloat(wagerAmount) * 1.95).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="animate-fadeInUp animate-delay-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Challenge Message</span>
                </CardTitle>
                <CardDescription>Add a message to your opponent (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Ready to prove you're the best? Let's settle this..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {message.length}/200 characters
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 animate-fadeInUp animate-delay-400">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="text-foreground">Match Request Guidelines</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Opponent has 24 hours to accept or decline</li>
                      <li>• Funds will be held in escrow until match completion</li>
                      <li>• Both players must agree on match results</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setStep('select')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendRequest}
            disabled={!game || !gameMode || !region}
            className="min-w-[140px]"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Challenge
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  return (
    <div className="page-transition max-w-2xl mx-auto">
      <Card className="border-primary/30 animate-scaleIn">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary animate-bounce" />
          </div>
          
          <h2 className="text-foreground mb-2">Challenge Sent!</h2>
          <p className="text-muted-foreground mb-6">
            Your match request has been sent to <span className="text-primary font-medium">{selectedOpponent?.name}</span>
          </p>

          <div className="bg-muted/30 rounded-lg p-6 space-y-4 text-left mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Match Type</span>
              <span className="text-foreground capitalize">{matchType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Game</span>
              <span className="text-foreground">
                {game === 'cs2' ? 'Counter-Strike 2' : 
                 game === 'valorant' ? 'Valorant' :
                 game === 'dota2' ? 'Dota 2' :
                 game === 'lol' ? 'League of Legends' : 'Overwatch 2'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span className="text-foreground">{gameMode}</span>
            </div>
            {matchType === 'wager' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wager</span>
                <span className="text-emerald-400">${wagerAmount}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-amber-600 text-white">
                <Clock className="h-3 w-3 mr-1" />
                Pending Response
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => onNavigate('messages')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Message Player
            </Button>
            <Button
              onClick={() => onNavigate('home')}
            >
              Back to Home
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            You'll receive a notification when {selectedOpponent?.name} responds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
