import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "./ui/utils";

interface UserAvatarProps {
  name?: string | null;
  username?: string | null;
  imageUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "";

function toAbsoluteUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getInitials(name?: string | null, username?: string | null) {
  const source = (name || username || "U").trim();
  if (!source) return "U";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function UserAvatar({
  name,
  username,
  imageUrl,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initials = getInitials(name, username);
  const src = toAbsoluteUrl(imageUrl);

  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={name || username || "Avatar"} /> : null}
      <AvatarFallback className={cn("bg-primary/10 text-primary font-semibold", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
