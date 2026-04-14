import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, Target, Sparkles } from 'lucide-react';

interface LoadingPageProps {
  message?: string;
  messages?: string[];
  autoRotate?: boolean;
  duration?: number;
}

export function LoadingPage({ 
  message = 'Loading...', 
  messages = [],
  autoRotate = false,
  duration = 2000 
}: LoadingPageProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (autoRotate && messages.length > 0) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      }, duration);

      return () => clearInterval(interval);
    }
  }, [autoRotate, messages.length, duration]);

  const displayMessage = messages.length > 0 ? messages[currentMessageIndex] : message;

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '50%', left: '50%' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        {/* Logo/Spinner Container */}
        <div className="relative w-32 h-32">
          {/* Outer Ring */}
          <motion.div
            className="absolute inset-0 w-32 h-32 rounded-full border-4 border-primary/30"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              borderTopColor: 'var(--primary)',
              borderRightColor: 'transparent',
            }}
          />

          {/* Middle Ring */}
          <motion.div
            className="absolute inset-2 w-28 h-28 rounded-full border-4 border-purple-500/30"
            animate={{ rotate: -360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              borderBottomColor: '#A855F7',
              borderLeftColor: 'transparent',
            }}
          />

          {/* Inner Ring */}
          <motion.div
            className="absolute inset-4 w-24 h-24 rounded-full border-4 border-blue-500/30"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              borderTopColor: '#3B82F6',
              borderRightColor: 'transparent',
            }}
          />

          {/* Center Logo/Icon */}
          <div className="absolute inset-0 w-32 h-32 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary via-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/50">
                <motion.div
                  animate={{
                    rotate: [0, -180, -360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Zap className="h-8 w-8 text-white" fill="currentColor" />
                </motion.div>
              </div>
              
              {/* Orbiting Particles */}
              {[0, 120, 240].map((angle, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary rounded-full"
                  animate={{
                    rotate: [angle, angle + 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.2
                  }}
                  style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: '0 0',
                    x: 40 * Math.cos((angle * Math.PI) / 180),
                    y: 40 * Math.sin((angle * Math.PI) / 180),
                  }}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Brand Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
            WannaBet?
          </h1>
        </motion.div>

        {/* Loading Message Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="relative bg-card/50 backdrop-blur-sm border border-primary/30 rounded-lg p-6 shadow-lg">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer rounded-lg" />
            
            {/* Message Content */}
            <div className="relative space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="h-5 w-5" />
                </motion.div>
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Loading
                </span>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2
                  }}
                >
                  <Sparkles className="h-5 w-5" />
                </motion.div>
              </div>

              {/* Animated Message Text */}
              <div className="min-h-[60px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={displayMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center text-base text-foreground font-medium"
                  >
                    {displayMessage}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Loading Progress Dots */}
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute text-primary/20"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ top: '20%', left: '15%' }}
          >
            <Trophy className="h-12 w-12" />
          </motion.div>

          <motion.div
            className="absolute text-purple-500/20"
            animate={{
              y: [0, 20, 0],
              x: [0, -10, 0],
              rotate: [0, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            style={{ bottom: '20%', right: '15%' }}
          >
            <Target className="h-12 w-12" />
          </motion.div>

          <motion.div
            className="absolute text-blue-500/20"
            animate={{
              y: [0, -15, 0],
              x: [0, -15, 0],
              rotate: [0, 15, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            style={{ top: '60%', left: '10%' }}
          >
            <Zap className="h-10 w-10" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
