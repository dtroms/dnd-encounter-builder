"use client";

import { useMemo, useState } from "react";
import type {
  CombatGroup,
  CombatantCondition,
  CreatureTemplate,
  Encounter,
  EncounterCombatant,
} from "@/lib/encounter/types";
import {
  createCombatant,
  sampleCreatureTemplates,
} from "@/lib/encounter/sample-data";
import {
  advanceTurn,
  previousTurn,
  rollEligibleInitiatives,
  rollEligibleInitiativesForGroup,
  rollSharedInitiativeForGroup,
  sortCombatantsByInitiative,
  type SyntheticInitiativeOverrides,
} from "@/lib/encounter/initiative";
import { applyDamage, applyHealing } from "@/lib/encounter/hp";
import { AppShell, type EncounterView } from "./app-shell";
import { CreatureLibrary } from "./creature-library";
import { EncounterBuilder } from "./encounter-builder";
import { EncounterRunner } from "./encounter-runner";
import type { RunnerFilter } from "./initiative-list";
import { SavedEncountersDashboard } from "./saved-encounters-dashboard";
import { StatBlockImporterPlaceholder } from "./stat-block-importer-placeholder";

const starterCombatants = [
  createCombatant(sampleCreatureTemplates[0]),
  createCombatant(sampleCreatureTemplates[1]),
  createCombatant(sampleCreatureTemplates[2]),
  createCombatant(sampleCreatureTemplates[3], 1),
  createCombatant(sampleCreatureTemplates[3], 2),
  createCombatant(sampleCreatureTemplates[4], 1),
  createCombatant(sampleCreatureTemplates[8], 1),
  createCombatant(sampleCreatureTemplates[9], 1),
];

function buildInitialCombatGroups(combatants: EncounterCombatant[]): CombatGroup[] {
  const groups = new Map<string, CombatGroup>();

  combatants.forEach((combatant) => {
    if (!combatant.combatGroupColor || combatant.combatGroupColor === "None") {
      return;
    }

    const name =
      combatant.combatGroupLabel || combatant.combatGroupColor || "Group";
    const id = `${combatant.combatGroupColor}-${name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    groups.set(id, {
      id,
      name,
      color: combatant.combatGroupColor,
    });
  });

  return [...groups.values()];
}

export function EncounterApp() {
  const [activeView, setActiveView] = useState<EncounterView>("encounters");
  const [encounterCampaignId, setEncounterCampaignId] =
    useState("lantern-road");
  const [runnerFilter, setRunnerFilter] = useState<RunnerFilter>("all");
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(
    starterCombatants[0]?.combatantId ?? null,
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    starterCombatants[0]?.combatantId ?? null,
  );
  const [syntheticEntryOverrides, setSyntheticEntryOverrides] =
    useState<SyntheticInitiativeOverrides>({});
  const [combatGroups, setCombatGroups] = useState<CombatGroup[]>(
    buildInitialCombatGroups(starterCombatants),
  );
  const [encounter, setEncounter] = useState<Encounter>({
    id: "local-encounter",
    name: "Lantern Alley Ambush",
    combatants: starterCombatants,
    waves: [{ id: "wave-1", name: "Opening wave" }],
    round: 1,
    turnNumber: 0,
    activeCombatantId: null,
  });

  const activeName = useMemo(() => {
    if (encounter.activeCombatantId === "lair-actions") {
      return syntheticEntryOverrides["lair-actions"]?.displayName ?? "Lair Actions";
    }

    if (encounter.activeCombatantId?.startsWith("lair-")) {
      const ownerId = encounter.activeCombatantId.replace("lair-", "");
      const owner = encounter.combatants.find(
        (combatant) => combatant.combatantId === ownerId,
      );

      return owner ? `${owner.displayName} - Lair Action` : "Lair Action";
    }

    return (
      encounter.combatants.find(
        (combatant) => combatant.combatantId === encounter.activeCombatantId,
      )?.displayName ?? "No active turn"
    );
  }, [encounter.activeCombatantId, encounter.combatants, syntheticEntryOverrides]);

  function updateCombatant(
    combatantId: string,
    updater: (combatant: EncounterCombatant) => EncounterCombatant,
  ) {
    setEncounter((current) => ({
      ...current,
      combatants: current.combatants.map((combatant) =>
        combatant.combatantId === combatantId ? updater(combatant) : combatant,
      ),
    }));
  }

  function addCombatants(template: CreatureTemplate, count: number) {
    setEncounter((current) => {
      const sameTemplateCount = current.combatants.filter(
        (combatant) => combatant.templateId === template.id,
      ).length;
      const additions = Array.from({ length: count }, (_, index) =>
        createCombatant(template, sameTemplateCount + index + 1),
      );

      return {
        ...current,
        combatants: [...current.combatants, ...additions],
        activeCombatantId:
          current.activeCombatantId ?? additions[0]?.combatantId ?? null,
      };
    });
  }

  function duplicateCombatant(combatant: EncounterCombatant) {
    const copy: EncounterCombatant = {
      ...combatant,
      combatantId: `${combatant.templateId}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      displayName: `${combatant.displayName} copy`,
      currentHp: combatant.maxHp,
      initiative: null,
      manualInitiative: combatant.type === "pc",
      conditions: [],
    };

    setEncounter((current) => ({
      ...current,
      combatants: [...current.combatants, copy],
    }));
  }

  function removeCombatant(combatantId: string) {
    setEncounter((current) => {
      const remaining = current.combatants.filter(
        (combatant) => combatant.combatantId !== combatantId,
      );
      const activeOwnerId = current.activeCombatantId?.startsWith("lair-")
        ? current.activeCombatantId.replace("lair-", "")
        : current.activeCombatantId;
      const keepLairTurn =
        current.activeCombatantId === "lair-actions" &&
        remaining.some(
          (combatant) => combatant.lairActions && combatant.lairActions.length > 0,
        );

      return {
        ...current,
        combatants: remaining,
        activeCombatantId: keepLairTurn || remaining.some(
          (combatant) => combatant.combatantId === activeOwnerId,
        )
          ? current.activeCombatantId
          : sortCombatantsByInitiative(remaining)[0]?.combatantId ?? null,
      };
    });

    if (selectedCombatantId === combatantId) {
      setSelectedCombatantId(null);
    }

    if (selectedEntryId === combatantId) {
      setSelectedEntryId(null);
    }
  }

  function patchCombatant(
    combatantId: string,
    updates: Partial<EncounterCombatant>,
  ) {
    updateCombatant(combatantId, (combatant) => ({ ...combatant, ...updates }));
  }

  function renameCombatGroup({
    label,
    color,
    newLabel,
  }: {
    label: string;
    color?: string;
    newLabel: string;
  }) {
    setCombatGroups((current) =>
      current.map((group) =>
        group.name === label && group.color === color
          ? { ...group, name: newLabel }
          : group,
      ),
    );
    setEncounter((current) => ({
      ...current,
      combatants: current.combatants.map((combatant) => {
        const combatantLabel =
          combatant.combatGroupLabel ||
          combatant.combatGroupColor ||
          "Ungrouped";
        const matchesLabel = combatantLabel === label;
        const matchesColor = (combatant.combatGroupColor || "None") === color;

        return matchesLabel && matchesColor
          ? { ...combatant, combatGroupLabel: newLabel }
          : combatant;
      }),
    }));
  }

  function clearCombatGroup({
    label,
    color,
  }: {
    label: string;
    color?: string;
  }) {
    setCombatGroups((current) =>
      current.filter((group) => !(group.name === label && group.color === color)),
    );
    setEncounter((current) => ({
      ...current,
      combatants: current.combatants.map((combatant) => {
        const combatantLabel =
          combatant.combatGroupLabel ||
          combatant.combatGroupColor ||
          "Ungrouped";
        const matchesLabel = combatantLabel === label;
        const matchesColor = (combatant.combatGroupColor || "None") === color;

        return matchesLabel && matchesColor
          ? {
              ...combatant,
              combatGroupLabel: "",
              combatGroupColor: "None",
            }
          : combatant;
      }),
    }));
  }

  function createCombatGroup({
    name,
    color,
  }: {
    name: string;
    color: string;
  }) {
    const id = `${color}-${name}-${Date.now()}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setCombatGroups((current) => {
      const duplicate = current.some(
        (group) =>
          group.name.toLowerCase() === name.toLowerCase() &&
          group.color === color,
      );

      return duplicate ? current : [...current, { id, name, color }];
    });
  }

  function toggleCondition(
    combatantId: string,
    condition: CombatantCondition,
  ) {
    updateCombatant(combatantId, (combatant) => {
      const hasCondition = combatant.conditions.includes(condition);

      return {
        ...combatant,
        conditions: hasCondition
          ? combatant.conditions.filter((item) => item !== condition)
          : [...combatant.conditions, condition],
      };
    });
  }

  function launchRunner() {
    setEncounter((current) => ({
      ...current,
      activeCombatantId:
        current.activeCombatantId ??
        sortCombatantsByInitiative(current.combatants)[0]?.combatantId ??
        null,
    }));
    setActiveView("runner");
  }

  function openBuilder() {
    setActiveView("builder");
  }

  function selectInitiativeEntry(entryId: string, sourceCombatantId: string | null) {
    setSelectedEntryId(entryId);
    setSelectedCombatantId(sourceCombatantId);
  }

  function updateSyntheticEntry(
    entryId: string,
    updates: { displayName?: string; initiative?: number | null },
  ) {
    setSyntheticEntryOverrides((current) => ({
      ...current,
      [entryId]: {
        ...current[entryId],
        ...updates,
      },
    }));
  }

  function rollMonstersAndNpcs() {
    setEncounter((current) => {
      const rolled = rollEligibleInitiatives(current.combatants);
      return {
        ...current,
        combatants: rolled,
        activeCombatantId:
          current.activeCombatantId ??
          sortCombatantsByInitiative(rolled)[0]?.combatantId ??
          null,
      };
    });
  }

  function rollCombatGroupInitiative(group: { label: string; color?: string }) {
    setEncounter((current) => {
      const rolled = rollEligibleInitiativesForGroup(
        current.combatants,
        group,
      );

      return {
        ...current,
        combatants: rolled,
        activeCombatantId:
          current.activeCombatantId ??
          sortCombatantsByInitiative(rolled)[0]?.combatantId ??
          null,
      };
    });
  }

  function rollSharedCombatGroupInitiative(group: {
    label: string;
    color?: string;
  }) {
    setEncounter((current) => {
      const rolled = rollSharedInitiativeForGroup(current.combatants, group);

      return {
        ...current,
        combatants: rolled,
        activeCombatantId:
          current.activeCombatantId ??
          sortCombatantsByInitiative(rolled)[0]?.combatantId ??
          null,
      };
    });
  }

  function sortInitiative() {
    setEncounter((current) => ({
      ...current,
      combatants: sortCombatantsByInitiative(current.combatants),
      activeCombatantId:
        current.activeCombatantId ??
        sortCombatantsByInitiative(current.combatants)[0]?.combatantId ??
        null,
    }));
  }

  function moveTurn(direction: "next" | "previous") {
    setEncounter((current) => {
      const turn =
        direction === "next"
          ? advanceTurn(
              current.combatants,
              current.activeCombatantId,
              current.round,
              current.turnNumber,
              syntheticEntryOverrides,
            )
          : previousTurn(
              current.combatants,
              current.activeCombatantId,
              current.round,
              current.turnNumber,
              syntheticEntryOverrides,
            );

      return { ...current, ...turn };
    });
  }

  return (
    <AppShell
      activeName={activeName}
      activeView={activeView}
      combatantCount={encounter.combatants.length}
      encounterName={encounter.name}
      round={encounter.round}
      onViewChange={(view) => (view === "runner" ? launchRunner() : setActiveView(view))}
    >
      {activeView === "encounters" ? (
        <SavedEncountersDashboard
          onCreateNew={openBuilder}
          onOpenBuilder={openBuilder}
          onOpenRunner={launchRunner}
        />
      ) : null}

      {activeView === "builder" ? (
        <EncounterBuilder
          campaignId={encounterCampaignId}
          combatGroups={combatGroups}
          combatants={encounter.combatants}
          encounterName={encounter.name}
          templates={sampleCreatureTemplates}
          onCampaignChange={setEncounterCampaignId}
          onCreateGroup={createCombatGroup}
          onAdd={addCombatants}
          onDuplicate={duplicateCombatant}
          onLaunchRunner={launchRunner}
          onRemove={removeCombatant}
          onUpdate={patchCombatant}
        />
      ) : null}

      {activeView === "runner" ? (
        <EncounterRunner
          activeCombatantId={encounter.activeCombatantId}
          addPanelOpen={addPanelOpen}
          combatGroups={combatGroups}
          combatants={encounter.combatants}
          encounterName={encounter.name}
          round={encounter.round}
          runnerFilter={runnerFilter}
          selectedCombatantId={selectedCombatantId}
          selectedEntryId={selectedEntryId}
          syntheticEntryOverrides={syntheticEntryOverrides}
          templates={sampleCreatureTemplates}
          turnNumber={encounter.turnNumber}
          onAdd={addCombatants}
          onDamage={(combatantId, amount) =>
            updateCombatant(combatantId, (combatant) => ({
              ...combatant,
              currentHp: applyDamage(combatant.currentHp, amount),
            }))
          }
          onFilterChange={setRunnerFilter}
          onHealing={(combatantId, amount) =>
            updateCombatant(combatantId, (combatant) => ({
              ...combatant,
              currentHp: applyHealing(
                combatant.currentHp,
                combatant.maxHp,
                amount,
              ),
            }))
          }
          onInitiativeChange={(combatantId, initiative) =>
            updateCombatant(combatantId, (combatant) => ({
              ...combatant,
              initiative,
              manualInitiative: true,
            }))
          }
          onNameChange={(combatantId, name) =>
            patchCombatant(combatantId, { displayName: name })
          }
          onSelectEntry={selectInitiativeEntry}
          onSyntheticEntryInitiativeChange={(entryId, initiative) =>
            updateSyntheticEntry(entryId, { initiative })
          }
          onSyntheticEntryNameChange={(entryId, displayName) =>
            updateSyntheticEntry(entryId, { displayName })
          }
          onUpdateGroup={(combatantId, updates) =>
            patchCombatant(combatantId, updates)
          }
          onClearGroup={clearCombatGroup}
          onCreateGroup={createCombatGroup}
          onRenameGroup={renameCombatGroup}
          onRollGroupInitiative={rollCombatGroupInitiative}
          onRollSharedGroupInitiative={rollSharedCombatGroupInitiative}
          onToggleCondition={toggleCondition}
          onNextTurn={() => moveTurn("next")}
          onPreviousTurn={() => moveTurn("previous")}
          onRemove={removeCombatant}
          onRollEligible={rollMonstersAndNpcs}
          onSort={sortInitiative}
          onToggleAddPanel={() => setAddPanelOpen((open) => !open)}
        />
      ) : null}

      {activeView === "library" ? (
        <CreatureLibrary
          onOpenBuilder={openBuilder}
          onOpenImporter={() => setActiveView("importer")}
        />
      ) : null}

      {activeView === "importer" ? <StatBlockImporterPlaceholder /> : null}
    </AppShell>
  );
}
