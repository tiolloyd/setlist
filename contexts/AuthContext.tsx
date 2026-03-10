"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, getSessionId, setSessionId, migrateSessionPreferences } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getSupabase();
    if (!db) {
      setLoading(false);
      return;
    }

    // Hydrate from current session on mount
    db.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      setLoading(false);
    });

    const { data: { subscription } } = db.auth.onAuthStateChange(
      async (_event, session) => {
        const newUser = session?.user ?? null;

        if (newUser) {
          // On login: migrate anonymous preferences to auth UID
          const oldSessionId = getSessionId();
          if (oldSessionId !== newUser.id) {
            await migrateSessionPreferences(oldSessionId, newUser.id);
            setSessionId(newUser.id);
          }

          // Upsert the user's public profile row
          const dbClient = getSupabase();
          if (dbClient) {
            await dbClient.from("users").upsert(
              {
                id: newUser.id,
                email: newUser.email ?? null,
                music_provider: null,
                mode_preference: null,
                location: null,
                created_at: new Date().toISOString(),
              },
              { onConflict: "id", ignoreDuplicates: false }
            );
          }
        }

        setUser(newUser);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithEmail(email: string, password: string): Promise<void> {
    const db = getSupabase();
    if (!db) throw new Error("Service unavailable");
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpWithEmail(email: string, password: string): Promise<void> {
    const db = getSupabase();
    if (!db) throw new Error("Service unavailable");
    const { error } = await db.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signInWithGoogle(): Promise<void> {
    const db = getSupabase();
    if (!db) throw new Error("Service unavailable");
    const { error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined"
          ? window.location.origin + "/results"
          : undefined,
      },
    });
    if (error) throw error;
  }

  async function signOut(): Promise<void> {
    const db = getSupabase();
    if (!db) return;
    await db.auth.signOut();
    // Restore a fresh anonymous session ID after sign-out
    const newId = crypto.randomUUID();
    setSessionId(newId);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
