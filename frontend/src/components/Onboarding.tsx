import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Swords,
  DollarSign,
  Users,
  Wallet,
  Target,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Shield,
  TrendingUp,
  Zap,
  Star,
  CheckCircle2
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for previous

  const steps = [
    {
      title: "Welcome to WannaBet!",
      subtitle: "Your Premier Esports Wagering Platform",
      description: "Get ready to Play. Wager. Win. Let's take a quick tour of everything you can do on WannaBet.",
      icon: Sparkles,
      color: "text-primary",
      bgColor: "bg-primary/10",
      features: [
        "Compete in real-money matches",
        "Join tournaments with guaranteed prizes",
        "Build your gaming reputation",
        "Secure escrow protection"
      ]
    },
    {
      title: "Open Lobbies",
      subtitle: "Quick Competitive Matches",
      description: "Browse available matches, choose your stake level, and compete against players worldwide in 1v1 or team matches.",
      icon: Target,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      features: [
        "Filter by game, region, and stake amount",
        "Check host trust scores before joining",
        "Instant match-making",
        "Multiple game modes available"
      ]
    },
    {
      title: "Tournaments",
      subtitle: "Structured Competitions",
      description: "Enter multi-round tournaments with guaranteed prize pools. Compete in brackets for bigger rewards and bragging rights.",
      icon: Trophy,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      features: [
        "Guaranteed prize pools",
        "Single & Double Elimination formats",
        "Track your bracket progression",
        "Higher placements = bigger rewards"
      ]
    },
    {
      title: "Practice Scrims",
      subtitle: "Improve Your Skills",
      description: "Practice matches with optional stakes and MMR requirements. Perfect for warming up or testing new strategies.",
      icon: Swords,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      features: [
        "Low or no-stake practice matches",
        "MMR gates for balanced gameplay",
        "Team coordination practice",
        "Safe environment to improve"
      ]
    },
    {
      title: "Wagers & Challenges",
      subtitle: "Direct Player Challenges",
      description: "Create or accept direct wager challenges. All funds are held in secure escrow until matches are verified.",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
      features: [
        "Secure escrow protection",
        "Create custom challenges",
        "Fair dispute resolution system",
        "Track all your wager history"
      ]
    },
    {
      title: "Social Hubs & Teams",
      subtitle: "Build Your Community",
      description: "Join gaming communities, create teams, and find consistent teammates for tournaments and team matches.",
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      features: [
        "Join game-specific communities",
        "Create or join competitive teams",
        "Find reliable teammates",
        "Team tournaments and scrims"
      ]
    },
    {
      title: "Wallet & Escrow",
      subtitle: "Secure Fund Management",
      description: "Your funds are protected with our escrow system. Deposit, withdraw, and track all your gaming transactions safely.",
      icon: Wallet,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      features: [
        "Secure escrow holds match funds",
        "Easy deposits & withdrawals",
        "Complete transaction history",
        "Funds released after verification"
      ]
    },
    {
      title: "You're All Set!",
      subtitle: "Start Playing Now",
      description: "You're ready to start competing! Browse lobbies, join tournaments, or create your first wager challenge.",
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      features: [
        "Start with smaller stakes to build reputation",
        "Check trust scores before joining matches",
        "Use practice scrims to warm up",
        "Join social hubs to find teammates"
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (isLastStep) {
          onComplete();
        } else {
          setDirection(1);
          setCurrentStep(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep > 0) {
          setDirection(-1);
          setCurrentStep(prev => prev - 1);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isLastStep, onComplete, onSkip]);

  // Animation variants for page transitions
  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
      rotateY: direction < 0 ? 15 : -15,
    }),
  };

  const pageTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  };

  // Animation variants for icon
  const iconVariants = {
    enter: { scale: 0, rotate: -180, opacity: 0 },
    center: { 
      scale: 1, 
      rotate: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      }
    },
    exit: { scale: 0, rotate: 180, opacity: 0 },
  };

  // Animation variants for features list
  const listContainerVariants = {
    enter: { opacity: 0 },
    center: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
    exit: { opacity: 0 },
  };

  const listItemVariants = {
    enter: { 
      x: -30, 
      opacity: 0,
      scale: 0.9,
    },
    center: { 
      x: 0, 
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      }
    },
    exit: { 
      x: -30, 
      opacity: 0,
      scale: 0.9,
    },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="gradient-blobs">
        <div className="gradient-blob gradient-blob-1" />
        <div className="gradient-blob gradient-blob-2" />
        <div className="gradient-blob gradient-blob-3" />
      </div>
      <div className="grid-overlay" />

      {/* Close/Skip Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onSkip}
        className="absolute top-4 right-4 z-20 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Main Onboarding Card */}
      <Card className="w-full max-w-3xl border-primary/30 shadow-2xl relative z-10 overflow-hidden">
        <CardContent className="p-8 md:p-12">
          {/* Progress Bar */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <motion.span 
                className="text-sm text-muted-foreground font-medium"
                key={currentStep}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                Step {currentStep + 1} of {steps.length}
              </motion.span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Skip Tour
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </motion.div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="perspective-1000"
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <motion.div 
                  className={`w-20 h-20 rounded-full ${currentStepData.bgColor} flex items-center justify-center`}
                  variants={iconVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <IconComponent className={`h-10 w-10 ${currentStepData.color}`} />
                </motion.div>
              </div>

              {/* Content */}
              <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
                  {currentStepData.title}
                </h2>
                <p className="text-primary font-medium mb-4">
                  {currentStepData.subtitle}
                </p>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {currentStepData.description}
                </p>
              </motion.div>

              {/* Features List */}
              <motion.div 
                className="grid gap-3 mb-8 max-w-2xl mx-auto"
                variants={listContainerVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {currentStepData.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={listItemVariants}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300"
                    whileHover={{ 
                      scale: 1.02, 
                      x: 5,
                      transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div 
            className="flex items-center justify-between gap-4 pt-4 border-t border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="gap-2 md:px-4 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden md:inline">Previous</span>
              </Button>
            </motion.div>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full ${
                    index === currentStep
                      ? 'bg-primary'
                      : index < currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted-foreground/20'
                  }`}
                  initial={false}
                  animate={{
                    width: index === currentStep ? 32 : 8,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              ))}
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleNext}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 md:px-4 px-3"
              >
                {isLastStep ? (
                  <>
                    <span className="hidden md:inline">Get Started</span>
                    <motion.div
                      animate={{ 
                        rotate: [0, -10, 10, -10, 0],
                      }}
                      transition={{ 
                        duration: 0.5,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    >
                      <Zap className="h-4 w-4" />
                    </motion.div>
                  </>
                ) : (
                  <>
                    <span className="hidden md:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>

          {/* Additional Info for First Step */}
          <AnimatePresence mode="wait">
            {isFirstStep && (
              <motion.div 
                className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg overflow-hidden"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-foreground font-medium mb-1">Your Security Matters</p>
                    <p className="text-muted-foreground">
                      All wagers are protected by secure escrow. We never store PII or sensitive data on this platform.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Additional Info for Last Step */}
            {isLastStep && (
              <motion.div 
                className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg overflow-hidden"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ 
                      rotate: [0, -5, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  >
                    <Star className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  </motion.div>
                  <div className="text-sm">
                    <p className="text-foreground font-medium mb-1">Build Your Trust Score</p>
                    <p className="text-muted-foreground">
                      Complete matches, play fair, and build your reputation. Higher trust scores unlock better opportunities!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Keyboard Navigation Hint */}
      <motion.div 
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 hidden md:block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <motion.div 
          className="flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50"
          whileHover={{ scale: 1.05 }}
        >
          <kbd className="px-2 py-1 bg-muted rounded text-foreground">←</kbd>
          <span>Previous</span>
          <span className="text-border">|</span>
          <kbd className="px-2 py-1 bg-muted rounded text-foreground">→</kbd>
          <span>Next</span>
          <span className="text-border">|</span>
          <kbd className="px-2 py-1 bg-muted rounded text-foreground">Esc</kbd>
          <span>Skip</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
