"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "./supabase/client";
import { useAuth } from "./auth-context";
import type { Gender } from "./mock-data";

export type { Gender };

export interface UserProfile {
  avatar: string;
  bio: string;
  cities: string[];
  gender: Gender | null;
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const DEFAULT_AVATAR = "https://i.pravatar.cc/150?u=placeholder";

const DEFAULT_PROFILE: UserProfile = {
  avatar: DEFAULT_AVATAR,
  bio: "",
  cities: [],
  gender: null,
};

const UserProfileContext = createContext<UserProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: async () => {},
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { dbUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Sync profile from Supabase user row whenever auth resolves
  useEffect(() => {
    if (!dbUser) return;
    setProfile({
      avatar: dbUser.avatar_url ?? DEFAULT_AVATAR,
      bio: dbUser.bio ?? "",
      cities: dbUser.locations.map((l) => l.city),
      gender: (dbUser.gender as Gender) ?? null,
    });
  }, [dbUser]);

  async function updateProfile(updates: Partial<UserProfile>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio || null;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.cities !== undefined) {
      dbUpdates.locations = updates.cities.map((city) => ({ city, state: "" }));
    }

    await supabase.from("users").update(dbUpdates).eq("id", user.id);
    setProfile((prev) => ({ ...prev, ...updates }));
    await refreshUser();
  }

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => useContext(UserProfileContext);
