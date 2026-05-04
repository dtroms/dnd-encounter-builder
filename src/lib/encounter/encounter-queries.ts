import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EncounterRecord } from "./db-types";

export type EncounterQueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type CreateEncounterShellInput = {
  accentColor?: string;
  description?: string;
  difficultyLabel?: string;
  location?: string;
  name?: string;
  partyLevel?: number;
  partySize?: number;
};

function missingSupabaseResult<T>(): EncounterQueryResult<T> {
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

async function getSignedInUserId() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return { supabase: null, userId: null, error: missingSupabaseResult<never>().error };
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      supabase,
      userId: null,
      error: safeErrorMessage(error, "You need to be signed in."),
    };
  }

  return { supabase, userId: data.user.id, error: null };
}

export async function fetchSavedEncounters(): Promise<
  EncounterQueryResult<EncounterRecord[]>
> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return missingSupabaseResult();
  }

  try {
    const { data, error } = await supabase
      .from("encounters")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as EncounterRecord[], error: null };
  } catch (error) {
    return {
      data: null,
      error: safeErrorMessage(error, "Could not load saved encounters."),
    };
  }
}

export async function createEncounterShell(
  input: CreateEncounterShellInput = {},
): Promise<EncounterQueryResult<EncounterRecord>> {
  const { error, supabase, userId } = await getSignedInUserId();

  if (!supabase || !userId) {
    return { data: null, error: error ?? "You need to be signed in." };
  }

  try {
    const { data, error: insertError } = await supabase
      .from("encounters")
      .insert({
        accent_color: input.accentColor ?? "Cyan",
        current_round: 1,
        current_turn_index: 0,
        description: input.description ?? null,
        difficulty_label: input.difficultyLabel ?? "Unrated",
        estimated_difficulty: input.difficultyLabel ?? "Unrated",
        location: input.location ?? null,
        name: input.name?.trim() || "Untitled Encounter",
        owner_user_id: userId,
        party_level: input.partyLevel ?? null,
        party_size: input.partySize ?? null,
        status: "draft",
      })
      .select("*")
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: data as EncounterRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not create encounter."),
    };
  }
}

export async function duplicateEncounter(
  encounterId: string,
): Promise<EncounterQueryResult<EncounterRecord>> {
  const { error, supabase, userId } = await getSignedInUserId();

  if (!supabase || !userId) {
    return { data: null, error: error ?? "You need to be signed in." };
  }

  try {
    const { data: source, error: fetchError } = await supabase
      .from("encounters")
      .select("*")
      .eq("id", encounterId)
      .single();

    if (fetchError || !source) {
      return {
        data: null,
        error: fetchError?.message ?? "Could not find encounter to duplicate.",
      };
    }

    const sourceEncounter = source as EncounterRecord;
    const { data, error: insertError } = await supabase
      .from("encounters")
      .insert({
        accent_color: sourceEncounter.accent_color,
        boss_count_snapshot: sourceEncounter.boss_count_snapshot,
        combatant_count_snapshot: sourceEncounter.combatant_count_snapshot,
        current_round: 1,
        current_turn_index: 0,
        description: sourceEncounter.description,
        difficulty_label: sourceEncounter.difficulty_label,
        estimated_difficulty: sourceEncounter.estimated_difficulty,
        has_lair_actions_snapshot: sourceEncounter.has_lair_actions_snapshot,
        last_opened_mode: sourceEncounter.last_opened_mode,
        last_played_at: null,
        location: sourceEncounter.location,
        name: `${sourceEncounter.name} Copy`,
        notes: sourceEncounter.notes,
        owner_user_id: userId,
        party_level: sourceEncounter.party_level,
        party_size: sourceEncounter.party_size,
        status: "draft",
      })
      .select("*")
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: data as EncounterRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not duplicate encounter."),
    };
  }
}

export async function archiveEncounter(
  encounterId: string,
): Promise<EncounterQueryResult<EncounterRecord>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return missingSupabaseResult();
  }

  try {
    const { data, error } = await supabase
      .from("encounters")
      .update({ status: "archived" })
      .eq("id", encounterId)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as EncounterRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not archive encounter."),
    };
  }
}
