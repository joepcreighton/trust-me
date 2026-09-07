"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

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
  const { authUser } = useAuth();
  const [interactions, setInteractions] = useState<Interactions>(DEFAULTS);

  useEffect(() => {
    if (!authUser) {
      setInteractions(DEFAULTS);
      return;
    }

    const supabase = createClient();

    async function load() {
      const [likesRes, vouchesRes, savesRes] = await Promise.all([
        supabase.from("likes").select("recommendation_id").eq("user_id", authUser!.id),
        supabase.from("vouches").select("recommendation_id").eq("user_id", authUser!.id),
        supabase.from("saves").select("recommendation_id").eq("user_id", authUser!.id),
      ]);

      setInteractions({
        likes: (likesRes.data ?? []).map((r) => r.recommendation_id),
        vouches: (vouchesRes.data ?? []).map((r) => r.recommendation_id),
        saves: (savesRes.data ?? []).map((r) => r.recommendation_id),
        vouchChains: {},
        disagreements: {},
      });
    }

    load();
  }, [authUser]);

  function toggle(type: "likes" | "saves", id: string) {
    if (!authUser) return;
    const supabase = createClient();
    const table = type === "likes" ? "likes" : "saves";

    setInteractions((prev) => {
      const arr = prev[type];
      const has = arr.includes(id);
      const next = has ? arr.filter((x) => x !== id) : [...arr, id];

      const call = has
        ? supabase.from(table).delete().eq("user_id", authUser.id).eq("recommendation_id", id)
        : supabase.from(table).insert({ user_id: authUser.id, recommendation_id: id });

      call.then(({ error }) => {
        if (error) console.error(`Failed to ${has ? "remove" : "add"} ${type}:`, error);
      });

      return { ...prev, [type]: next };
    });
  }

  function addVouch(recId: string) {
    if (!authUser) return;
    const supabase = createClient();

    setInteractions((prev) => {
      if (prev.vouches.includes(recId)) return prev;
      supabase
        .from("vouches")
        .insert({ user_id: authUser.id, recommendation_id: recId })
        .then(({ error }) => {
          if (error) console.error("Failed to add vouch:", error);
        });
      return { ...prev, vouches: [...prev.vouches, recId] };
    });
  }

  function removeVouch(recId: string) {
    if (!authUser) return;
    const supabase = createClient();

    setInteractions((prev) => {
      supabase
        .from("vouches")
        .delete()
        .eq("user_id", authUser.id)
        .eq("recommendation_id", recId)
        .then(({ error }) => {
          if (error) console.error("Failed to remove vouch:", error);
        });
      return { ...prev, vouches: prev.vouches.filter((id) => id !== recId) };
    });
  }

  // chain_source stored separately; vouchChains local display removed
  function addVouchChain(_recId: string, _chain: string[]) {}

  async function addDisagreement(recId: string, comment: string) {
    if (!authUser) return;
    const supabase = createClient();

    const { error } = await supabase.from("disagreements").insert({
      user_id: authUser.id,
      recommendation_id: recId,
      comment,
    });

    if (error) {
      console.error("Failed to post disagreement:", error);
      return;
    }

    setInteractions((prev) => {
      const existing = prev.disagreements[recId] ?? [];
      return {
        ...prev,
        disagreements: {
          ...prev.disagreements,
          [recId]: [...existing, { comment, timestamp: new Date().toISOString() }],
        },
      };
    });
  }

  return { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement };
}
