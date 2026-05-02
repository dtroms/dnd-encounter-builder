"use client";

import { useMemo, useState } from "react";
import type {
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
  sortCombatantsByInitiative,
} from "@/lib/encounter/initiative";
import { applyDamage, applyHealing } from "@/lib/encounter/hp";
import { AppShell, type EncounterView } from "./app-shell";
import { EncounterBuilder } from "./encounter-builder";
import { EncounterRunner } from "./encounter-runner";
import type { RunnerFilter } from "./initiative-list";
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

export function EncounterApp() {
  const [activeView, setActiveView] = useState<EncounterView>("builder");
  const [runnerFilter, setRunnerFilter] = useState<RunnerFilter>("all");
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(
    starterCombatants[0]?.combatantId ?? null,
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
  }, [encounter.activeCombatantId, encounter.combatants]);

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

      return {
        ...current,
        combatants: remaining,
        activeCombatantId: remaining.some(
          (combatant) => combatant.combatantId === activeOwnerId,
        )
          ? current.activeCombatantId
          : sortCombatantsByInitiative(remaining)[0]?.combatantId ?? null,
      };
    });

    if (selectedCombatantId === combatantId) {
      setSelectedCombatantId(null);
    }
  }

  function patchCombatant(
    combatantId: string,
    updates: Partial<EncounterCombatant>,
  ) {
    updateCombatant(combatantId, (combatant) => ({ ...combatant, ...updates }));
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
            )
          : previousTurn(
              current.combatants,
              current.activeCombatantId,
              current.round,
              current.turnNumber,
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
      {activeView === "builder" ? (
        <EncounterBuilder
          combatants={encounter.combatants}
          templates={sampleCreatureTemplates}
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
          combatants={encounter.combatants}
          encounterName={encounter.name}
          round={encounter.round}
          runnerFilter={runnerFilter}
          selectedCombatantId={selectedCombatantId}
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
          onToggleCondition={toggleCondition}
          onNextTurn={() => moveTurn("next")}
          onPreviousTurn={() => moveTurn("previous")}
          onRemove={removeCombatant}
          onRollEligible={rollMonstersAndNpcs}
          onSelect={setSelectedCombatantId}
          onSort={sortInitiative}
          onToggleAddPanel={() => setAddPanelOpen((open) => !open)}
        />
      ) : null}

      {activeView === "library" ? (
        <LibraryPreview templates={sampleCreatureTemplates} />
      ) : null}
    </AppShell>
  );
}

function LibraryPreview({ templates }: { templates: CreatureTemplate[] }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Library Preview</h2>
          <p className="mt-1 text-sm text-slate-400">
            Placeholder view for the future creature repository. For now this is
            just the local custom sample set.
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
