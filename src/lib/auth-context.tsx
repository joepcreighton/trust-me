"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import type { User, Gender } from "./mock-data";

const DEFAULT_AVATAR = "https://i.pravatar.cc/150?u=placeholder";

export interface DbUser {
  id: string;
  handle: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  gender: string | null;
  locations: { city: string; state?: string; neighborhood?: string }[];
  onboarding_complete: boolean;
}

interface AuthContextType {
  authUser: SupabaseUser | null;
  dbUser: DbUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  dbUser: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDbUser = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select(
        "id, handle, full_name, bio, avatar_url, gender, locations, onboarding_complete"
      )
      .eq("id", userId)
      .single();
    setDbUser(data ?? null);
  }, []);

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await fetchDbUser(user.id);
  }, [fetchDbUser]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchDbUser(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchDbUser(session.user.id);
      } else {
        setDbUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchDbUser]);

  return (
    <AuthContext.Provider value={{ authUser, dbUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Returns the current user shaped like the mock User type so all existing
// components can replace their `currentUser` import with this hook with
// minimal changes.
export function useCurrentUser(): User {
  const { dbUser } = useAuth();
  if (!dbUser) {
    return {
      id: "",
      name: "",
      username: "",
      avatar: DEFAULT_AVATAR,
      friends: [],
    };
  }
  return {
    id: dbUser.id,
    name: dbUser.full_name,
    username: dbUser.handle,
    avatar: dbUser.avatar_url ?? DEFAULT_AVATAR,
    bio: dbUser.bio ?? undefined,
    cities: dbUser.locations.map((l) => l.city),
    gender: (dbUser.gender as Gender) ?? undefined,
    friends: [],
  };
}
