"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { recommendations, users, currentUser, Category, Recommendation } from "@/lib/mock-data";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { CardSheet } from "@/components/card-sheet";
import { cn } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false });

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Array<Category | "All"> = [
  "All", "Beauty", "Health", "Home", "Fitness", "Pets", "Other",
];

type ActionFilter = "Reserve now" | "Open now";

const ACTION_FILTERS: ActionFilter[] = ["Reserve now", "Open now"];

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const { userRecs } = useUserRecs();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [activeFilters, setActiveFilters] = useState<Set<ActionFilter>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allRecs = useMemo(() => [...userRecs, ...recommendations], [userRecs]);
  const friends = users.filter((u) => u.id !== currentUser.id);

  const vouchChainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [id, chains] of Object.entries(interactions.vouchChains)) {
      counts[id] = chains.length;
    }
    return counts;
  }, [interactions.vouchChains]);

  function toggleFilter(f: ActionFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  }

  const filteredRecs = useMemo<Recommendation[]>(() => {
    return allRecs.filter((r) => {
      if (activeCategory !== "All" && r.category !== activeCategory) return false;
      if (activeFilters.has("Reserve now") && !r.reservations) return false;
      if (activeFilters.has("Open now") && !r.openNow) return false;
      return r.lat != null && r.lng != null;
    });
  }, [allRecs, activeCategory, activeFilters]);

  const selectedRec = selectedId ? allRecs.find((r) => r.id === selectedId) ?? null : null;
  const selectedRecommender = selectedRec
    ? (users.find((u) => u.id === selectedRec.recommenderId) ?? currentUser)
    : currentUser;

  return (
    <>
      <div className="pt-4">

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar mb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex-shrink-0 text-sm font-medium px-3.5 py-1.5 rounded-full border transition-all",
                activeCategory === cat
                  ? "bg-sage text-white border-sage shadow-sm"
                  : "bg-white text-muted border-black/10 hover:border-sage/50 hover:text-charcoal"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action filter pills */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar mb-3">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              className={cn(
                "flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                activeFilters.has(f)
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-white text-charcoal/70 border-black/10 hover:border-black/25"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="text-[11px] text-muted px-4 mb-2">
          {filteredRecs.length} place{filteredRecs.length !== 1 ? "s" : ""} on map
        </p>

        {/* Map */}
        <MapView
          recs={filteredRecs}
          vouchChainCounts={vouchChainCounts}
          onRecClick={setSelectedId}
          onSwitchToList={() => {}}
        />
      </div>

      <CardSheet
        rec={selectedRec}
        onClose={() => setSelectedId(null)}
        recommender={selectedRecommender}
        friends={friends}
        currentUserAvatar={currentUser.avatar}
        isLiked={selectedId ? interactions.likes.includes(selectedId) : false}
        isVouched={selectedId ? interactions.vouches.includes(selectedId) : false}
        isSaved={selectedId ? interactions.saves.includes(selectedId) : false}
        onToggleLike={() => selectedId && toggle("likes", selectedId)}
        onToggleSave={() => selectedId && toggle("saves", selectedId)}
        onVouch={(chain) => { if (!selectedId) return; addVouch(selectedId); if (chain) addVouchChain(selectedId, chain); }}
        onUnvouch={() => selectedId && removeVouch(selectedId)}
        onDisagree={(comment) => selectedId && addDisagreement(selectedId, comment)}
        vouchChains={selectedId ? (interactions.vouchChains[selectedId] ?? []) : []}
        disagreements={selectedId ? (interactions.disagreements[selectedId] ?? []) : []}
      />
    </>
  );
}
