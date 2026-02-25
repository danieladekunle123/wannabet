import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { Search, MessageCircle, Users, Send, MoreVertical, Pin, Star, Hash, User, Phone, Video, ArrowLeft, Smile, Paperclip, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isMe?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'hub';
  lastMessage: string;
  timestamp: string;
  unread: number;
  online?: boolean;
  avatar?: string;
  game?: string;
  pinned?: boolean;
}

export function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const conversations: Conversation[] = [
    {
      id: '1',
      name: 'ProGamer23',
      type: 'direct',
      lastMessage: 'Ready for the Valorant match?',
      timestamp: '2m ago',
      unread: 2,
      online: true,
      pinned: true
    },
    {
      id: '2',
      name: 'Pro Scrims',
      type: 'hub',
      lastMessage: 'TeamLeader: Match starting in 10 mins',
      timestamp: '5m ago',
      unread: 5,
      game: 'Valorant'
    },
    {
      id: '3',
      name: 'Elite Squad',
      type: 'group',
      lastMessage: 'SkillMaster: Tournament brackets are out',
      timestamp: '1h ago',
      unread: 0,
      game: 'CS2'
    },
    {
      id: '4',
      name: 'MidLaneKing',
      type: 'direct',
      lastMessage: 'GG! Great game',
      timestamp: '2h ago',
      unread: 0,
      online: false
    },
    {
      id: '5',
      name: 'Valorant Masters',
      type: 'hub',
      lastMessage: 'AimBot99: New strats video posted',
      timestamp: '3h ago',
      unread: 12,
      game: 'Valorant'
    },
    {
      id: '6',
      name: 'TeamAlpha',
      type: 'group',
      lastMessage: 'You: Thanks for the scrim!',
      timestamp: '1d ago',
      unread: 0,
      game: 'CS2'
    }
  ];

  const messages: Message[] = [
    {
      id: '1',
      sender: 'ProGamer23',
      content: 'Hey! Are you ready for our Valorant match?',
      timestamp: '10:30 AM'
    },
    {
      id: '2',
      sender: 'Me',
      content: 'Yeah, just warming up. What map are we playing?',
      timestamp: '10:31 AM',
      isMe: true
    },
    {
      id: '3',
      sender: 'ProGamer23',
      content: 'Ascent - best of 3 as agreed. Stakes are locked in escrow?',
      timestamp: '10:32 AM'
    },
    {
      id: '4',
      sender: 'Me',
      content: 'Perfect! Yes, $50 locked in. See you in game!',
      timestamp: '10:33 AM',
      isMe: true
    },
    {
      id: '5',
      sender: 'ProGamer23',
      content: 'Ready for the Valorant match?',
      timestamp: '10:35 AM'
    }
  ];

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'direct': return <User className="h-4 w-4" />;
      case 'group': return <Users className="h-4 w-4" />;
      case 'hub': return <Hash className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const selectedChat = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Here you would typically send the message to your backend
      setMessageInput('');
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile View */}
      {!isDesktop && (
      <div className="fixed inset-0 top-0 bottom-16 flex flex-col bg-background overflow-hidden">
        {/* Conversations List - Mobile */}
        <AnimatePresence mode="wait">
          {!showMobileChat && (
            <motion.div
              key="conversation-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col overflow-hidden"
            >
              {/* Header with Glass Effect */}
              <div className="p-4 border-b border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
                <motion.div 
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between mb-4"
                >
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">Messages</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Stay connected with your team</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Badge className="bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
                      {conversations.reduce((sum, c) => sum + c.unread, 0)}
                    </Badge>
                  </motion.div>
                </motion.div>
                
                {/* Search with Animation */}
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                  <Input 
                    placeholder="Search conversations..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-muted/30 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all duration-300 focus:shadow-lg focus:shadow-primary/5"
                  />
                </motion.div>
              </div>

              {/* Conversations List with Staggered Animation */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredConversations.map((conversation, index) => (
                    <motion.div 
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.3 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={selectedConversation === conversation.id ? "secondary" : "ghost"}
                          className={`w-full h-auto p-3 justify-start transition-all duration-300 relative overflow-hidden group ${
                            selectedConversation === conversation.id 
                              ? 'bg-primary/10 border border-primary/30 shadow-lg shadow-primary/5' 
                              : 'hover:bg-muted/50 hover:border-border'
                          }`}
                          onClick={() => handleConversationClick(conversation.id)}
                        >
                          {/* Animated Background Glow */}
                          {selectedConversation === conversation.id && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                          )}

                          <div className="flex items-start space-x-3 w-full relative z-10">
                            <div className="relative">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <Avatar className="h-12 w-12 border-2 border-primary/20">
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {conversation.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              </motion.div>
                              {conversation.online && (
                                <motion.div 
                                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-background shadow-lg"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                  {getConversationIcon(conversation.type)}
                                  <span className="font-semibold truncate">{conversation.name}</span>
                                  {conversation.pinned && (
                                    <motion.div
                                      animate={{ rotate: [0, -15, 0] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    >
                                      <Pin className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                                    </motion.div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                  {conversation.unread > 0 && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                    >
                                      <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center shadow-lg shadow-primary/30">
                                        {conversation.unread > 9 ? '9+' : conversation.unread}
                                      </Badge>
                                    </motion.div>
                                  )}
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{conversation.timestamp}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-1 gap-2">
                                <p className="text-sm text-muted-foreground truncate flex-1">
                                  {conversation.lastMessage}
                                </p>
                                {conversation.game && (
                                  <Badge variant="secondary" className="text-xs flex-shrink-0 bg-muted/50 backdrop-blur-sm">
                                    {conversation.game}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}

          {/* Chat View - Mobile */}
          {showMobileChat && selectedChat && (
            <motion.div
              key="chat-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 top-0 bottom-16 flex flex-col overflow-hidden bg-background z-20"
            >
              {/* Chat Header with Glass Effect */}
              <div className="p-4 border-b border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBackToList}
                        className="hover:bg-muted/50 transition-all duration-300 hover:rotate-[-5deg]"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Avatar className="h-11 w-11 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {selectedChat.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getConversationIcon(selectedChat.type)}
                        <h3 className="font-semibold text-foreground truncate">{selectedChat.name}</h3>
                        {selectedChat.online && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs backdrop-blur-sm">
                              Online
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                      {selectedChat.game && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-muted-foreground"
                        >
                          Playing {selectedChat.game}
                        </motion.p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {selectedChat.type === 'direct' && (
                      <>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                            <Video className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </>
                    )}
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4 pb-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                        className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.isMe ? 'order-2' : 'order-1'}`}>
                          {!message.isMe && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 + 0.1 }}
                              className="flex items-center space-x-2 mb-1.5"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {message.sender.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-foreground">{message.sender}</span>
                              <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                            </motion.div>
                          )}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`rounded-2xl px-4 py-2.5 transition-all duration-300 backdrop-blur-sm ${
                              message.isMe 
                                ? 'bg-primary text-primary-foreground ml-auto shadow-lg shadow-primary/20' 
                                : 'bg-muted/70 text-foreground shadow-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            {message.isMe && (
                              <p className="text-xs opacity-75 mt-1.5 text-right">{message.timestamp}</p>
                            )}
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted/70 rounded-2xl px-4 py-3 shadow-md">
                        <div className="flex space-x-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input - Mobile with Enhanced Styling */}
              <div className="p-4 border-t border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-xl">
                <div className="flex items-center space-x-2">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder={`Message ${selectedChat.name}...`}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-muted/30 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all duration-300 focus:shadow-lg focus:shadow-primary/5 pr-10"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Smile className="h-4 w-4" />
                    </motion.button>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:shadow-none"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* Desktop View */}
      {isDesktop && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed top-16 bottom-0 left-0 right-0 lg:left-64 flex flex-col bg-background"
      >
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          {/* Conversations Sidebar */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40} className="border-r border-border/50 flex flex-col min-h-0">
            {/* Header with Glass Effect */}
            <div className="p-4 border-b border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
              <motion.div 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between mb-4"
              >
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Messages</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Stay connected with your team</p>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <Badge className="bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
                    {conversations.reduce((sum, c) => sum + c.unread, 0)}
                  </Badge>
                </motion.div>
              </motion.div>
              
              {/* Search with Animation */}
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                <Input 
                  placeholder="Search conversations..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/30 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all duration-300 focus:shadow-lg focus:shadow-primary/5"
                />
              </motion.div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-2 space-y-1">
                {filteredConversations.map((conversation, index) => (
                  <motion.div 
                    key={conversation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={selectedConversation === conversation.id ? "secondary" : "ghost"}
                        className={`w-full h-auto p-3 justify-start transition-all duration-300 relative overflow-hidden group ${
                          selectedConversation === conversation.id 
                            ? 'bg-primary/10 border border-primary/30 shadow-lg shadow-primary/5' 
                            : 'hover:bg-muted/50 hover:border-border'
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        {/* Animated Background Glow */}
                        {selectedConversation === conversation.id && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                        )}

                        <div className="flex items-start space-x-3 w-full relative z-10">
                          <div className="relative">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <Avatar className="h-12 w-12 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {conversation.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>
                            {conversation.online && (
                              <motion.div 
                                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-background shadow-lg"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                {getConversationIcon(conversation.type)}
                                <span className="font-semibold truncate">{conversation.name}</span>
                                {conversation.pinned && (
                                  <motion.div
                                    animate={{ rotate: [0, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <Pin className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                                  </motion.div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                {conversation.unread > 0 && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center shadow-lg shadow-primary/30">
                                      {conversation.unread > 9 ? '9+' : conversation.unread}
                                    </Badge>
                                  </motion.div>
                                )}
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{conversation.timestamp}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1 gap-2">
                              <p className="text-sm text-muted-foreground truncate flex-1">
                                {conversation.lastMessage}
                              </p>
                              {conversation.game && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0 bg-muted/50 backdrop-blur-sm">
                                  {conversation.game}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="hover:bg-primary/20 transition-colors" />

          {/* Chat Area */}
          <ResizablePanel defaultSize={70} className="flex flex-col min-h-0">
            {selectedChat ? (
              <>
                {/* Chat Header with Glass Effect */}
                <div className="p-4 border-b border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {selectedChat.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {getConversationIcon(selectedChat.type)}
                          <h3 className="font-semibold text-foreground truncate">{selectedChat.name}</h3>
                          {selectedChat.online && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs backdrop-blur-sm">
                                Online
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                        {selectedChat.game && (
                          <motion.p 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-muted-foreground"
                          >
                            Playing {selectedChat.game}
                          </motion.p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {selectedChat.type === 'direct' && (
                        <>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                              <Video className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </>
                      )}
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button variant="ghost" size="icon" className="hover:bg-muted/50 hover:text-primary transition-all duration-300">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                          className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-md lg:max-w-lg ${message.isMe ? 'order-2' : 'order-1'}`}>
                            {!message.isMe && (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 + 0.1 }}
                                className="flex items-center space-x-2 mb-1.5"
                              >
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {message.sender.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-foreground">{message.sender}</span>
                                <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                              </motion.div>
                            )}
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className={`rounded-2xl px-4 py-3 transition-all duration-300 backdrop-blur-sm ${
                                message.isMe 
                                  ? 'bg-primary text-primary-foreground ml-auto shadow-lg shadow-primary/20' 
                                  : 'bg-muted/70 text-foreground shadow-md'
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              {message.isMe && (
                                <p className="text-xs opacity-75 mt-1.5 text-right">{message.timestamp}</p>
                              )}
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex justify-start"
                      >
                        <div className="bg-muted/70 rounded-2xl px-4 py-3 shadow-md">
                          <div className="flex space-x-1.5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Message Input - Desktop with Enhanced Styling */}
                <div className="p-4 border-t border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-xl">
                  <div className="max-w-4xl mx-auto flex items-center space-x-2">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    
                    <div className="flex-1 relative">
                      <Input
                        placeholder={`Message ${selectedChat.name}...`}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="bg-muted/30 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all duration-300 focus:shadow-lg focus:shadow-primary/5 pr-10"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Smile className="h-4 w-4" />
                      </motion.button>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:shadow-none"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <MessageCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the sidebar to start chatting</p>
                </motion.div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </motion.div>
      )}
    </>
  );
}
