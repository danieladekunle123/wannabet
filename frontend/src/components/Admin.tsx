import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Settings, 
  Shield, 
  Database, 
  Users, 
  DollarSign,
  Activity,
  Zap,
  Bell,
 
  Lock,
  Globe,
  Mail,
  Server,
  Code,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Crown,
  Coins,
  BarChart3
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { motion } from 'motion/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from './ui/slider';

export function Admin() {
  const [activeTab, setActiveTab] = useState('overview');

  const { token } = useAuth();
  const API_URL = "http://localhost:4000";

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Feature toggles
  const [features, setFeatures] = useState({
    tournaments: true,
    wagers: true,
    socialHubs: true,
    liveChat: true,
    leaderboards: true,
    achievements: true,
    escrowSystem: true,
    referrals: false
  });

  // Platform settings
  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'WannaBet?',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    twoFactorEnabled: true,
    minWagerAmount: 5,
    maxWagerAmount: 1000,
    platformFee: 5,
    escrowHoldTime: 24,
    maxActiveMatches: 10,
    trustScoreThreshold: 50
  });

 

  // System stats (fetched)
  const [systemStats, setSystemStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalMatches: 0,
    activeMatches: 0,
    totalEscrow: 0,
    totalWalletBalance: 0,
    serverUptime: 'unknown',
    avgResponseTime: 'unknown',
    databaseSize: 'unknown',
    apiCalls: 0,
    errorRate: '0%','matchesByStatus': [],
  });

  // Recent admin logs
  const adminLogs = [
    { id: 1, admin: 'AdminUser1', action: 'Updated platform fee to 5%', timestamp: '5 minutes ago', type: 'settings' },
    { id: 2, admin: 'AdminUser2', action: 'Banned user: ToxicPlayer123', timestamp: '1 hour ago', type: 'moderation' },
    { id: 3, admin: 'AdminUser1', action: 'Enabled maintenance mode', timestamp: '3 hours ago', type: 'system' },
    { id: 4, admin: 'AdminUser3', action: 'Updated tournament prize pool', timestamp: '5 hours ago', type: 'finance' },
    { id: 5, admin: 'AdminUser2', action: 'Modified escrow hold time', timestamp: '1 day ago', type: 'settings' }
  ];

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  useEffect(() => {
    if (token) fetchUsers(1);
    if (token) fetchStats();
  }, [token]);

  async function fetchStats() {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      // compute activeMatches from matchesByStatus excluding finished/cancelled
      const matchesByStatus = data.matchesByStatus || [];
      const totalMatches = matchesByStatus.reduce((sum: number, s: any) => sum + (s._count?.status || 0), 0);
      // treat active matches as total minus finished/cancelled if present
      const finishedEntry = matchesByStatus.find((m: any) => m.status === 'finished' || m.status === 'completed');
      const cancelledEntry = matchesByStatus.find((m: any) => m.status === 'cancelled');
      const finishedCount = (finishedEntry?._count?.status || 0) + (cancelledEntry?._count?.status || 0);
      const activeMatches = Math.max(0, totalMatches - finishedCount);

      setSystemStats(prev => ({
        ...prev,
        totalUsers: data.totalUsers || prev.totalUsers,
        totalMatches,
        activeMatches,
        totalEscrow: data.totalEscrow || prev.totalEscrow,
        totalWalletBalance: data.totalWalletBalance || prev.totalWalletBalance,
        matchesByStatus,
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchUsers(page = 1) {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/users?page=${page}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function changeRole(userId: string, role: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update role');
      }
      // update local state
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role } : u)));
    } catch (err) {
      console.error(err);
      alert((err as any).message || 'Failed to update role');
    }
  }

  const handleSettingChange = (setting: string, value: any) => {
    setPlatformSettings(prev => ({ ...prev, [setting]: value }));
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'settings': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'moderation': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'system': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'finance': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

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
              <Crown className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Full control over platform configuration and management</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={platformSettings.maintenanceMode 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }>
              {platformSettings.maintenanceMode ? 'Maintenance Mode' : 'System Online'}
            </Badge>
            <Badge className="bg-primary/20 text-primary border border-primary/30 text-lg px-4 py-2">
              <Activity className="h-4 w-4 mr-2" />
              {systemStats.activeUsers.toLocaleString()} Active
            </Badge>
          </div>
        </motion.div>

        {/* System Health Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-blue-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{systemStats.totalUsers.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-8 w-8 text-emerald-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">${(systemStats.totalRevenue / 1000).toFixed(1)}k</div>
                    <div className="text-xs text-muted-foreground">Total Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Activity className="h-8 w-8 text-purple-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-400">{systemStats.activeMatches}</div>
                    <div className="text-xs text-muted-foreground">Active Matches</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Coins className="h-8 w-8 text-amber-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-400">${(systemStats.totalEscrow / 1000).toFixed(1)}k</div>
                    <div className="text-xs text-muted-foreground">In Escrow</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Server className="h-8 w-8 text-blue-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-400">{systemStats.serverUptime}</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Zap className="h-8 w-8 text-emerald-400" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">{systemStats.avgResponseTime}</div>
                    <div className="text-xs text-muted-foreground">Response Time</div>
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-auto lg:inline-grid bg-muted/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Zap className="h-4 w-4 mr-2" />
                Features
              </TabsTrigger>
              
              <TabsTrigger value="system" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Server className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Status */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5 text-blue-400" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">Database</div>
                            <div className="text-xs text-muted-foreground">{systemStats.databaseSize}</div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Healthy
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Server className="h-5 w-5 text-purple-400" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">API Server</div>
                            <div className="text-xs text-muted-foreground">{systemStats.apiCalls.toLocaleString()} calls</div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">Error Rate</div>
                            <div className="text-xs text-muted-foreground">Last 24 hours</div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {systemStats.errorRate}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-yellow-400" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">Performance</div>
                            <div className="text-xs text-muted-foreground">Avg response: {systemStats.avgResponseTime}</div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Optimal
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Overview */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      Revenue Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                        <div className="text-3xl font-bold text-emerald-400">${systemStats.totalRevenue.toLocaleString()}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
                          <TrendingUp className="h-3 w-3" />
                          <span>+12.5% from last month</span>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Monthly Revenue</div>
                        <div className="text-3xl font-bold text-blue-400">${systemStats.monthlyRevenue.toLocaleString()}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-400">
                          <TrendingUp className="h-3 w-3" />
                          <span>+8.3% from last month</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Platform Fees</div>
                          <div className="text-xl font-bold text-foreground">${(systemStats.totalRevenue * 0.05).toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">In Escrow</div>
                          <div className="text-xl font-bold text-amber-400">${systemStats.totalEscrow.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Activity Log */}
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Recent Admin Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {adminLogs.map((log, index) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-300"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground">{log.admin}</span>
                              <Badge className={getLogTypeColor(log.type)}>
                                {log.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{log.action}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {log.timestamp}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                    <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                      <Database className="h-4 w-4 mr-2" />
                      Backup DB
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Platform Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* General Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-400" />
                      General Settings
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Site Name</Label>
                          <p className="text-sm text-muted-foreground">The name of your platform</p>
                        </div>
                        <Input 
                          value={platformSettings.siteName}
                          onChange={(e) => handleSettingChange('siteName', e.target.value)}
                          className="max-w-xs bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Maintenance Mode</Label>
                          <p className="text-sm text-muted-foreground">Disable site access for maintenance</p>
                        </div>
                        <Switch
                          checked={platformSettings.maintenanceMode}
                          onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">User Registration</Label>
                          <p className="text-sm text-muted-foreground">Allow new user sign-ups</p>
                        </div>
                        <Switch
                          checked={platformSettings.registrationEnabled}
                          onCheckedChange={(checked) => handleSettingChange('registrationEnabled', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Lock className="h-5 w-5 text-red-400" />
                      Security Settings
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Email Verification Required</Label>
                          <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                        </div>
                        <Switch
                          checked={platformSettings.emailVerificationRequired}
                          onCheckedChange={(checked) => handleSettingChange('emailVerificationRequired', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">Enable 2FA for enhanced security</p>
                        </div>
                        <Switch
                          checked={platformSettings.twoFactorEnabled}
                          onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Trust Score Threshold</Label>
                          <p className="text-sm text-muted-foreground">Minimum trust score to create matches: {platformSettings.trustScoreThreshold}%</p>
                        </div>
                        <div className="w-64">
                          <Slider
                            value={[platformSettings.trustScoreThreshold]}
                            onValueChange={(value) => handleSettingChange('trustScoreThreshold', value[0])}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Settings */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      Financial Settings
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Minimum Wager Amount</Label>
                          <p className="text-sm text-muted-foreground">Minimum bet amount in USD</p>
                        </div>
                        <Input 
                          type="number"
                          value={platformSettings.minWagerAmount}
                          onChange={(e) => handleSettingChange('minWagerAmount', parseInt(e.target.value))}
                          className="max-w-xs bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Maximum Wager Amount</Label>
                          <p className="text-sm text-muted-foreground">Maximum bet amount in USD</p>
                        </div>
                        <Input 
                          type="number"
                          value={platformSettings.maxWagerAmount}
                          onChange={(e) => handleSettingChange('maxWagerAmount', parseInt(e.target.value))}
                          className="max-w-xs bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Platform Fee (%)</Label>
                          <p className="text-sm text-muted-foreground">Percentage fee on each match: {platformSettings.platformFee}%</p>
                        </div>
                        <div className="w-64">
                          <Slider
                            value={[platformSettings.platformFee]}
                            onValueChange={(value) => handleSettingChange('platformFee', value[0])}
                            max={20}
                            step={0.5}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Escrow Hold Time (hours)</Label>
                          <p className="text-sm text-muted-foreground">How long funds are held in escrow</p>
                        </div>
                        <Input 
                          type="number"
                          value={platformSettings.escrowHoldTime}
                          onChange={(e) => handleSettingChange('escrowHoldTime', parseInt(e.target.value))}
                          className="max-w-xs bg-background/50 border-border/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Match Settings */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-400" />
                      Match Settings
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Max Active Matches Per User</Label>
                          <p className="text-sm text-muted-foreground">Limit simultaneous active matches</p>
                        </div>
                        <Input 
                          type="number"
                          value={platformSettings.maxActiveMatches}
                          onChange={(e) => handleSettingChange('maxActiveMatches', parseInt(e.target.value))}
                          className="max-w-xs bg-background/50 border-border/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50">
                    <Card className="border-primary/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          User Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingUsers ? (
                          <p>Loading users…</p>
                        ) : (
                          <div className="space-y-3">
                            {users.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No users found</p>
                            ) : (
                              <div className="grid gap-2">
                                {users.map((u: any) => (
                                  <div key={u.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div>
                                      <div className="font-medium">{u.username} <span className="text-xs text-muted-foreground">{u.email}</span></div>
                                      <div className="text-xs text-muted-foreground">{u.profile?.displayName}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Select value={u.role} onValueChange={(val: string) => changeRole(u.id, val)}>
                                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="PLAYER">PLAYER</SelectItem>
                                          <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="pt-6 border-t border-border/50">
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save All Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Feature Toggles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {Object.entries(features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-300">
                        <div className="space-y-0.5">
                          <Label className="text-base capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</Label>
                          <p className="text-sm text-muted-foreground">
                            {feature === 'tournaments' && 'Enable tournament creation and participation'}
                            {feature === 'wagers' && 'Allow users to create and join wager matches'}
                            {feature === 'socialHubs' && 'Enable social hub functionality'}
                            {feature === 'liveChat' && 'Enable real-time messaging system'}
                            {feature === 'leaderboards' && 'Display global and game-specific leaderboards'}
                            {feature === 'achievements' && 'Enable achievement system'}
                            {feature === 'escrowSystem' && 'Use escrow for match funds'}
                            {feature === 'referrals' && 'Enable referral program'}
                          </p>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={() => handleFeatureToggle(feature)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="pt-6">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Apply Feature Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            

            {/* System Tab */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Database Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-blue-500/30 bg-blue-500/10">
                      <Database className="h-4 w-4 text-blue-400" />
                      <AlertDescription>
                        Current database size: <span className="font-semibold">{systemStats.databaseSize}</span>
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        <Download className="h-4 w-4 mr-2" />
                        Create Backup
                      </Button>
                      <Button variant="outline" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                        <Upload className="h-4 w-4 mr-2" />
                        Restore from Backup
                      </Button>
                      <Button variant="outline" className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Optimize Database
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      Server Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-amber-500/30 bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <AlertDescription>
                        Warning: These actions may affect platform availability
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restart Services
                      </Button>
                      <Button variant="outline" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                        <Code className="h-4 w-4 mr-2" />
                        Clear Cache
                      </Button>
                      <Button variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Emergency Shutdown
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Email & Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Enable push notifications</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">Send promotional emails</p>
                      </div>
                      <Switch />
                    </div>
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
