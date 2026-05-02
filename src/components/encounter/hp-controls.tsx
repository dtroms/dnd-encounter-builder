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
    <div className="grid min-w-32 gap-1">
      <div className="grid grid-cols-[2rem_3.25rem_2rem] overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
        <button
          aria-label={`Apply ${amount} damage`}
          className="h-8 border-r border-slate-700 bg-rose-500/85 text-base font-black text-white transition hover:bg-rose-400"
          type="button"
          onClick={() => onDamage(amount)}
        >
          -
        </button>
        <input
          aria-label="HP change amount"
          className="h-8 w-full bg-slate-950 px-1 text-center text-sm font-black text-white outline-none focus:bg-slate-900"
          min={0}
          type="number"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
        <button
          aria-label={`Heal ${amount} HP`}
          className="h-8 border-l border-slate-700 bg-emerald-500/85 text-base font-black text-slate-950 transition hover:bg-emerald-400"
          type="button"
          onClick={() => onHealing(amount)}
        >
          +
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
