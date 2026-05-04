import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CreatureTemplateRecord } from "./db-types";
import type { LibraryCreature } from "./library-sample-data";
import { libraryCreatureToRecordInput } from "./mappers";

export type CreatureQueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

function missingSupabaseResult<T>(): CreatureQueryResult<T> {
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
    return {
      error: missingSupabaseResult<never>().error,
      supabase: null,
      userId: null,
    };
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      error: safeErrorMessage(error, "You need to be signed in."),
      supabase,
      userId: null,
    };
  }

  return { error: null, supabase, userId: data.user.id };
}

export async function fetchCreatureTemplates(): Promise<
  CreatureQueryResult<CreatureTemplateRecord[]>
> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return missingSupabaseResult();
  }

  try {
    const { data, error } = await supabase
      .from("creature_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as CreatureTemplateRecord[], error: null };
  } catch (error) {
    return {
      data: null,
      error: safeErrorMessage(error, "Could not load creature library."),
    };
  }
}

export async function createCreatureTemplate(
  creature: LibraryCreature,
): Promise<CreatureQueryResult<CreatureTemplateRecord>> {
  const { error, supabase, userId } = await getSignedInUserId();

  if (!supabase || !userId) {
    return { data: null, error: error ?? "You need to be signed in." };
  }

  try {
    const input = libraryCreatureToRecordInput(
      {
        ...creature,
        sourceName: creature.sourceName || "User Created",
        sourceType: creature.sourceType === "sample" ? "custom" : creature.sourceType,
      },
      userId,
    );

    const { data, error: insertError } = await supabase
      .from("creature_templates")
      .insert(input)
      .select("*")
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: data as CreatureTemplateRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not create creature."),
    };
  }
}

export async function updateCreatureTemplate(
  id: string,
  creature: LibraryCreature,
): Promise<CreatureQueryResult<CreatureTemplateRecord>> {
  const { error, supabase, userId } = await getSignedInUserId();

  if (!supabase || !userId) {
    return { data: null, error: error ?? "You need to be signed in." };
  }

  try {
    const input = libraryCreatureToRecordInput(creature, userId);
    const updates: Partial<typeof input> = { ...input };
    delete updates.owner_user_id;

    const { data, error: updateError } = await supabase
      .from("creature_templates")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: data as CreatureTemplateRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not update creature."),
    };
  }
}

export async function duplicateCreatureTemplate(
  id: string,
): Promise<CreatureQueryResult<CreatureTemplateRecord>> {
  const { error, supabase, userId } = await getSignedInUserId();

  if (!supabase || !userId) {
    return { data: null, error: error ?? "You need to be signed in." };
  }

  try {
    const { data: source, error: fetchError } = await supabase
      .from("creature_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !source) {
      return {
        data: null,
        error: fetchError?.message ?? "Could not find creature to duplicate.",
      };
    }

    const sourceCreature = source as CreatureTemplateRecord;
    const copy: Partial<CreatureTemplateRecord> = { ...sourceCreature };
    delete copy.created_at;
    delete copy.id;
    delete copy.updated_at;

    const { data, error: insertError } = await supabase
      .from("creature_templates")
      .insert({
        ...copy,
        import_method: "manual",
        imported_at: null,
        name: `${sourceCreature.name} Copy`,
        original_import_text: null,
        owner_user_id: userId,
        source_name: "Duplicated Creature",
        source_type: "custom",
      })
      .select("*")
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: data as CreatureTemplateRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not duplicate creature."),
    };
  }
}

export async function archiveOrDeleteCreatureTemplate(
  id: string,
): Promise<CreatureQueryResult<{ id: string }>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return missingSupabaseResult();
  }

  try {
    const { error } = await supabase
      .from("creature_templates")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { id }, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not remove creature."),
    };
  }
}
