"use client";

import type {
  CombatGroup,
  CombatantCondition,
  CreatureTemplate,
  EncounterCombatant,
} from "@/lib/encounter/types";
import type { SyntheticInitiativeOverrides } from "@/lib/encounter/initiative";
import { AddCombatantPanel } from "./add-combatant-panel";
import { CombatGroupSummary } from "./combat-group-summary";
import { ConditionTrackerPanel } from "./condition-tracker-panel";
import { InitiativeList, type RunnerFilter } from "./initiative-list";
import { RunnerToolbar } from "./runner-toolbar";
import { StatBlockPanel } from "./stat-block-panel";

type EncounterRunnerProps = {
  encounterName: string;
  combatants: EncounterCombatant[];
  combatGroups: CombatGroup[];
  templates: CreatureTemplate[];
  activeCombatantId: string | null;
  selectedCombatantId: string | null;
  selectedEntryId: string | null;
  syntheticEntryOverrides: SyntheticInitiativeOverrides;
  round: number;
  turnNumber: number;
  runnerFilter: RunnerFilter;
  addPanelOpen: boolean;
  onAdd: (template: CreatureTemplate, count: number) => void;
  onRemove: (combatantId: string) => void;
  onSelectEntry: (entryId: string, sourceCombatantId: string | null) => void;
  onDamage: (combatantId: string, amount: number) => void;
  onHealing: (combatantId: string, amount: number) => void;
  onInitiativeChange: (combatantId: string, initiative: number | null) => void;
  onNameChange: (combatantId: string, name: string) => void;
  onSyntheticEntryNameChange: (entryId: string, name: string) => void;
  onSyntheticEntryInitiativeChange: (
    entryId: string,
    initiative: number | null,
  ) => void;
  onUpdateGroup: (
    combatantId: string,
    updates: { combatGroupLabel?: string; combatGroupColor?: string },
  ) => void;
  onRenameGroup: (group: {
    label: string;
    color?: string;
    newLabel: string;
  }) => void;
  onClearGroup: (group: { label: string; color?: string }) => void;
  onCreateGroup: (group: { name: string; color: string }) => void;
  onRollGroupInitiative: (group: { label: string; color?: string }) => void;
  onToggleCondition: (
    combatantId: string,
    condition: CombatantCondition,
  ) => void;
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
  combatGroups,
  templates,
  activeCombatantId,
  selectedCombatantId,
  selectedEntryId,
  syntheticEntryOverrides,
  round,
  turnNumber,
  runnerFilter,
  addPanelOpen,
  onAdd,
  onRemove,
  onSelectEntry,
  onDamage,
  onHealing,
  onInitiativeChange,
  onNameChange,
  onSyntheticEntryNameChange,
  onSyntheticEntryInitiativeChange,
  onUpdateGroup,
  onRenameGroup,
  onClearGroup,
  onCreateGroup,
  onToggleCondition,
  onRollGroupInitiative,
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
    <div className="grid gap-2.5">
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

      <div className="grid gap-2.5 xl:grid-cols-[20rem_minmax(0,0.95fr)_34rem]">
        <aside className="grid content-start gap-2.5">
          <ConditionTrackerPanel
            combatant={selectedCombatant}
            onToggleCondition={(condition) => {
              if (selectedCombatant) {
                onToggleCondition(selectedCombatant.combatantId, condition);
              }
            }}
          />
          <CombatGroupSummary
            combatGroups={combatGroups}
            combatants={combatants}
            onClearGroup={onClearGroup}
            onCreateGroup={onCreateGroup}
            onRenameGroup={onRenameGroup}
            onRollGroupInitiative={onRollGroupInitiative}
          />
        </aside>
        <main className="min-w-0">
          <RunnerControlStrip
            filter={runnerFilter}
            onFilterChange={onFilterChange}
          />
          <InitiativeList
            activeCombatantId={activeCombatantId}
            combatGroups={combatGroups}
            combatants={combatants}
            filter={runnerFilter}
            selectedEntryId={selectedEntryId}
            syntheticEntryOverrides={syntheticEntryOverrides}
            onDamage={onDamage}
            onHealing={onHealing}
            onInitiativeChange={onInitiativeChange}
            onNameChange={onNameChange}
            onSelectEntry={onSelectEntry}
            onSyntheticEntryInitiativeChange={onSyntheticEntryInitiativeChange}
            onSyntheticEntryNameChange={onSyntheticEntryNameChange}
            onUpdateGroup={onUpdateGroup}
            onRemove={onRemove}
          />
        </main>
        <StatBlockPanel combatant={selectedCombatant} />
      </div>
    </div>
  );
}

const filterOptions: Array<{ key: RunnerFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "alive", label: "Alive" },
  { key: "enemies", label: "Enemies" },
  { key: "pcs", label: "PCs" },
];

function RunnerControlStrip({
  filter,
  onFilterChange,
}: {
  filter: RunnerFilter;
  onFilterChange: (filter: RunnerFilter) => void;
}) {
  return (
    <section className="mb-1.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
          Show
        </span>
        {filterOptions.map((item) => (
          <button
            className={`h-7 rounded-md px-2 text-xs font-black transition ${
              filter === item.key
                ? "bg-cyan-300 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
            key={item.key}
            type="button"
            onClick={() => onFilterChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        className="h-7 rounded-md border border-dashed border-slate-700 px-2 text-xs font-bold text-slate-500"
        type="button"
      >
        Add Wave later
      </button>
    </section>
  );
}
