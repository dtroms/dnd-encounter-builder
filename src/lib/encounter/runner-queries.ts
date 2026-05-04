import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CombatGroupRecord,
  EncounterCombatantRecord,
  EncounterRecord,
  EncounterWaveRecord,
  InitiativeEntryRecord,
  JsonValue,
} from "./db-types";
import type { CombatantCondition, SpellEffect } from "./types";

export type RunnerQueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type RunnerEncounterState = {
  combatants: EncounterCombatantRecord[];
  combatGroups: CombatGroupRecord[];
  encounter: EncounterRecord;
  initiativeEntries: InitiativeEntryRecord[];
  waves: EncounterWaveRecord[];
};

export type CombatantRuntimeInput = {
  combatGroupId?: string | null;
  conditions?: CombatantCondition[];
  currentHp?: number;
  displayName?: string;
  initiativeManuallySet?: boolean;
  initiativeValue?: number | null;
  notes?: string | null;
  spellEffects?: SpellEffect[];
  temporaryHp?: number | null;
};

export type InitiativeEntryInput = {
  displayName?: string;
  initiativeManuallySet?: boolean;
  initiativeValue?: number | null;
  sortOrder?: number | null;
};

function missingSupabaseResult<T>(): RunnerQueryResult<T> {
  return {
    data: null,
    error: "Supabase is not configured for this environment.",
  };
}

function safeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

function getSupabaseOrMissing<T>() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return { error: missingSupabaseResult<T>().error, supabase: null };
  }

  return { error: null, supabase };
}

export async function fetchRunnerEncounterState(
  encounterId: string,
): Promise<RunnerQueryResult<RunnerEncounterState>> {
  const { error, supabase } = getSupabaseOrMissing<RunnerEncounterState>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  try {
    const [
      encounterResult,
      combatantsResult,
      groupsResult,
      entriesResult,
      wavesResult,
    ] = await Promise.all([
      supabase.from("encounters").select("*").eq("id", encounterId).single(),
      supabase
        .from("encounter_combatants")
        .select("*")
        .eq("encounter_id", encounterId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("combat_groups")
        .select("*")
        .eq("encounter_id", encounterId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("initiative_entries")
        .select("*")
        .eq("encounter_id", encounterId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("encounter_waves")
        .select("*")
        .eq("encounter_id", encounterId)
        .order("sort_order", { ascending: true }),
    ]);

    const firstError =
      encounterResult.error ??
      combatantsResult.error ??
      groupsResult.error ??
      entriesResult.error ??
      wavesResult.error;

    if (firstError || !encounterResult.data) {
      return {
        data: null,
        error: firstError?.message ?? "Could not load Runner encounter state.",
      };
    }

    const encounter = encounterResult.data as EncounterRecord;
    const combatants = (combatantsResult.data ?? []) as EncounterCombatantRecord[];
    let initiativeEntries = (entriesResult.data ?? []) as InitiativeEntryRecord[];

    const ensured = await ensureMissingInitiativeEntries(
      encounterId,
      combatants,
      initiativeEntries,
    );

    if (ensured.error) {
      return { data: null, error: ensured.error };
    }

    initiativeEntries = ensured.data ?? initiativeEntries;

    return {
      data: {
        combatants,
        combatGroups: (groupsResult.data ?? []) as CombatGroupRecord[],
        encounter,
        initiativeEntries,
        waves: (wavesResult.data ?? []) as EncounterWaveRecord[],
      },
      error: null,
    };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not load Runner state."),
    };
  }
}

async function ensureMissingInitiativeEntries(
  encounterId: string,
  combatants: EncounterCombatantRecord[],
  entries: InitiativeEntryRecord[],
): Promise<RunnerQueryResult<InitiativeEntryRecord[]>> {
  const { error, supabase } = getSupabaseOrMissing<InitiativeEntryRecord[]>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  const existingCombatantIds = new Set(
    entries
      .filter((entry) => entry.entry_type === "combatant" && entry.combatant_id)
      .map((entry) => entry.combatant_id),
  );
  const inserts: Array<Record<string, unknown>> = combatants
    .filter((combatant) => !existingCombatantIds.has(combatant.id))
    .map((combatant, index) => ({
      combatant_id: combatant.id,
      display_name: combatant.display_name,
      encounter_id: encounterId,
      entry_type: "combatant",
      initiative_manually_set: combatant.initiative_manually_set,
      initiative_value: combatant.initiative_value,
      is_synthetic: false,
      metadata: {},
      sort_order: combatant.sort_order ?? index,
      source_combatant_id: null,
    }));

  const hasLairEntry = entries.some(
    (entry) => entry.entry_type === "lair_action" && entry.is_synthetic,
  );
  const lairSource = combatants.find(
    (combatant) => combatant.lair_actions.length > 0,
  );

  if (lairSource && !hasLairEntry) {
    inserts.push({
      combatant_id: null,
      display_name: "Lair Actions",
      encounter_id: encounterId,
      entry_type: "lair_action",
      initiative_manually_set: false,
      initiative_value: 20,
      is_synthetic: true,
      metadata: { localEntryId: "lair-actions" },
      sort_order: 0,
      source_combatant_id: lairSource.id,
    });
  }

  if (inserts.length === 0) {
    return { data: entries, error: null };
  }

  const { data, error: insertError } = await supabase
    .from("initiative_entries")
    .insert(inserts)
    .select("*");

  if (insertError) {
    return { data: null, error: insertError.message };
  }

  return {
    data: [...entries, ...((data ?? []) as InitiativeEntryRecord[])],
    error: null,
  };
}

export async function updateEncounterRoundAndTurn(
  encounterId: string,
  input: {
    activeEntryId?: string | null;
    currentRound: number;
    currentTurnIndex: number;
    selectedEntryId?: string | null;
  },
): Promise<RunnerQueryResult<EncounterRecord>> {
  const { error, supabase } = getSupabaseOrMissing<EncounterRecord>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  try {
    const { data, error: updateError } = await supabase
      .from("encounters")
      .update({
        active_entry_id: input.activeEntryId ?? null,
        current_round: input.currentRound,
        current_turn_index: input.currentTurnIndex,
        selected_entry_id: input.selectedEntryId ?? null,
        status: "running",
      })
      .eq("id", encounterId)
      .select("*")
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: data as EncounterRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not save round or turn."),
    };
  }
}

export async function updateCombatantRuntimeState(
  combatantId: string,
  input: CombatantRuntimeInput,
): Promise<RunnerQueryResult<EncounterCombatantRecord>> {
  const { error, supabase } = getSupabaseOrMissing<EncounterCombatantRecord>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  try {
    const update: Record<string, unknown> = {};

    if ("combatGroupId" in input) update.combat_group_id = input.combatGroupId;
    if (input.conditions) update.conditions = input.conditions;
    if (typeof input.currentHp === "number") update.current_hp = input.currentHp;
    if (input.displayName !== undefined) update.display_name = input.displayName;
    if (input.initiativeManuallySet !== undefined) {
      update.initiative_manually_set = input.initiativeManuallySet;
    }
    if ("initiativeValue" in input) update.initiative_value = input.initiativeValue;
    if ("notes" in input) update.notes = input.notes;
    if ("temporaryHp" in input) update.temporary_hp = input.temporaryHp;

    if (input.spellEffects) {
      const metadataPatch = await patchCombatantSnapshotMetadata(combatantId, {
        spellEffects: input.spellEffects,
      });

      if (metadataPatch.error) {
        return { data: null, error: metadataPatch.error };
      }
    }

    if (Object.keys(update).length === 0 && !input.spellEffects) {
      return { data: null, error: "No combatant runtime updates were provided." };
    }

    const { data, error: updateError } = await supabase
      .from("encounter_combatants")
      .update(update)
      .eq("id", combatantId)
      .select("*")
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: data as EncounterCombatantRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not save combatant state."),
    };
  }
}

async function patchCombatantSnapshotMetadata(
  combatantId: string,
  patch: Record<string, JsonValue>,
): Promise<RunnerQueryResult<EncounterCombatantRecord>> {
  const { error, supabase } = getSupabaseOrMissing<EncounterCombatantRecord>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("encounter_combatants")
    .select("snapshot_metadata")
    .eq("id", combatantId)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  const snapshot = (existing?.snapshot_metadata ?? {}) as Record<string, JsonValue>;
  const { data, error: updateError } = await supabase
    .from("encounter_combatants")
    .update({ snapshot_metadata: { ...snapshot, ...patch } })
    .eq("id", combatantId)
    .select("*")
    .single();

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  return { data: data as EncounterCombatantRecord, error: null };
}

export async function updateInitiativeEntry(
  entryId: string,
  input: InitiativeEntryInput,
): Promise<RunnerQueryResult<InitiativeEntryRecord>> {
  const { error, supabase } = getSupabaseOrMissing<InitiativeEntryRecord>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  const update: Record<string, unknown> = {};

  if (input.displayName !== undefined) update.display_name = input.displayName;
  if (input.initiativeManuallySet !== undefined) {
    update.initiative_manually_set = input.initiativeManuallySet;
  }
  if ("initiativeValue" in input) update.initiative_value = input.initiativeValue;
  if ("sortOrder" in input) update.sort_order = input.sortOrder;

  try {
    const { data, error: updateError } = await supabase
      .from("initiative_entries")
      .update(update)
      .eq("id", entryId)
      .select("*")
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: data as InitiativeEntryRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not save initiative entry."),
    };
  }
}

export async function createCombatGroup(
  encounterId: string,
  input: { colorKey: string; name: string; sortOrder?: number },
): Promise<RunnerQueryResult<CombatGroupRecord>> {
  const { error, supabase } = getSupabaseOrMissing<CombatGroupRecord>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  try {
    const { data, error: insertError } = await supabase
      .from("combat_groups")
      .insert({
        color_key: input.colorKey,
        encounter_id: encounterId,
        name: input.name,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: data as CombatGroupRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not create combat group."),
    };
  }
}

export async function updateCombatGroup(
  groupId: string,
  input: { colorKey?: string; name?: string; sortOrder?: number },
): Promise<RunnerQueryResult<CombatGroupRecord>> {
  const { error, supabase } = getSupabaseOrMissing<CombatGroupRecord>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  try {
    const { data, error: updateError } = await supabase
      .from("combat_groups")
      .update({
        ...(input.colorKey !== undefined ? { color_key: input.colorKey } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
      })
      .eq("id", groupId)
      .select("*")
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: data as CombatGroupRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not save combat group."),
    };
  }
}

export async function removeCombatGroup(
  groupId: string,
): Promise<RunnerQueryResult<{ id: string }>> {
  const { error, supabase } = getSupabaseOrMissing<{ id: string }>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  try {
    const { error: deleteError } = await supabase
      .from("combat_groups")
      .delete()
      .eq("id", groupId);

    if (deleteError) {
      return { data: null, error: deleteError.message };
    }

    return { data: { id: groupId }, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not remove combat group."),
    };
  }
}

export async function clearCombatGroup(
  groupId: string,
): Promise<RunnerQueryResult<{ groupId: string }>> {
  const { error, supabase } = getSupabaseOrMissing<{ groupId: string }>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  try {
    const { error: updateError } = await supabase
      .from("encounter_combatants")
      .update({ combat_group_id: null })
      .eq("combat_group_id", groupId);

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: { groupId }, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not clear combat group."),
    };
  }
}

export async function updateWaveDeployment(
  waveId: string,
  deployed: boolean,
): Promise<RunnerQueryResult<EncounterWaveRecord>> {
  const { error, supabase } = getSupabaseOrMissing<EncounterWaveRecord>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  try {
    const { data, error: updateError } = await supabase
      .from("encounter_waves")
      .update({
        deployed,
        deployed_at: deployed ? new Date().toISOString() : null,
      })
      .eq("id", waveId)
      .select("*")
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: data as EncounterWaveRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not save wave deployment."),
    };
  }
}
