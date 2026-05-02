"use client";

import type { EncounterCombatant } from "@/lib/encounter/types";
import { getHpStatus } from "@/lib/encounter/hp";
import { sortCombatantsByInitiative } from "@/lib/encounter/initiative";
import { CombatantCard } from "./combatant-card";
import { EmptyState } from "./empty-state";

export type RunnerFilter = "all" | "alive" | "enemies" | "pcs";

type InitiativeListProps = {
  combatants: EncounterCombatant[];
  filter: RunnerFilter;
  activeCombatantId: string | null;
  selectedCombatantId: string | null;
  onSelect: (combatantId: string) => void;
  onRemove: (combatantId: string) => void;
  onDamage: (combatantId: string, amount: number) => void;
  onHealing: (combatantId: string, amount: number) => void;
  onInitiativeChange: (combatantId: string, initiative: number | null) => void;
};

export function InitiativeList({
  combatants,
  filter,
  activeCombatantId,
  selectedCombatantId,
  onSelect,
  onRemove,
  onDamage,
  onHealing,
  onInitiativeChange,
}: InitiativeListProps) {
  const ordered = sortCombatantsByInitiative(combatants).filter((combatant) => {
    if (filter === "alive") return getHpStatus(combatant.currentHp, combatant.maxHp) !== "Down";
    if (filter === "enemies") return combatant.type === "enemy" || combatant.type === "boss";
    if (filter === "pcs") return combatant.type === "pc";
    return true;
  });

  if (ordered.length === 0) {
    return (
      <EmptyState
        detail="Add combatants or adjust the runner filter to see cards here."
        title="No combatants in this view"
      />
    );
  }

  return (
    <div className="grid gap-1.5">
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
        />
      ))}
    </div>
  );
}
