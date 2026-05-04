import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CombatGroupRecord,
  EncounterCombatantRecord,
  EncounterRecord,
  EncounterWaveRecord,
  InitiativeEntryRecord,
} from "./db-types";
import { encounterCombatantToRecordInput } from "./mappers";
import type { CombatGroup, Encounter, EncounterCombatant } from "./types";

export type BuilderQueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type BuilderEncounterState = {
  combatants: EncounterCombatantRecord[];
  combatGroups: CombatGroupRecord[];
  encounter: EncounterRecord;
  initiativeEntries: InitiativeEntryRecord[];
  waves: EncounterWaveRecord[];
};

function missingSupabaseResult<T>(): BuilderQueryResult<T> {
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

export async function fetchBuilderEncounterState(
  encounterId: string,
): Promise<BuilderQueryResult<BuilderEncounterState>> {
  const { error, supabase } = getSupabaseOrMissing<BuilderEncounterState>();

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
        error: firstError?.message ?? "Could not load Builder encounter state.",
      };
    }

    return {
      data: {
        combatants: (combatantsResult.data ?? []) as EncounterCombatantRecord[],
        combatGroups: (groupsResult.data ?? []) as CombatGroupRecord[],
        encounter: encounterResult.data as EncounterRecord,
        initiativeEntries: (entriesResult.data ?? []) as InitiativeEntryRecord[],
        waves: (wavesResult.data ?? []) as EncounterWaveRecord[],
      },
      error: null,
    };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not load Builder state."),
    };
  }
}

export async function saveBuilderEncounterState(input: {
  campaignId?: string | null;
  combatGroups: CombatGroup[];
  encounter: Encounter;
}): Promise<BuilderQueryResult<BuilderEncounterState>> {
  const { error, supabase } = getSupabaseOrMissing<BuilderEncounterState>();

  if (!supabase) {
    return { data: null, error: error ?? "Supabase is not configured." };
  }

  const encounterId = input.encounter.id;

  try {
    const { error: clearEntriesError } = await supabase
      .from("initiative_entries")
      .delete()
      .eq("encounter_id", encounterId);

    if (clearEntriesError) {
      return { data: null, error: clearEntriesError.message };
    }

    const { error: clearCombatantsError } = await supabase
      .from("encounter_combatants")
      .delete()
      .eq("encounter_id", encounterId);

    if (clearCombatantsError) {
      return { data: null, error: clearCombatantsError.message };
    }

    const { error: clearGroupsError } = await supabase
      .from("combat_groups")
      .delete()
      .eq("encounter_id", encounterId);

    if (clearGroupsError) {
      return { data: null, error: clearGroupsError.message };
    }

    const { error: clearWavesError } = await supabase
      .from("encounter_waves")
      .delete()
      .eq("encounter_id", encounterId);

    if (clearWavesError) {
      return { data: null, error: clearWavesError.message };
    }

    const wavesToSave =
      input.encounter.waves.length > 0
        ? input.encounter.waves
        : [{ deployed: true, id: "wave-1", name: "Wave 1" }];
    const { data: waveRows, error: wavesError } = await supabase
      .from("encounter_waves")
      .insert(
        wavesToSave.map((wave, index) => ({
          deployed: wave.deployed,
          deployed_at: wave.deployed ? new Date().toISOString() : null,
          description: wave.description ?? wave.notes ?? null,
          encounter_id: encounterId,
          name: wave.name,
          sort_order: index,
        })),
      )
      .select("*");

    if (wavesError) {
      return { data: null, error: wavesError.message };
    }

    const savedWaves = (waveRows ?? []) as EncounterWaveRecord[];
    const waveIdMap = new Map(
      wavesToSave.map((wave, index) => [wave.id, savedWaves[index]?.id ?? null]),
    );

    const { data: groupRows, error: groupsError } = input.combatGroups.length
      ? await supabase
          .from("combat_groups")
          .insert(
            input.combatGroups.map((group, index) => ({
              color_key: group.color,
              encounter_id: encounterId,
              name: group.name,
              sort_order: index,
            })),
          )
          .select("*")
      : { data: [], error: null };

    if (groupsError) {
      return { data: null, error: groupsError.message };
    }

    const savedGroups = (groupRows ?? []) as CombatGroupRecord[];
    const groupIdMap = new Map(
      input.combatGroups.map((group, index) => [
        group.id,
        savedGroups[index]?.id ?? null,
      ]),
    );

    const combatantsToSave = input.encounter.combatants.map((combatant, index) =>
      mapCombatantForSave(combatant, {
        combatGroupId: combatant.combatGroupId
          ? groupIdMap.get(combatant.combatGroupId) ?? null
          : null,
        encounterId,
        sortOrder: index,
        waveId: combatant.waveId
          ? waveIdMap.get(combatant.waveId) ?? null
          : savedWaves[0]?.id ?? null,
      }),
    );

    const { data: combatantRows, error: combatantsError } = combatantsToSave.length
      ? await supabase
          .from("encounter_combatants")
          .insert(combatantsToSave)
          .select("*")
      : { data: [], error: null };

    if (combatantsError) {
      return { data: null, error: combatantsError.message };
    }

    const savedCombatants = (combatantRows ?? []) as EncounterCombatantRecord[];
    const initiativeRows = buildInitiativeRows(encounterId, savedCombatants);
    const { data: initiativeData, error: initiativeError } = initiativeRows.length
      ? await supabase
          .from("initiative_entries")
          .insert(initiativeRows)
          .select("*")
      : { data: [], error: null };

    if (initiativeError) {
      return { data: null, error: initiativeError.message };
    }

    const { data: encounterData, error: encounterError } = await supabase
      .from("encounters")
      .update({
        campaign_id: input.campaignId ?? null,
        combatant_count_snapshot: savedCombatants.length,
        current_round: input.encounter.round,
        current_turn_index: input.encounter.turnNumber,
        has_lair_actions_snapshot: savedCombatants.some(
          (combatant) => combatant.lair_actions.length > 0,
        ),
        name: input.encounter.name,
        status: "draft",
      })
      .eq("id", encounterId)
      .select("*")
      .single();

    if (encounterError || !encounterData) {
      return {
        data: null,
        error: encounterError?.message ?? "Could not update encounter metadata.",
      };
    }

    return {
      data: {
        combatants: savedCombatants,
        combatGroups: savedGroups,
        encounter: encounterData as EncounterRecord,
        initiativeEntries: (initiativeData ?? []) as InitiativeEntryRecord[],
        waves: savedWaves,
      },
      error: null,
    };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not save Builder draft."),
    };
  }
}

function mapCombatantForSave(
  combatant: EncounterCombatant,
  input: {
    combatGroupId: string | null;
    encounterId: string;
    sortOrder: number;
    waveId: string | null;
  },
) {
  const record = encounterCombatantToRecordInput(
    {
      ...combatant,
      waveId: input.waveId ?? undefined,
    },
    input.encounterId,
    input.combatGroupId,
  );

  return {
    ...record,
    sort_order: input.sortOrder,
    wave_id: input.waveId,
    snapshot_metadata: {
      ...record.snapshot_metadata,
      characterSheetTitle: combatant.characterSheetTitle ?? "",
      characterSheetUrl: combatant.characterSheetUrl ?? "",
      externalSheetNotes: combatant.externalSheetNotes ?? "",
      localCombatantId: combatant.combatantId,
      localTemplateId: combatant.templateId,
      waveLabel: combatant.waveLabel ?? "",
    },
  };
}

function buildInitiativeRows(
  encounterId: string,
  combatants: EncounterCombatantRecord[],
) {
  const rows: Array<Record<string, unknown>> = combatants.map((combatant, index) => ({
    combatant_id: combatant.id,
    display_name: combatant.display_name,
    encounter_id: encounterId,
    entry_type: "combatant",
    initiative_manually_set: combatant.initiative_manually_set,
    initiative_value: combatant.initiative_value,
    is_synthetic: false,
    metadata: {},
    sort_order: index + 1,
    source_combatant_id: null,
  }));
  const firstLairSource = combatants.find(
    (combatant) => combatant.lair_actions.length > 0,
  );

  if (firstLairSource) {
    rows.push({
      combatant_id: null,
      display_name: "Lair Actions",
      encounter_id: encounterId,
      entry_type: "lair_action",
      initiative_manually_set: false,
      initiative_value: 20,
      is_synthetic: true,
      metadata: { localEntryId: "lair-actions" },
      sort_order: 0,
      source_combatant_id: firstLairSource.id,
    });
  }

  return rows;
}
