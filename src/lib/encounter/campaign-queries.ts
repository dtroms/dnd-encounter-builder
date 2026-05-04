import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CampaignRecord, CampaignStatus } from "./db-types";

export type CampaignQueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type CampaignMutationInput = {
  accentColor?: string | null;
  description?: string | null;
  name: string;
  sortOrder?: number | null;
  status?: CampaignStatus;
};

function missingSupabaseResult<T>(): CampaignQueryResult<T> {
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
    return { error: missingSupabaseResult<never>().error, supabase: null, userId: null };
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

export async function fetchCampaigns(): Promise<
  CampaignQueryResult<CampaignRecord[]>
> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return missingSupabaseResult();
  }

  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "active")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data ?? []) as CampaignRecord[], error: null };
  } catch (error) {
    return {
      data: null,
      error: safeErrorMessage(error, "Could not load campaigns."),
    };
  }
}

export async function createCampaign(
  input: CampaignMutationInput,
): Promise<CampaignQueryResult<CampaignRecord>> {
  const { error, supabase, userId } = await getSignedInUserId();

  if (!supabase || !userId) {
    return { data: null, error: error ?? "You need to be signed in." };
  }

  const name = input.name.trim();

  if (!name) {
    return { data: null, error: "Campaign name is required." };
  }

  try {
    const { data, error: insertError } = await supabase
      .from("campaigns")
      .insert({
        accent_color: input.accentColor ?? "Cyan",
        description: input.description?.trim() || null,
        name,
        owner_user_id: userId,
        sort_order: input.sortOrder ?? null,
        status: input.status ?? "active",
      })
      .select("*")
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: data as CampaignRecord, error: null };
  } catch (error) {
    return {
      data: null,
      error: safeErrorMessage(error, "Could not create campaign."),
    };
  }
}

export async function updateCampaign(
  campaignId: string,
  input: Partial<CampaignMutationInput>,
): Promise<CampaignQueryResult<CampaignRecord>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return missingSupabaseResult();
  }

  const updates: Record<string, string | number | null> = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      return { data: null, error: "Campaign name is required." };
    }
    updates.name = name;
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  if (input.accentColor !== undefined) {
    updates.accent_color = input.accentColor;
  }

  if (input.sortOrder !== undefined) {
    updates.sort_order = input.sortOrder;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  try {
    const { data, error } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", campaignId)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CampaignRecord, error: null };
  } catch (error) {
    return {
      data: null,
      error: safeErrorMessage(error, "Could not update campaign."),
    };
  }
}

export async function archiveOrDeleteCampaign(
  campaignId: string,
): Promise<CampaignQueryResult<CampaignRecord>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return missingSupabaseResult();
  }

  try {
    const { error: encounterError } = await supabase
      .from("encounters")
      .update({ campaign_id: null })
      .eq("campaign_id", campaignId);

    if (encounterError) {
      return { data: null, error: encounterError.message };
    }

    const { data, error } = await supabase
      .from("campaigns")
      .update({ status: "archived" })
      .eq("id", campaignId)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CampaignRecord, error: null };
  } catch (error) {
    return {
      data: null,
      error: safeErrorMessage(error, "Could not archive campaign."),
    };
  }
}

export async function assignEncounterToCampaign(
  encounterId: string,
  campaignId: string | null,
): Promise<CampaignQueryResult<{ id: string; campaign_id: string | null }>> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return missingSupabaseResult();
  }

  try {
    const { data, error } = await supabase
      .from("encounters")
      .update({ campaign_id: campaignId })
      .eq("id", encounterId)
      .select("id,campaign_id")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: data as { id: string; campaign_id: string | null },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: safeErrorMessage(error, "Could not assign encounter to campaign."),
    };
  }
}
