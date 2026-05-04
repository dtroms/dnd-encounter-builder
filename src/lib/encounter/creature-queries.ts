import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CreatureTemplateRecord, CreatureTemplateRecordInput } from "./db-types";
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

function safeDatabaseErrorMessage(error: {
  code?: string;
  details?: string | null;
  message?: string;
} | null | undefined, fallback: string) {
  if (!error) {
    return fallback;
  }

  const message = error.message?.trim() || fallback;
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("row-level security") ||
    lowerMessage.includes("violates row-level security policy")
  ) {
    return "Database insert was rejected by RLS. Confirm you are signed in and owner_user_id matches your user.";
  }

  if (lowerMessage.includes("column") && lowerMessage.includes("does not exist")) {
    return `Database insert failed: ${message}`;
  }

  if (error.code) {
    return `Database insert failed (${error.code}): ${message}`;
  }

  return `Database insert failed: ${message}`;
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
    const validationError = validateCreatureTemplateInsert(input);

    if (validationError) {
      return { data: null, error: validationError };
    }

    const { data, error: insertError } = await supabase
      .from("creature_templates")
      .insert(input)
      .select("*")
      .single();

    if (insertError) {
      if (isMissingColumnError(insertError)) {
        const compatibleInput = removeOptionalImportColumns(input);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("creature_templates")
          .insert(compatibleInput)
          .select("*")
          .single();

        if (!fallbackError && fallbackData) {
          return { data: fallbackData as CreatureTemplateRecord, error: null };
        }

        return {
          data: null,
          error: safeDatabaseErrorMessage(
            fallbackError ?? insertError,
            "Could not create creature.",
          ),
        };
      }

      return {
        data: null,
        error: safeDatabaseErrorMessage(insertError, "Could not create creature."),
      };
    }

    return { data: data as CreatureTemplateRecord, error: null };
  } catch (caughtError) {
    return {
      data: null,
      error: safeErrorMessage(caughtError, "Could not create creature."),
    };
  }
}

function isMissingColumnError(error: { code?: string; message?: string }) {
  return (
    error.code === "42703" ||
    (error.message?.toLowerCase().includes("column") &&
      error.message.toLowerCase().includes("does not exist"))
  );
}

function removeOptionalImportColumns(input: CreatureTemplateRecordInput) {
  const compatibleInput: Partial<CreatureTemplateRecordInput> = { ...input };

  delete compatibleInput.import_method;
  delete compatibleInput.imported_at;
  delete compatibleInput.original_import_text;
  delete compatibleInput.import_notes;
  delete compatibleInput.parser_version;
  delete compatibleInput.parser_confidence;
  delete compatibleInput.import_metadata;

  return compatibleInput;
}

function validateCreatureTemplateInsert(input: CreatureTemplateRecordInput) {
  const missingFields = [
    input.owner_user_id ? null : "owner_user_id",
    input.name.trim() ? null : "name",
    input.creature_type.trim() ? null : "creature_type",
    Number.isFinite(input.armor_class) ? null : "armor_class",
    Number.isFinite(input.hit_points) ? null : "hit_points",
    Number.isFinite(input.initiative_bonus) ? null : "initiative_bonus",
    hasCompleteAbilityScores(input.ability_scores) ? null : "ability_scores",
  ].filter(Boolean) as string[];

  if (missingFields.length) {
    return `Missing or invalid required field${missingFields.length === 1 ? "" : "s"}: ${missingFields.join(", ")}.`;
  }

  const jsonFields: Array<[string, unknown]> = [
    ["ability_scores", input.ability_scores],
    ["saving_throws", input.saving_throws],
    ["skills", input.skills],
    ["resistances", input.resistances],
    ["immunities", input.immunities],
    ["vulnerabilities", input.vulnerabilities],
    ["traits", input.traits],
    ["actions", input.actions],
    ["bonus_actions", input.bonus_actions],
    ["reactions", input.reactions],
    ["legendary_actions", input.legendary_actions],
    ["lair_actions", input.lair_actions],
    ["import_metadata", input.import_metadata],
  ];

  const invalidJsonField = jsonFields.find(
    ([, value]) => !isJsonSerializableWithoutInvalidNumbers(value),
  );

  if (invalidJsonField) {
    return `Import data could not be saved because ${invalidJsonField[0]} contains invalid JSON values.`;
  }

  return null;
}

function hasCompleteAbilityScores(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const scores = value as Record<string, unknown>;

  return ["str", "dex", "con", "int", "wis", "cha"].every(
    (key) => typeof scores[key] === "number" && Number.isFinite(scores[key]),
  );
}

function isJsonSerializableWithoutInvalidNumbers(value: unknown): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    value === undefined
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonSerializableWithoutInvalidNumbers);
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(
      isJsonSerializableWithoutInvalidNumbers,
    );
  }

  return false;
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
