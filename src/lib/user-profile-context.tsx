"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { currentUser, type Gender } from "./mock-data";

export type { Gender };

export interface UserProfile {
  avatar: string;
  bio: string;
  cities: string[];
  gender: Gender | null;
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  avatar: currentUser.avatar,
  bio: currentUser.bio ?? "",
  cities: currentUser.cities ?? [],
  gender: currentUser.gender ?? null,
};

const UserProfileContext = createContext<UserProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
});

const PROFILE_KEY = "trust-me-profile";

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(stored) });
    } catch {
      // ignore
    }
  }, []);

  function updateProfile(updates: Partial<UserProfile>) {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => useContext(UserProfileContext);
