"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "trust-me-interactions";

export interface Interactions {
  likes: string[];
  vouches: string[];
  saves: string[];
}

export function useInteractions() {
  const [interactions, setInteractions] = useState<Interactions>({
    likes: [],
    vouches: [],
    saves: [],
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setInteractions(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  function toggle(type: keyof Interactions, id: string) {
    setInteractions((prev) => {
      const arr = prev[type];
      const next = arr.includes(id)
        ? arr.filter((x) => x !== id)
        : [...arr, id];
      const updated = { ...prev, [type]: next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }

  return { interactions, toggle };
}
