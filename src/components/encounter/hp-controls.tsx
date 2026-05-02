"use client";

import { useState } from "react";

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

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Quick HP
        </label>
        <input
          aria-label="HP amount"
          className="h-10 w-20 rounded-md border border-zinc-300 bg-white px-2 text-center text-lg font-bold text-zinc-950 outline-none focus:border-zinc-900"
          min={0}
          type="number"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="h-10 rounded-md bg-rose-700 px-3 text-sm font-bold text-white transition hover:bg-rose-800"
          type="button"
          onClick={() => onDamage(amount)}
        >
          Damage
        </button>
        <button
          className="h-10 rounded-md bg-emerald-700 px-3 text-sm font-bold text-white transition hover:bg-emerald-800"
          type="button"
          onClick={() => onHealing(amount)}
        >
          Heal
        </button>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full bg-zinc-900"
          style={{ width: `${Math.max(0, Math.min(100, (currentHp / maxHp) * 100))}%` }}
        />
      </div>
    </div>
  );
}
