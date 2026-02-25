import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, Lock, Eye, EyeOff, Key, Smartphone, AlertCircle, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

interface PrivacySecurityProps {
  onNavigate?: (tab: string) => void;
}

export function PrivacySecurity({ onNavigate }: PrivacySecurityProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const loginSessions = [
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'New York, USA',
      ipAddress: '192.168.1.1',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      location: 'New York, USA',
      ipAddress: '192.168.1.2',
      lastActive: '3 hours ago',
      current: false,
    },
    {
      id: 3,
      device: 'Chrome on Android',
      location: 'New York, USA',
      ipAddress: '192.168.1.3',
      lastActive: '2 days ago',
      current: false,
    },
  ];

  const securityEvents = [
    {
      id: 1,
      type: 'success',
      event: 'Password changed successfully',
      date: '2 days ago',
    },
    {
      id: 2,
      type: 'warning',
      event: 'New device login from iPhone',
      date: '3 days ago',
    },
    {
      id: 3,
      type: 'success',
      event: '2FA enabled',
      date: '1 week ago',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.('settings')}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="mb-2">Privacy & Security</h1>
          <p className="text-muted-foreground">
            Manage your account security and privacy settings
          </p>
        </div>
      </div>

      {/* Security Status */}
      <Card className="border-emerald-600/50 hover-lift bg-gradient-to-br from-emerald-600/10 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-emerald-400" />
              Security Status
            </CardTitle>
            <Badge className="bg-emerald-600 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Strong
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Password</p>
                <p className="text-xs text-muted-foreground">Strong password set</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-foreground">2FA Enabled</p>
                <p className="text-xs text-muted-foreground">Extra layer of security</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Email Verified</p>
                <p className="text-xs text-muted-foreground">Account verified</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card className="border-border/50 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password regularly to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="pr-10 bg-input-background"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    className="pr-10 bg-input-background"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="bg-input-background"
                />
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="border-border/50 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-primary" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <h4 className="font-medium text-foreground">Authenticator App</h4>
                  <p className="text-sm text-muted-foreground">
                    Use an authenticator app to generate codes
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>

              {twoFactorEnabled && (
                <div className="p-4 border border-emerald-600/30 rounded-lg bg-emerald-600/5 space-y-3 animate-fadeInUp">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">2FA is enabled</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your account is protected with two-factor authentication
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10">
                    <Key className="h-4 w-4 mr-2" />
                    View Backup Codes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border-border/50 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Sessions</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Sign Out All Devices
                </Button>
              </CardTitle>
              <CardDescription>
                Manage devices that are currently logged into your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loginSessions.map((session, index) => (
                <div
                  key={session.id}
                  className="p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground">{session.device}</h4>
                        {session.current && (
                          <Badge className="bg-emerald-600 text-white text-xs">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{session.location}</p>
                        <p>IP: {session.ipAddress}</p>
                        <p>Last active: {session.lastActive}</p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        Sign Out
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Activity */}
          <Card className="border-border/50 hover-lift">
            <CardHeader>
              <CardTitle>Recent Security Activity</CardTitle>
              <CardDescription>
                Review recent security-related events on your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {securityEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 p-3 border border-border rounded-lg bg-muted/30"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {event.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : event.type === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{event.event}</p>
                    <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          {/* Privacy Settings */}
          <Card className="border-border/50 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-primary" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control who can see your information and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anyone to view your profile
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Online Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others see when you're online
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Match History</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your match results publicly
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Stats & Achievements</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your statistics visible to others
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Friend Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Let other players send friend requests
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Direct Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive messages from non-friends
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className="border-border/50 hover-lift">
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>
                Manage your personal data and privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                <div>
                  <h4 className="font-medium text-foreground">Download Your Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Get a copy of your WannaBet data
                  </p>
                </div>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                  Request
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                <div>
                  <h4 className="font-medium text-foreground">Delete Account Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently remove specific data types
                  </p>
                </div>
                <Button variant="outline" className="border-border">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Blocked Users */}
          <Card className="border-border/50 hover-lift">
            <CardHeader>
              <CardTitle>Blocked Users</CardTitle>
              <CardDescription>
                Manage users you've blocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No blocked users</h3>
                <p className="text-sm text-muted-foreground">
                  Users you block will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}