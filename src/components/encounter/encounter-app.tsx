"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthScreen } from "@/components/auth/auth-screen";
import type {
  CombatGroup,
  CombatantCondition,
  CreatureTemplate,
  Encounter,
  EncounterCombatant,
  EncounterWave,
  SpellEffect,
} from "@/lib/encounter/types";
import {
  createCombatant,
  sampleCreatureTemplates,
} from "@/lib/encounter/sample-data";
import {
  archiveOrDeleteCreatureTemplate as archiveOrDeleteCreatureTemplateRecord,
  createCreatureTemplate as createCreatureTemplateRecord,
  duplicateCreatureTemplate as duplicateCreatureTemplateRecord,
  fetchCreatureTemplates,
  updateCreatureTemplate as updateCreatureTemplateRecord,
} from "@/lib/encounter/creature-queries";
import {
  libraryCreatures,
  type LibraryCreature,
} from "@/lib/encounter/library-sample-data";
import { creatureTemplateRecordToLibraryCreature } from "@/lib/encounter/mappers";
import {
  advanceTurn,
  previousTurn,
  rollInitiative,
  rollEligibleInitiatives,
  rollEligibleInitiativesForGroup,
  rollSharedInitiativeForGroup,
  sortCombatantsByInitiative,
  type SyntheticInitiativeOverrides,
} from "@/lib/encounter/initiative";
import { applyDamage, applyHealing } from "@/lib/encounter/hp";
import {
  getCurrentSession,
  isLocalDemoModeEnabled,
  isSupabaseConfigured,
  onAuthStateChange,
  signOut,
} from "@/lib/supabase/auth";
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
].map((combatant) => ({
  ...combatant,
  waveId: "wave-1",
  waveLabel: "Wave 1",
}));

function buildInitialCombatGroups(combatants: EncounterCombatant[]): CombatGroup[] {
  const groups = new Map<string, CombatGroup>();

  combatants.forEach((combatant) => {
    if (!combatant.combatGroupColor || combatant.combatGroupColor === "None") {
      return;
    }

    const name =
      combatant.combatGroupLabel || combatant.combatGroupColor || "Group";
    const id =
      combatant.combatGroupId ??
      createLocalCombatGroupId(name, combatant.combatGroupColor);

    groups.set(id, {
      id,
      name,
      color: combatant.combatGroupColor,
    });
  });

  return [...groups.values()];
}

export function EncounterApp() {
  const supabaseConfigured = isSupabaseConfigured();
  const localDemoModeEnabled = isLocalDemoModeEnabled();
  const authRequired = supabaseConfigured && !localDemoModeEnabled;
  const [authLoading, setAuthLoading] = useState(authRequired);
  const [session, setSession] = useState<Session | null>(null);
  const [activeView, setActiveView] = useState<EncounterView>("encounters");
  const [encounterCampaignId, setEncounterCampaignId] =
    useState("lantern-road");
  const [creatureTemplates, setCreatureTemplates] =
    useState<LibraryCreature[]>(libraryCreatures);
  const [creatureLibraryError, setCreatureLibraryError] = useState<string | null>(
    null,
  );
  const [creatureLibraryLoading, setCreatureLibraryLoading] = useState(false);
  const [creatureLibraryMutating, setCreatureLibraryMutating] = useState(false);
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
    waves: [{ id: "wave-1", name: "Wave 1", deployed: true }],
    round: 1,
    turnNumber: 0,
    activeCombatantId: null,
  });

  useEffect(() => {
    if (!authRequired) {
      return;
    }

    let active = true;

    getCurrentSession()
      .then((currentSession) => {
        if (active) {
          setSession(currentSession);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
        }
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false);
        }
      });

    const unsubscribe = onAuthStateChange((currentSession) => {
      setSession(currentSession);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [authRequired]);

  const useSupabaseCreatureLibrary = Boolean(authRequired && session);

  const deployedCombatants = useMemo(
    () => getDeployedCombatants(encounter.combatants, encounter.waves),
    [encounter.combatants, encounter.waves],
  );

  const activeName = useMemo(() => {
    if (encounter.activeCombatantId === "lair-actions") {
      return syntheticEntryOverrides["lair-actions"]?.displayName ?? "Lair Actions";
    }

    if (encounter.activeCombatantId?.startsWith("lair-")) {
      const ownerId = encounter.activeCombatantId.replace("lair-", "");
      const owner = deployedCombatants.find(
        (combatant) => combatant.combatantId === ownerId,
      );

      return owner ? `${owner.displayName} - Lair Action` : "Lair Action";
    }

    return (
      deployedCombatants.find(
        (combatant) => combatant.combatantId === encounter.activeCombatantId,
      )?.displayName ?? "No active turn"
    );
  }, [deployedCombatants, encounter.activeCombatantId, syntheticEntryOverrides]);

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

  function addCombatants(template: CreatureTemplate, count: number, waveId?: string) {
    setEncounter((current) => {
      const wave = waveId
        ? current.waves.find((item) => item.id === waveId)
        : null;
      const sameTemplateCount = current.combatants.filter(
        (combatant) => combatant.templateId === template.id,
      ).length;
      const additions = Array.from({ length: count }, (_, index) => {
        const combatant = createCombatant(template, sameTemplateCount + index + 1);

        return wave
          ? { ...combatant, waveId: wave.id, waveLabel: wave.name }
          : combatant;
      });

      return {
        ...current,
        combatants: [...current.combatants, ...additions],
        activeCombatantId:
          current.activeCombatantId ?? additions[0]?.combatantId ?? null,
      };
    });
  }

  const reloadCreatureLibrary = useCallback(async () => {
    if (!useSupabaseCreatureLibrary) {
      return;
    }

    setCreatureLibraryLoading(true);
    setCreatureLibraryError(null);

    const result = await fetchCreatureTemplates();

    if (result.error || !result.data) {
      setCreatureLibraryError(result.error ?? "Could not load creature library.");
    } else {
      setCreatureTemplates(
        result.data.map(creatureTemplateRecordToLibraryCreature),
      );
    }

    setCreatureLibraryLoading(false);
  }, [useSupabaseCreatureLibrary]);

  useEffect(() => {
    if (!useSupabaseCreatureLibrary) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void reloadCreatureLibrary();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [reloadCreatureLibrary, useSupabaseCreatureLibrary]);

  async function archiveCreatureTemplate(creatureId: string) {
    if (useSupabaseCreatureLibrary) {
      setCreatureLibraryMutating(true);
      setCreatureLibraryError(null);

      const result = await archiveOrDeleteCreatureTemplateRecord(creatureId);

      if (result.error) {
        setCreatureLibraryError(result.error);
        setCreatureLibraryMutating(false);
        return false;
      }

      setCreatureTemplates((current) =>
        current.filter((creature) => creature.id !== creatureId),
      );
      setCreatureLibraryMutating(false);
      return true;
    }

    setCreatureTemplates((current) =>
      current.filter((creature) => creature.id !== creatureId),
    );

    return true;
  }

  async function createCreatureTemplate(creature: LibraryCreature) {
    if (useSupabaseCreatureLibrary) {
      setCreatureLibraryMutating(true);
      setCreatureLibraryError(null);

      const result = await createCreatureTemplateRecord(creature);

      if (result.error || !result.data) {
        setCreatureLibraryError(result.error ?? "Could not create creature.");
        setCreatureLibraryMutating(false);
        return null;
      }

      const savedCreature = creatureTemplateRecordToLibraryCreature(result.data);
      setCreatureTemplates((current) => [savedCreature, ...current]);
      setCreatureLibraryMutating(false);
      return savedCreature;
    }

    setCreatureTemplates((current) => [creature, ...current]);
    return creature;
  }

  async function updateCreatureTemplate(updatedCreature: LibraryCreature) {
    if (useSupabaseCreatureLibrary) {
      setCreatureLibraryMutating(true);
      setCreatureLibraryError(null);

      const result = await updateCreatureTemplateRecord(
        updatedCreature.id,
        updatedCreature,
      );

      if (result.error || !result.data) {
        setCreatureLibraryError(result.error ?? "Could not update creature.");
        setCreatureLibraryMutating(false);
        return null;
      }

      const savedCreature = creatureTemplateRecordToLibraryCreature(result.data);
      setCreatureTemplates((current) =>
        current.map((creature) =>
          creature.id === savedCreature.id ? savedCreature : creature,
        ),
      );
      syncCombatantExternalSheetFields(savedCreature);
      setCreatureLibraryMutating(false);
      return savedCreature;
    }

    setCreatureTemplates((current) =>
      current.map((creature) =>
        creature.id === updatedCreature.id ? updatedCreature : creature,
      ),
    );
    syncCombatantExternalSheetFields(updatedCreature);
    return updatedCreature;
  }

  async function duplicateCreatureTemplate(creature: LibraryCreature) {
    if (useSupabaseCreatureLibrary) {
      setCreatureLibraryMutating(true);
      setCreatureLibraryError(null);

      const result = await duplicateCreatureTemplateRecord(creature.id);

      if (result.error || !result.data) {
        setCreatureLibraryError(result.error ?? "Could not duplicate creature.");
        setCreatureLibraryMutating(false);
        return null;
      }

      const savedCreature = creatureTemplateRecordToLibraryCreature(result.data);
      setCreatureTemplates((current) => [savedCreature, ...current]);
      setCreatureLibraryMutating(false);
      return savedCreature;
    }

    setCreatureTemplates((current) => [creature, ...current]);
    return creature;
  }

  function syncCombatantExternalSheetFields(updatedCreature: LibraryCreature) {
    setEncounter((current) => ({
      ...current,
      combatants: current.combatants.map((combatant) =>
        combatant.templateId === updatedCreature.id
          ? {
              ...combatant,
              characterSheetTitle: updatedCreature.characterSheetTitle,
              characterSheetUrl: updatedCreature.characterSheetUrl,
              externalSheetNotes: updatedCreature.externalSheetNotes,
            }
          : combatant,
      ),
    }));
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
      spellEffects: [],
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

  function createWave(input: {
    deployed?: boolean;
    description?: string;
    id?: string;
    name: string;
  }) {
    const name = input.name.trim();

    if (!name) {
      return;
    }

    setEncounter((current) => ({
      ...current,
      waves: [
        ...current.waves,
        {
          id: input.id ?? `wave-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          description: input.description?.trim(),
          deployed: input.deployed ?? false,
        },
      ],
    }));
  }

  function updateWave(
    waveId: string,
    updates: Partial<Pick<EncounterWave, "description" | "name">>,
  ) {
    setEncounter((current) => ({
      ...current,
      combatants: updates.name
        ? current.combatants.map((combatant) =>
            combatant.waveId === waveId
              ? { ...combatant, waveLabel: updates.name }
              : combatant,
          )
        : current.combatants,
      waves: current.waves.map((wave) =>
        wave.id === waveId ? { ...wave, ...updates } : wave,
      ),
    }));
  }

  function deleteWave(waveId: string) {
    setEncounter((current) => {
      if (current.waves.length <= 1) {
        return current;
      }

      const remainingWaves = current.waves.filter((wave) => wave.id !== waveId);
      const fallbackWave = remainingWaves[0];

      return {
        ...current,
        combatants: current.combatants.map((combatant) =>
          combatant.waveId === waveId
            ? {
                ...combatant,
                waveId: fallbackWave.id,
                waveLabel: fallbackWave.name,
              }
            : combatant,
        ),
        waves: remainingWaves,
      };
    });
  }

  function deployWave(waveId: string) {
    setEncounter((current) => {
      const wave = current.waves.find((item) => item.id === waveId);

      if (!wave || wave.deployed) {
        return current;
      }

      const combatants = current.combatants.map((combatant) => {
        if (combatant.waveId !== waveId) {
          return combatant;
        }

        if (
          combatant.type === "pc" ||
          !combatant.autoRollEligible ||
          combatant.initiative !== null
        ) {
          return combatant;
        }

        return {
          ...combatant,
          initiative: rollInitiative(combatant.initiativeBonus),
          manualInitiative: false,
        };
      });
      const waves = current.waves.map((item) =>
        item.id === waveId ? { ...item, deployed: true } : item,
      );
      const activeCombatants = getDeployedCombatants(combatants, waves);

      return {
        ...current,
        activeCombatantId:
          current.activeCombatantId ??
          sortCombatantsByInitiative(activeCombatants)[0]?.combatantId ??
          null,
        combatants,
        waves,
      };
    });
  }

  function patchCombatant(
    combatantId: string,
    updates: Partial<EncounterCombatant>,
  ) {
    updateCombatant(combatantId, (combatant) => ({ ...combatant, ...updates }));
  }

  function renameCombatGroup({
    groupId,
    newLabel,
  }: {
    groupId: string;
    newLabel: string;
  }) {
    setCombatGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, name: newLabel } : group,
      ),
    );
    setEncounter((current) => ({
      ...current,
      combatants: current.combatants.map((combatant) =>
        combatant.combatGroupId === groupId
          ? { ...combatant, combatGroupLabel: newLabel }
          : combatant,
      ),
    }));
  }

  function updateCombatGroupColor(groupId: string, color: string) {
    setCombatGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, color } : group,
      ),
    );
    setEncounter((current) => ({
      ...current,
      combatants: current.combatants.map((combatant) =>
        combatant.combatGroupId === groupId
          ? { ...combatant, combatGroupColor: color }
          : combatant,
      ),
    }));
  }

  function clearCombatGroup(groupId: string) {
    unassignCombatGroupMembers(groupId);
  }

  function removeCombatGroup(groupId: string) {
    setCombatGroups((current) => current.filter((group) => group.id !== groupId));
    unassignCombatGroupMembers(groupId);
  }

  function unassignCombatGroupMembers(groupId: string) {
    setEncounter((current) => ({
      ...current,
      combatants: current.combatants.map((combatant) =>
        combatant.combatGroupId === groupId
          ? {
              ...combatant,
              combatGroupId: undefined,
              combatGroupLabel: "",
              combatGroupColor: "None",
            }
          : combatant,
      ),
    }));
  }

  function createCombatGroup({
    name,
    color,
  }: {
    name: string;
    color: string;
  }) {
    const id = `${createLocalCombatGroupId(name, color)}-${Date.now()}`;

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

  function toggleSpellEffect(combatantId: string, effect: SpellEffect) {
    updateCombatant(combatantId, (combatant) => {
      const activeSpellEffects = combatant.spellEffects ?? [];
      const hasEffect = activeSpellEffects.includes(effect);

      return {
        ...combatant,
        spellEffects: hasEffect
          ? activeSpellEffects.filter((item) => item !== effect)
          : [...activeSpellEffects, effect],
      };
    });
  }

  function launchRunner() {
    setEncounter((current) => ({
      ...current,
      activeCombatantId:
        current.activeCombatantId ??
        sortCombatantsByInitiative(
          getDeployedCombatants(current.combatants, current.waves),
        )[0]?.combatantId ??
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
      const deployedIds = new Set(
        getDeployedCombatants(current.combatants, current.waves).map(
          (combatant) => combatant.combatantId,
        ),
      );
      const rolled = rollEligibleInitiatives(
        current.combatants.filter((combatant) =>
          deployedIds.has(combatant.combatantId),
        ),
      );
      const rolledById = new Map(
        rolled.map((combatant) => [combatant.combatantId, combatant]),
      );
      const combatants = current.combatants.map(
        (combatant) => rolledById.get(combatant.combatantId) ?? combatant,
      );
      const activeCombatants = getDeployedCombatants(combatants, current.waves);
      return {
        ...current,
        combatants,
        activeCombatantId:
          current.activeCombatantId ??
          sortCombatantsByInitiative(activeCombatants)[0]?.combatantId ??
          null,
      };
    });
  }

  function rollCombatGroupInitiative(group: { label: string; color?: string }) {
    setEncounter((current) => {
      const activeCombatants = getDeployedCombatants(
        current.combatants,
        current.waves,
      );
      const rolledActive = rollEligibleInitiativesForGroup(
        getDeployedCombatants(current.combatants, current.waves),
        group,
      );
      const rolledById = new Map(
        rolledActive.map((combatant) => [combatant.combatantId, combatant]),
      );
      const combatants = current.combatants.map(
        (combatant) => rolledById.get(combatant.combatantId) ?? combatant,
      );

      return {
        ...current,
        combatants,
        activeCombatantId:
          current.activeCombatantId ??
          sortCombatantsByInitiative(activeCombatants)[0]?.combatantId ??
          null,
      };
    });
  }

  function rollSharedCombatGroupInitiative(group: {
    label: string;
    color?: string;
  }) {
    setEncounter((current) => {
      const activeCombatants = getDeployedCombatants(
        current.combatants,
        current.waves,
      );
      const rolledActive = rollSharedInitiativeForGroup(activeCombatants, group);
      const rolledById = new Map(
        rolledActive.map((combatant) => [combatant.combatantId, combatant]),
      );
      const combatants = current.combatants.map(
        (combatant) => rolledById.get(combatant.combatantId) ?? combatant,
      );

      return {
        ...current,
        combatants,
        activeCombatantId:
          current.activeCombatantId ??
          sortCombatantsByInitiative(rolledActive)[0]?.combatantId ??
          null,
      };
    });
  }

  function sortInitiative() {
    setEncounter((current) => {
      const activeCombatants = getDeployedCombatants(
        current.combatants,
        current.waves,
      );
      const activeIds = new Set(
        activeCombatants.map((combatant) => combatant.combatantId),
      );

      return {
        ...current,
        combatants: [
          ...sortCombatantsByInitiative(activeCombatants),
          ...current.combatants.filter(
            (combatant) => !activeIds.has(combatant.combatantId),
          ),
        ],
        activeCombatantId:
          current.activeCombatantId ??
          sortCombatantsByInitiative(activeCombatants)[0]?.combatantId ??
          null,
      };
    });
  }

  function moveTurn(direction: "next" | "previous") {
    setEncounter((current) => {
      const activeCombatants = getDeployedCombatants(
        current.combatants,
        current.waves,
      );
      const turn =
        direction === "next"
          ? advanceTurn(
              activeCombatants,
              current.activeCombatantId,
              current.round,
              current.turnNumber,
              syntheticEntryOverrides,
            )
          : previousTurn(
              activeCombatants,
              current.activeCombatantId,
              current.round,
              current.turnNumber,
              syntheticEntryOverrides,
            );

      return { ...current, ...turn };
    });
  }

  async function handleSignOut() {
    const result = await signOut();

    if (!result.error) {
      setSession(null);
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080b12] px-4 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 text-center shadow-2xl shadow-black/30">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            D&D Encounter Builder
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-400">
            Checking beta session...
          </p>
        </div>
      </main>
    );
  }

  if (authRequired && !session) {
    return <AuthScreen />;
  }

  return (
    <AppShell
      activeName={activeName}
      activeView={activeView}
      combatantCount={encounter.combatants.length}
      encounterName={encounter.name}
      round={encounter.round}
      authModeLabel={authRequired ? "Signed in beta" : "Local demo mode"}
      userEmail={session?.user.email}
      onSignOut={authRequired ? handleSignOut : undefined}
      onViewChange={(view) => (view === "runner" ? launchRunner() : setActiveView(view))}
    >
      {activeView === "encounters" ? (
        <SavedEncountersDashboard
          useSupabaseData={Boolean(authRequired && session)}
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
          templates={creatureTemplates}
          waves={encounter.waves}
          onCampaignChange={setEncounterCampaignId}
          onCreateWave={createWave}
          onCreateGroup={createCombatGroup}
          onRenameGroup={renameCombatGroup}
          onUpdateGroupColor={updateCombatGroupColor}
          onClearGroup={clearCombatGroup}
          onRemoveGroup={removeCombatGroup}
          onDeleteWave={deleteWave}
          onAdd={addCombatants}
          onDuplicate={duplicateCombatant}
          onLaunchRunner={launchRunner}
          onRemove={removeCombatant}
          onUpdate={patchCombatant}
          onUpdateWave={updateWave}
        />
      ) : null}

      {activeView === "runner" ? (
        <EncounterRunner
          activeCombatantId={encounter.activeCombatantId}
          addPanelOpen={addPanelOpen}
          combatGroups={combatGroups}
          combatants={deployedCombatants}
          encounterName={encounter.name}
          plannedCombatants={encounter.combatants}
          round={encounter.round}
          runnerFilter={runnerFilter}
          selectedCombatantId={selectedCombatantId}
          selectedEntryId={selectedEntryId}
          syntheticEntryOverrides={syntheticEntryOverrides}
          templates={creatureTemplates}
          turnNumber={encounter.turnNumber}
          waves={encounter.waves}
          onAdd={addCombatants}
          onDeployWave={deployWave}
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
          onRemoveGroup={removeCombatGroup}
          onUpdateGroupColor={updateCombatGroupColor}
          onRollGroupInitiative={rollCombatGroupInitiative}
          onRollSharedGroupInitiative={rollSharedCombatGroupInitiative}
          onToggleCondition={toggleCondition}
          onToggleSpellEffect={toggleSpellEffect}
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
          creatures={creatureTemplates}
          errorMessage={creatureLibraryError}
          isBusy={creatureLibraryMutating}
          isLoading={creatureLibraryLoading}
          useSupabaseData={useSupabaseCreatureLibrary}
          onOpenBuilder={openBuilder}
          onOpenImporter={() => setActiveView("importer")}
          onArchiveCreature={archiveCreatureTemplate}
          onCreateCreature={createCreatureTemplate}
          onDuplicateCreature={duplicateCreatureTemplate}
          onRetry={reloadCreatureLibrary}
          onUpdateCreature={updateCreatureTemplate}
        />
      ) : null}

      {activeView === "importer" ? (
        <StatBlockImporterPlaceholder
          existingCreatures={creatureTemplates}
          useSupabaseData={useSupabaseCreatureLibrary}
          onSaveCreature={createCreatureTemplate}
        />
      ) : null}
    </AppShell>
  );
}

function getDeployedCombatants(
  combatants: EncounterCombatant[],
  waves: EncounterWave[],
) {
  const deployedWaveIds = new Set(
    waves.filter((wave) => wave.deployed).map((wave) => wave.id),
  );

  return combatants.filter(
    (combatant) => !combatant.waveId || deployedWaveIds.has(combatant.waveId),
  );
}

function createLocalCombatGroupId(name: string, color?: string) {
  return `${color || "group"}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
