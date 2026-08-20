"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "trust-me-interactions";

export interface Disagreement {
  comment: string;
  timestamp: string;
}

export interface Interactions {
  likes: string[];
  vouches: string[];
  saves: string[];
  vouchChains: Record<string, string[][]>;
  disagreements: Record<string, Disagreement[]>;
}

const DEFAULTS: Interactions = {
  likes: [],
  vouches: [],
  saves: [],
  vouchChains: {},
  disagreements: {},
};

export function useInteractions() {
  const [interactions, setInteractions] = useState<Interactions>(DEFAULTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setInteractions({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {
      // ignore
    }
  }, []);

  function persist(updated: Interactions) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  }

  function toggle(type: "likes" | "saves", id: string) {
    setInteractions((prev) => {
      const arr = prev[type];
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      const updated = { ...prev, [type]: next };
      persist(updated);
      return updated;
    });
  }

  function addVouch(recId: string) {
    setInteractions((prev) => {
      if (prev.vouches.includes(recId)) return prev;
      const updated = { ...prev, vouches: [...prev.vouches, recId] };
      persist(updated);
      return updated;
    });
  }

  function removeVouch(recId: string) {
    setInteractions((prev) => {
      const updated = { ...prev, vouches: prev.vouches.filter((id) => id !== recId) };
      persist(updated);
      return updated;
    });
  }

  function addVouchChain(recId: string, chain: string[]) {
    setInteractions((prev) => {
      const existing = prev.vouchChains[recId] ?? [];
      const updated = {
        ...prev,
        vouchChains: { ...prev.vouchChains, [recId]: [...existing, chain] },
      };
      persist(updated);
      return updated;
    });
  }

  function addDisagreement(recId: string, comment: string) {
    setInteractions((prev) => {
      const existing = prev.disagreements[recId] ?? [];
      const disagreement: Disagreement = { comment, timestamp: new Date().toISOString() };
      const updated = {
        ...prev,
        disagreements: { ...prev.disagreements, [recId]: [...existing, disagreement] },
      };
      persist(updated);
      return updated;
    });
  }

  return { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement };
}
