"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Recommendation } from "./mock-data";

const STORAGE_KEY = "trust-me-user-recs";

interface UserRecsContextType {
  userRecs: Recommendation[];
  addUserRec: (rec: Recommendation) => void;
}

const UserRecsContext = createContext<UserRecsContextType>({
  userRecs: [],
  addUserRec: () => {},
});

export function UserRecsProvider({ children }: { children: React.ReactNode }) {
  const [userRecs, setUserRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUserRecs(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  function addUserRec(rec: Recommendation) {
    setUserRecs((prev) => {
      const next = [rec, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <UserRecsContext.Provider value={{ userRecs, addUserRec }}>
      {children}
    </UserRecsContext.Provider>
  );
}

export const useUserRecs = () => useContext(UserRecsContext);
