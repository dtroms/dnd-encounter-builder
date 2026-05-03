import type { CombatantType } from "./types";

export const combatantTypeOrder: CombatantType[] = [
  "pc",
  "ally",
  "enemy",
  "boss",
  "summon",
  "minion",
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
  minion: {
    label: "Minion",
    text: "text-orange-200",
    border: "border-orange-400/50",
    bg: "bg-orange-500/15",
    softBg: "bg-orange-950/35",
    ring: "ring-orange-400/40",
    dot: "bg-orange-400",
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

export const combatGroupOptions = [
  {
    label: "No Group",
    color: "None",
    className: "bg-slate-500",
    rowTint: "bg-slate-900/88",
    border: "border-slate-800",
  },
  {
    label: "Red Warband",
    color: "Red",
    className: "bg-red-500",
    rowTint: "bg-red-500/8",
    border: "border-red-400/20",
  },
  {
    label: "Blue Warband",
    color: "Blue",
    className: "bg-blue-500",
    rowTint: "bg-blue-500/8",
    border: "border-blue-400/20",
  },
  {
    label: "Green Warband",
    color: "Green",
    className: "bg-green-500",
    rowTint: "bg-green-500/8",
    border: "border-green-400/20",
  },
  {
    label: "Gold Warband",
    color: "Gold",
    className: "bg-amber-300",
    rowTint: "bg-amber-300/10",
    border: "border-amber-300/25",
  },
  {
    label: "Purple Warband",
    color: "Purple",
    className: "bg-purple-500",
    rowTint: "bg-purple-500/8",
    border: "border-purple-400/20",
  },
  {
    label: "Cyan Warband",
    color: "Cyan",
    className: "bg-cyan-300",
    rowTint: "bg-cyan-300/8",
    border: "border-cyan-300/25",
  },
  {
    label: "Gray Warband",
    color: "Gray",
    className: "bg-zinc-400",
    rowTint: "bg-zinc-500/10",
    border: "border-zinc-500/25",
  },
];

export function getCombatGroupColorClass(groupColor?: string): string | null {
  if (!groupColor || groupColor === "None") {
    return null;
  }

  return (
    combatGroupOptions.find((option) => option.color === groupColor)?.className ??
    null
  );
}

export function getCombatGroupRowStyle(groupColor?: string): {
  rowTint: string;
  border: string;
} {
  const option = combatGroupOptions.find(
    (item) => item.color === (groupColor || "None"),
  );

  return {
    rowTint: option?.rowTint ?? "bg-slate-900/88",
    border: option?.border ?? "border-slate-800",
  };
}
