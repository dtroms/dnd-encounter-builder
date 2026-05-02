"use client";

import type { CombatantType, EncounterCombatant } from "@/lib/encounter/types";
import { sortCombatantsByInitiative } from "@/lib/encounter/initiative";
import { CombatantCard } from "./combatant-card";

type InitiativeListProps = {
  combatants: EncounterCombatant[];
  activeCombatantId: string | null;
  selectedCombatantId: string | null;
  onSelect: (combatantId: string) => void;
  onRemove: (combatantId: string) => void;
  onDamage: (combatantId: string, amount: number) => void;
  onHealing: (combatantId: string, amount: number) => void;
  onInitiativeChange: (combatantId: string, initiative: number | null) => void;
  onTypeChange: (combatantId: string, type: CombatantType) => void;
};

export function InitiativeList({
  combatants,
  activeCombatantId,
  selectedCombatantId,
  onSelect,
  onRemove,
  onDamage,
  onHealing,
  onInitiativeChange,
  onTypeChange,
}: InitiativeListProps) {
  const ordered = sortCombatantsByInitiative(combatants);

  if (ordered.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <h2 className="text-xl font-black text-zinc-950">No combatants yet</h2>
        <p className="mt-2 text-zinc-600">
          Add creatures in the builder or use the fast add panel during combat.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {ordered.map((combatant) => (
        <CombatantCard
          active={combatant.combatantId === activeCombatantId}
          combatant={combatant}
          key={combatant.combatantId}
          selected={combatant.combatantId === selectedCombatantId}
          onDamage={(amount) => onDamage(combatant.combatantId, amount)}
          onHealing={(amount) => onHealing(combatant.combatantId, amount)}
          onInitiativeChange={(initiative) =>
            onInitiativeChange(combatant.combatantId, initiative)
          }
          onRemove={() => onRemove(combatant.combatantId)}
          onSelect={() => onSelect(combatant.combatantId)}
          onTypeChange={(type) => onTypeChange(combatant.combatantId, type)}
        />
      ))}
    </div>
  );
}
