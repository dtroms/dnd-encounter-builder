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
import {
  creatureTemplateRecordToLibraryCreature,
  encounterCombatantRecordToEncounterCombatant,
} from "@/lib/encounter/mappers";
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
import type { InitiativeEntryRecord } from "@/lib/encounter/db-types";
import {
  clearCombatGroup as clearRunnerCombatGroup,
  createCombatGroup as createRunnerCombatGroup,
  fetchRunnerEncounterState,
  removeCombatGroup as removeRunnerCombatGroup,
  updateCombatantRuntimeState,
  updateCombatGroup as updateRunnerCombatGroup,
  updateEncounterRoundAndTurn,
  updateInitiativeEntry,
  updateWaveDeployment,
} from "@/lib/encounter/runner-queries";
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
  const useLocalSampleData = !supabaseConfigured || localDemoModeEnabled;
  const authRequired = supabaseConfigured && !localDemoModeEnabled;
  const [authLoading, setAuthLoading] = useState(authRequired);
  const [session, setSession] = useState<Session | null>(null);
  const [activeView, setActiveView] = useState<EncounterView>("encounters");
  const [encounterCampaignId, setEncounterCampaignId] =
    useState("lantern-road");
  const [creatureTemplates, setCreatureTemplates] =
    useState<LibraryCreature[]>(useLocalSampleData ? libraryCreatures : []);
  const [creatureLibraryError, setCreatureLibraryError] = useState<string | null>(
    null,
  );
  const [creatureLibraryLoading, setCreatureLibraryLoading] = useState(false);
  const [creatureLibraryMutating, setCreatureLibraryMutating] = useState(false);
  const [runnerFilter, setRunnerFilter] = useState<RunnerFilter>("all");
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(
    useLocalSampleData ? starterCombatants[0]?.combatantId ?? null : null,
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    useLocalSampleData ? starterCombatants[0]?.combatantId ?? null : null,
  );
  const [syntheticEntryOverrides, setSyntheticEntryOverrides] =
    useState<SyntheticInitiativeOverrides>({});
  const [runnerInitiativeEntryIds, setRunnerInitiativeEntryIds] = useState<
    Record<string, string>
  >({});
  const [runnerEncounterId, setRunnerEncounterId] = useState<string | null>(null);
  const [runnerLoading, setRunnerLoading] = useState(false);
  const [runnerError, setRunnerError] = useState<string | null>(null);
  const [runnerSaveMessage, setRunnerSaveMessage] = useState("");
  const [combatGroups, setCombatGroups] = useState<CombatGroup[]>(
    useLocalSampleData ? buildInitialCombatGroups(starterCombatants) : [],
  );
  const [encounter, setEncounter] = useState<Encounter>({
    id: useLocalSampleData ? "local-encounter" : "signed-in-empty-encounter",
    name: useLocalSampleData ? "Lantern Alley Ambush" : "No encounter selected",
    combatants: useLocalSampleData ? starterCombatants : [],
    waves: useLocalSampleData
      ? [{ id: "wave-1", name: "Wave 1", deployed: true }]
      : [],
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
  const useSupabaseRunnerState = Boolean(authRequired && session);

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

  const loadRunnerEncounter = useCallback(
    async (encounterId: string) => {
      if (!useSupabaseRunnerState) {
        return;
      }

      setRunnerLoading(true);
      setRunnerError(null);
      setRunnerSaveMessage("");

      const result = await fetchRunnerEncounterState(encounterId);

      if (result.error || !result.data) {
        setRunnerError(result.error ?? "Could not load Runner state.");
        setRunnerLoading(false);
        return;
      }

      const groupById = new Map(
        result.data.combatGroups.map((group) => [group.id, group]),
      );
      const combatants = result.data.combatants.map((record) => {
        const combatant = encounterCombatantRecordToEncounterCombatant(record);
        const group = record.combat_group_id
          ? groupById.get(record.combat_group_id)
          : null;

        return group
          ? {
              ...combatant,
              combatGroupColor: group.color_key,
              combatGroupId: group.id,
              combatGroupLabel: group.name,
            }
          : combatant;
      });
      const waves = result.data.waves.map((wave) => ({
        id: wave.id,
        name: wave.name,
        description: wave.description ?? undefined,
        deployed: wave.deployed,
      }));
      const entryMapping = buildInitiativeEntryMapping(result.data.initiativeEntries);
      const syntheticOverrides = buildSyntheticOverrides(
        result.data.initiativeEntries,
      );
      const activeCombatantId = getLocalEntryId(
        result.data.encounter.active_entry_id,
        result.data.initiativeEntries,
      );
      const selectedLocalEntryId = getLocalEntryId(
        result.data.encounter.selected_entry_id,
        result.data.initiativeEntries,
      );

      setRunnerInitiativeEntryIds(entryMapping);
      setSyntheticEntryOverrides(syntheticOverrides);
      setCombatGroups(
        result.data.combatGroups.map((group) => ({
          color: group.color_key,
          id: group.id,
          name: group.name,
        })),
      );
      setEncounter({
        id: result.data.encounter.id,
        name: result.data.encounter.name,
        activeCombatantId:
          activeCombatantId ??
          sortCombatantsByInitiative(getDeployedCombatants(combatants, waves))[0]
            ?.combatantId ??
          null,
        combatants,
        round: result.data.encounter.current_round,
        turnNumber: result.data.encounter.current_turn_index,
        waves: waves.length
          ? waves
          : [{ id: "wave-local-fallback", name: "Wave 1", deployed: true }],
      });
      setSelectedEntryId(selectedLocalEntryId ?? combatants[0]?.combatantId ?? null);
      setSelectedCombatantId(
        selectedLocalEntryId && selectedLocalEntryId !== "lair-actions"
          ? selectedLocalEntryId
          : combatants[0]?.combatantId ?? null,
      );
      setRunnerLoading(false);
    },
    [useSupabaseRunnerState],
  );

  useEffect(() => {
    if (
      !useSupabaseRunnerState ||
      activeView !== "runner" ||
      !runnerEncounterId
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadRunnerEncounter(runnerEncounterId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeView, loadRunnerEncounter, runnerEncounterId, useSupabaseRunnerState]);

  function noteRunnerSaveError(error: string | null | undefined) {
    if (error) {
      setRunnerSaveMessage(`Save failed: ${error}`);
    }
  }

  function getDbEntryId(localEntryId: string | null | undefined) {
    return localEntryId ? runnerInitiativeEntryIds[localEntryId] ?? null : null;
  }

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

  async function saveImportedCreatureTemplate(creature: LibraryCreature) {
    if (useSupabaseCreatureLibrary) {
      setCreatureLibraryMutating(true);
      setCreatureLibraryError(null);

      const result = await createCreatureTemplateRecord(creature);

      if (result.error || !result.data) {
        const message = result.error ?? "Could not create imported creature.";
        setCreatureLibraryError(message);
        setCreatureLibraryMutating(false);
        throw new Error(message);
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

    if (useSupabaseRunnerState) {
      void updateWaveDeployment(waveId, true).then((result) =>
        noteRunnerSaveError(result.error),
      );
    }
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

    if (useSupabaseRunnerState) {
      void updateRunnerCombatGroup(groupId, { name: newLabel }).then((result) =>
        noteRunnerSaveError(result.error),
      );
    }
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

    if (useSupabaseRunnerState) {
      void updateRunnerCombatGroup(groupId, { colorKey: color }).then((result) =>
        noteRunnerSaveError(result.error),
      );
    }
  }

  function clearCombatGroup(groupId: string) {
    unassignCombatGroupMembers(groupId);

    if (useSupabaseRunnerState) {
      void clearRunnerCombatGroup(groupId).then((result) =>
        noteRunnerSaveError(result.error),
      );
    }
  }

  function removeCombatGroup(groupId: string) {
    setCombatGroups((current) => current.filter((group) => group.id !== groupId));
    unassignCombatGroupMembers(groupId);

    if (useSupabaseRunnerState) {
      void removeRunnerCombatGroup(groupId).then((result) =>
        noteRunnerSaveError(result.error),
      );
    }
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
    if (useSupabaseRunnerState) {
      void createRunnerCombatGroup(encounter.id, {
        colorKey: color,
        name,
        sortOrder: combatGroups.length,
      }).then((result) => {
        if (result.error || !result.data) {
          noteRunnerSaveError(result.error ?? "Could not create combat group.");
          return;
        }

        setCombatGroups((current) => [
          ...current,
          {
            color: result.data.color_key,
            id: result.data.id,
            name: result.data.name,
          },
        ]);
      });
      return;
    }

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
    let nextConditions: CombatantCondition[] = [];

    updateCombatant(combatantId, (combatant) => {
      const hasCondition = combatant.conditions.includes(condition);
      nextConditions = hasCondition
        ? combatant.conditions.filter((item) => item !== condition)
        : [...combatant.conditions, condition];

      return {
        ...combatant,
        conditions: nextConditions,
      };
    });

    if (useSupabaseRunnerState) {
      void updateCombatantRuntimeState(combatantId, {
        conditions: nextConditions,
      }).then((result) => noteRunnerSaveError(result.error));
    }
  }

  function toggleSpellEffect(combatantId: string, effect: SpellEffect) {
    let nextSpellEffects: SpellEffect[] = [];

    updateCombatant(combatantId, (combatant) => {
      const activeSpellEffects = combatant.spellEffects ?? [];
      const hasEffect = activeSpellEffects.includes(effect);
      nextSpellEffects = hasEffect
        ? activeSpellEffects.filter((item) => item !== effect)
        : [...activeSpellEffects, effect];

      return {
        ...combatant,
        spellEffects: nextSpellEffects,
      };
    });

    if (useSupabaseRunnerState) {
      void updateCombatantRuntimeState(combatantId, {
        spellEffects: nextSpellEffects,
      }).then((result) => noteRunnerSaveError(result.error));
    }
  }

  function launchRunner(encounterId?: string) {
    if (encounterId) {
      setRunnerEncounterId(encounterId);
    }

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

    if (useSupabaseRunnerState) {
      void updateEncounterRoundAndTurn(encounter.id, {
        activeEntryId: getDbEntryId(encounter.activeCombatantId),
        currentRound: encounter.round,
        currentTurnIndex: encounter.turnNumber,
        selectedEntryId: getDbEntryId(entryId),
      }).then((result) => noteRunnerSaveError(result.error));
    }
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

    if (useSupabaseRunnerState) {
      const dbEntryId = getDbEntryId(entryId);

      if (dbEntryId) {
        void updateInitiativeEntry(dbEntryId, {
          displayName: updates.displayName,
          initiativeManuallySet:
            updates.initiative !== undefined ? true : undefined,
          initiativeValue: updates.initiative,
        }).then((result) => noteRunnerSaveError(result.error));
      }
    }
  }

  function rollMonstersAndNpcs() {
    let changedCombatants: EncounterCombatant[] = [];

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
      changedCombatants = combatants.filter((combatant) =>
        rolledById.has(combatant.combatantId),
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

    if (useSupabaseRunnerState) {
      changedCombatants.forEach((combatant) => {
        void updateCombatantRuntimeState(combatant.combatantId, {
          initiativeManuallySet: combatant.manualInitiative,
          initiativeValue: combatant.initiative,
        }).then((result) => noteRunnerSaveError(result.error));
        const entryId = getDbEntryId(combatant.combatantId);
        if (entryId) {
          void updateInitiativeEntry(entryId, {
            initiativeManuallySet: combatant.manualInitiative,
            initiativeValue: combatant.initiative,
          }).then((result) => noteRunnerSaveError(result.error));
        }
      });
    }
  }

  function rollCombatGroupInitiative(group: { label: string; color?: string }) {
    let changedCombatants: EncounterCombatant[] = [];

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
      changedCombatants = combatants.filter((combatant) =>
        rolledById.has(combatant.combatantId),
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

    if (useSupabaseRunnerState) {
      persistInitiatives(changedCombatants);
    }
  }

  function rollSharedCombatGroupInitiative(group: {
    label: string;
    color?: string;
  }) {
    let changedCombatants: EncounterCombatant[] = [];

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
      changedCombatants = combatants.filter((combatant) =>
        rolledById.has(combatant.combatantId),
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

    if (useSupabaseRunnerState) {
      persistInitiatives(changedCombatants);
    }
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
    const nextTurn =
      direction === "next"
        ? advanceTurn(
            deployedCombatants,
            encounter.activeCombatantId,
            encounter.round,
            encounter.turnNumber,
            syntheticEntryOverrides,
          )
        : previousTurn(
            deployedCombatants,
            encounter.activeCombatantId,
            encounter.round,
            encounter.turnNumber,
            syntheticEntryOverrides,
          );

    setEncounter((current) => {
      return { ...current, ...nextTurn };
    });

    if (useSupabaseRunnerState) {
      void updateEncounterRoundAndTurn(encounter.id, {
        activeEntryId: getDbEntryId(nextTurn.activeCombatantId),
        currentRound: nextTurn.round,
        currentTurnIndex: nextTurn.turnNumber,
        selectedEntryId: getDbEntryId(selectedEntryId),
      }).then((result) => noteRunnerSaveError(result.error));
    }
  }

  function persistInitiatives(combatants: EncounterCombatant[]) {
    combatants.forEach((combatant) => {
      void updateCombatantRuntimeState(combatant.combatantId, {
        initiativeManuallySet: combatant.manualInitiative,
        initiativeValue: combatant.initiative,
      }).then((result) => noteRunnerSaveError(result.error));
      const entryId = getDbEntryId(combatant.combatantId);
      if (entryId) {
        void updateInitiativeEntry(entryId, {
          initiativeManuallySet: combatant.manualInitiative,
          initiativeValue: combatant.initiative,
        }).then((result) => noteRunnerSaveError(result.error));
      }
    });
  }

  function damageCombatant(combatantId: string, amount: number) {
    let nextHp: number | null = null;

    updateCombatant(combatantId, (combatant) => {
      nextHp = applyDamage(combatant.currentHp, amount);
      return { ...combatant, currentHp: nextHp };
    });

    if (useSupabaseRunnerState && nextHp !== null) {
      void updateCombatantRuntimeState(combatantId, { currentHp: nextHp }).then(
        (result) => noteRunnerSaveError(result.error),
      );
    }
  }

  function healCombatant(combatantId: string, amount: number) {
    let nextHp: number | null = null;

    updateCombatant(combatantId, (combatant) => {
      nextHp = applyHealing(combatant.currentHp, combatant.maxHp, amount);
      return { ...combatant, currentHp: nextHp };
    });

    if (useSupabaseRunnerState && nextHp !== null) {
      void updateCombatantRuntimeState(combatantId, { currentHp: nextHp }).then(
        (result) => noteRunnerSaveError(result.error),
      );
    }
  }

  function changeCombatantInitiative(
    combatantId: string,
    initiative: number | null,
  ) {
    updateCombatant(combatantId, (combatant) => ({
      ...combatant,
      initiative,
      manualInitiative: true,
    }));

    if (useSupabaseRunnerState) {
      void updateCombatantRuntimeState(combatantId, {
        initiativeManuallySet: true,
        initiativeValue: initiative,
      }).then((result) => noteRunnerSaveError(result.error));
      const entryId = getDbEntryId(combatantId);
      if (entryId) {
        void updateInitiativeEntry(entryId, {
          initiativeManuallySet: true,
          initiativeValue: initiative,
        }).then((result) => noteRunnerSaveError(result.error));
      }
    }
  }

  function renameCombatant(combatantId: string, name: string) {
    patchCombatant(combatantId, { displayName: name });

    if (useSupabaseRunnerState) {
      void updateCombatantRuntimeState(combatantId, {
        displayName: name,
      }).then((result) => noteRunnerSaveError(result.error));
      const entryId = getDbEntryId(combatantId);
      if (entryId) {
        void updateInitiativeEntry(entryId, {
          displayName: name,
        }).then((result) => noteRunnerSaveError(result.error));
      }
    }
  }

  function updateCombatantGroup(
    combatantId: string,
    updates: {
      combatGroupColor?: string;
      combatGroupId?: string;
      combatGroupLabel?: string;
    },
  ) {
    patchCombatant(combatantId, updates);

    if (useSupabaseRunnerState) {
      void updateCombatantRuntimeState(combatantId, {
        combatGroupId: updates.combatGroupId ?? null,
      }).then((result) => noteRunnerSaveError(result.error));
    }
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

      {activeView === "runner" && useSupabaseRunnerState && !runnerEncounterId ? (
        <RunnerStateNotice
          detail="Open an encounter from the Encounters dashboard or Builder to resume saved combat."
          title="No encounter selected"
        />
      ) : null}

      {activeView === "runner" && runnerLoading ? (
        <RunnerStateNotice
          detail="Loading combatants, initiative, groups, waves, and live turn state."
          title="Loading Runner state..."
        />
      ) : null}

      {activeView === "runner" && runnerError ? (
        <RunnerStateNotice
          actionLabel="Try again"
          detail={runnerError}
          title="Could not load Runner state"
          onAction={() => {
            if (runnerEncounterId) {
              void loadRunnerEncounter(runnerEncounterId);
            }
          }}
        />
      ) : null}

      {activeView === "runner" &&
      (!useSupabaseRunnerState || runnerEncounterId) &&
      !runnerLoading &&
      !runnerError ? (
        <EncounterRunner
          activeCombatantId={encounter.activeCombatantId}
          addPanelOpen={addPanelOpen}
          combatGroups={combatGroups}
          combatants={deployedCombatants}
          encounterName={encounter.name}
          plannedCombatants={encounter.combatants}
          round={encounter.round}
          runnerFilter={runnerFilter}
          saveMessage={runnerSaveMessage}
          selectedCombatantId={selectedCombatantId}
          selectedEntryId={selectedEntryId}
          syntheticEntryOverrides={syntheticEntryOverrides}
          templates={creatureTemplates}
          turnNumber={encounter.turnNumber}
          waves={encounter.waves}
          onAdd={addCombatants}
          onDeployWave={deployWave}
          onDamage={damageCombatant}
          onFilterChange={setRunnerFilter}
          onHealing={healCombatant}
          onInitiativeChange={changeCombatantInitiative}
          onNameChange={renameCombatant}
          onSelectEntry={selectInitiativeEntry}
          onSyntheticEntryInitiativeChange={(entryId, initiative) =>
            updateSyntheticEntry(entryId, { initiative })
          }
          onSyntheticEntryNameChange={(entryId, displayName) =>
            updateSyntheticEntry(entryId, { displayName })
          }
          onUpdateGroup={updateCombatantGroup}
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
          onSaveCreature={saveImportedCreatureTemplate}
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

function RunnerStateNotice({
  actionLabel,
  detail,
  title,
  onAction,
}: {
  actionLabel?: string;
  detail: string;
  title: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/80 p-6 text-center">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        {detail}
      </p>
      {onAction && actionLabel ? (
        <button
          className="mt-4 rounded-lg border border-cyan-300/50 bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function buildInitiativeEntryMapping(entries: InitiativeEntryRecord[]) {
  return entries.reduce<Record<string, string>>((acc, entry) => {
    const localId = getLocalEntryId(entry.id, entries);

    if (localId) {
      acc[localId] = entry.id;
    }

    return acc;
  }, {});
}

function buildSyntheticOverrides(
  entries: InitiativeEntryRecord[],
): SyntheticInitiativeOverrides {
  return entries.reduce<SyntheticInitiativeOverrides>((acc, entry) => {
    if (entry.entry_type !== "lair_action") {
      return acc;
    }

    acc["lair-actions"] = {
      displayName: entry.display_name,
      initiative: entry.initiative_value ?? 20,
    };

    return acc;
  }, {});
}

function getLocalEntryId(
  entryId: string | null,
  entries: InitiativeEntryRecord[],
) {
  if (!entryId) {
    return null;
  }

  const entry = entries.find((item) => item.id === entryId);

  if (!entry) {
    return null;
  }

  if (entry.entry_type === "lair_action") {
    return "lair-actions";
  }

  return entry.combatant_id;
}
