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
import { EncounterBuilder } from "./encounter-builder";
import { EncounterRunner } from "./encounter-runner";
import type { RunnerFilter } from "./initiative-list";
import { SavedEncountersDashboard } from "./saved-encounters-dashboard";
import { StatBlockImporterPlaceholder } from "./stat-block-importer-placeholder";
import { TypeBadge } from "./type-badge";

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
        <LibraryPreview templates={sampleCreatureTemplates} />
      ) : null}

      {activeView === "importer" ? <StatBlockImporterPlaceholder /> : null}
    </AppShell>
  );
}

function LibraryPreview({ templates }: { templates: CreatureTemplate[] }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Library</h2>
          <p className="mt-1 text-sm text-slate-400">
            Placeholder view for the future creature repository. For now this
            uses the local custom sample set.
          </p>
        </div>
        <span className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-300">
          {templates.length} templates
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {templates.map((template) => (
          <article
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
            key={template.id}
          >
            <TypeBadge type={template.type} />
            <h3 className="mt-3 text-xl font-black text-white">{template.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {template.size} - {template.speed}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <LibraryStat label="AC" value={String(template.armorClass)} />
              <LibraryStat label="HP" value={String(template.maxHp)} />
              <LibraryStat
                label="Init"
                value={`${template.initiativeBonus >= 0 ? "+" : ""}${template.initiativeBonus}`}
              />
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
              {template.notes}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <span
                  className="rounded-full bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-400"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LibraryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-950 p-2 text-center">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}
