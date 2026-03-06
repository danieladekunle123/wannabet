import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Smile, 
  Paperclip, 
  Image as ImageIcon,
  Pin,
  Search,
  AlertCircle,
  Check,
  CheckCheck,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface UserProfile {
  id: string;
  username: string;
  status: 'online' | 'offline' | 'away';
  game?: string;
  trustScore: number;
}

export function IndividualDMs() {
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hey! Are you ready for our Valorant match?',
      timestamp: '10:30 AM',
      isMe: false,
      status: 'read'
    },
    {
      id: '2',
      content: 'Yeah, just warming up. What map are we playing?',
      timestamp: '10:31 AM',
      isMe: true,
      status: 'read'
    },
    {
      id: '3',
      content: 'Ascent - best of 3 as agreed. Stakes are locked in escrow?',
      timestamp: '10:32 AM',
      isMe: false,
      status: 'read'
    },
    {
      id: '4',
      content: 'Perfect! Yes, $50 locked in. See you in game!',
      timestamp: '10:33 AM',
      isMe: true,
      status: 'read'
    },
    {
      id: '5',
      content: 'Sounds good! Let me know when you\'re in the lobby.',
      timestamp: '10:34 AM',
      isMe: false,
      status: 'read'
    },
    {
      id: '6',
      content: 'Will do! Loading in now.',
      timestamp: '10:35 AM',
      isMe: true,
      status: 'delivered'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock user profile
  const otherUser: UserProfile = {
    id: '1',
    username: 'ProGamer23',
    status: 'online',
    game: 'Valorant',
    trustScore: 98.5
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (messageInput.length > 0) {
      const timer = setTimeout(() => {
        setIsTyping(Math.random() > 0.7); // Randomly show typing indicator
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messageInput]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageInput,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        isMe: true,
        status: 'sent'
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');

      // Simulate message delivery
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        ));
      }, 500);

      // Simulate message read
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'read' } : msg
        ));
      }, 2000);

      // Simulate response (demo purposes)
      if (Math.random() > 0.5) {
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            const responses = [
              'Got it!',
              'Sure thing!',
              'Sounds good to me',
              'Let\'s do this!',
              'Ready when you are'
            ];
            const responseMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: responses[Math.floor(Math.random() * responses.length)],
              timestamp: new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }),
              isMe: false,
              status: 'read'
            };
            setMessages(prev => [...prev, responseMessage]);
            setIsTyping(false);
          }, 2000);
        }, 1000);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-400';
      case 'away': return 'bg-amber-400';
      default: return 'bg-muted-foreground';
    }
  };

  const getMessageStatusIcon = (status?: 'sent' | 'delivered' | 'read') => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 top-16 bottom-0 lg:left-64 flex flex-col bg-background overflow-hidden">
      {/* Header with Glass Effect */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 border-b border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                className="hover:bg-muted/50 transition-all duration-300 hover:rotate-[-5deg]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {otherUser.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <motion.div 
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${getStatusColor(otherUser.status)} rounded-full border-2 border-background shadow-lg`}
                animate={{ scale: otherUser.status === 'online' ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-lg truncate">{otherUser.username}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {otherUser.status === 'online' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                      Online
                    </Badge>
                  </motion.div>
                )}
                {otherUser.game && (
                  <span className="text-xs text-muted-foreground">
                    Playing {otherUser.game}
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  {otherUser.trustScore}% Trust
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                <Search className="h-5 w-5" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                <Phone className="h-5 w-5" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                <Video className="h-5 w-5" />
              </Button>
            </motion.div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-primary/30">
                <DropdownMenuItem className="cursor-pointer">
                  <Info className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Pin className="h-4 w-4 mr-2" />
                  Pin Conversation
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Search className="h-4 w-4 mr-2" />
                  Search in Conversation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-400 focus:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {/* Date Separator */}
          <div className="flex items-center justify-center my-6">
            <div className="bg-muted/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-muted-foreground">
              Today
            </div>
          </div>

          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.03, type: "spring", stiffness: 200 }}
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${message.isMe ? 'order-2' : 'order-1'}`}>
                  {!message.isMe && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 + 0.1 }}
                      className="flex items-center space-x-2 mb-1.5 ml-1"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {otherUser.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{otherUser.username}</span>
                    </motion.div>
                  )}
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`group relative rounded-2xl px-4 py-3 transition-all duration-300 backdrop-blur-sm ${
                      message.isMe 
                        ? 'bg-primary text-primary-foreground ml-auto shadow-lg shadow-primary/20' 
                        : 'bg-muted/70 text-foreground shadow-md'
                    }`}>
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    
                    <div className={`flex items-center gap-1.5 mt-1.5 ${message.isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-xs ${message.isMe ? 'opacity-75' : 'text-muted-foreground'}`}>
                        {message.timestamp}
                      </span>
                      {message.isMe && getMessageStatusIcon(message.status)}
                    </div>

                    {/* Hover tooltip for timestamp */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-card border border-primary/30 rounded-lg text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                      {message.timestamp}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-2">
                  <Avatar className="h-6 w-6 mt-2">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {otherUser.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/70 rounded-2xl px-5 py-3.5 shadow-md">
                    <div className="flex space-x-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input - Enhanced Discord-like Style */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 border-t border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-xl"
      >
        <div className="max-w-4xl mx-auto">
          <Card className="bg-muted/30 backdrop-blur-sm border-border/50 shadow-lg">
            <div className="p-3">
              <div className="flex items-end gap-3">
                {/* Attachment Button */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="hover:bg-muted/50 hover:text-primary transition-all duration-300 rounded-full"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </motion.div>
                
                {/* Message Input Field */}
                <div className="flex-1 relative">
                  <Input
                    placeholder={`Message ${otherUser.username}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-background/50 border-0 focus:ring-2 focus:ring-primary/30 transition-all duration-300 pr-20 min-h-[44px] resize-none"
                    style={{ paddingTop: '12px', paddingBottom: '12px' }}
                  />
                  
                  {/* Emoji & Image Buttons Inside Input */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-full hover:bg-muted/50"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-full hover:bg-muted/50"
                    >
                      <Smile className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                
                {/* Send Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    size="icon"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:shadow-none rounded-full h-11 w-11"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>

              {/* Character Count & Tips */}
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="text-xs text-muted-foreground">
                  {messageInput.length > 0 && (
                    <span className={messageInput.length > 500 ? 'text-amber-400' : ''}>
                      {messageInput.length}/1000
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
