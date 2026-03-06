import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import {
  Search,
  MessageCircle,
  Users,
  Send,
  MoreVertical,
  Pin,
  Star,
  Hash,
  User,
  Phone,
  Video,
  ArrowLeft,
  Smile,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "./ui/context-menu";

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
  type: "direct" | "group" | "hub";
  lastMessage: string;
  timestamp: string;
  unread: number;
  online?: boolean;
  avatar?: string;
  game?: string;
  pinned?: boolean;
}

interface MessagesProps {
  initialConversationId?: string | undefined;
  onInitialConsumed?: () => void;
}

export function Messages({
  initialConversationId,
  onInitialConsumed,
}: MessagesProps) {
  const { user, token } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string>("");
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [messagesState, setMessagesState] = useState<Message[]>([]);
  const prevConversationRef = useRef<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  useEffect(() => {
    // connect socket with token auth
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const authToken = token || localStorage.getItem("token");
    socketRef.current = io(apiUrl, {
      auth: { token: authToken },
      withCredentials: true,
    });

    const s = socketRef.current;
    s.on("connect", () => console.log("socket connected", s.id));
    s.on("message", (msg: any) => {
      // map incoming server message to local Message shape
      try {
        const mapped: Message = {
          id: msg.id,
          sender: msg.senderId || msg.sender || "unknown",
          content: msg.content || msg.text || msg.message?.content || "",
          timestamp: msg.createdAt || new Date().toISOString(),
          isMe: msg.senderId === user?.id,
        };
        setMessagesState((prev) => {
          // if this is our own sent message, try to replace any temp optimistic message
          if (mapped.isMe) {
            const idx = prev.findIndex(
              (m) => m.isMe && m.content === mapped.content,
            );
            if (idx !== -1) {
              const copy = [...prev];
              copy[idx] = mapped;
              return copy;
            }
          }
          return [...prev, mapped];
        });
      } catch (e) {
        console.log("failed mapping incoming message", e, msg);
      }
    });
    s.on("message:update", (msg: any) => {
      setMessagesState((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, content: msg.content } : m)),
      );
    });
    s.on("message:delete", ({ id }: any) => {
      setMessagesState((prev) => prev.filter((m) => m.id !== id));
    });

    return () => {
      s.disconnect();
    };
  }, [token, user?.id]);

  // track desktop breakpoint
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const [conversationsState, setConversationsState] = useState<Conversation[]>(
    [],
  );

  // load real conversations from backend for this user
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;
    fetch(`${apiUrl}/messages/conversations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const items = (data.data || []).map((c: any) => ({
          id:
            c.id ??
            c.channelId ??
            c.conversationId ??
            (c.type === "dm" && c.members ? `dm:${c.members.join(":")}` : ""),
          name:
            c.name ??
            c.displayName ??
            (c.type === "dm" && c.members
              ? c.members
                  .filter((m: string) => m !== (user?.username || user?.id))
                  .join(", ")
              : "Conversation"),
          type:
            c.type === "hub" ? "hub" : c.type === "group" ? "group" : "direct",
          lastMessage: c.lastMessage ?? c.last_message ?? c.preview ?? "",
          timestamp: c.updatedAt ?? c.lastMessageAt ?? c.createdAt ?? "",
          unread: c.unread ?? 0,
          online: c.online ?? false,
          avatar: c.avatarUrl ?? undefined,
          game: c.game,
          pinned: c.pinned ?? false,
        }));
        setConversationsState(items);
      })
      .catch((err) => console.error("failed loading conversations", err));
  }, [token, user?.id]);

  // load friends for current user and show them at top of sidebar
  const [friendsList, setFriendsList] = useState<any[]>([]);
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;
    fetch(`${apiUrl}/users/me/friends`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then((r) => r.json())
      .then((d) => setFriendsList(d.friends || []))
      .catch((e) => console.error('failed loading friends', e));
  }, [token]);

  // removed mock messages; real messages are loaded into `messagesState` via `handleConversationClick`

  const getConversationIcon = (type: string) => {
    switch (type) {
      case "direct":
        return <User className="h-4 w-4" />;
      case "group":
        return <Users className="h-4 w-4" />;
      case "hub":
        return <Hash className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const selectedChat = conversationsState.find(
    (c) => c.id === selectedConversation,
  );
  const activeConversation = selectedConversation
    ? (selectedChat ?? {
        id: selectedConversation,
        name: selectedConversation.startsWith("dm:")
          ? selectedConversation
              .replace(/^dm:/, "")
              .split(":")
              .filter(Boolean)
              .join(", ")
          : selectedConversation || "Conversation",
        type: selectedConversation.startsWith("dm:") ? "direct" : "group",
        lastMessage: "",
        timestamp: "",
        unread: 0,
      })
    : null;

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const authToken = token || localStorage.getItem("token");
    const content = messageInput.trim();
    // optimistic UI: append temp message immediately
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      sender: user?.username || "Me",
      content,
      timestamp: new Date().toISOString(),
      isMe: true,
    };
    setMessagesState((prev) => [...prev, tempMessage]);

    // persist message via API; server will broadcast saved message
    const body: any = { conversationId: selectedConversation, content };
    if (replyingToId && !replyingToId.startsWith("temp-"))
      body.replyToId = replyingToId;

    fetch(`${apiUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    }).catch((err) => {
      console.error("send message error", err);
      // on error, remove optimistic message
      setMessagesState((prev) => prev.filter((m) => m.id !== tempId));
    });
    setMessageInput("");
  };

  const startReply = (id: string) => {
    setReplyingToId(id);
  };

  const cancelReply = () => setReplyingToId(null);

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setEditingText(current);
  };

  const submitEdit = async () => {
    if (!editingId) return;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const authToken = token || localStorage.getItem("token");
    // if this is an optimistic (temp) message, update locally only
    if (editingId.startsWith("temp-")) {
      setMessagesState((prev) =>
        prev.map((m) =>
          m.id === editingId ? { ...m, content: editingText } : m,
        ),
      );
      setEditingId(null);
      setEditingText("");
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/messages/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content: editingText }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessagesState((prev) =>
          prev.map((m) =>
            m.id === editingId ? { ...m, content: data.data.content } : m,
          ),
        );
      }
    } catch (e) {
      console.error("edit failed", e);
    }
    setEditingId(null);
    setEditingText("");
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    // if this is an optimistic (temp) message, remove locally only
    if (id.startsWith("temp-")) {
      setMessagesState((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const authToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/messages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) setMessagesState((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error("delete failed", e);
    }
  };

  // Wrappers used by context menu to allow menu to close before running actions
  const handleMenuReply = (id: string) => {
    setTimeout(() => startReply(id), 0);
  };
  const handleMenuEdit = (id: string, content: string) => {
    setTimeout(() => startEdit(id, content), 0);
  };
  const handleMenuDelete = (id: string) => {
    setTimeout(() => deleteMessage(id), 0);
  };

  const handleConversationClick = async (conversationId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const authToken = token || localStorage.getItem("token");

    // leave previous channel
    if (socketRef.current && selectedConversation) {
      socketRef.current.emit("leave", `channel:${selectedConversation}`);
    }

    // join new channel
    if (socketRef.current) {
      socketRef.current.emit("join", `channel:${conversationId}`);
    }

    // fetch existing messages for this conversation
    try {
      const res = await fetch(`${apiUrl}/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.debug(
          "Messages: fetched",
          (data.data || []).length,
          "messages for",
          conversationId,
        );
        const mapped = (data.data || []).map((m: any) => ({
          id: m.id,
          sender: m.senderId,
          content: m.content,
          timestamp: m.createdAt,
          isMe: m.senderId === user?.id,
        }));
        setMessagesState(mapped);
      }
    } catch (e) {
      console.error("failed loading conversation", e);
    }

    setSelectedConversation(conversationId);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  // when conversations load, auto-select the first one if none selected
  useEffect(() => {
    if (!conversationsState || conversationsState.length === 0) return;
    // if parent requested opening a specific conversation, don't override it
    if (initialConversationId) return;
    const found = conversationsState.find((c) => c.id === selectedConversation);
    if (!found) {
      handleConversationClick(conversationsState[0].id);
    }
  }, [conversationsState]);

  // if parent requested opening a specific conversation (eg. from search), open it on mount
  useEffect(() => {
    if (initialConversationId) {
      console.debug(
        "Messages: initialConversationId received:",
        initialConversationId,
      );
      handleConversationClick(initialConversationId);

      // ensure the conversation appears in the sidebar even if there are no stored messages yet
      setConversationsState((prev) => {
        if (prev.find((c) => c.id === initialConversationId)) return prev;
        // derive a friendly name for dm: keys by showing the other participant id
        let name = initialConversationId;
        if (initialConversationId.startsWith("dm:")) {
          const parts = initialConversationId
            .replace(/^dm:/, "")
            .split(":")
            .filter(Boolean);
          const other = parts.find((p) => p !== (user?.id || user?.username));
          name = other ? other : parts.join(", ");
        }
        const stub = {
          id: initialConversationId,
          name,
          type: initialConversationId.startsWith("dm:") ? "direct" : "group",
          lastMessage: "",
          timestamp: "",
          unread: 0,
        } as Conversation;
        return [stub, ...prev];
      });

      // inform parent that we've consumed the initial conversation id so it won't re-trigger
      if (typeof onInitialConsumed === "function") {
        onInitialConsumed();
      }
    }
  }, [initialConversationId]);

  const filteredConversations = conversationsState.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
                      <h2 className="text-2xl font-semibold text-foreground">
                        Messages
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Stay connected with your team
                      </p>
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      <Badge className="bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
                        {conversationsState.reduce(
                          (sum, c) => sum + (c.unread || 0),
                          0,
                        )}
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
                            variant={
                              selectedConversation === conversation.id
                                ? "secondary"
                                : "ghost"
                            }
                            className={`w-full h-auto p-3 justify-start transition-all duration-300 relative overflow-hidden group ${
                              selectedConversation === conversation.id
                                ? "bg-primary/10 border border-primary/30 shadow-lg shadow-primary/5"
                                : "hover:bg-muted/50 hover:border-border"
                            }`}
                            onClick={() =>
                              handleConversationClick(conversation.id)
                            }
                          >
                            {/* Animated Background Glow */}
                            {selectedConversation === conversation.id && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              />
                            )}

                            <div className="flex items-start space-x-3 w-full relative z-10">
                              <div className="relative">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                  }}
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
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                    }}
                                  />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                    {getConversationIcon(conversation.type)}
                                    <span className="font-semibold truncate">
                                      {conversation.name}
                                    </span>
                                    {conversation.pinned && (
                                      <motion.div
                                        animate={{ rotate: [0, -15, 0] }}
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                        }}
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
                                        transition={{
                                          type: "spring",
                                          stiffness: 300,
                                        }}
                                      >
                                        <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center shadow-lg shadow-primary/30">
                                          {conversation.unread > 9
                                            ? "9+"
                                            : conversation.unread}
                                        </Badge>
                                      </motion.div>
                                    )}
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {conversation.timestamp}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-1 gap-2">
                                  <p className="text-sm text-muted-foreground truncate flex-1">
                                    {conversation.lastMessage}
                                  </p>
                                  {conversation.game && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs flex-shrink-0 bg-muted/50 backdrop-blur-sm"
                                    >
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
            {showMobileChat && activeConversation && (
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
                            {activeConversation.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {getConversationIcon(activeConversation.type)}
                          <h3 className="font-semibold text-foreground truncate">
                            {activeConversation.name}
                          </h3>
                          {activeConversation.online && (
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
                      {selectedChat.type === "direct" && (
                        <>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </>
                      )}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                        >
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
                      {messagesState.map((message, index) => (
                        <ContextMenu key={message.id}>
                          <ContextMenuTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, y: 20, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{
                                delay: index * 0.05,
                                type: "spring",
                                stiffness: 200,
                              }}
                              className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] ${message.isMe ? "order-2" : "order-1"}`}
                              >
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
                                    <span className="text-sm font-medium text-foreground">
                                      {message.sender}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {message.timestamp}
                                    </span>
                                  </motion.div>
                                )}
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  className={`rounded-2xl px-4 py-2.5 transition-all duration-300 backdrop-blur-sm ${
                                    message.isMe
                                      ? "bg-primary text-primary-foreground ml-auto shadow-lg shadow-primary/20"
                                      : "bg-muted/70 text-foreground shadow-md"
                                  }`}
                                >
                                  {message.replyToId && (
                                    <div className="mb-2 text-xs text-muted-foreground/80 italic rounded p-2 bg-muted/20">
                                      In reply to:{" "}
                                      {messagesState.find(
                                        (x) => x.id === message.replyToId,
                                      )?.content || "..."}
                                    </div>
                                  )}

                                  {editingId === message.id ? (
                                    <div>
                                      <Input
                                        value={editingText}
                                        onChange={(e) =>
                                          setEditingText(
                                            (e.target as HTMLInputElement)
                                              .value,
                                          )
                                        }
                                      />
                                      <div className="flex justify-center space-x-2 mt-2">
                                        <Button
                                          onClick={submitEdit}
                                          className="ring-2 ring-white/10"
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingId(null);
                                            setEditingText("");
                                          }}
                                          className="ring-2 ring-white/6"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm leading-relaxed">
                                        {message.content}
                                      </p>
                                      <div className="flex items-center justify-between mt-2">
                                        <div className="text-xs opacity-75">
                                          {message.isMe ? (
                                            <span className="text-right">
                                              {message.timestamp}
                                            </span>
                                          ) : (
                                            message.timestamp
                                          )}
                                        </div>
                                        <div className="space-x-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              startReply(message.id)
                                            }
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                          {message.isMe && (
                                            <>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  startEdit(
                                                    message.id,
                                                    message.content,
                                                  )
                                                }
                                              >
                                                Edit
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  deleteMessage(message.id)
                                                }
                                              >
                                                Delete
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </motion.div>
                              </div>
                            </motion.div>
                          </ContextMenuTrigger>

                          <ContextMenuContent sideOffset={6}>
                            <ContextMenuItem
                              onSelect={() => handleMenuReply(message.id)}
                            >
                              Reply
                            </ContextMenuItem>
                            {message.isMe && (
                              <>
                                <ContextMenuItem
                                  onSelect={() =>
                                    handleMenuEdit(message.id, message.content)
                                  }
                                >
                                  Edit
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                  onSelect={() => handleMenuDelete(message.id)}
                                  variant="destructive"
                                >
                                  Delete
                                </ContextMenuItem>
                              </>
                            )}
                          </ContextMenuContent>
                        </ContextMenu>
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
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: i * 0.1,
                                }}
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
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
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
                        placeholder={`Message ${activeConversation.name}...`}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        className="bg-muted/30 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all duration-300 focus:shadow-lg focus:shadow-primary/5 pr-10"
                      />
                      {replyingToId && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                          Replying to:{" "}
                          {messagesState.find((x) => x.id === replyingToId)
                            ?.content || "..."}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelReply}
                          >
                            x
                          </Button>
                        </div>
                      )}
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
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 min-h-0"
          >
            {/* Conversations Sidebar */}
            <ResizablePanel
              defaultSize={30}
              minSize={25}
              maxSize={40}
              className="border-r border-border/50 flex flex-col min-h-0"
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
                    <h2 className="text-2xl font-semibold text-foreground">
                      Messages
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Stay connected with your team
                    </p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Badge className="bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
                      {conversationsState.reduce(
                        (sum, c) => sum + (c.unread || 0),
                        0,
                      )}
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
                  {/* Friends list */}
                  {friendsList.length > 0 && (
                    <div className="px-2 pb-2">
                      <div className="text-xs text-muted-foreground mb-2">Friends</div>
                      {friendsList.map((f) => (
                        <Button key={f.id} variant="ghost" className="w-full justify-start text-sm" onClick={() => handleConversationClick(`dm:${user?.id}:${f.id}`)}>
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-8 w-8"><AvatarFallback>{(f.username||'U').charAt(0)}</AvatarFallback></Avatar>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{f.username}</div>
                            </div>
                          </div>
                        </Button>
                      ))}
                      <Separator className="my-2" />
                    </div>
                  )}
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
                          variant={
                            selectedConversation === conversation.id
                              ? "secondary"
                              : "ghost"
                          }
                          className={`w-full h-auto p-3 justify-start transition-all duration-300 relative overflow-hidden group ${
                            selectedConversation === conversation.id
                              ? "bg-primary/10 border border-primary/30 shadow-lg shadow-primary/5"
                              : "hover:bg-muted/50 hover:border-border"
                          }`}
                          onClick={() =>
                            handleConversationClick(conversation.id)
                          }
                        >
                          {/* Animated Background Glow */}
                          {selectedConversation === conversation.id && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
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
                                  <span className="font-semibold truncate">
                                    {conversation.name}
                                  </span>
                                  {conversation.pinned && (
                                    <motion.div
                                      animate={{ rotate: [0, -15, 0] }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                      }}
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
                                      transition={{
                                        type: "spring",
                                        stiffness: 300,
                                      }}
                                    >
                                      <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center shadow-lg shadow-primary/30">
                                        {conversation.unread > 9
                                          ? "9+"
                                          : conversation.unread}
                                      </Badge>
                                    </motion.div>
                                  )}
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {conversation.timestamp}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-1 gap-2">
                                <p className="text-sm text-muted-foreground truncate flex-1">
                                  {conversation.lastMessage}
                                </p>
                                {conversation.game && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs flex-shrink-0 bg-muted/50 backdrop-blur-sm"
                                  >
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

            <ResizableHandle
              withHandle
              className="hover:bg-primary/20 transition-colors"
            />

            {/* Chat Area */}
            <ResizablePanel defaultSize={70} className="flex flex-col min-h-0">
              {selectedConversation ? (
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
                              {activeConversation.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {getConversationIcon(activeConversation.type)}
                            <h3 className="font-semibold text-foreground truncate">
                              {activeConversation.name}
                            </h3>
                            {activeConversation.online && (
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
                          {activeConversation.game && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-muted-foreground"
                            >
                              Playing {activeConversation.game}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {selectedChat.type === "direct" && (
                          <>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                              >
                                <Video className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </>
                        )}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                          >
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
                        {messagesState.map((message, index) => (
                          <ContextMenu key={message.id}>
                            <ContextMenuTrigger asChild>
                              <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                  delay: index * 0.05,
                                  type: "spring",
                                  stiffness: 200,
                                }}
                                className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-md lg:max-w-lg ${message.isMe ? "order-2" : "order-1"}`}
                                >
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
                                      <span className="text-sm font-medium text-foreground">
                                        {message.sender}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {message.timestamp}
                                      </span>
                                    </motion.div>
                                  )}
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className={`rounded-2xl px-4 py-3 transition-all duration-300 backdrop-blur-sm ${
                                      message.isMe
                                        ? "bg-primary text-primary-foreground ml-auto shadow-lg shadow-primary/20"
                                        : "bg-muted/70 text-foreground shadow-md"
                                    }`}
                                  >
                                    {editingId === message.id ? (
                                      <div>
                                        <Input
                                          value={editingText}
                                          onChange={(e) =>
                                            setEditingText(
                                              (e.target as HTMLInputElement)
                                                .value,
                                            )
                                          }
                                        />
                                        <div className="flex justify-center space-x-2 mt-2">
                                          <Button
                                            onClick={submitEdit}
                                            className="ring-2 ring-white/10"
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingId(null);
                                              setEditingText("");
                                            }}
                                            className="ring-2 ring-white/6"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="text-sm leading-relaxed">
                                          {message.content}
                                        </p>
                                        {message.isMe && (
                                          <p className="text-xs opacity-75 mt-1.5 text-right">
                                            {message.timestamp}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </motion.div>
                                </div>
                              </motion.div>
                            </ContextMenuTrigger>

                            <ContextMenuContent sideOffset={6}>
                              <ContextMenuItem
                                onSelect={() => handleMenuReply(message.id)}
                              >
                                Reply
                              </ContextMenuItem>
                              {message.isMe && (
                                <>
                                  <ContextMenuItem
                                    onSelect={() =>
                                      handleMenuEdit(
                                        message.id,
                                        message.content,
                                      )
                                    }
                                  >
                                    Edit
                                  </ContextMenuItem>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem
                                    onSelect={() =>
                                      handleMenuDelete(message.id)
                                    }
                                    variant="destructive"
                                  >
                                    Delete
                                  </ContextMenuItem>
                                </>
                              )}
                            </ContextMenuContent>
                          </ContextMenu>
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
                                  transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.1,
                                  }}
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
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
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
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSendMessage()
                          }
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
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <MessageCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-muted-foreground">
                      Choose a conversation from the sidebar to start chatting
                    </p>
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
