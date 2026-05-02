"use client";

import type { CreatureTemplate, EncounterCombatant } from "@/lib/encounter/types";
import { AddCombatantPanel } from "./add-combatant-panel";
import { InitiativeList, type RunnerFilter } from "./initiative-list";
import { RunnerToolbar } from "./runner-toolbar";
import { StatBlockPanel } from "./stat-block-panel";
import { UtilityRail } from "./utility-rail";

type EncounterRunnerProps = {
  encounterName: string;
  combatants: EncounterCombatant[];
  templates: CreatureTemplate[];
  activeCombatantId: string | null;
  selectedCombatantId: string | null;
  round: number;
  turnNumber: number;
  runnerFilter: RunnerFilter;
  addPanelOpen: boolean;
  onAdd: (template: CreatureTemplate, count: number) => void;
  onRemove: (combatantId: string) => void;
  onSelect: (combatantId: string) => void;
  onDamage: (combatantId: string, amount: number) => void;
  onHealing: (combatantId: string, amount: number) => void;
  onInitiativeChange: (combatantId: string, initiative: number | null) => void;
  onRollEligible: () => void;
  onSort: () => void;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onFilterChange: (filter: RunnerFilter) => void;
  onToggleAddPanel: () => void;
};

export function EncounterRunner({
  encounterName,
  combatants,
  templates,
  activeCombatantId,
  selectedCombatantId,
  round,
  turnNumber,
  runnerFilter,
  addPanelOpen,
  onAdd,
  onRemove,
  onSelect,
  onDamage,
  onHealing,
  onInitiativeChange,
  onRollEligible,
  onSort,
  onNextTurn,
  onPreviousTurn,
  onFilterChange,
  onToggleAddPanel,
}: EncounterRunnerProps) {
  const selectedCombatant =
    combatants.find(
      (combatant) => combatant.combatantId === selectedCombatantId,
    ) ?? null;
  const activeName =
    combatants.find((combatant) => combatant.combatantId === activeCombatantId)
      ?.displayName ?? "No active turn";

  return (
    <div className="grid gap-4">
      <RunnerToolbar
        currentName={activeName}
        encounterName={encounterName}
        round={round}
        turnNumber={turnNumber}
        onAdd={onToggleAddPanel}
        onNext={onNextTurn}
        onPrevious={onPreviousTurn}
        onRoll={onRollEligible}
        onSort={onSort}
      />

      {addPanelOpen ? (
        <AddCombatantPanel compact templates={templates} onAdd={onAdd} />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_24rem]">
        <UtilityRail
          addPanelOpen={addPanelOpen}
          filter={runnerFilter}
          onFilterChange={onFilterChange}
          onRoll={onRollEligible}
          onToggleAddPanel={onToggleAddPanel}
        />
        <main className="min-w-0">
          <InitiativeList
            activeCombatantId={activeCombatantId}
            combatants={combatants}
            filter={runnerFilter}
            selectedCombatantId={selectedCombatantId}
            onDamage={onDamage}
            onHealing={onHealing}
            onInitiativeChange={onInitiativeChange}
            onRemove={onRemove}
            onSelect={onSelect}
          />
        </main>
        <StatBlockPanel combatant={selectedCombatant} />
      </div>
    </div>
  );
}
