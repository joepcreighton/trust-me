"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { Category, Recommendation } from "@/lib/mock-data";
import type { DbRecommendation } from "@/lib/db-types";
import { useCurrentUser } from "@/lib/auth-context";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { CardSheet } from "@/components/card-sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = "https://i.pravatar.cc/150?u=placeholder";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapDbRec(row: DbRecommendation & { recommender?: { id: string; handle: string; full_name: string; avatar_url: string | null } | null }): Recommendation & { _recommenderName: string; _recommenderAvatar: string } {
  return {
    id: row.id,
    recommenderId: row.user_id,
    businessName: row.business_name,
    category: capitalize(row.category) as Category,
    subCategory: row.subcategory ?? "Other",
    city: row.city ?? "",
    neighborhood: row.neighborhood ?? undefined,
    lat: row.latitude ?? undefined,
    lng: row.longitude ?? undefined,
    blurb: row.blurb,
    photo: row.photo_url ?? undefined,
    timestamp: row.created_at,
    likesCount: row.likes?.length ?? 0,
    vouches: row.vouches?.map((v) => v.user_id) ?? [],
    commentCount: 0,
    _recommenderName: row.recommender?.full_name ?? "Someone",
    _recommenderAvatar: row.recommender?.avatar_url ?? DEFAULT_AVATAR,
  };
}

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false });

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Array<Category | "All"> = [
  "All", "Beauty", "Health", "Home", "Fitness", "Pets", "Other",
];

type ActionFilter = "Reserve now" | "Open now";

const ACTION_FILTERS: ActionFilter[] = ["Reserve now", "Open now"];

// ─── page ─────────────────────────────────────────────────────────────────────

type RichRec = Recommendation & { _recommenderName: string; _recommenderAvatar: string };

export default function ExplorePage() {
  const currentUser = useCurrentUser();
  const { userRecs } = useUserRecs();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [activeFilters, setActiveFilters] = useState<Set<ActionFilter>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dbRecs, setDbRecs] = useState<RichRec[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("recommendations")
      .select(`*, recommender:users!user_id(id, handle, full_name, avatar_url), vouches(user_id), likes(user_id)`)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setDbRecs((data as (DbRecommendation & { recommender?: { id: string; handle: string; full_name: string; avatar_url: string | null } | null })[]).map(mapDbRec));
      });
  }, []);

  const allRecs = useMemo(() => {
    const mapped = userRecs.map((r) => ({ ...r, _recommenderName: currentUser.name || "You", _recommenderAvatar: currentUser.avatar }));
    return [...mapped, ...dbRecs.filter((r) => r.recommenderId !== currentUser.id)];
  }, [userRecs, dbRecs, currentUser]);

  const friends = useMemo(
    () => dbRecs.map((r) => ({ id: r.recommenderId, name: r._recommenderName, username: "unknown", avatar: r._recommenderAvatar, friends: [] as string[] }))
      .filter((u, i, arr) => u.id && u.id !== currentUser.id && arr.findIndex((x) => x.id === u.id) === i),
    [dbRecs, currentUser.id]
  );

  function toggleFilter(f: ActionFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  }

  const filteredRecs = useMemo<RichRec[]>(() => {
    return allRecs.filter((r) => {
      if (activeCategory !== "All" && r.category !== activeCategory) return false;
      if (activeFilters.has("Reserve now") && !r.reservations) return false;
      return r.lat != null && r.lng != null;
    });
  }, [allRecs, activeCategory, activeFilters]);

  const selectedRec = selectedId ? allRecs.find((r) => r.id === selectedId) ?? null : null;
  const selectedRecommender = selectedRec
    ? { id: selectedRec.recommenderId, name: selectedRec._recommenderName, username: "unknown", avatar: selectedRec._recommenderAvatar, friends: [] as string[] }
    : { id: "", name: "", username: "", avatar: DEFAULT_AVATAR, friends: [] as string[] };

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
          vouchChainCounts={{}}
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
        vouchChains={[]}
        disagreements={selectedId ? (interactions.disagreements[selectedId] ?? []) : []}
      />
    </>
  );
}
