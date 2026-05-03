"use client";

import { useState } from "react";
import type {
  CombatGroup,
  CombatantCondition,
  CreatureTemplate,
  EncounterCombatant,
  EncounterWave,
} from "@/lib/encounter/types";
import type { SyntheticInitiativeOverrides } from "@/lib/encounter/initiative";
import { AddCombatantPanel } from "./add-combatant-panel";
import { CombatGroupSummary } from "./combat-group-summary";
import { ConditionTrackerPanel } from "./condition-tracker-panel";
import { ExternalCharacterSheetViewer } from "./external-character-sheet-viewer";
import { InitiativeList, type RunnerFilter } from "./initiative-list";
import { RunnerToolbar } from "./runner-toolbar";
import { StatBlockPanel } from "./stat-block-panel";

type EncounterRunnerProps = {
  encounterName: string;
  combatants: EncounterCombatant[];
  plannedCombatants: EncounterCombatant[];
  combatGroups: CombatGroup[];
  templates: CreatureTemplate[];
  waves: EncounterWave[];
  activeCombatantId: string | null;
  selectedCombatantId: string | null;
  selectedEntryId: string | null;
  syntheticEntryOverrides: SyntheticInitiativeOverrides;
  round: number;
  turnNumber: number;
  runnerFilter: RunnerFilter;
  addPanelOpen: boolean;
  onAdd: (template: CreatureTemplate, count: number) => void;
  onDeployWave: (waveId: string) => void;
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
  onRollSharedGroupInitiative: (group: {
    label: string;
    color?: string;
  }) => void;
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
  plannedCombatants,
  combatGroups,
  templates,
  waves,
  activeCombatantId,
  selectedCombatantId,
  selectedEntryId,
  syntheticEntryOverrides,
  round,
  turnNumber,
  runnerFilter,
  addPanelOpen,
  onAdd,
  onDeployWave,
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
  onRollSharedGroupInitiative,
  onRollEligible,
  onSort,
  onNextTurn,
  onPreviousTurn,
  onFilterChange,
  onToggleAddPanel,
}: EncounterRunnerProps) {
  const [sheetCombatant, setSheetCombatant] =
    useState<EncounterCombatant | null>(null);
  const selectedCombatant =
    combatants.find(
      (combatant) => combatant.combatantId === selectedCombatantId,
    ) ?? null;
  const activeName =
    combatants.find((combatant) => combatant.combatantId === activeCombatantId)
      ?.displayName ?? "No active turn";

  return (
    <div className="grid gap-2.5">
      <div className="sticky top-2 z-40 rounded-xl bg-slate-950/95 shadow-lg shadow-slate-950/50 backdrop-blur">
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
      </div>

      {addPanelOpen ? (
        <AddCombatantPanel compact templates={templates} onAdd={onAdd} />
      ) : null}

      <div className="grid gap-2.5 xl:grid-cols-[20rem_minmax(0,0.95fr)_34rem]">
        <aside className="xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
          <div className="grid content-start gap-2.5">
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
              onRollSharedGroupInitiative={onRollSharedGroupInitiative}
            />
          </div>
        </aside>
        <main className="min-w-0">
          <RunnerControlStrip
            filter={runnerFilter}
            onFilterChange={onFilterChange}
          />
          <RunnerWavesPanel
            combatants={plannedCombatants}
            waves={waves}
            onDeployWave={onDeployWave}
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
            onViewSheet={setSheetCombatant}
            onRemove={onRemove}
          />
        </main>
        <StatBlockPanel
          combatant={selectedCombatant}
          onViewSheet={setSheetCombatant}
        />
      </div>

      {sheetCombatant?.characterSheetUrl ? (
        <ExternalCharacterSheetViewer
          title={
            sheetCombatant.characterSheetTitle?.trim() ||
            sheetCombatant.displayName
          }
          url={sheetCombatant.characterSheetUrl}
          onClose={() => setSheetCombatant(null)}
        />
      ) : null}
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
      <span className="h-7 rounded-md border border-dashed border-slate-700 px-2 py-1 text-xs font-bold text-slate-500">
        Waves below
      </span>
    </section>
  );
}

function RunnerWavesPanel({
  combatants,
  waves,
  onDeployWave,
}: {
  combatants: EncounterCombatant[];
  waves: EncounterWave[];
  onDeployWave: (waveId: string) => void;
}) {
  const undeployedWaves = waves.filter((wave) => !wave.deployed);
  const deployedWaves = waves.filter((wave) => wave.deployed);

  if (waves.length === 0) {
    return null;
  }

  return (
    <section className="mb-1.5 rounded-xl border border-slate-800 bg-slate-950/70 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Waves / Reinforcements
        </h3>
        <span className="text-[11px] font-bold text-slate-500">
          {undeployedWaves.length} ready
        </span>
      </div>

      {undeployedWaves.length === 0 ? (
        <p className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2 py-1.5 text-xs font-semibold text-emerald-100">
          All planned waves have been deployed.
        </p>
      ) : null}

      <div className="mt-2 grid gap-1.5">
        {undeployedWaves.map((wave) => {
          const members = combatants.filter(
            (combatant) => combatant.waveId === wave.id,
          );

          return (
            <div
              className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-2"
              key={wave.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-amber-100">
                    {wave.name}
                  </p>
                  {wave.description ? (
                    <p className="mt-1 text-xs font-semibold leading-5 text-amber-100/70">
                      {wave.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] font-bold text-slate-400">
                    {members.length} combatants held for deployment
                  </p>
                </div>
                <button
                  className="rounded-lg bg-amber-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={members.length === 0}
                  type="button"
                  onClick={() => onDeployWave(wave.id)}
                >
                  Deploy
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {deployedWaves.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {deployedWaves.map((wave) => (
            <span
              className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-black text-emerald-100"
              key={wave.id}
            >
              {wave.name} deployed
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
