import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MessageCircle, Mail, Clock, CheckCircle2, HelpCircle, AlertCircle, Zap, ArrowLeft } from 'lucide-react';

interface ContactSupportProps {
  onNavigate?: (tab: string) => void;
}

export function ContactSupport({ onNavigate }: ContactSupportProps) {
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Submit logic here
  };

  const supportOptions = [
    {
      title: 'Email Support',
      icon: Mail,
      description: 'Get help via email',
      responseTime: 'Within 24 hours',
      available: true,
    },
    {
      title: 'Live Chat',
      icon: MessageCircle,
      description: 'Chat with our team',
      responseTime: 'Average 5 minutes',
      available: true,
      badge: 'Fastest',
    },
    {
      title: 'Priority Support',
      icon: Zap,
      description: 'For Pro & Elite members',
      responseTime: 'Within 1 hour',
      available: false,
      badge: 'Premium',
    },
  ];

  const recentTickets = [
    {
      id: '#TICKET-5892',
      subject: 'Question about withdrawal times',
      status: 'resolved',
      date: '2 days ago',
      category: 'Wallet',
    },
    {
      id: '#TICKET-5891',
      subject: 'Tournament bracket issue',
      status: 'in-progress',
      date: '4 days ago',
      category: 'Tournaments',
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
            <h1 className="mb-2">Contact Support</h1>
            <p className="text-muted-foreground">
              Get help from our dedicated support team
            </p>
          </div>
        </div>

        <Card className="border-emerald-600/50 bg-gradient-to-br from-emerald-600/10 to-transparent">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mb-2">Support Ticket Created!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for contacting us. Our support team will review your request and respond as soon as possible.
            </p>
            <div className="space-y-3">
              <div className="p-4 border border-border rounded-lg bg-card text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Ticket ID</span>
                  <Badge className="bg-primary text-primary-foreground">#TICKET-5893</Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Expected Response Time</span>
                  <span className="text-sm font-medium text-foreground">Within 24 hours</span>
                </div>
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground">
                  You'll receive updates via email at elite.gamer@wannabet.com
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => setSubmitted(false)}
                >
                  Submit Another Ticket
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  View My Tickets
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
          <h1 className="mb-2">Contact Support</h1>
          <p className="text-muted-foreground">
            Get help from our dedicated support team
          </p>
        </div>
      </div>

      {/* Support Options */}
      <div className="grid gap-4 md:grid-cols-3">
        {supportOptions.map((option, index) => {
          const IconComponent = option.icon;
          return (
            <Card
              key={option.title}
              className={`border-border/50 hover-lift ${!option.available ? 'opacity-60' : 'cursor-pointer'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  {option.badge && (
                    <Badge className={`text-xs ${
                      option.badge === 'Fastest' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-amber-600 text-white'
                    }`}>
                      {option.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="font-medium text-foreground mb-1">{option.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{option.responseTime}</span>
                </div>
                {!option.available && (
                  <Badge className="bg-muted text-muted-foreground text-xs mt-3">
                    Upgrade Required
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Banner */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Before Contacting Support</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check our <span className="text-primary cursor-pointer hover:underline">Help Center</span> and <span className="text-primary cursor-pointer hover:underline">FAQ</span> for instant answers to common questions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle>Submit a Support Ticket</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you soon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
                    <SelectItem value="account">Account & Login</SelectItem>
                    <SelectItem value="wallet">Wallet & Payments</SelectItem>
                    <SelectItem value="match">Match & Lobbies</SelectItem>
                    <SelectItem value="tournament">Tournaments</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="report">Report Player</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  required
                >
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent - Account Locked</SelectItem>
                    <SelectItem value="high">High - Payment Issue</SelectItem>
                    <SelectItem value="normal">Normal - General Question</SelectItem>
                    <SelectItem value="low">Low - Feedback/Suggestion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <textarea
                id="message"
                placeholder="Please provide as much detail as possible..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                className="w-full min-h-[150px] px-3 py-2 rounded-md border border-input bg-input-background text-foreground resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Include relevant details like error messages, screenshots, or account information
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Your Information</Label>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between p-3 border border-border rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground font-medium">elite.gamer@wannabet.com</span>
                </div>
                <div className="flex justify-between p-3 border border-border rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="text-foreground font-medium">@EliteGamer</span>
                </div>
                <div className="flex justify-between p-3 border border-border rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Account Type:</span>
                  <Badge className="bg-primary text-primary-foreground">Pro</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" className="border-border">
            Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <MessageCircle className="h-4 w-4 mr-2" />
            Submit Ticket
          </Button>
        </div>
      </form>

      {/* Recent Tickets */}
      {recentTickets.length > 0 && (
        <Card className="border-border/50 hover-lift">
          <CardHeader>
            <CardTitle>Your Recent Tickets</CardTitle>
            <CardDescription>
              Track the status of your support requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {ticket.id}
                      </Badge>
                      <h4 className="font-medium text-foreground">{ticket.subject}</h4>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span>{ticket.category}</span>
                      <span>•</span>
                      <span>{ticket.date}</span>
                    </div>
                  </div>
                  <Badge className={`text-xs ${
                    ticket.status === 'resolved'
                      ? 'bg-emerald-600 text-white'
                      : ticket.status === 'in-progress'
                      ? 'bg-amber-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {ticket.status === 'resolved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {ticket.status === 'in-progress' && <Clock className="h-3 w-3 mr-1" />}
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support Hours */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Support Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Email Support
              </h4>
              <p className="text-sm text-muted-foreground">
                24/7 - We respond within 24 hours
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center">
                <MessageCircle className="h-4 w-4 mr-2 text-primary" />
                Live Chat
              </h4>
              <p className="text-sm text-muted-foreground">
                Mon-Fri: 9AM-9PM EST
                <br />
                Sat-Sun: 10AM-6PM EST
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}