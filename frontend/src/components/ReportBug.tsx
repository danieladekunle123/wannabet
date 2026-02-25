import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bug, Upload, CheckCircle2, AlertCircle, Clock, Code, ArrowLeft } from 'lucide-react';

interface ReportBugProps {
  onNavigate?: (tab: string) => void;
}

export function ReportBug({ onNavigate }: ReportBugProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    severity: '',
    description: '',
    steps: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Submit logic here
  };

  const recentReports = [
    {
      id: '#BUG-1247',
      title: 'Match history not loading',
      status: 'investigating',
      date: '2 hours ago',
      severity: 'medium',
    },
    {
      id: '#BUG-1246',
      title: 'Tournament bracket display issue',
      status: 'resolved',
      date: '1 day ago',
      severity: 'low',
    },
    {
      id: '#BUG-1245',
      title: 'Wallet balance not updating',
      status: 'fixed',
      date: '3 days ago',
      severity: 'high',
    },
  ];

  if (submitted) {
    return (
      <div className="space-y-6 animate-fadeInUp">
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
            <h1 className="mb-2">Report a Bug</h1>
            <p className="text-muted-foreground">
              Help us improve WannaBet by reporting issues
            </p>
          </div>
        </div>

        <Card className="border-emerald-600/50 bg-gradient-to-br from-emerald-600/10 to-transparent">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mb-2">Bug Report Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for helping us improve WannaBet. We've received your report and our team will investigate it shortly.
            </p>
            <div className="space-y-3">
              <div className="p-4 border border-border rounded-lg bg-card text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Report ID</span>
                  <Badge className="bg-primary text-primary-foreground">#BUG-1248</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll receive updates via email and in your notifications
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => setSubmitted(false)}
                >
                  Report Another Bug
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  View My Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="mb-2">Report a Bug</h1>
          <p className="text-muted-foreground">
            Help us improve WannaBet by reporting issues you encounter
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Bug className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Before Reporting</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please check if the issue has already been reported. Include as much detail as possible to help us reproduce and fix the bug faster.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bug Report Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle>Bug Details</CardTitle>
            <CardDescription>
              Provide information about the bug you encountered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Bug Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-input-background"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ui">User Interface</SelectItem>
                    <SelectItem value="match">Match/Lobby</SelectItem>
                    <SelectItem value="wallet">Wallet/Payments</SelectItem>
                    <SelectItem value="tournament">Tournaments</SelectItem>
                    <SelectItem value="messaging">Messaging</SelectItem>
                    <SelectItem value="profile">Profile/Account</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  required
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical - App Unusable</SelectItem>
                    <SelectItem value="high">High - Major Feature Broken</SelectItem>
                    <SelectItem value="medium">Medium - Feature Partially Working</SelectItem>
                    <SelectItem value="low">Low - Minor Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                placeholder="Describe what happened and what you expected to happen..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-input-background text-foreground resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps">Steps to Reproduce</Label>
              <textarea
                id="steps"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe that..."
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-input-background text-foreground resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                List the steps to reproduce the bug
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Help us debug by providing context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Screenshots or Video</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF, MP4 up to 10MB
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Browser:</p>
                <p className="text-foreground font-medium">Chrome 120.0.0</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Operating System:</p>
                <p className="text-foreground font-medium">Windows 11</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Screen Resolution:</p>
                <p className="text-foreground font-medium">1920x1080</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Time of Issue:</p>
                <p className="text-foreground font-medium">Just now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" className="border-border">
            Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Bug className="h-4 w-4 mr-2" />
            Submit Bug Report
          </Button>
        </div>
      </form>

      {/* Recent Reports */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle>Your Recent Reports</CardTitle>
          <CardDescription>
            Track the status of your submitted bug reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report, index) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {report.id}
                    </Badge>
                    <h4 className="font-medium text-foreground">{report.title}</h4>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <span>{report.date}</span>
                    <span>•</span>
                    <Badge className={`text-xs ${
                      report.severity === 'high' ? 'bg-red-600 text-white' :
                      report.severity === 'medium' ? 'bg-amber-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {report.severity}
                    </Badge>
                  </div>
                </div>
                <Badge className={`text-xs ${
                  report.status === 'resolved' || report.status === 'fixed'
                    ? 'bg-emerald-600 text-white'
                    : report.status === 'investigating'
                    ? 'bg-amber-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {report.status === 'investigating' && <Clock className="h-3 w-3 mr-1" />}
                  {report.status === 'resolved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {report.status === 'fixed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {report.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}