import type { Request } from "express";

const LOCAL_IPS = new Set(["::1", "127.0.0.1", "0.0.0.0"]);

function normalizeIpValue(raw: string) {
  let value = raw.trim().replace(/^"|"$/g, "");
  if (!value) return null;
  if (value.toLowerCase() === "unknown") return null;

  // IPv4-mapped IPv6: ::ffff:192.168.1.2
  value = value.replace(/^::ffff:/i, "");

  // [2001:db8::1]:443 -> 2001:db8::1
  const bracketMatch = value.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketMatch?.[1]) {
    value = bracketMatch[1];
  }

  // 1.2.3.4:12345 -> 1.2.3.4
  const ipv4PortMatch = value.match(/^(\d+\.\d+\.\d+\.\d+):(\d+)$/);
  if (ipv4PortMatch?.[1]) {
    value = ipv4PortMatch[1];
  }

  // Remove IPv6 zone index: fe80::1%lo0
  const zoneIndex = value.indexOf("%");
  if (zoneIndex >= 0) {
    value = value.slice(0, zoneIndex);
  }

  return value || null;
}

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIpv6(ip: string) {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  return false;
}

export function isPrivateOrLocalIp(ip?: string | null) {
  if (!ip) return true;
  if (LOCAL_IPS.has(ip)) return true;
  if (ip.includes(":")) return isPrivateIpv6(ip);
  return isPrivateIpv4(ip);
}

function headerValues(value: unknown) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => String(entry).split(","));
  }
  return [];
}

export function resolveClientIp(req: Request) {
  const headers = req.headers as Record<string, unknown>;

  const candidates: Array<{ source: string; value: string }> = [];
  const pushValues = (source: string, value: unknown) => {
    for (const raw of headerValues(value)) {
      const normalized = normalizeIpValue(raw);
      if (normalized) candidates.push({ source, value: normalized });
    }
  };

  pushValues("cf-connecting-ip", headers["cf-connecting-ip"]);
  pushValues("true-client-ip", headers["true-client-ip"]);
  pushValues("x-real-ip", headers["x-real-ip"]);
  pushValues("fly-client-ip", headers["fly-client-ip"]);
  pushValues("x-client-ip", headers["x-client-ip"]);
  pushValues("x-forwarded-for", headers["x-forwarded-for"]);
  pushValues("req.ip", req.ip);
  pushValues("remoteAddress", req.socket?.remoteAddress);

  const firstPublic = candidates.find(
    (candidate) => !isPrivateOrLocalIp(candidate.value),
  );
  if (firstPublic) {
    return {
      ip: firstPublic.value,
      source: firstPublic.source,
      isPrivate: false,
      candidates: candidates.map((candidate) => candidate.value),
    };
  }

  const firstAny = candidates[0];
  return {
    ip: firstAny?.value || null,
    source: firstAny?.source || "unknown",
    isPrivate: firstAny ? isPrivateOrLocalIp(firstAny.value) : true,
    candidates: candidates.map((candidate) => candidate.value),
  };
}
