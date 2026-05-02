"use client";

import type {
  CombatantType,
  CreatureTemplate,
  EncounterCombatant,
} from "@/lib/encounter/types";
import { typeStyles } from "@/lib/encounter/sample-data";
import { AddCombatantPanel } from "./add-combatant-panel";

const combatantTypes: CombatantType[] = [
  "pc",
  "ally",
  "enemy",
  "boss",
  "summon",
  "neutral",
];

type EncounterBuilderProps = {
  combatants: EncounterCombatant[];
  templates: CreatureTemplate[];
  onAdd: (template: CreatureTemplate, count: number) => void;
  onRemove: (combatantId: string) => void;
  onUpdate: (
    combatantId: string,
    updates: Partial<EncounterCombatant>,
  ) => void;
  onLaunchRunner: () => void;
};

export function EncounterBuilder({
  combatants,
  templates,
  onAdd,
  onRemove,
  onUpdate,
  onLaunchRunner,
}: EncounterBuilderProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(34rem,1.1fr)]">
      <AddCombatantPanel templates={templates} onAdd={onAdd} />

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-zinc-950">
              Current Encounter Roster
            </h2>
            <p className="text-sm text-zinc-600">
              Rename, tune stats, set groups, and prepare initiative.
            </p>
          </div>
          <button
            className="h-11 rounded-md bg-amber-500 px-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400"
            type="button"
            onClick={onLaunchRunner}
          >
            Go to Runner
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {combatants.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-600">
              Add sample creatures to start building the encounter.
            </div>
          ) : null}

          {combatants.map((combatant) => {
            const style = typeStyles[combatant.type];

            return (
              <div
                className={`rounded-lg border-l-4 bg-zinc-50 p-3 ${style.accent}`}
                key={combatant.combatantId}
              >
                <div className="grid gap-3 lg:grid-cols-[1fr_8rem_8rem_8rem_8rem_8rem]">
                  <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Name
                    <input
                      className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-zinc-950"
                      value={combatant.displayName}
                      onChange={(event) =>
                        onUpdate(combatant.combatantId, {
                          displayName: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Type
                    <select
                      className="h-10 rounded-md border border-zinc-300 bg-white px-2 text-sm font-semibold normal-case tracking-normal text-zinc-950"
                      value={combatant.type}
                      onChange={(event) =>
                        onUpdate(combatant.combatantId, {
                          type: event.target.value as CombatantType,
                          autoRollEligible: event.target.value !== "pc",
                        })
                      }
                    >
                      {combatantTypes.map((type) => (
                        <option key={type} value={type}>
                          {typeStyles[type].label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Group
                    <input
                      className="h-10 rounded-md border border-zinc-300 bg-white px-2 text-sm font-semibold normal-case tracking-normal text-zinc-950"
                      value={combatant.color}
                      onChange={(event) =>
                        onUpdate(combatant.combatantId, {
                          color: event.target.value,
                        })
                      }
                    />
                  </label>

                  <NumberField
                    label="AC"
                    value={combatant.armorClass}
                    onChange={(armorClass) =>
                      onUpdate(combatant.combatantId, { armorClass })
                    }
                  />
                  <NumberField
                    label="Max HP"
                    value={combatant.maxHp}
                    onChange={(maxHp) =>
                      onUpdate(combatant.combatantId, {
                        maxHp,
                        currentHp: Math.min(combatant.currentHp, maxHp),
                      })
                    }
                  />
                  <NumberField
                    label="Cur HP"
                    value={combatant.currentHp}
                    onChange={(currentHp) =>
                      onUpdate(combatant.combatantId, { currentHp })
                    }
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <NumberField
                    label="Init bonus"
                    value={combatant.initiativeBonus}
                    onChange={(initiativeBonus) =>
                      onUpdate(combatant.combatantId, { initiativeBonus })
                    }
                  />
                  <button
                    className="h-10 rounded-md border border-zinc-300 px-3 text-sm font-bold text-zinc-700 transition hover:border-rose-700 hover:text-rose-700"
                    type="button"
                    onClick={() => onRemove(combatant.combatantId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
      {label}
      <input
        className="h-10 rounded-md border border-zinc-300 bg-white px-2 text-sm font-semibold normal-case tracking-normal text-zinc-950"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
