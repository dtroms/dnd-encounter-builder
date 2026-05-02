"use client";

import type { EncounterCombatant } from "@/lib/encounter/types";
import {
  getCombatGroupColorClass,
  getCombatGroupRowStyle,
  typeStyles,
} from "@/lib/encounter/colors";
import { getHpPercent, getHpStatus } from "@/lib/encounter/hp";
import { CombatGroupPicker } from "./combat-group-picker";
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
  onUpdateGroup: (updates: {
    combatGroupLabel?: string;
    combatGroupColor?: string;
  }) => void;
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
  onUpdateGroup,
}: CombatantCardProps) {
  const status = getHpStatus(combatant.currentHp, combatant.maxHp);
  const hpPercent = getHpPercent(combatant.currentHp, combatant.maxHp);
  const style = typeStyles[combatant.type];
  const groupColorClass = getCombatGroupColorClass(combatant.combatGroupColor);
  const groupRowStyle = getCombatGroupRowStyle(combatant.combatGroupColor);
  const groupLabel =
    combatant.combatGroupColor && combatant.combatGroupColor !== "None"
      ? combatant.combatGroupLabel || combatant.combatGroupColor
      : "No Group";
  const down = status === "Down";
  const isBoss = combatant.type === "boss";
  const legendaryActions = combatant.legendaryActions ?? [];

  return (
    <article
      className={`relative overflow-visible rounded-xl border py-1.5 pl-2 pr-0 shadow-sm transition ${groupRowStyle.rowTint} ${
        isBoss ? "border-amber-300/35" : groupRowStyle.border
      } ${
        active ? `ring-2 ${style.ring}` : ""
      } ${selected ? "outline outline-2 outline-cyan-300/70" : ""} ${
        down ? "opacity-60 grayscale" : ""
      }`}
      onClick={onSelect}
    >
      {active ? (
        <div className="absolute inset-y-0 left-0 w-1.5 bg-cyan-300" />
      ) : null}
      <div className="grid items-center gap-1 xl:grid-cols-[4.5rem_minmax(9rem,0.72fr)_3rem_16.25rem_0.6rem_4.25rem]">
        <div
          className="rounded-lg border border-slate-700 bg-slate-950/80 p-1 text-left"
          onClick={(event) => event.stopPropagation()}
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
        </div>

        <div className="min-w-0 cursor-pointer text-left">
          <h3 className="truncate text-base font-black text-white">
            {combatant.displayName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={combatant.type} />
            <span className="inline-flex h-5 max-w-36 items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-1.5 text-[10px] font-black text-slate-300">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  groupColorClass ?? "bg-slate-600"
                }`}
              />
              <span className="truncate">{groupLabel}</span>
            </span>
          </div>
        </div>

        <div className="cursor-pointer text-left">
          <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
            AC
          </span>
          <strong className="text-2xl font-black text-white">
            {combatant.armorClass}
          </strong>
        </div>

        <div className="grid grid-cols-[8.25rem_1fr] items-center gap-1">
          <div className="cursor-pointer text-left">
            <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
              HP
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <strong className="text-lg font-black text-white">
                {combatant.currentHp}/{combatant.maxHp}
              </strong>
              <span className="text-xs font-bold text-slate-500">
                {hpPercent}%
              </span>
            </div>
            <div className="mt-0.5">
              <StatusBadge status={status} />
            </div>
          </div>
          <div onClick={(event) => event.stopPropagation()}>
            <HpControls
              currentHp={combatant.currentHp}
              maxHp={combatant.maxHp}
              onDamage={onDamage}
              onHealing={onHealing}
            />
          </div>
        </div>

        <div className={`h-full min-h-14 w-full ${groupColorClass ?? style.dot}`} />
        <div
          className="grid grid-cols-[2rem_2rem] items-center justify-end"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            aria-label={`Remove ${combatant.displayName}`}
            className="h-9 w-8 rounded-l-lg border border-slate-700 bg-slate-950/75 px-2 text-sm font-black text-slate-300 transition hover:border-rose-400 hover:text-rose-200"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            X
          </button>
          <CombatGroupPicker
            combatant={combatant}
            variant="menu"
            onUpdateGroup={onUpdateGroup}
          />
        </div>
      </div>

      {isBoss && legendaryActions.length > 0 ? (
        <section className="ml-[5rem] mr-10 mt-1.5 rounded-lg border border-amber-300/25 bg-slate-950/75 p-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">
            Legendary Actions
          </h4>
          <div className="mt-1.5 grid gap-1.5 md:grid-cols-2">
            {legendaryActions.map((action) => (
              <div
                className="rounded-md border border-amber-300/15 bg-slate-900/90 p-2"
                key={action.name}
              >
                <p className="text-xs font-black text-amber-100">
                  {action.name}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-300">
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
