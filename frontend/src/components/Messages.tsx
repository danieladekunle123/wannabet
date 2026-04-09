import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
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
  Check,
  CheckCheck,
  MoreVertical,
  Pin,
  Star,
  Hash,
  User,
  Reply,
  ArrowLeft,
  Smile,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { GifPicker } from "./GifPicker";
import { UserAvatar } from "./UserAvatar";
import { StatusDot } from "./StatusDot";
import { usePresence } from "../context/PresenceContext";
import { formatTimeAgo } from "../utils/formatTimeAgo";
import { uploadFile } from "../services/uploadService";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "./ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  senderId?: string;
  receiverId?: string | null;
  replyToId?: string | null;
  messageType?: "text" | "gif" | "image" | "video";
  mediaUrl?: string | null;
  readAt?: string | null;
  editedAt?: string | null;
  isMe?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  type: "direct" | "group" | "hub" | "team";
  lastMessage: string;
  timestamp: string;
  unread: number;
  online?: boolean;
  avatar?: string;
  game?: string;
  pinned?: boolean;
  teamId?: string;
  canManageTeam?: boolean;
}

interface MessagesProps {
  initialConversationId?: string | undefined;
  onInitialConsumed?: () => void;
  onNavigate?: (tab: string, query?: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

const THREAD_GROUP_WINDOW_MS = 5 * 60 * 1000;

export function Messages({
  initialConversationId,
  onInitialConsumed,
  onNavigate,
  onUnreadCountChange,
}: MessagesProps) {
  const API_URL = import.meta.env.VITE_API_URL ?? "";
  const GIPHY_API_KEY =
    import.meta.env.VITE_GIPHY_API_KEY || "wYChZ0CXRzFrNp3kVR2bzsAqFHeBWyh2";
  const { user, token } = useAuth();
  const { getStatus, getLastSeen, watchUsers } = usePresence();
  const [selectedConversation, setSelectedConversation] = useState<string>("");
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [messagesState, setMessagesState] = useState<Message[]>([]);
  const prevConversationRef = useRef<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isUpdatingTeamPhoto, setIsUpdatingTeamPhoto] = useState(false);
  const [usernamesById, setUsernamesById] = useState<Record<string, string>>(
    {},
  );
  const [userImagesById, setUserImagesById] = useState<Record<string, string>>(
    {},
  );
  const selectedConversationRef = useRef<string>("");
  const usernamesRef = useRef<Record<string, string>>({});
  const conversationNamesRef = useRef<Record<string, string>>({});
  const userImagesRef = useRef<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const teamPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const readSyncInFlightRef = useRef<Record<string, boolean>>({});

  const isLikelyUserId = (value?: string) => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  };

  const rememberUserName = (userId?: string | null, name?: string | null) => {
    if (!userId || !name || isLikelyUserId(name)) return;
    setUsernamesById((prev) => ({ ...prev, [userId]: name }));
  };

  const rememberUserImage = (
    userId?: string | null,
    imageUrl?: string | null,
  ) => {
    if (!userId || !imageUrl) return;
    setUserImagesById((prev) => ({ ...prev, [userId]: imageUrl }));
  };

  const normalizeConversationId = (conversationId: string) => {
    if (!conversationId?.startsWith("dm:")) return conversationId;
    const parts = conversationId
      .replace(/^dm:/, "")
      .split(":")
      .filter(Boolean)
      .sort();
    return `dm:${parts.join(":")}`;
  };

  const getDmOtherUserId = (conversationId: string) => {
    if (!conversationId?.startsWith("dm:")) return null;
    const parts = conversationId.replace(/^dm:/, "").split(":").filter(Boolean);
    return parts.find((p) => p !== user?.id) || null;
  };

  const getUserNavigationMeta = (value?: string) => {
    if (!value?.startsWith("user:")) return null;
    const parts = value.split(":");
    const targetUserId = parts[1] || "";
    const encodedName = parts.slice(2).join(":");
    const targetName = encodedName ? decodeURIComponent(encodedName) : "";
    return { targetUserId, targetName };
  };

  const resolveConversationDisplayName = (conversationId: string) => {
    if (!conversationId) return "Conversation";
    if (!conversationId.startsWith("dm:")) {
      return conversationNamesRef.current[conversationId] || "Conversation";
    }

    const otherUserId = getDmOtherUserId(conversationId);
    if (otherUserId && usernamesRef.current[otherUserId]) {
      return usernamesRef.current[otherUserId];
    }

    const mappedConversationName = conversationNamesRef.current[conversationId];
    if (mappedConversationName && !isLikelyUserId(mappedConversationName)) {
      return mappedConversationName;
    }

    return otherUserId || mappedConversationName || "Direct Message";
  };

  const resolveConversationAvatarUrl = (conversationId: string) => {
    const conversation = conversationsState.find(
      (c) => c.id === conversationId,
    );
    if (conversation?.avatar) {
      return resolveMediaUrl(conversation.avatar);
    }
    if (!conversationId?.startsWith("dm:")) return "";
    const otherUserId = getDmOtherUserId(conversationId);
    if (!otherUserId) return "";
    return resolveMediaUrl(userImagesRef.current[otherUserId] || "");
  };

  const resolveSenderAvatarUrl = (
    senderId?: string,
    conversationId?: string,
  ) => {
    if (!senderId) return "";
    if (senderId === user?.id) {
      return user?.profileImageUrl || user?.avatarUrl || "";
    }
    if (userImagesRef.current[senderId]) {
      return userImagesRef.current[senderId];
    }

    const targetConversationId =
      conversationId || selectedConversationRef.current;
    if (targetConversationId?.startsWith("dm:")) {
      const otherUserId = getDmOtherUserId(targetConversationId);
      if (otherUserId === senderId) {
        return resolveConversationAvatarUrl(targetConversationId);
      }
    }

    return "";
  };

  const resolveSenderLabel = (
    senderId?: string,
    fallbackLabel?: string,
    conversationId?: string,
  ) => {
    if (senderId && senderId === user?.id) return user?.username || "You";
    if (senderId && usernamesRef.current[senderId])
      return usernamesRef.current[senderId];

    const targetConversationId =
      conversationId || selectedConversationRef.current;
    if (senderId && targetConversationId?.startsWith("dm:")) {
      const otherUserId = getDmOtherUserId(targetConversationId);
      if (otherUserId === senderId) {
        return resolveConversationDisplayName(targetConversationId);
      }
    }

    if (fallbackLabel && !isLikelyUserId(fallbackLabel)) {
      if (senderId) rememberUserName(senderId, fallbackLabel);
      return fallbackLabel;
    }
    return senderId || fallbackLabel || "Unknown";
  };

  const isSameCalendarDay = (a: string, b: string) => {
    const first = new Date(a);
    const second = new Date(b);
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const shouldShowSenderLabel = (
    currentMessage: Message,
    previousMessage?: Message,
  ) => {
    if (!previousMessage) return true;
    if ((currentMessage.senderId || "") !== (previousMessage.senderId || "")) {
      return true;
    }

    const currentMillis = new Date(currentMessage.timestamp).getTime();
    const previousMillis = new Date(previousMessage.timestamp).getTime();
    if (Number.isNaN(currentMillis) || Number.isNaN(previousMillis))
      return true;

    return currentMillis - previousMillis > THREAD_GROUP_WINDOW_MS;
  };

  const shouldShowGroupedTimestamp = (
    currentMessage: Message,
    previousMessage?: Message,
  ) => {
    if (!previousMessage) return true;

    const currentMillis = new Date(currentMessage.timestamp).getTime();
    const previousMillis = new Date(previousMessage.timestamp).getTime();
    if (Number.isNaN(currentMillis) || Number.isNaN(previousMillis))
      return true;

    return currentMillis - previousMillis > THREAD_GROUP_WINDOW_MS;
  };

  const getConversationIdForMessage = (message: {
    channelId?: string | null;
    senderId?: string;
    receiverId?: string | null;
  }) => {
    if (message.channelId) return normalizeConversationId(message.channelId);
    if (message.senderId && message.receiverId) {
      return normalizeConversationId(
        `dm:${message.senderId}:${message.receiverId}`,
      );
    }
    return "";
  };

  const getConversationPreview = (message: {
    content?: string;
    messageType?: string;
  }) => {
    if (message.messageType === "gif") return "GIF";
    if (message.messageType === "image") return "Image";
    if (message.messageType === "video") return "Video";
    return message.content || "";
  };

  const sortConversationsByRecent = (items: Conversation[]) => {
    return [...items].sort((a, b) => {
      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    });
  };

  const upsertConversationActivity = (
    conversationId: string,
    message: {
      content?: string;
      messageType?: string;
      timestamp?: string;
      senderId?: string;
      receiverId?: string | null;
    },
  ) => {
    if (!conversationId) return;
    const preview = getConversationPreview(message);
    const timestamp = message.timestamp || new Date().toISOString();

    setConversationsState((prev) => {
      const idx = prev.findIndex((c) => c.id === conversationId);
      if (idx === -1) {
        const fallbackName = resolveConversationDisplayName(conversationId);
        const created: Conversation = {
          id: conversationId,
          name: fallbackName,
          type: conversationId.startsWith("dm:") ? "direct" : "group",
          lastMessage: preview,
          timestamp,
          unread: 0,
        };
        return sortConversationsByRecent([created, ...prev]);
      }

      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        lastMessage: preview,
        timestamp,
      };
      return sortConversationsByRecent(copy);
    });
  };

  const formatSidebarTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const dayDiff = Math.round(
      (today.getTime() - targetDay.getTime()) / 86400000,
    );

    if (dayDiff === 0) {
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    if (dayDiff === 1) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatMessageDayLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thatDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const dayDiff = Math.round(
      (today.getTime() - thatDay.getTime()) / 86400000,
    );

    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const resolveMediaUrl = (mediaUrl?: string | null) => {
    if (!mediaUrl) return "";
    if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
      return mediaUrl;
    }
    return `${API_URL}${mediaUrl.startsWith("/") ? "" : "/"}${mediaUrl}`;
  };

  const dedupeMessagesById = (messages: Message[]) => {
    const map = new Map<string, Message>();
    for (const message of messages) {
      if (!message?.id) continue;
      map.set(message.id, message);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  };

  const applyReadReceipt = (payload: {
    messageIds?: string[];
    readAt?: string;
  }) => {
    if (!payload?.messageIds?.length || !payload.readAt) return;

    setMessagesState((prev) =>
      prev.map((message) => {
        if (!payload.messageIds?.includes(message.id)) return message;
        if (!message.isMe) return message;
        return { ...message, readAt: payload.readAt };
      }),
    );
  };

  const markConversationAsRead = async (conversationId: string) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken || !conversationId) return;

    const normalizedConversationId = normalizeConversationId(conversationId);
    if (!normalizedConversationId) return;
    if (readSyncInFlightRef.current[normalizedConversationId]) return;

    readSyncInFlightRef.current[normalizedConversationId] = true;
    try {
      const res = await fetch(
        `${API_URL}/messages/${normalizedConversationId}/read`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      if (!res.ok) return;
      const payload = await res.json().catch(() => ({}));
      applyReadReceipt(payload?.data || {});
    } catch (error) {
      console.error("failed marking conversation as read", error);
    } finally {
      readSyncInFlightRef.current[normalizedConversationId] = false;
    }
  };

  const resolveNavigationConversationId = (value: string) => {
    if (!value) return null;

    if (value.startsWith("dm:")) {
      return normalizeConversationId(value);
    }

    if (value.startsWith("user:")) {
      return null;
    }

    return normalizeConversationId(value);
  };

  const ensureDmConversation = async (
    targetUserId: string,
    fallbackName?: string,
  ) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken || !targetUserId) return null;

    const res = await fetch(
      `${API_URL}/messages/conversations/dm/${targetUserId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || "failed to start conversation");
    }

    const payload = await res.json();
    const conversation = payload?.data || payload?.conversation || null;
    if (!conversation) return null;

    const normalizedId = normalizeConversationId(
      conversation.id || conversation.key || "",
    );
    if (!normalizedId) return null;

    const otherUser = conversation.otherUser;
    const otherName =
      otherUser?.displayName ||
      otherUser?.username ||
      fallbackName ||
      "Direct Message";
    const otherImage = otherUser?.profileImageUrl || otherUser?.avatarUrl || "";

    if (otherUser?.id && otherName) {
      rememberUserName(otherUser.id, otherName);
    }
    if (otherUser?.id && otherImage) {
      rememberUserImage(otherUser.id, otherImage);
    }

    setConversationsState((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c) => c.id === normalizedId);
      const updatedConversation: Conversation = {
        id: normalizedId,
        name: otherName,
        type: "direct",
        lastMessage: conversation.lastMessage || "",
        timestamp:
          conversation.updatedAt ||
          conversation.lastMessageAt ||
          conversation.createdAt ||
          "",
        unread: 0,
        avatar: otherImage ? resolveMediaUrl(otherImage) : undefined,
      };

      if (idx === -1) {
        next.unshift(updatedConversation);
      } else {
        next[idx] = { ...next[idx], ...updatedConversation };
      }

      return sortConversationsByRecent(next);
    });

    return normalizedId;
  };

  const messageBelongsToConversation = (msg: any, conversationId: string) => {
    if (!conversationId) return false;
    const normalizedConversationId = normalizeConversationId(conversationId);

    if (normalizedConversationId.startsWith("dm:")) {
      const messageChannelId = normalizeConversationId(
        String(msg.channelId || ""),
      );
      if (messageChannelId && messageChannelId === normalizedConversationId) {
        return true;
      }

      if (msg.senderId && msg.receiverId) {
        const pair = [msg.senderId, msg.receiverId].sort().join(":");
        return `dm:${pair}` === normalizedConversationId;
      }

      return false;
    }

    return String(msg.channelId || "") === normalizedConversationId;
  };

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    usernamesRef.current = usernamesById;
  }, [usernamesById]);

  useEffect(() => {
    userImagesRef.current = userImagesById;
  }, [userImagesById]);

  useEffect(() => {
    // connect socket with token auth
    const authToken = token || localStorage.getItem("token");
    socketRef.current = io(API_URL, {
      auth: { token: authToken },
      withCredentials: true,
    });

    const s = socketRef.current;
    s.on("connect", () => console.log("socket connected", s.id));
    s.on("message", (msg: any) => {
      // map incoming server message to local Message shape
      try {
        const currentConversation = selectedConversationRef.current;
        if (!messageBelongsToConversation(msg, currentConversation)) {
          return;
        }

        const mapped: Message = {
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId || null,
          sender: resolveSenderLabel(
            msg.senderId,
            msg.sender?.username ?? msg.sender,
            currentConversation,
          ),
          content: msg.content || msg.text || msg.message?.content || "",
          timestamp: msg.createdAt || new Date().toISOString(),
          replyToId: msg.replyToId || null,
          messageType: msg.messageType || "text",
          mediaUrl: msg.mediaUrl || null,
          readAt: msg.readAt || null,
          editedAt: msg.editedAt || null,
          isMe: msg.senderId === user?.id,
        };
        setMessagesState((prev) => {
          if (prev.some((m) => m.id === mapped.id)) {
            return prev;
          }

          // if this is our own sent message, try to replace any temp optimistic message
          if (mapped.isMe) {
            const idx = prev.findIndex(
              (m) => m.isMe && m.content === mapped.content,
            );
            if (idx !== -1) {
              const copy = [...prev];
              copy[idx] = mapped;
              return dedupeMessagesById(copy);
            }
          }
          return dedupeMessagesById([...prev, mapped]);
        });

        const conversationForMessage = getConversationIdForMessage({
          channelId: msg.channelId,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
        });
        upsertConversationActivity(conversationForMessage, {
          content: mapped.content,
          messageType: mapped.messageType,
          timestamp: mapped.timestamp,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
        });

        if (
          msg.senderId &&
          (msg.senderProfileImageUrl || msg.senderAvatarUrl)
        ) {
          rememberUserImage(
            msg.senderId,
            msg.senderProfileImageUrl || msg.senderAvatarUrl,
          );
        }

        if (!mapped.isMe && currentConversation) {
          markConversationAsRead(currentConversation);
        }
      } catch (e) {
        console.log("failed mapping incoming message", e, msg);
      }
    });
    s.on("message:update", (msg: any) => {
      setMessagesState((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? {
                ...m,
                content: msg.content,
                editedAt:
                  msg.editedAt || m.editedAt || new Date().toISOString(),
              }
            : m,
        ),
      );
    });
    s.on("message:delete", ({ id }: any) => {
      setMessagesState((prev) => prev.filter((m) => m.id !== id));
    });
    s.on("message:read", (payload: any) => {
      applyReadReceipt(payload || {});
    });
    s.on("user:read", (payload: any) => {
      applyReadReceipt(payload || {});
    });

    s.on(
      "user:typing",
      ({ userId: typerId, chatId }: { userId: string; chatId: string }) => {
        if (typerId === user?.id) return;
        setTypingUserId(typerId);
        setIsTyping(true);
        // Auto-clear after 3s (matches Redis TTL)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingUserId(null);
        }, 3000);
      },
    );

    return () => {
      s.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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

  useEffect(() => {
    if (!onUnreadCountChange) return;
    const unreadCount = conversationsState.reduce(
      (sum, conversation) => sum + (conversation.unread || 0),
      0,
    );
    onUnreadCountChange(unreadCount);
  }, [conversationsState, onUnreadCountChange]);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const conv of conversationsState) {
      map[conv.id] = conv.name;
    }
    conversationNamesRef.current = map;
  }, [conversationsState]);

  // load real conversations from backend for this user
  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;
    fetch(`${API_URL}/messages/conversations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const discoveredNames: Record<string, string> = {};
        const discoveredImages: Record<string, string> = {};
        const items = (data.data || [])
          .map((c: any) => {
            const normalizedId = normalizeConversationId(
              c.id ??
                c.channelId ??
                c.conversationId ??
                (c.type === "dm" && c.members
                  ? `dm:${[...c.members].sort().join(":")}`
                  : ""),
            );
            const fallbackDmName =
              c.type === "dm" && c.members
                ? c.members
                    .filter((m: string) => m !== (user?.id || user?.username))
                    .join(", ")
                : "Conversation";

            if (c.otherUser?.id) {
              const otherName =
                c.otherUser?.username ||
                c.otherUser?.displayName ||
                c.name ||
                "";
              if (otherName) discoveredNames[c.otherUser.id] = otherName;
              const otherImage =
                c.otherUser?.profileImageUrl ||
                c.otherUser?.avatarUrl ||
                c.profileImageUrl ||
                c.avatarUrl ||
                "";
              if (otherImage) discoveredImages[c.otherUser.id] = otherImage;
            }

            return {
              id: normalizedId,
              name:
                c.name ??
                c.displayName ??
                c.otherUser?.displayName ??
                c.otherUser?.username ??
                fallbackDmName,
              type:
                c.type === "hub"
                  ? "hub"
                  : c.type === "team"
                    ? "team"
                    : c.type === "group" || c.type === "channel"
                      ? "group"
                      : "direct",
              lastMessage: c.lastMessage ?? c.last_message ?? c.preview ?? "",
              timestamp: c.updatedAt ?? c.lastMessageAt ?? c.createdAt ?? "",
              unread: c.unread ?? 0,
              online: c.online ?? false,
              avatar:
                c.profileImageUrl || c.avatarUrl
                  ? resolveMediaUrl(c.profileImageUrl ?? c.avatarUrl)
                  : undefined,
              game: c.game,
              teamId: c.teamId,
              canManageTeam: !!c.canManageTeam,
              pinned: c.pinned ?? false,
            };
          })
          .filter((c: Conversation) => Boolean(c.id));
        setConversationsState(sortConversationsByRecent(items));
        if (Object.keys(discoveredNames).length > 0) {
          setUsernamesById((prev) => ({ ...prev, ...discoveredNames }));
        }
        if (Object.keys(discoveredImages).length > 0) {
          setUserImagesById((prev) => ({ ...prev, ...discoveredImages }));
        }
      })
      .catch((err) => console.error("failed loading conversations", err));
  }, [token, user?.id]);

  // load friends for current user and show them at top of sidebar
  const [friendsList, setFriendsList] = useState<any[]>([]);
  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;
    fetch(`${API_URL}/users/me/friends`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const friends = d.friends || [];
        setFriendsList(friends);
        const discoveredNames: Record<string, string> = {};
        const discoveredImages: Record<string, string> = {};
        for (const friend of friends) {
          const friendName = friend?.username || friend?.profile?.displayName;
          if (friend?.id && friendName && !isLikelyUserId(friendName)) {
            discoveredNames[friend.id] = friendName;
          }
          const friendImage = friend?.profileImageUrl || friend?.avatarUrl;
          if (friend?.id && friendImage) {
            discoveredImages[friend.id] = friendImage;
          }
        }
        if (Object.keys(discoveredNames).length > 0) {
          setUsernamesById((prev) => ({ ...prev, ...discoveredNames }));
        }
        if (Object.keys(discoveredImages).length > 0) {
          setUserImagesById((prev) => ({ ...prev, ...discoveredImages }));
        }
      })
      .catch((e) => console.error("failed loading friends", e));
  }, [token]);

  // removed mock messages; real messages are loaded into `messagesState` via `handleConversationClick`

  const getConversationIcon = (type: string) => {
    switch (type) {
      case "direct":
        return <User className="h-4 w-4" />;
      case "team":
        return <Users className="h-4 w-4" />;
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
        name: resolveConversationDisplayName(selectedConversation),
        type: selectedConversation.startsWith("dm:") ? "direct" : "group",
        lastMessage: "",
        timestamp: "",
        unread: 0,
      })
    : null;

  const canEditActiveTeamPhoto =
    !!activeConversation &&
    activeConversation.type === "team" &&
    !!activeConversation.teamId &&
    !!activeConversation.canManageTeam;

  const replyingToMessage = replyingToId
    ? messagesState.find((message) => message.id === replyingToId)
    : null;

  const getReplyPreviewText = (message: Message | null) => {
    if (!message) return "Original message";
    if (message.content?.trim()) return message.content;
    if (message.messageType === "gif") return "GIF";
    if (message.messageType === "image") return "Image";
    if (message.messageType === "video") return "Video";
    return "Message";
  };

  const getReplyIndicatorText = (replyToId?: string | null) => {
    if (!replyToId) return "Original message";
    const originalMessage = messagesState.find(
      (message) => message.id === replyToId,
    );
    if (!originalMessage) return "Original message";
    if (originalMessage.content?.trim()) return originalMessage.content;
    if (originalMessage.messageType === "gif") return "GIF";
    if (originalMessage.messageType === "image") return "Image";
    if (originalMessage.messageType === "video") return "Video";
    return "Message";
  };

  const sendMessage = async ({
    content = "",
    messageType = "text",
    mediaUrl = null,
  }: {
    content?: string;
    messageType?: "text" | "gif" | "image" | "video";
    mediaUrl?: string | null;
  }) => {
    const trimmedContent = content.trim();
    if (!trimmedContent && !mediaUrl) return;

    const authToken = token || localStorage.getItem("token");
    if (!authToken || !selectedConversation) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderId: user?.id,
      sender: user?.username || "Me",
      content: trimmedContent,
      timestamp: new Date().toISOString(),
      messageType,
      mediaUrl,
      isMe: true,
    };

    const normalizedConversationId =
      normalizeConversationId(selectedConversation);
    const receiverId = getDmOtherUserId(normalizedConversationId);

    setMessagesState((prev) => [...prev, tempMessage]);
    upsertConversationActivity(normalizedConversationId, {
      content: tempMessage.content,
      messageType: tempMessage.messageType,
      timestamp: tempMessage.timestamp,
      senderId: tempMessage.senderId,
      receiverId,
    });

    const body: any = {
      conversationId: normalizedConversationId,
      content: trimmedContent,
      messageType,
      mediaUrl,
    };
    if (receiverId) body.receiverId = receiverId;
    if (replyingToId && !replyingToId.startsWith("temp-"))
      body.replyToId = replyingToId;

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "failed to send message");
      }

      setReplyingToId(null);
    } catch (err) {
      console.error("send message error", err);
      setMessagesState((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    if (messageType === "text") setMessageInput("");
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessage({ content: messageInput, messageType: "text" });
  };

  const handleGifSelect = (gifUrl: string) => {
    sendMessage({ messageType: "gif", mediaUrl: gifUrl });
    setShowGifPicker(false);
  };

  const handleMediaUpload = async (file: File) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    setIsUploadingMedia(true);
    try {
      const url = await uploadFile(file, "message");
      const messageType: "image" | "video" = file.type.startsWith("video/")
        ? "video"
        : "image";
      await sendMessage({ messageType, mediaUrl: url });
    } catch (error) {
      console.error("media upload failed", error);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleMediaUpload(file);
    event.target.value = "";
  };

  const handleTeamPhotoUpload = async (file: File) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken || !activeConversation) return;
    if (activeConversation.type !== "team") return;
    if (!activeConversation.teamId || !activeConversation.canManageTeam) return;

    setIsUpdatingTeamPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        `${API_URL}/teams/${encodeURIComponent(activeConversation.teamId)}/profile-image/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
          body: form,
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to update group photo");
      }

      const payload = await res.json().catch(() => ({}));
      const profileImageUrl =
        payload?.team?.profileImageUrl || payload?.profileImageUrl || "";
      const resolvedUrl = resolveMediaUrl(profileImageUrl || "");
      if (!resolvedUrl) return;

      setConversationsState((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConversation.id
            ? { ...conversation, avatar: resolvedUrl }
            : conversation,
        ),
      );
    } catch (error: any) {
      alert(error?.message || "Failed to update group photo");
    } finally {
      setIsUpdatingTeamPhoto(false);
    }
  };

  const handleTeamPhotoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleTeamPhotoUpload(file);
    event.target.value = "";
  };

  const openTeamPhotoPicker = () => {
    if (!activeConversation) return;
    if (activeConversation.type !== "team") return;
    if (!activeConversation.teamId || !activeConversation.canManageTeam) return;
    teamPhotoInputRef.current?.click();
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
      const res = await fetch(`${API_URL}/messages/${editingId}`, {
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
            m.id === editingId
              ? {
                  ...m,
                  content: data.data.content,
                  editedAt:
                    data.data.editedAt ||
                    m.editedAt ||
                    new Date().toISOString(),
                }
              : m,
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
    const authToken = token || localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/messages/${id}`, {
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
    const normalizedConversationId = normalizeConversationId(conversationId);
    const authToken = token || localStorage.getItem("token");

    if (!normalizedConversationId) return false;

    const previousConversation = prevConversationRef.current;
    if (
      socketRef.current &&
      previousConversation &&
      previousConversation !== normalizedConversationId
    ) {
      socketRef.current.emit("leave", `channel:${previousConversation}`);
    }

    setSelectedConversation(normalizedConversationId);
    setReplyingToId(null);
    prevConversationRef.current = normalizedConversationId;
    setShowMobileChat(true);

    if (!authToken) return false;

    // join new channel
    if (socketRef.current) {
      socketRef.current.emit("join", `channel:${normalizedConversationId}`);
    }

    // fetch existing messages for this conversation
    try {
      const res = await fetch(
        `${API_URL}/messages/${normalizedConversationId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        console.debug(
          "Messages: fetched",
          (data.data || []).length,
          "messages for",
          normalizedConversationId,
        );
        const mapped = (data.data || []).map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          receiverId: m.receiverId || null,
          sender: resolveSenderLabel(
            m.senderId,
            m.sender?.username,
            normalizedConversationId,
          ),
          content: m.content,
          timestamp: m.createdAt,
          replyToId: m.replyToId || null,
          messageType: m.messageType || "text",
          mediaUrl: m.mediaUrl || null,
          readAt: m.readAt || null,
          editedAt: m.editedAt || null,
          isMe: m.senderId === user?.id,
        }));
        setMessagesState(dedupeMessagesById(mapped));
        await markConversationAsRead(normalizedConversationId);
      } else {
        setMessagesState([]);
      }
    } catch (e) {
      console.error("failed loading conversation", e);
      setMessagesState([]);
    }

    return true;
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  const handleOpenActiveDmProfile = () => {
    if (!onNavigate || !activeConversation?.id) return;
    if (activeConversation.type !== "direct") return;

    const otherUserId = getDmOtherUserId(activeConversation.id);
    if (!otherUserId) return;
    onNavigate(`profile-${otherUserId}`);
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
    if (!initialConversationId) return;

    let isCancelled = false;
    (async () => {
      const navMeta = getUserNavigationMeta(initialConversationId);
      if (navMeta?.targetUserId && navMeta?.targetName) {
        rememberUserName(navMeta.targetUserId, navMeta.targetName);
      }

      let conversationToOpen = resolveNavigationConversationId(
        initialConversationId,
      );
      if (navMeta?.targetUserId) {
        try {
          conversationToOpen = await ensureDmConversation(
            navMeta.targetUserId,
            navMeta.targetName,
          );
        } catch (error) {
          console.error("failed ensuring DM conversation", error);
          conversationToOpen = null;
        }
      }

      if (!conversationToOpen || isCancelled) return;

      const opened = await handleConversationClick(conversationToOpen);
      if (!opened || isCancelled) return;

      if (typeof onInitialConsumed === "function") {
        onInitialConsumed();
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [initialConversationId, token, user?.id]);

  const filteredConversations = conversationsState.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.mov"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={teamPhotoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleTeamPhotoFileChange}
      />

      {showGifPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Send a GIF
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGifPicker(false)}
              >
                Close
              </Button>
            </div>
            <GifPicker apiKey={GIPHY_API_KEY} onSelect={handleGifSelect} />
          </div>
        </div>
      )}

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
                                  <UserAvatar
                                    className="h-12 w-12 border-2 border-primary/20"
                                    name={conversation.name}
                                    username={conversation.name}
                                    imageUrl={
                                      conversation.avatar ||
                                      resolveConversationAvatarUrl(
                                        conversation.id,
                                      )
                                    }
                                  />
                                </motion.div>
                                {conversation.type === "direct" &&
                                  (() => {
                                    const otherId = getDmOtherUserId(
                                      conversation.id,
                                    );
                                    const st = otherId
                                      ? getStatus(otherId)
                                      : "offline";
                                    const dotColor =
                                      st === "online"
                                        ? "bg-emerald-400"
                                        : st === "idle"
                                          ? "bg-yellow-400"
                                          : st === "dnd"
                                            ? "bg-red-500"
                                            : "bg-gray-400";
                                    const dotTitle =
                                      st === "online"
                                        ? "Online"
                                        : st === "idle"
                                          ? "Idle"
                                          : st === "dnd"
                                            ? "Do Not Disturb"
                                            : "Offline";
                                    return (
                                      <motion.div
                                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${dotColor} rounded-full border-2 border-background shadow-lg`}
                                        title={dotTitle}
                                        animate={
                                          st === "online"
                                            ? { scale: [1, 1.2, 1] }
                                            : {}
                                        }
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                        }}
                                      />
                                    );
                                  })()}
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
                                      {formatSidebarTimestamp(
                                        conversation.timestamp,
                                      )}
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
                                {conversation.type === "direct" &&
                                  (() => {
                                    const otherId = getDmOtherUserId(
                                      conversation.id,
                                    );
                                    const st = otherId
                                      ? getStatus(otherId)
                                      : "offline";
                                    const ls = otherId
                                      ? getLastSeen(otherId)
                                      : null;
                                    if (st === "offline" && ls) {
                                      return (
                                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                                          Last seen {formatTimeAgo(ls)}
                                        </p>
                                      );
                                    }
                                    return null;
                                  })()}
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

                      <button
                        type="button"
                        onClick={handleOpenActiveDmProfile}
                        className={`flex items-center space-x-3 flex-1 min-w-0 text-left ${
                          activeConversation.type === "direct"
                            ? "cursor-pointer"
                            : "cursor-default"
                        }`}
                        disabled={activeConversation.type !== "direct"}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <UserAvatar
                            className="h-11 w-11 border-2 border-primary/20"
                            name={activeConversation.name}
                            username={activeConversation.name}
                            imageUrl={resolveConversationAvatarUrl(
                              activeConversation.id,
                            )}
                          />
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {getConversationIcon(activeConversation.type)}
                            <h3 className="font-semibold text-foreground truncate">
                              {activeConversation.name}
                            </h3>
                            {activeConversation.type === "direct" &&
                              (() => {
                                const otherId = getDmOtherUserId(
                                  activeConversation.id,
                                );
                                const st = otherId
                                  ? getStatus(otherId)
                                  : "offline";
                                const stLabel =
                                  st === "online"
                                    ? "Online"
                                    : st === "idle"
                                      ? "Idle"
                                      : st === "dnd"
                                        ? "Do Not Disturb"
                                        : null;
                                return stLabel ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                    }}
                                  >
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs backdrop-blur-sm">
                                      {stLabel}
                                    </Badge>
                                  </motion.div>
                                ) : null;
                              })()}
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
                      </button>
                    </div>

                    {activeConversation.type !== "direct" && (
                      <div className="flex items-center space-x-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
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
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={8}>
                            {canEditActiveTeamPhoto ? (
                              <DropdownMenuItem
                                onSelect={openTeamPhotoPicker}
                                disabled={isUpdatingTeamPhoto}
                              >
                                {isUpdatingTeamPhoto
                                  ? "Uploading..."
                                  : "Edit Group Photo"}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled>
                                Only team owner can edit group photo
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4 overflow-y-auto">
                  <div
                    key={`mobile-thread-${selectedConversation || "none"}`}
                    className="space-y-0 pb-2 dm-thread-transition"
                  >
                    <AnimatePresence>
                      {messagesState.map((message, index) => (
                        <React.Fragment key={message.id}>
                          {(index === 0 ||
                            !isSameCalendarDay(
                              message.timestamp,
                              messagesState[index - 1].timestamp,
                            )) && (
                            <div className="flex justify-center py-1">
                              <span className="text-xs text-muted-foreground bg-muted/40 px-3 py-1 rounded-full">
                                {formatMessageDayLabel(message.timestamp)}
                              </span>
                            </div>
                          )}
                          {shouldShowGroupedTimestamp(
                            message,
                            messagesState[index - 1],
                          ) && (
                            <div className="flex justify-center py-0.5">
                              <span className="text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full">
                                {formatMessageTime(message.timestamp)}
                              </span>
                            </div>
                          )}
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                  delay: index * 0.05,
                                  type: "spring",
                                  stiffness: 200,
                                }}
                                className={`flex ${message.isMe ? "justify-end" : "justify-start"} ${
                                  index === 0
                                    ? ""
                                    : !shouldShowGroupedTimestamp(
                                          message,
                                          messagesState[index - 1],
                                        ) &&
                                        (message.senderId || "") ===
                                          (messagesState[index - 1]?.senderId ||
                                            "")
                                      ? "mt-0.5"
                                      : "mt-1.5"
                                }`}
                              >
                                <div
                                  className={`max-w-[74%] ${message.isMe ? "order-2" : "order-1"}`}
                                >
                                  {!message.isMe &&
                                    shouldShowSenderLabel(
                                      message,
                                      messagesState[index - 1],
                                    ) && (
                                      <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          delay: index * 0.05 + 0.1,
                                        }}
                                        className="flex items-center space-x-2 mb-0.5"
                                      >
                                        <UserAvatar
                                          className="h-6 w-6 -mt-0.5"
                                          name={message.sender}
                                          username={message.sender}
                                          imageUrl={resolveSenderAvatarUrl(
                                            message.senderId,
                                            activeConversation?.id,
                                          )}
                                          fallbackClassName="bg-primary/10 text-primary text-xs"
                                        />
                                        <span className="text-sm font-medium text-foreground">
                                          {message.sender}
                                        </span>
                                      </motion.div>
                                    )}
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className={`w-fit max-w-full rounded-2xl px-3 py-1.5 transition-all duration-300 backdrop-blur-sm border border-black/35 dark:border-white/55 ${
                                      message.isMe
                                        ? "ml-auto bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "mr-auto bg-muted/70 text-foreground shadow-md"
                                    }`}
                                  >
                                    {message.replyToId && (
                                      <div className="mb-2 flex items-center gap-1.5 rounded-md border border-current/25 bg-black/10 px-2 py-1 text-[11px] opacity-90">
                                        <Reply className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                          {getReplyIndicatorText(
                                            message.replyToId,
                                          )}
                                        </span>
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
                                        {message.messageType === "gif" &&
                                          message.mediaUrl && (
                                            <img
                                              src={resolveMediaUrl(
                                                message.mediaUrl,
                                              )}
                                              alt="GIF"
                                              style={{
                                                maxWidth: 128,
                                                maxHeight: 128,
                                              }}
                                              className="rounded-lg object-contain"
                                            />
                                          )}
                                        {message.messageType === "image" &&
                                          message.mediaUrl && (
                                            <img
                                              src={resolveMediaUrl(
                                                message.mediaUrl,
                                              )}
                                              alt="Image"
                                              style={{
                                                maxWidth: 128,
                                                maxHeight: 128,
                                              }}
                                              className="rounded-lg object-contain"
                                            />
                                          )}
                                        {message.messageType === "video" &&
                                          message.mediaUrl && (
                                            <video
                                              src={resolveMediaUrl(
                                                message.mediaUrl,
                                              )}
                                              controls
                                              style={{
                                                maxWidth: 128,
                                                maxHeight: 128,
                                              }}
                                              className="rounded-lg"
                                            />
                                          )}
                                        {message.content && (
                                          <p
                                            className={`text-sm leading-relaxed ${
                                              message.messageType &&
                                              message.messageType !== "text" &&
                                              message.mediaUrl
                                                ? "mt-2"
                                                : "mt-0"
                                            }`}
                                          >
                                            {message.content}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </motion.div>
                                  {editingId !== message.id &&
                                    (message.editedAt ||
                                      (message.isMe &&
                                        activeConversation?.type ===
                                          "direct")) && (
                                      <div
                                        className={`mt-1 flex items-center gap-2 text-[10px] leading-none text-muted-foreground ${
                                          message.isMe
                                            ? "justify-end"
                                            : "justify-start"
                                        }`}
                                      >
                                        {message.editedAt && (
                                          <span className="italic">Edited</span>
                                        )}
                                        {message.isMe &&
                                          activeConversation?.type ===
                                            "direct" && (
                                            <span className="flex items-center gap-1">
                                              {message.readAt ? (
                                                <>
                                                  <CheckCheck className="h-2.5 w-2.5" />
                                                  <span>Read</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Check className="h-2.5 w-2.5" />
                                                  <span>Sent</span>
                                                </>
                                              )}
                                            </span>
                                          )}
                                      </div>
                                    )}
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
                        </React.Fragment>
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
                  {replyingToId && (
                    <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-primary">
                          Replying to {replyingToMessage?.sender || "message"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {getReplyPreviewText(replyingToMessage ?? null)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelReply}
                        className="h-6 w-6 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowGifPicker(true)}
                        className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                        disabled={isUploadingMedia}
                      >
                        {isUploadingMedia ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>

                    <div className="flex-1 relative">
                      <Input
                        placeholder={`Message ${activeConversation.name}...`}
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          if (socketRef.current && selectedConversation) {
                            socketRef.current.emit("typing", {
                              chatId: `channel:${selectedConversation}`,
                            });
                          }
                        }}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        className="bg-muted/30 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all duration-300 focus:shadow-lg focus:shadow-primary/5 pr-10"
                      />
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
                      <div className="text-xs text-muted-foreground mb-2">
                        Friends
                      </div>
                      {friendsList.map((f) => (
                        <Button
                          key={f.id}
                          variant="ghost"
                          className="w-full justify-start text-sm"
                          onClick={async () => {
                            try {
                              const conversationId = await ensureDmConversation(
                                f.id,
                                f.profile?.displayName || f.username,
                              );
                              if (conversationId) {
                                await handleConversationClick(conversationId);
                              }
                            } catch (error) {
                              console.error("failed starting DM", error);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <UserAvatar
                              className="h-8 w-8"
                              name={f.profile?.displayName || f.username}
                              username={f.username}
                              imageUrl={f.profileImageUrl || f.avatarUrl}
                            />
                            <div className="flex-1 text-left">
                              <div className="font-medium">
                                {f.profile?.displayName || f.username}
                              </div>
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
                                <UserAvatar
                                  className="h-12 w-12 border-2 border-primary/20"
                                  name={conversation.name}
                                  username={conversation.name}
                                  imageUrl={
                                    conversation.avatar ||
                                    resolveConversationAvatarUrl(
                                      conversation.id,
                                    )
                                  }
                                />
                              </motion.div>
                              {conversation.type === "direct" &&
                                (() => {
                                  const otherId = getDmOtherUserId(
                                    conversation.id,
                                  );
                                  const st = otherId
                                    ? getStatus(otherId)
                                    : "offline";
                                  const dotColor =
                                    st === "online"
                                      ? "bg-emerald-400"
                                      : st === "idle"
                                        ? "bg-yellow-400"
                                        : st === "dnd"
                                          ? "bg-red-500"
                                          : "bg-gray-400";
                                  const dotTitle =
                                    st === "online"
                                      ? "Online"
                                      : st === "idle"
                                        ? "Idle"
                                        : st === "dnd"
                                          ? "Do Not Disturb"
                                          : "Offline";
                                  return (
                                    <motion.div
                                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${dotColor} rounded-full border-2 border-background shadow-lg`}
                                      title={dotTitle}
                                      animate={
                                        st === "online"
                                          ? { scale: [1, 1.2, 1] }
                                          : {}
                                      }
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                      }}
                                    />
                                  );
                                })()}
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
                                    {formatSidebarTimestamp(
                                      conversation.timestamp,
                                    )}
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
                              {conversation.type === "direct" &&
                                (() => {
                                  const otherId = getDmOtherUserId(
                                    conversation.id,
                                  );
                                  const st = otherId
                                    ? getStatus(otherId)
                                    : "offline";
                                  const ls = otherId
                                    ? getLastSeen(otherId)
                                    : null;
                                  if (st === "offline" && ls) {
                                    return (
                                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                                        Last seen {formatTimeAgo(ls)}
                                      </p>
                                    );
                                  }
                                  return null;
                                })()}
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
                      <button
                        type="button"
                        onClick={handleOpenActiveDmProfile}
                        className={`flex items-center space-x-3 flex-1 min-w-0 text-left ${
                          activeConversation.type === "direct"
                            ? "cursor-pointer"
                            : "cursor-default"
                        }`}
                        disabled={activeConversation.type !== "direct"}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <UserAvatar
                            className="h-12 w-12 border-2 border-primary/20"
                            name={activeConversation.name}
                            username={activeConversation.name}
                            imageUrl={resolveConversationAvatarUrl(
                              activeConversation.id,
                            )}
                          />
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {getConversationIcon(activeConversation.type)}
                            <h3 className="font-semibold text-foreground truncate">
                              {activeConversation.name}
                            </h3>
                            {activeConversation.type === "direct" &&
                              (() => {
                                const otherId = getDmOtherUserId(
                                  activeConversation.id,
                                );
                                const st = otherId
                                  ? getStatus(otherId)
                                  : "offline";
                                const stLabel =
                                  st === "online"
                                    ? "Online"
                                    : st === "idle"
                                      ? "Idle"
                                      : st === "dnd"
                                        ? "Do Not Disturb"
                                        : null;
                                return stLabel ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                    }}
                                  >
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs backdrop-blur-sm">
                                      {stLabel}
                                    </Badge>
                                  </motion.div>
                                ) : null;
                              })()}
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
                      </button>

                      {activeConversation.type !== "direct" && (
                        <div className="flex items-center space-x-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
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
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={8}>
                              {canEditActiveTeamPhoto ? (
                                <DropdownMenuItem
                                  onSelect={openTeamPhotoPicker}
                                  disabled={isUpdatingTeamPhoto}
                                >
                                  {isUpdatingTeamPhoto
                                    ? "Uploading..."
                                    : "Edit Group Photo"}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem disabled>
                                  Only team owner can edit group photo
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 min-h-0">
                    <div
                      key={`desktop-thread-${selectedConversation || "none"}`}
                      className="space-y-0 max-w-4xl mx-auto dm-thread-transition"
                    >
                      <AnimatePresence>
                        {messagesState.map((message, index) => (
                          <React.Fragment key={message.id}>
                            {(index === 0 ||
                              !isSameCalendarDay(
                                message.timestamp,
                                messagesState[index - 1].timestamp,
                              )) && (
                              <div className="flex justify-center py-1">
                                <span className="text-xs text-muted-foreground bg-muted/40 px-3 py-1 rounded-full">
                                  {formatMessageDayLabel(message.timestamp)}
                                </span>
                              </div>
                            )}
                            {shouldShowGroupedTimestamp(
                              message,
                              messagesState[index - 1],
                            ) && (
                              <div className="flex justify-center py-0.5">
                                <span className="text-[11px] text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full">
                                  {formatMessageTime(message.timestamp)}
                                </span>
                              </div>
                            )}
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <motion.div
                                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{
                                    delay: index * 0.05,
                                    type: "spring",
                                    stiffness: 200,
                                  }}
                                  className={`flex ${message.isMe ? "justify-end" : "justify-start"} ${
                                    index === 0
                                      ? ""
                                      : !shouldShowGroupedTimestamp(
                                            message,
                                            messagesState[index - 1],
                                          ) &&
                                          (message.senderId || "") ===
                                            (messagesState[index - 1]
                                              ?.senderId || "")
                                        ? "mt-0.5"
                                        : "mt-1.5"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[72%] ${message.isMe ? "order-2" : "order-1"}`}
                                  >
                                    {!message.isMe &&
                                      shouldShowSenderLabel(
                                        message,
                                        messagesState[index - 1],
                                      ) && (
                                        <motion.div
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: index * 0.05 + 0.1,
                                          }}
                                          className="flex items-center space-x-2 mb-0.5"
                                        >
                                          <UserAvatar
                                            className="h-7 w-7 -mt-0.5"
                                            name={message.sender}
                                            username={message.sender}
                                            imageUrl={resolveSenderAvatarUrl(
                                              message.senderId,
                                              activeConversation?.id,
                                            )}
                                            fallbackClassName="bg-primary/10 text-primary text-xs"
                                          />
                                          <span className="text-sm font-medium text-foreground">
                                            {message.sender}
                                          </span>
                                        </motion.div>
                                      )}
                                    <motion.div
                                      whileHover={{ scale: 1.02 }}
                                      className={`w-fit max-w-full rounded-2xl px-3 py-1.5 transition-all duration-300 backdrop-blur-sm border border-black/35 dark:border-white/55 ${
                                        message.isMe
                                          ? "ml-auto bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                          : "mr-auto bg-muted/70 text-foreground shadow-md"
                                      }`}
                                    >
                                      {message.replyToId && (
                                        <div className="mb-2 flex items-center gap-1.5 rounded-md border border-current/25 bg-black/10 px-2 py-1 text-[11px] opacity-90">
                                          <Reply className="h-3 w-3 shrink-0" />
                                          <span className="truncate">
                                            {getReplyIndicatorText(
                                              message.replyToId,
                                            )}
                                          </span>
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
                                          {message.messageType === "gif" &&
                                            message.mediaUrl && (
                                              <img
                                                src={resolveMediaUrl(
                                                  message.mediaUrl,
                                                )}
                                                alt="GIF"
                                                style={{
                                                  maxWidth: 160,
                                                  maxHeight: 160,
                                                }}
                                                className="rounded-lg object-contain"
                                              />
                                            )}
                                          {message.messageType === "image" &&
                                            message.mediaUrl && (
                                              <img
                                                src={resolveMediaUrl(
                                                  message.mediaUrl,
                                                )}
                                                alt="Image"
                                                style={{
                                                  maxWidth: 160,
                                                  maxHeight: 160,
                                                }}
                                                className="rounded-lg object-contain"
                                              />
                                            )}
                                          {message.messageType === "video" &&
                                            message.mediaUrl && (
                                              <video
                                                src={resolveMediaUrl(
                                                  message.mediaUrl,
                                                )}
                                                controls
                                                style={{
                                                  maxWidth: 160,
                                                  maxHeight: 160,
                                                }}
                                                className="rounded-lg"
                                              />
                                            )}
                                          {message.content && (
                                            <p
                                              className={`text-sm leading-relaxed ${
                                                message.messageType &&
                                                message.messageType !==
                                                  "text" &&
                                                message.mediaUrl
                                                  ? "mt-2"
                                                  : "mt-0"
                                              }`}
                                            >
                                              {message.content}
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </motion.div>
                                    {editingId !== message.id &&
                                      (message.editedAt ||
                                        (message.isMe &&
                                          activeConversation?.type ===
                                            "direct")) && (
                                        <div
                                          className={`mt-1 flex items-center gap-2 text-[10px] leading-none text-muted-foreground ${
                                            message.isMe
                                              ? "justify-end"
                                              : "justify-start"
                                          }`}
                                        >
                                          {message.editedAt && (
                                            <span className="italic">
                                              Edited
                                            </span>
                                          )}
                                          {message.isMe &&
                                            activeConversation?.type ===
                                              "direct" && (
                                              <span className="flex items-center gap-1">
                                                {message.readAt ? (
                                                  <>
                                                    <CheckCheck className="h-2.5 w-2.5" />
                                                    <span>Read</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Check className="h-2.5 w-2.5" />
                                                    <span>Sent</span>
                                                  </>
                                                )}
                                              </span>
                                            )}
                                        </div>
                                      )}
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
                          </React.Fragment>
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
                    {replyingToId && (
                      <div className="max-w-4xl mx-auto mb-2 flex items-start justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-primary">
                            Replying to {replyingToMessage?.sender || "message"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {getReplyPreviewText(replyingToMessage ?? null)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cancelReply}
                          className="h-6 w-6 shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    <div className="max-w-4xl mx-auto flex items-center space-x-2">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowGifPicker(true)}
                          className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingMedia}
                          className="hover:bg-muted/50 hover:text-primary transition-all duration-300"
                        >
                          {isUploadingMedia ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </motion.div>

                      <div className="flex-1 relative">
                        <Input
                          placeholder={`Message ${activeConversation?.name || "conversation"}...`}
                          value={messageInput}
                          onChange={(e) => {
                            setMessageInput(e.target.value);
                            if (socketRef.current && selectedConversation) {
                              socketRef.current.emit("typing", {
                                chatId: `channel:${selectedConversation}`,
                              });
                            }
                          }}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSendMessage()
                          }
                          className="bg-muted/30 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-muted/50 transition-all duration-300 focus:shadow-lg focus:shadow-primary/5 pr-10"
                        />
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
