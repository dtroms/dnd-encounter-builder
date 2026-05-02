import type { CombatantType } from "./types";

export const combatantTypeOrder: CombatantType[] = [
  "pc",
  "ally",
  "enemy",
  "boss",
  "summon",
  "neutral",
];

export const typeStyles: Record<
  CombatantType,
  {
    label: string;
    text: string;
    border: string;
    bg: string;
    softBg: string;
    ring: string;
    dot: string;
  }
> = {
  pc: {
    label: "PC",
    text: "text-sky-200",
    border: "border-sky-400/50",
    bg: "bg-sky-500/15",
    softBg: "bg-sky-950/35",
    ring: "ring-sky-400/40",
    dot: "bg-sky-400",
  },
  ally: {
    label: "Ally",
    text: "text-emerald-200",
    border: "border-emerald-400/50",
    bg: "bg-emerald-500/15",
    softBg: "bg-emerald-950/35",
    ring: "ring-emerald-400/40",
    dot: "bg-emerald-400",
  },
  enemy: {
    label: "Enemy",
    text: "text-rose-200",
    border: "border-rose-400/50",
    bg: "bg-rose-500/15",
    softBg: "bg-rose-950/35",
    ring: "ring-rose-400/40",
    dot: "bg-rose-400",
  },
  boss: {
    label: "Boss",
    text: "text-amber-200",
    border: "border-amber-400/60",
    bg: "bg-amber-500/15",
    softBg: "bg-amber-950/35",
    ring: "ring-amber-300/50",
    dot: "bg-amber-300",
  },
  summon: {
    label: "Summon",
    text: "text-violet-200",
    border: "border-violet-400/50",
    bg: "bg-violet-500/15",
    softBg: "bg-violet-950/35",
    ring: "ring-violet-400/40",
    dot: "bg-violet-400",
  },
  neutral: {
    label: "Neutral",
    text: "text-zinc-200",
    border: "border-zinc-500/60",
    bg: "bg-zinc-500/15",
    softBg: "bg-zinc-900/60",
    ring: "ring-zinc-400/30",
    dot: "bg-zinc-400",
  },
};

export const accentColorOptions = [
  "Blue",
  "Green",
  "Red",
  "Gold",
  "Purple",
  "Gray",
  "Cyan",
  "Magenta",
];
