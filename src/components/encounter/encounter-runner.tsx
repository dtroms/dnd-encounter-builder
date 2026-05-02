"use client";

import type {
  CombatantType,
  CreatureTemplate,
  EncounterCombatant,
} from "@/lib/encounter/types";
import { InitiativeList } from "./initiative-list";
import { StatBlockPanel } from "./stat-block-panel";
import { AddCombatantPanel } from "./add-combatant-panel";

type EncounterRunnerProps = {
  combatants: EncounterCombatant[];
  templates: CreatureTemplate[];
  activeCombatantId: string | null;
  selectedCombatantId: string | null;
  round: number;
  onAdd: (template: CreatureTemplate, count: number) => void;
  onRemove: (combatantId: string) => void;
  onSelect: (combatantId: string) => void;
  onDamage: (combatantId: string, amount: number) => void;
  onHealing: (combatantId: string, amount: number) => void;
  onInitiativeChange: (combatantId: string, initiative: number | null) => void;
  onTypeChange: (combatantId: string, type: CombatantType) => void;
  onRollEligible: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
};

export function EncounterRunner({
  combatants,
  templates,
  activeCombatantId,
  selectedCombatantId,
  round,
  onAdd,
  onRemove,
  onSelect,
  onDamage,
  onHealing,
  onInitiativeChange,
  onTypeChange,
  onRollEligible,
  onNextTurn,
  onPreviousTurn,
}: EncounterRunnerProps) {
  const selectedCombatant =
    combatants.find(
      (combatant) => combatant.combatantId === selectedCombatantId,
    ) ?? null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <main className="grid gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-zinc-500">
                Live Combat
              </p>
              <h2 className="text-3xl font-black text-zinc-950">
                Round {round}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="h-11 rounded-md border border-zinc-300 px-4 text-sm font-black text-zinc-800 transition hover:border-zinc-950"
                type="button"
                onClick={onPreviousTurn}
              >
                Previous
              </button>
              <button
                className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-black text-white transition hover:bg-zinc-800"
                type="button"
                onClick={onNextTurn}
              >
                Next Turn
              </button>
              <button
                className="h-11 rounded-md bg-amber-500 px-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400"
                type="button"
                onClick={onRollEligible}
              >
                Roll Monsters/NPCs
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            This roll button skips PCs. Player initiative stays manual unless
            changed directly on a card.
          </p>
        </section>

        <InitiativeList
          activeCombatantId={activeCombatantId}
          combatants={combatants}
          selectedCombatantId={selectedCombatantId}
          onDamage={onDamage}
          onHealing={onHealing}
          onInitiativeChange={onInitiativeChange}
          onRemove={onRemove}
          onSelect={onSelect}
          onTypeChange={onTypeChange}
        />
      </main>

      <aside className="grid content-start gap-4">
        <StatBlockPanel combatant={selectedCombatant} />
        <AddCombatantPanel compact templates={templates} onAdd={onAdd} />
      </aside>
    </div>
  );
}
