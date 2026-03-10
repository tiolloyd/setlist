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

/** Alias for getSupabase() — same singleton */
export const getSupabaseClient = getSupabase;

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

/** Sets the session ID in localStorage (used after login to use auth UID). */
export function setSessionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("setlist_session_id", id);
}

/**
 * Returns the owner identifier for preference writes.
 * When logged in, returns the user's auth UID.
 * When logged out, returns the random session UUID.
 */
export function getPreferenceOwnerId(userId?: string | null): string {
  if (userId) return userId;
  return getSessionId();
}

/**
 * Migrates preferences from the old anonymous session_id to the new user UID.
 * Called once on login/signup.
 */
export async function migrateSessionPreferences(
  oldSessionId: string,
  newUserId: string
): Promise<void> {
  const db = getSupabase();
  if (!db || oldSessionId === newUserId) return;

  const { data: rows } = await db
    .from("user_artist_preferences")
    .select("artist_id, artist_name, genre, subgenre, preference")
    .eq("session_id", oldSessionId);

  if (!rows || rows.length === 0) return;

  // Upsert each row under the new user UID
  await db.from("user_artist_preferences").upsert(
    rows.map((row) => ({
      session_id: newUserId,
      artist_id: row.artist_id,
      artist_name: row.artist_name,
      genre: row.genre,
      subgenre: row.subgenre,
      preference: row.preference,
    })),
    { onConflict: "session_id,artist_id" }
  );

  // Remove old anonymous rows
  await db
    .from("user_artist_preferences")
    .delete()
    .eq("session_id", oldSessionId);
}
