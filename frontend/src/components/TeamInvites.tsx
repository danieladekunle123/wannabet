import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import {
  Users,
  Check,
  X,
  Clock,
  Trophy,
  Target,
  ChevronRight,
  Mail,
  Shield,
  Star,
  Calendar,
  UserPlus,
  Inbox
} from 'lucide-react';

interface TeamInvite {
  id: string;
  teamName: string;
  teamLogo?: string;
  teamTag: string;
  invitedBy: string;
  inviterAvatar?: string;
  inviterRole: string;
  teamSize: number;
  maxSize: number;
  wins: number;
  losses: number;
  trustScore: number;
  primaryGame: string;
  inviteDate: string;
  message?: string;
  teamRank?: string;
}

interface TeamInvitesProps {
  onNavigateToTeam?: (teamId: string) => void;
}

export function TeamInvites({ onNavigateToTeam }: TeamInvitesProps) {
  const [invites, setInvites] = useState<TeamInvite[]>([
    {
      id: 'invite-1',
      teamName: 'Apex Predators',
      teamTag: 'APEX',
      invitedBy: 'CommanderZero',
      inviterRole: 'Team Captain',
      teamSize: 8,
      maxSize: 10,
      wins: 47,
      losses: 12,
      trustScore: 98,
      primaryGame: 'Valorant',
      inviteDate: '2 hours ago',
      teamRank: 'Diamond',
      message: "We've been watching your gameplay and think you'd be a great fit for our competitive roster. We practice Monday-Friday 7-10 PM EST."
    },
    {
      id: 'invite-2',
      teamName: 'Shadow Wolves',
      teamTag: 'SHDW',
      invitedBy: 'NightHawk',
      inviterRole: 'Recruiter',
      teamSize: 12,
      maxSize: 15,
      wins: 89,
      losses: 34,
      trustScore: 95,
      primaryGame: 'CS2',
      inviteDate: '5 hours ago',
      teamRank: 'Platinum',
    },
    {
      id: 'invite-3',
      teamName: 'Crimson Strike',
      teamTag: 'CRMN',
      invitedBy: 'BlazeFury',
      inviterRole: 'Team Manager',
      teamSize: 6,
      maxSize: 8,
      wins: 124,
      losses: 56,
      trustScore: 92,
      primaryGame: 'Overwatch 2',
      inviteDate: '1 day ago',
      teamRank: 'Gold',
      message: "Looking for dedicated players for our tournament squad. Great team chemistry and active Discord!"
    },
  ]);

  const [processingInvite, setProcessingInvite] = useState<string | null>(null);

  const handleAccept = async (invite: TeamInvite) => {
    setProcessingInvite(invite.id);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setInvites(prev => prev.filter(i => i.id !== invite.id));
    setProcessingInvite(null);
    
    toast.success(`Welcome to ${invite.teamName}!`, {
      description: `You've successfully joined ${invite.teamTag}. Check your team page for details.`,
      action: {
        label: 'View Team',
        onClick: () => onNavigateToTeam?.(invite.id),
      },
    });

    // Navigate to team page after a short delay
    setTimeout(() => {
      onNavigateToTeam?.(invite.id);
    }, 1500);
  };

  const handleDecline = async (invite: TeamInvite) => {
    setProcessingInvite(invite.id);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setInvites(prev => prev.filter(i => i.id !== invite.id));
    setProcessingInvite(null);
    
    toast.info(`Invite declined`, {
      description: `You declined the invitation from ${invite.teamName}.`,
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      }
    },
    exit: { 
      opacity: 0, 
      x: -100,
      scale: 0.9,
      transition: {
        duration: 0.3,
      }
    },
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
              Team Invitations
            </h1>
            <p className="text-sm text-muted-foreground">
              {invites.length === 0 
                ? "No pending invitations" 
                : `${invites.length} pending ${invites.length === 1 ? 'invitation' : 'invitations'}`
              }
            </p>
          </div>
        </div>
      </motion.div>

      {/* Invites List */}
      <AnimatePresence mode="popLayout">
        {invites.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4"
                >
                  <Inbox className="h-10 w-10 text-muted-foreground" />
                </motion.div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Pending Invitations
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                  You don't have any team invitations at the moment. Explore Social Hubs to discover teams!
                </p>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Browse Teams
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {invites.map((invite) => (
              <motion.div
                key={invite.id}
                variants={itemVariants}
                exit="exit"
                layout
              >
                <Card className="border-border/50 hover:border-primary/30 transition-colors overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
                      {/* Left: Team Info */}
                      <div className="flex-1 space-y-4">
                        {/* Team Header */}
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {invite.teamTag}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="font-semibold text-foreground text-lg">
                                  {invite.teamName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  [{invite.teamTag}]
                                </p>
                              </div>
                              {invite.teamRank && (
                                <Badge variant="outline" className="shrink-0">
                                  {invite.teamRank}
                                </Badge>
                              )}
                            </div>

                            {/* Inviter Info */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserPlus className="h-4 w-4" />
                              <span>Invited by <span className="text-foreground font-medium">{invite.invitedBy}</span></span>
                              <span className="text-border">•</span>
                              <span>{invite.inviterRole}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Clock className="h-4 w-4" />
                              <span>{invite.inviteDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Team Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Users className="h-3.5 w-3.5" />
                              <span>Members</span>
                            </div>
                            <p className="font-semibold text-foreground">
                              {invite.teamSize}/{invite.maxSize}
                            </p>
                          </div>

                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Trophy className="h-3.5 w-3.5" />
                              <span>Record</span>
                            </div>
                            <p className="font-semibold text-foreground">
                              {invite.wins}W-{invite.losses}L
                            </p>
                          </div>

                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Shield className="h-3.5 w-3.5" />
                              <span>Trust Score</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <p className="font-semibold text-emerald-500">
                                {invite.trustScore}%
                              </p>
                              {invite.trustScore >= 95 && (
                                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              )}
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Target className="h-3.5 w-3.5" />
                              <span>Game</span>
                            </div>
                            <p className="font-semibold text-foreground truncate">
                              {invite.primaryGame}
                            </p>
                          </div>
                        </div>

                        {/* Invite Message */}
                        {invite.message && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ delay: 0.2 }}
                            className="bg-primary/5 border border-primary/20 rounded-lg p-4"
                          >
                            <p className="text-sm text-muted-foreground italic">
                              "{invite.message}"
                            </p>
                          </motion.div>
                        )}
                      </div>

                      {/* Right: Action Buttons */}
                      <Separator className="lg:hidden" />
                      
                      <div className="flex lg:flex-col gap-3 lg:w-[200px] justify-center lg:pt-8 lg:gap-4">
                        <motion.div
                          className="flex-1 lg:flex-none"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={() => handleAccept(invite)}
                            disabled={processingInvite === invite.id}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12"
                          >
                            {processingInvite === invite.id ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Check className="h-4 w-4" />
                              </motion.div>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                <span>Accept</span>
                              </>
                            )}
                          </Button>
                        </motion.div>

                        <motion.div
                          className="flex-1 lg:flex-none"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={() => handleDecline(invite)}
                            disabled={processingInvite === invite.id}
                            variant="outline"
                            className="w-full gap-2 h-12 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          >
                            {processingInvite === invite.id ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <X className="h-4 w-4" />
                              </motion.div>
                            ) : (
                              <>
                                <X className="h-4 w-4" />
                                <span>Decline</span>
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Banner */}
      {invites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6"
        >
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="text-foreground font-medium">
                    Review Before Joining
                  </p>
                  <p className="text-muted-foreground">
                    Check team stats, trust scores, and requirements before accepting invitations. You can always leave a team later if it's not the right fit.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
