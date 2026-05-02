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
      className={`relative overflow-hidden rounded-xl border bg-slate-900/88 px-2 py-2 shadow-sm transition ${
        style.border
      } ${active ? `ring-2 ${style.ring}` : ""} ${
        selected ? "outline outline-2 outline-cyan-300/70" : ""
      } ${down ? "opacity-60 grayscale" : ""}`}
    >
      {active ? (
        <div className="absolute inset-y-0 left-0 w-1.5 bg-cyan-300" />
      ) : null}
      <div className="grid items-center gap-2 xl:grid-cols-[5.25rem_minmax(14rem,1.2fr)_4.5rem_10rem_minmax(8rem,0.7fr)_13rem_5.5rem]">
        <button
          className="rounded-lg border border-slate-700 bg-slate-950/80 p-1 text-left"
          type="button"
          onClick={onSelect}
        >
          <input
            aria-label={`${combatant.displayName} initiative`}
            className="h-12 w-full rounded-md border border-slate-700 bg-slate-950 px-1 text-center text-3xl font-black leading-none tabular-nums text-white outline-none focus:border-cyan-300"
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
          <h3 className="truncate text-base font-black text-white">
            {combatant.displayName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={combatant.type} />
            {combatant.waveLabel || combatant.groupLabel ? (
              <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                {combatant.waveLabel || combatant.groupLabel}
              </span>
            ) : null}
            <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[11px] font-bold text-slate-400">
              {combatant.accentColor}
            </span>
          </div>
        </button>

        <button className="text-left" type="button" onClick={onSelect}>
          <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
            AC
          </span>
          <strong className="text-2xl font-black text-white">
            {combatant.armorClass}
          </strong>
        </button>

        <button className="text-left" type="button" onClick={onSelect}>
          <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
            HP
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <strong className="text-lg font-black text-white">
              {combatant.currentHp}/{combatant.maxHp}
            </strong>
            <span className="text-xs font-bold text-slate-500">{hpPercent}%</span>
          </div>
          <div className="mt-1">
            <StatusBadge status={status} />
          </div>
        </button>

        <button className="min-w-0 text-left" type="button" onClick={onSelect}>
          <ConditionBadges conditions={combatant.conditions} />
        </button>

        <HpControls
          currentHp={combatant.currentHp}
          maxHp={combatant.maxHp}
          onDamage={onDamage}
          onHealing={onHealing}
        />

        <div className="grid grid-cols-2 gap-1.5">
          <button
            className="h-8 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2 text-xs font-bold text-cyan-100 transition hover:border-cyan-300"
            type="button"
            onClick={onSelect}
          >
            View
          </button>
          <button
            aria-label={`Remove ${combatant.displayName}`}
            className="h-8 rounded-lg border border-slate-700 px-2 text-sm font-black text-slate-300 transition hover:border-rose-400 hover:text-rose-200"
            type="button"
            onClick={onRemove}
          >
            X
          </button>
        </div>
      </div>
    </article>
  );
}
