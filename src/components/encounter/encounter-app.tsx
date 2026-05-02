"use client";

import { useMemo, useState } from "react";
import type {
  CombatantType,
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
import { EncounterBuilder } from "./encounter-builder";
import { EncounterRunner } from "./encounter-runner";

type ActiveTab = "builder" | "runner";

const starterCombatants = [
  createCombatant(sampleCreatureTemplates[0]),
  createCombatant(sampleCreatureTemplates[1]),
  createCombatant(sampleCreatureTemplates[2]),
  createCombatant(sampleCreatureTemplates[3], 1),
  createCombatant(sampleCreatureTemplates[3], 2),
  createCombatant(sampleCreatureTemplates[4], 1),
  createCombatant(sampleCreatureTemplates[8], 1),
];

export function EncounterApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("builder");
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(
    starterCombatants[0]?.combatantId ?? null,
  );
  const [encounter, setEncounter] = useState<Encounter>({
    id: "local-encounter",
    name: "Lantern Alley Ambush",
    combatants: starterCombatants,
    waves: [{ id: "wave-1", name: "Opening wave" }],
    round: 1,
    activeCombatantId: null,
  });

  const selectedCount = encounter.combatants.length;
  const activeName = useMemo(() => {
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
      const additions = Array.from({ length: count }, (_, index) =>
        createCombatant(template, current.combatants.length + index + 1),
      );

      return {
        ...current,
        combatants: [...current.combatants, ...additions],
        activeCombatantId:
          current.activeCombatantId ?? additions[0]?.combatantId ?? null,
      };
    });
  }

  function removeCombatant(combatantId: string) {
    setEncounter((current) => {
      const remaining = current.combatants.filter(
        (combatant) => combatant.combatantId !== combatantId,
      );
      const activeStillExists = remaining.some(
        (combatant) => combatant.combatantId === current.activeCombatantId,
      );

      return {
        ...current,
        combatants: remaining,
        activeCombatantId: activeStillExists
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
    updateCombatant(combatantId, (combatant) => ({
      ...combatant,
      ...updates,
    }));
  }

  function launchRunner() {
    setEncounter((current) => ({
      ...current,
      activeCombatantId:
        current.activeCombatantId ??
        sortCombatantsByInitiative(current.combatants)[0]?.combatantId ??
        null,
    }));
    setActiveTab("runner");
  }

  function rollMonstersAndNpcs() {
    setEncounter((current) => ({
      ...current,
      combatants: rollEligibleInitiatives(current.combatants),
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
            )
          : previousTurn(
              current.combatants,
              current.activeCombatantId,
              current.round,
            );

      return { ...current, ...turn };
    });
  }

  return (
    <div className="min-h-screen bg-stone-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-amber-700">
              D&D Encounter Builder
            </p>
            <h1 className="text-3xl font-black tracking-normal text-zinc-950">
              {encounter.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-bold text-zinc-700">
            <span className="rounded-md bg-zinc-100 px-3 py-2">
              {selectedCount} combatants
            </span>
            <span className="rounded-md bg-zinc-100 px-3 py-2">
              Active: {activeName}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <nav className="mb-5 inline-grid grid-cols-2 rounded-lg border border-zinc-300 bg-white p-1">
          <TabButton
            active={activeTab === "builder"}
            label="Encounter Builder"
            onClick={() => setActiveTab("builder")}
          />
          <TabButton
            active={activeTab === "runner"}
            label="Encounter Runner"
            onClick={launchRunner}
          />
        </nav>

        {activeTab === "builder" ? (
          <EncounterBuilder
            combatants={encounter.combatants}
            templates={sampleCreatureTemplates}
            onAdd={addCombatants}
            onLaunchRunner={launchRunner}
            onRemove={removeCombatant}
            onUpdate={patchCombatant}
          />
        ) : (
          <EncounterRunner
            activeCombatantId={encounter.activeCombatantId}
            combatants={encounter.combatants}
            round={encounter.round}
            selectedCombatantId={selectedCombatantId}
            templates={sampleCreatureTemplates}
            onAdd={addCombatants}
            onDamage={(combatantId, amount) =>
              updateCombatant(combatantId, (combatant) => ({
                ...combatant,
                currentHp: applyDamage(combatant.currentHp, amount),
              }))
            }
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
            onNextTurn={() => moveTurn("next")}
            onPreviousTurn={() => moveTurn("previous")}
            onRemove={removeCombatant}
            onRollEligible={rollMonstersAndNpcs}
            onSelect={setSelectedCombatantId}
            onTypeChange={(combatantId, type: CombatantType) =>
              patchCombatant(combatantId, {
                type,
                autoRollEligible: type !== "pc",
              })
            }
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-11 rounded-md px-4 text-sm font-black transition ${
        active
          ? "bg-zinc-950 text-white"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
