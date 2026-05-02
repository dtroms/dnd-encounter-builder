"use client";

import { useState } from "react";
import { getHpPercent } from "@/lib/encounter/hp";

type HpControlsProps = {
  currentHp: number;
  maxHp: number;
  onDamage: (amount: number) => void;
  onHealing: (amount: number) => void;
};

export function HpControls({
  currentHp,
  maxHp,
  onDamage,
  onHealing,
}: HpControlsProps) {
  const [amount, setAmount] = useState(5);
  const hpPercent = getHpPercent(currentHp, maxHp);

  return (
    <div className="grid min-w-40 gap-1">
      <div className="flex items-center gap-1.5">
        <input
          aria-label="HP amount"
          className="h-8 w-14 rounded-lg border border-slate-700 bg-slate-950 px-1 text-center text-sm font-black text-white outline-none focus:border-cyan-300"
          min={0}
          type="number"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
        <button
          className="h-8 flex-1 rounded-lg bg-rose-500/90 px-2 text-xs font-black text-white transition hover:bg-rose-400"
          type="button"
          onClick={() => onDamage(amount)}
        >
          -HP
        </button>
        <button
          className="h-8 flex-1 rounded-lg bg-emerald-500/90 px-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400"
          type="button"
          onClick={() => onHealing(amount)}
        >
          +HP
        </button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full ${
            hpPercent <= 25
              ? "bg-rose-400"
              : hpPercent <= 50
                ? "bg-amber-300"
                : "bg-emerald-400"
          }`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
    </div>
  );
}
