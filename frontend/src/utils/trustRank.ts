export type TrustRank = {
  label: string;
  /** Tailwind text colour class */
  textColor: string;
  /** Tailwind bg colour class */
  bgColor: string;
  /** Tailwind border colour class */
  borderColor: string;
  /** Emoji icon */
  icon: string;
};

const RANKS: Array<{ min: number } & TrustRank> = [
  {
    min: 90,
    label: "Highly Trusted",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    borderColor: "border-emerald-500/40",
    icon: "✔",
  },
  {
    min: 76,
    label: "Trusted",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/15",
    borderColor: "border-blue-500/40",
    icon: "🛡",
  },
  {
    min: 61,
    label: "Neutral",
    textColor: "text-slate-400",
    bgColor: "bg-slate-500/15",
    borderColor: "border-slate-500/40",
    icon: "—",
  },
  {
    min: 25,
    label: "Risky",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/40",
    icon: "⚠",
  },
  {
    min: 0,
    label: "Untrusted",
    textColor: "text-red-400",
    bgColor: "bg-red-500/15",
    borderColor: "border-red-500/40",
    icon: "✕",
  },
];

export function getTrustRank(trustScore: number): TrustRank {
  const clamped = Math.min(100, Math.max(0, trustScore));
  return RANKS.find((r) => clamped >= r.min) ?? RANKS[RANKS.length - 1];
}
