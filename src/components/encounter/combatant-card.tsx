"use client";

import type { CombatantType, EncounterCombatant } from "@/lib/encounter/types";
import { getHpStatus } from "@/lib/encounter/hp";
import { typeStyles } from "@/lib/encounter/sample-data";
import { HpControls } from "./hp-controls";

const combatantTypes: CombatantType[] = [
  "pc",
  "ally",
  "enemy",
  "boss",
  "summon",
  "neutral",
];

type CombatantCardProps = {
  combatant: EncounterCombatant;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDamage: (amount: number) => void;
  onHealing: (amount: number) => void;
  onInitiativeChange: (initiative: number | null) => void;
  onTypeChange?: (type: CombatantType) => void;
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
  onTypeChange,
}: CombatantCardProps) {
  const status = getHpStatus(combatant.currentHp, combatant.maxHp);
  const style = typeStyles[combatant.type];

  return (
    <article
      className={`rounded-lg border-l-8 bg-white p-4 shadow-sm ring-1 ring-zinc-200 transition ${style.accent} ${
        active ? "ring-4 ring-zinc-950" : ""
      } ${selected ? "bg-zinc-50" : ""}`}
    >
      <div className="grid gap-4 md:grid-cols-[6.5rem_1fr_12rem]">
        <button
          className="rounded-md border border-zinc-300 bg-zinc-50 p-2 text-left transition hover:border-zinc-900"
          type="button"
          onClick={onSelect}
        >
          <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Init
          </span>
          <input
            aria-label={`${combatant.displayName} initiative`}
            className="mt-1 h-14 w-full rounded-md border border-zinc-300 bg-white px-2 text-center text-4xl font-black tabular-nums text-zinc-950 outline-none focus:border-zinc-900"
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
            <span
              aria-hidden="true"
              className={`h-3 w-3 rounded-full ${style.dot}`}
            />
            <span
              className={`rounded-full border px-2 py-1 text-xs font-bold uppercase tracking-wide ${style.badge}`}
            >
              {style.label}
            </span>
            {onTypeChange ? (
              <select
                aria-label={`${combatant.displayName} type`}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs font-semibold text-zinc-800"
                value={combatant.type}
                onChange={(event) =>
                  onTypeChange(event.target.value as CombatantType)
                }
                onClick={(event) => event.stopPropagation()}
              >
                {combatantTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeStyles[type].label}
                  </option>
                ))}
              </select>
            ) : null}
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">
              {combatant.color}
            </span>
          </div>

          <h3 className="mt-2 truncate text-2xl font-black text-zinc-950">
            {combatant.displayName}
          </h3>

          <div className="mt-3 flex flex-wrap gap-3">
            <strong className="rounded-md bg-zinc-950 px-3 py-2 text-xl text-white">
              AC {combatant.armorClass}
            </strong>
            <strong className="rounded-md bg-zinc-100 px-3 py-2 text-xl text-zinc-950">
              HP {combatant.currentHp}/{combatant.maxHp}
            </strong>
            <span className="rounded-md border border-zinc-300 px-3 py-2 text-base font-bold text-zinc-800">
              {status}
            </span>
          </div>

          <div className="mt-3 flex min-h-7 flex-wrap gap-2">
            {combatant.conditions.length > 0 ? (
              combatant.conditions.map((condition) => (
                <span
                  className="rounded-full bg-zinc-900 px-2 py-1 text-xs font-semibold text-white"
                  key={condition}
                >
                  {condition}
                </span>
              ))
            ) : (
              <span className="text-sm font-medium text-zinc-500">
                No conditions
              </span>
            )}
          </div>
        </button>

        <div className="grid content-between gap-3">
          <HpControls
            currentHp={combatant.currentHp}
            maxHp={combatant.maxHp}
            onDamage={onDamage}
            onHealing={onHealing}
          />
          <button
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-bold text-zinc-700 transition hover:border-rose-700 hover:text-rose-700"
            type="button"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
