import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Bell, 
  Trophy, 
  Users, 
  DollarSign, 
  MessageCircle, 
  Volume2,
  Smartphone,
  Mail,
  ArrowLeft,
  UserPlus,
  AlertTriangle,
  Clock,
  CheckCircle,
  Moon,
  BellRing,
  BellOff,
  Gamepad2,
  AtSign
} from 'lucide-react';

interface NotificationSettingsProps {
  onNavigate?: (tab: string) => void;
}

export function NotificationSettings({ onNavigate }: NotificationSettingsProps) {
  const [activeTab, setActiveTab] = useState('general');
  
  const [settings, setSettings] = useState({
    // Delivery Methods
    pushNotifications: true,
    emailNotifications: false,
    soundEnabled: true,
    desktopNotifications: true,
    
    // Match Notifications
    matchResults: true,
    matchStarting: true,
    opponentFound: true,
    tournamentStart: true,
    
    // Financial Notifications
    payoutReceived: true,
    disputeFiled: true,
    disputeResolved: true,
    lowBalance: true,
    
    // Social Notifications
    friendRequest: true,
    teamInvite: true,
    newMessage: true,
    mentionedInChat: true,
    
    // Do Not Disturb
    doNotDisturb: false,
  });

  const [soundVolume, setSoundVolume] = useState([75]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const NotificationRow = ({ 
    settingKey, 
    icon: Icon, 
    label, 
    description, 
    badge 
  }: { 
    settingKey: keyof typeof settings; 
    icon: any; 
    label: string; 
    description: string;
    badge?: string;
  }) => (
    <div className="flex items-center justify-between py-3 hover:bg-muted/30 rounded-lg px-2 transition-colors">
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        <Icon className="h-4 w-4 mt-1 text-primary shrink-0" />
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label className="cursor-pointer">{label}</Label>
            {badge && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={settings[settingKey]}
        onCheckedChange={() => handleToggle(settingKey)}
        className="shrink-0"
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.('settings')}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-2xl text-foreground">Notification Preferences</h2>
        </div>
      </div>

      <p className="text-muted-foreground">
        Customize how and when you receive notifications
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => {
            const allOn = Object.fromEntries(
              Object.keys(settings).map(key => [key, true])
            ) as typeof settings;
            setSettings(allOn);
          }}
        >
          <BellRing className="h-4 w-4" />
          Enable All
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => {
            const allOff = Object.fromEntries(
              Object.keys(settings).map(key => [key, false])
            ) as typeof settings;
            setSettings(allOff);
          }}
        >
          <BellOff className="h-4 w-4" />
          Disable All
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 col-span-2 sm:col-span-1"
          onClick={() => handleToggle('doNotDisturb')}
        >
          <Moon className="h-4 w-4" />
          {settings.doNotDisturb ? 'DND: On' : 'DND: Off'}
        </Button>
      </div>

      {/* Main Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            General
          </TabsTrigger>
          <TabsTrigger value="gaming" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Gaming & Social
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Delivery Methods */}
          <Card className="animate-fadeInUp">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Delivery Methods
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <NotificationRow
                settingKey="pushNotifications"
                icon={Bell}
                label="Push Notifications"
                description="Receive in-app notifications"
              />
              <NotificationRow
                settingKey="desktopNotifications"
                icon={Smartphone}
                label="Desktop Notifications"
                description="Browser notifications when WannaBet? is open"
              />
              <NotificationRow
                settingKey="emailNotifications"
                icon={Mail}
                label="Email Notifications"
                description="Receive important updates via email"
              />
              <NotificationRow
                settingKey="soundEnabled"
                icon={Volume2}
                label="Sound Alerts"
                description="Play sound when notifications arrive"
              />
              
              {settings.soundEnabled && (
                <div className="ml-7 mt-4 space-y-3 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Sound Volume</Label>
                      <span className="text-sm text-muted-foreground">{soundVolume[0]}%</span>
                    </div>
                    <Slider
                      value={soundVolume}
                      onValueChange={setSoundVolume}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Do Not Disturb */}
          <Card className="animate-fadeInUp animate-delay-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-indigo-400" />
                Do Not Disturb
              </CardTitle>
              <CardDescription>
                Silence all notifications when you need focus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <NotificationRow
                settingKey="doNotDisturb"
                icon={Moon}
                label="Enable Do Not Disturb"
                description="Mute all non-critical notifications"
              />
              
              {settings.doNotDisturb && (
                <div className="ml-7 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground">Priority notifications enabled</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You'll still receive critical alerts like match results, disputes, and payouts
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Notifications */}
          <Card className="animate-fadeInUp animate-delay-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                Financial Notifications
              </CardTitle>
              <CardDescription>
                Stay updated on transactions and disputes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <NotificationRow
                settingKey="payoutReceived"
                icon={DollarSign}
                label="Payout Received"
                description="Get notified when winnings are credited"
                badge="Priority"
              />
              <NotificationRow
                settingKey="disputeFiled"
                icon={AlertTriangle}
                label="Dispute Filed"
                description="When a dispute is filed"
                badge="Priority"
              />
              <NotificationRow
                settingKey="disputeResolved"
                icon={CheckCircle}
                label="Dispute Resolved"
                description="When a dispute is resolved"
              />
              <NotificationRow
                settingKey="lowBalance"
                icon={AlertTriangle}
                label="Low Balance Alert"
                description="Warn when account balance is low"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gaming & Social Tab */}
        <TabsContent value="gaming" className="space-y-6">
          {/* Match Notifications */}
          <Card className="animate-fadeInUp">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                Match & Tournament Notifications
              </CardTitle>
              <CardDescription>
                Get updates about your competitive matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <NotificationRow
                settingKey="matchResults"
                icon={Trophy}
                label="Match Results"
                description="Win/loss notifications and payouts"
                badge="Priority"
              />
              <NotificationRow
                settingKey="matchStarting"
                icon={Clock}
                label="Match Starting Soon"
                description="Reminder before match starts"
              />
              <NotificationRow
                settingKey="opponentFound"
                icon={Users}
                label="Opponent Found"
                description="When an opponent accepts your match"
              />
              <NotificationRow
                settingKey="tournamentStart"
                icon={Trophy}
                label="Tournament Starting"
                description="When tournaments you've joined begin"
                badge="Priority"
              />
            </CardContent>
          </Card>

          {/* Social Notifications */}
          <Card className="animate-fadeInUp animate-delay-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Social Notifications
              </CardTitle>
              <CardDescription>
                Stay connected with friends and teams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <NotificationRow
                settingKey="friendRequest"
                icon={UserPlus}
                label="Friend Requests"
                description="When someone sends you a friend request"
              />
              <NotificationRow
                settingKey="teamInvite"
                icon={Users}
                label="Team Invitations"
                description="When invited to join a team"
              />
            </CardContent>
          </Card>

          {/* Messaging Notifications */}
          <Card className="animate-fadeInUp animate-delay-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-400" />
                Messaging Notifications
              </CardTitle>
              <CardDescription>
                Control your message notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <NotificationRow
                settingKey="newMessage"
                icon={MessageCircle}
                label="New Messages"
                description="When you receive direct messages"
              />
              <NotificationRow
                settingKey="mentionedInChat"
                icon={AtSign}
                label="Mentions"
                description="When someone @mentions you"
                badge="Priority"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          variant="outline" 
          onClick={() => onNavigate?.('settings')}
        >
          Cancel
        </Button>
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => {
            // Here you would save the settings
            onNavigate?.('settings');
          }}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}