import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { HelpCircle, Search, Book, Video, FileText, MessageCircle, ExternalLink, TrendingUp, Shield, Wallet, Users, ArrowLeft } from 'lucide-react';

interface HelpCenterProps {
  onNavigate?: (tab: string) => void;
}

export function HelpCenter({ onNavigate }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const quickLinks = [
    { title: 'Getting Started Guide', icon: Book, category: 'Guides' },
    { title: 'Video Tutorials', icon: Video, category: 'Learning' },
    { title: 'FAQ', icon: HelpCircle, category: 'Help' },
    { title: 'Community Forum', icon: MessageCircle, category: 'Community' },
  ];

  const categories = [
    {
      title: 'Getting Started',
      icon: Book,
      color: 'text-blue-400',
      articles: [
        'How to create your first match',
        'Understanding the lobby system',
        'Setting up your profile',
        'Wallet and credits explained',
      ],
    },
    {
      title: 'Wallet & Payments',
      icon: Wallet,
      color: 'text-emerald-400',
      articles: [
        'How to deposit funds',
        'Understanding escrow',
        'Withdrawal process',
        'Payment methods',
      ],
    },
    {
      title: 'Matches & Tournaments',
      icon: TrendingUp,
      color: 'text-amber-400',
      articles: [
        'How to join a tournament',
        'Creating custom matches',
        'Match rules and regulations',
        'Tournament brackets explained',
      ],
    },
    {
      title: 'Security & Safety',
      icon: Shield,
      color: 'text-primary',
      articles: [
        'Account security best practices',
        'Two-factor authentication setup',
        'Reporting suspicious activity',
        'Privacy settings guide',
      ],
    },
    {
      title: 'Teams & Social',
      icon: Users,
      color: 'text-purple-400',
      articles: [
        'Creating and managing teams',
        'Joining social hubs',
        'Team tournaments',
        'Communication features',
      ],
    },
  ];

  const faqs = [
    {
      question: 'How does the escrow system work?',
      answer: 'When you join a match, the wager amount is automatically placed in escrow. This ensures both players have committed their funds. Once the match is complete and verified, the funds are automatically distributed to the winner. This protects both players from disputes and ensures fair play.',
    },
    {
      question: 'What happens if there\'s a dispute?',
      answer: 'If there\'s a dispute about match results, both players can submit evidence (screenshots, recordings, etc.) through the dispute resolution system. Our team reviews all submissions and makes a fair decision based on the evidence provided. The escrow funds are held until the dispute is resolved.',
    },
    {
      question: 'How do I withdraw my winnings?',
      answer: 'You can withdraw funds from your available balance (not in escrow) at any time through the Wallet & Escrow page. Minimum withdrawal is $50. Withdrawals are processed within 2-5 business days depending on your payment method.',
    },
    {
      question: 'What are the transaction fees?',
      answer: 'Transaction fees vary based on your subscription tier: Free (5%), Pro (2.5%), and Elite (0%). These fees help us maintain the platform and provide secure escrow services.',
    },
    {
      question: 'Can I play with friends?',
      answer: 'Yes! You can create private lobbies and invite specific players, or create teams to compete together in team tournaments. You can also join social hubs to connect with friends and the community.',
    },
    {
      question: 'How is MMR/ranking calculated?',
      answer: 'Your MMR (Matchmaking Rating) is calculated based on your win/loss record, the skill level of your opponents, and your performance consistency. Higher MMR gives you access to more competitive lobbies and exclusive tournaments.',
    },
    {
      question: 'What games are supported?',
      answer: 'We currently support CS2, Valorant, League of Legends, Dota 2, Rocket League, and Apex Legends. We\'re constantly adding new games based on community demand.',
    },
    {
      question: 'Is WannaBet available worldwide?',
      answer: 'WannaBet is available in most countries. However, some regions have restrictions on competitive gaming platforms. Check our Terms of Service for the full list of supported regions.',
    },
  ];

  const popularArticles = [
    { title: 'Complete Guide to Your First Match', views: '12.5k', category: 'Getting Started' },
    { title: 'Understanding Escrow and How It Protects You', views: '9.8k', category: 'Wallet' },
    { title: 'Tournament Strategy: From Amateur to Pro', views: '8.2k', category: 'Tournaments' },
    { title: 'Building a Winning Team', views: '7.1k', category: 'Teams' },
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
          <h1 className="mb-2">Help Center</h1>
          <p className="text-muted-foreground">
            Find answers, guides, and resources to get the most out of WannaBet
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles, guides, and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-input-background"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Popular searches:</span>
            {['escrow', 'withdraw', 'tournament', 'team'].map((term) => (
              <Badge
                key={term}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 hover:border-primary/50"
                onClick={() => setSearchQuery(term)}
              >
                {term}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        {quickLinks.map((link, index) => {
          const IconComponent = link.icon;
          return (
            <Card
              key={link.title}
              className="border-border/50 hover-lift cursor-pointer group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">{link.title}</h3>
                <p className="text-xs text-muted-foreground">{link.category}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Popular Articles */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Popular Articles
          </CardTitle>
          <CardDescription>
            Most viewed help articles this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {popularArticles.map((article, index) => (
              <div
                key={article.title}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {article.category} • {article.views} views
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Browse by Category */}
      <div>
        <h2 className="mb-4">Browse by Category</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card
                key={category.title}
                className="border-border/50 hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <IconComponent className={`h-5 w-5 mr-2 ${category.color}`} />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article, idx) => (
                      <li key={idx}>
                        <a
                          href="#"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center group"
                        >
                          <span className="mr-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          {article}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQs */}
      <Card className="border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-primary" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Quick answers to common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Still Need Help */}
      <Card className="border-primary/50 hover-lift bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle>Still Need Help?</CardTitle>
          <CardDescription>
            Our support team is here to help you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 h-auto py-4">
              <div className="text-left w-full">
                <div className="flex items-center space-x-2 mb-1">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium">Contact Support</span>
                </div>
                <p className="text-xs text-muted-foreground">Get help from our team</p>
              </div>
            </Button>
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 h-auto py-4">
              <div className="text-left w-full">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Community Forum</span>
                </div>
                <p className="text-xs text-muted-foreground">Ask the community</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}