"use client";

import type { EncounterCombatant } from "@/lib/encounter/types";
import { typeStyles } from "@/lib/encounter/colors";
import { getHpPercent, getHpStatus } from "@/lib/encounter/hp";
import { ConditionBadges } from "./condition-badges";
import { HpControls } from "./hp-controls";
import { StatusBadge } from "./status-badge";
import { TypeBadge } from "./type-badge";

type CombatantCardProps = {
  combatant: EncounterCombatant;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDamage: (amount: number) => void;
  onHealing: (amount: number) => void;
  onInitiativeChange: (initiative: number | null) => void;
};

export function CombatantCard({
  combatant,
  active,
  selected,
  onSelect,
  onRemove,
  onDamage,
  onHealing,
  onInitiativeChange,
}: CombatantCardProps) {
  const status = getHpStatus(combatant.currentHp, combatant.maxHp);
  const hpPercent = getHpPercent(combatant.currentHp, combatant.maxHp);
  const style = typeStyles[combatant.type];
  const down = status === "Down";

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-slate-900/88 p-4 shadow-lg transition ${
        style.border
      } ${active ? `ring-4 ${style.ring}` : ""} ${
        selected ? "outline outline-2 outline-cyan-300/70" : ""
      } ${down ? "opacity-60 grayscale" : ""}`}
    >
      {active ? (
        <div className="absolute inset-x-0 top-0 h-1.5 bg-cyan-300" />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[7.25rem_minmax(0,1fr)_17rem]">
        <button
          className="rounded-2xl border border-slate-700 bg-slate-950/80 p-2 text-left"
          type="button"
          onClick={onSelect}
        >
          <span className="block text-center text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
            Init
          </span>
          <input
            aria-label={`${combatant.displayName} initiative`}
            className="mt-1 h-16 w-full rounded-xl border border-slate-700 bg-slate-950 px-2 text-center text-5xl font-black leading-none tabular-nums text-white outline-none focus:border-cyan-300"
            type="number"
            value={combatant.initiative ?? ""}
            onChange={(event) =>
              onInitiativeChange(
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
            onClick={(event) => event.stopPropagation()}
          />
        </button>

        <button className="min-w-0 text-left" type="button" onClick={onSelect}>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={combatant.type} />
            {combatant.waveLabel || combatant.groupLabel ? (
              <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-bold text-slate-300">
                {combatant.waveLabel || combatant.groupLabel}
              </span>
            ) : null}
            <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-bold text-slate-400">
              {combatant.accentColor}
            </span>
          </div>

          <h3 className="mt-3 truncate text-2xl font-black text-white">
            {combatant.displayName}
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <strong className="rounded-xl bg-slate-950 px-3 py-2 text-xl text-white">
              AC {combatant.armorClass}
            </strong>
            <strong className="rounded-xl bg-slate-800 px-3 py-2 text-xl text-white">
              HP {combatant.currentHp}/{combatant.maxHp}
            </strong>
            <StatusBadge status={status} />
            <span className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-300">
              {hpPercent}%
            </span>
          </div>

          <div className="mt-3">
            <ConditionBadges conditions={combatant.conditions} />
          </div>
        </button>

        <div className="grid content-between gap-3">
          <HpControls
            currentHp={combatant.currentHp}
            maxHp={combatant.maxHp}
            onDamage={onDamage}
            onHealing={onHealing}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              className="h-10 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 text-sm font-bold text-cyan-100 transition hover:border-cyan-300"
              type="button"
              onClick={onSelect}
            >
              View
            </button>
            <button
              className="h-10 rounded-xl border border-slate-700 px-3 text-sm font-bold text-slate-300 transition hover:border-rose-400 hover:text-rose-200"
              type="button"
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
