"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, ChevronRight, Users, TrendingUp, X, List, Map } from "lucide-react";
import {
  recommendations,
  users,
  currentUser,
  avasDirectFriendIds,
  Category,
  Recommendation,
} from "@/lib/mock-data";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { CardSheet } from "@/components/card-sheet";
import { cn } from "@/lib/utils";

// ─── map (client-only) ────────────────────────────────────────────────────────

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false });

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Array<Category | "All"> = [
  "All", "Beauty", "Health", "Food", "Home", "Fitness", "Pets",
];

const CATEGORY_STYLE: Record<Category, { bg: string; text: string }> = {
  Beauty:  { bg: "bg-pink-100",   text: "text-pink-700" },
  Health:  { bg: "bg-teal-100",   text: "text-teal-700" },
  Food:    { bg: "bg-orange-100", text: "text-orange-700" },
  Home:    { bg: "bg-blue-100",   text: "text-blue-700" },
  Fitness: { bg: "bg-purple-100", text: "text-purple-700" },
  Pets:    { bg: "bg-lime-100",   text: "text-lime-700" },
};

type ActionFilter = "Reserve now" | "Order" | "Open now";

const ACTION_FILTERS: ActionFilter[] = ["Reserve now", "Order", "Open now"];

// ─── compact discover card ────────────────────────────────────────────────────

function DiscoverCard({
  rec,
  isTrusted,
  onClick,
}: {
  rec: Recommendation;
  isTrusted?: boolean;
  onClick: () => void;
}) {
  const recommender = users.find((u) => u.id === rec.recommenderId);
  const style = rec.category in CATEGORY_STYLE ? CATEGORY_STYLE[rec.category as Category] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-black/4 group",
        isTrusted && "bg-sage-light/20"
      )}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        {rec.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.photo} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center text-xl", style?.bg ?? "bg-gray-100")}>
            {!rec.photo && <span className="text-lg opacity-60">·</span>}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm leading-tight truncate">
          {rec.businessName}
        </p>
        <p className="text-xs text-muted mt-0.5 truncate">
          by {recommender?.name.split(" ")[0]} · {rec.city}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {style && (
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", style.bg, style.text)}>
              {rec.category}
            </span>
          )}
          <span className="text-[11px] text-muted">
            ❤️ {rec.likesCount} &nbsp;·&nbsp; 🤝 {rec.vouches.length}
          </span>
        </div>
      </div>

      <ChevronRight
        size={15}
        className="text-muted/40 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

// ─── section ──────────────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  label,
  badge,
  badgeStyle,
  recs,
  isTrusted,
  onCardClick,
}: {
  icon: React.ElementType;
  label: string;
  badge?: string;
  badgeStyle?: string;
  recs: Recommendation[];
  isTrusted?: boolean;
  onCardClick: (id: string) => void;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 px-4 mb-2">
        <Icon size={14} className={isTrusted ? "text-sage" : "text-muted"} />
        <h3
          className={cn(
            "text-[13px] font-bold tracking-wide uppercase",
            isTrusted ? "text-charcoal" : "text-muted"
          )}
        >
          {label}
        </h3>
        {badge && (
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto", badgeStyle)}>
            {badge}
          </span>
        )}
      </div>

      <div
        className={cn(
          "mx-4 rounded-2xl overflow-hidden divide-y shadow-sm shadow-black/5",
          isTrusted
            ? "bg-sage-light/30 divide-sage/10 ring-1 ring-sage/15"
            : "bg-white divide-black/5"
        )}
      >
        {recs.map((rec) => (
          <DiscoverCard
            key={rec.id}
            rec={rec}
            isTrusted={isTrusted}
            onClick={() => onCardClick(rec.id)}
          />
        ))}
      </div>

      <button className="flex items-center gap-1 px-5 mt-2.5 text-xs font-semibold text-sage">
        See all <ChevronRight size={12} />
      </button>
    </div>
  );
}

// ─── flat results ─────────────────────────────────────────────────────────────

function FlatResults({
  recs,
  onCardClick,
}: {
  recs: Recommendation[];
  onCardClick: (id: string) => void;
}) {
  if (recs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <p className="text-muted text-sm">No results found.</p>
        <p className="text-muted/60 text-xs mt-1">Try a different search or filter.</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <p className="text-xs font-bold text-muted uppercase tracking-wide px-4 mb-2">
        {recs.length} result{recs.length !== 1 ? "s" : ""}
      </p>
      <div className="mx-4 bg-white rounded-2xl shadow-sm shadow-black/5 divide-y divide-black/5 overflow-hidden">
        {recs.map((rec) => (
          <DiscoverCard key={rec.id} rec={rec} onClick={() => onCardClick(rec.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const { userRecs } = useUserRecs();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [activeFilters, setActiveFilters] = useState<Set<ActionFilter>>(new Set());
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allRecs = useMemo(() => [...userRecs, ...recommendations], [userRecs]);
  const friends = users.filter((u) => u.id !== currentUser.id);

  // vouch chain counts per rec (number of chains)
  const vouchChainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [id, chains] of Object.entries(interactions.vouchChains)) {
      counts[id] = chains.length;
    }
    return counts;
  }, [interactions.vouchChains]);

  // ── toggle action filter ───────────────────────────────────────────────────
  function toggleFilter(f: ActionFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  // ── filtering ─────────────────────────────────────────────────────────────
  const isFiltered = query.trim().length > 0 || activeCategory !== "All" || activeFilters.size > 0;

  const filteredRecs = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allRecs.filter((r) => {
      const matchCat = activeCategory === "All" || r.category === activeCategory;
      if (!matchCat) return false;

      if (activeFilters.has("Reserve now") && !r.reservations) return false;
      if (activeFilters.has("Order") && !r.delivery) return false;
      if (activeFilters.has("Open now") && !r.openNow) return false;

      if (!q) return true;
      const recommender = users.find((u) => u.id === r.recommenderId);
      return (
        r.businessName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.blurb.toLowerCase().includes(q) ||
        recommender?.name.toLowerCase().includes(q)
      );
    });
  }, [allRecs, query, activeCategory, activeFilters]);

  // ── sections (unfiltered list view) ──────────────────────────────────────
  const fromYourPeople = useMemo(
    () =>
      allRecs
        .filter((r) => avasDirectFriendIds.has(r.recommenderId))
        .sort((a, b) => b.vouches.length - a.vouches.length)
        .slice(0, 3),
    [allRecs]
  );

  const friendsOfFriends = useMemo(
    () =>
      allRecs
        .filter((r) => !avasDirectFriendIds.has(r.recommenderId) && r.recommenderId !== currentUser.id)
        .sort((a, b) => b.likesCount - a.likesCount)
        .slice(0, 2),
    [allRecs]
  );

  const popularNearby = useMemo(
    () =>
      allRecs
        .sort((a, b) => b.likesCount + b.vouches.length * 2 - (a.likesCount + a.vouches.length * 2))
        .slice(0, 3),
    [allRecs]
  );

  // ── selected card ─────────────────────────────────────────────────────────
  const selectedRec = selectedId ? allRecs.find((r) => r.id === selectedId) ?? null : null;
  const selectedRecommender = selectedRec
    ? (users.find((u) => u.id === selectedRec.recommenderId) ?? currentUser)
    : currentUser;

  const hasActiveFilters = isFiltered || view === "map";
  const recsForMap = isFiltered ? filteredRecs : allRecs;

  return (
    <>
      <div className="pt-4 pb-4">

        {/* ── Search + view toggle ────────────────────────────────────────── */}
        <div className="px-4 mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recs, places, people…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-black/10 text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* List / Map toggle */}
          <div className="flex items-center bg-white border border-black/10 rounded-xl overflow-hidden flex-shrink-0">
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1 px-3 py-2.5 text-xs font-semibold transition-colors",
                view === "list" ? "bg-sage text-white" : "text-muted"
              )}
            >
              <List size={13} />
              <span>List</span>
            </button>
            <button
              onClick={() => setView("map")}
              className={cn(
                "flex items-center gap-1 px-3 py-2.5 text-xs font-semibold transition-colors",
                view === "map" ? "bg-sage text-white" : "text-muted"
              )}
            >
              <Map size={13} />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* ── Category chips ──────────────────────────────────────────────── */}
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

        {/* ── Action filter pills ─────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar mb-4">
          {ACTION_FILTERS.map((f) => {
            const active = activeFilters.has(f);
            return (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className={cn(
                  "flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
                  active
                    ? "bg-charcoal text-white border-charcoal"
                    : "bg-white text-charcoal/70 border-black/10 hover:border-black/25"
                )}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {view === "map" ? (
          <MapView
            recs={recsForMap}
            vouchChainCounts={vouchChainCounts}
            onRecClick={setSelectedId}
            onSwitchToList={() => setView("list")}
          />
        ) : isFiltered ? (
          <FlatResults recs={filteredRecs} onCardClick={setSelectedId} />
        ) : (
          <>
            <Section
              icon={Users}
              label="From your people"
              badge="Most trusted"
              badgeStyle="bg-sage text-white"
              recs={fromYourPeople}
              isTrusted
              onCardClick={setSelectedId}
            />
            <Section
              icon={Users}
              label="Friends of friends"
              recs={friendsOfFriends}
              onCardClick={setSelectedId}
            />
            <Section
              icon={TrendingUp}
              label="Popular in your area"
              recs={popularNearby}
              onCardClick={setSelectedId}
            />
          </>
        )}
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
        onVouch={(chain) => {
          if (!selectedId) return;
          addVouch(selectedId);
          if (chain) addVouchChain(selectedId, chain);
        }}
        onUnvouch={() => selectedId && removeVouch(selectedId)}
        onDisagree={(comment) => selectedId && addDisagreement(selectedId, comment)}
        vouchChains={selectedId ? (interactions.vouchChains[selectedId] ?? []) : []}
        disagreements={selectedId ? (interactions.disagreements[selectedId] ?? []) : []}
      />
    </>
  );
}
