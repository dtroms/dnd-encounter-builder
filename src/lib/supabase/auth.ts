import type { Session } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  isLocalDemoModeEnabled,
  isSupabaseConfigured,
} from "./client";

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase is not configured for this environment.");
  }

  return supabase;
}

export { isLocalDemoModeEnabled, isSupabaseConfigured };

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = requireSupabaseClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = requireSupabaseClient();
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  const supabase = requireSupabaseClient();
  return supabase.auth.signOut();
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return () => undefined;
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}
