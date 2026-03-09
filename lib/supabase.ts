import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — avoids module-level errors during SSR/prerender when env vars may be absent
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key);
  return _client;
}

/** Returns the persistent session ID for this visitor, generating one if needed. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "setlist_session_id";
  const existing = localStorage.getItem(key);
  if (!existing) {
    const newId = crypto.randomUUID();
    localStorage.setItem(key, newId);
    return newId;
  }
  return existing;
}
