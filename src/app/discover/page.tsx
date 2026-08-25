"use client";

import { useState, useMemo } from "react";
import { Search, ChevronRight, Users, TrendingUp, X, MapPin, ChevronDown } from "lucide-react";
import {
  recommendations,
  users,
  currentUser,
  avasDirectFriendIds,
  avaLocation,
  CITY_NEIGHBORHOODS,
  Category,
  Recommendation,
  ExternalResult,
  getMockExternalResults,
} from "@/lib/mock-data";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { CardSheet } from "@/components/card-sheet";
import { LocationSheet, LocationFilter } from "@/components/location-sheet";
import { cn } from "@/lib/utils";

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Array<Category | "All"> = [
  "All", "Beauty", "Health", "Home", "Fitness", "Pets", "Other",
];

const CATEGORY_STYLE: Record<Category, { bg: string; text: string }> = {
  Beauty:  { bg: "bg-pink-100",   text: "text-pink-700" },
  Health:  { bg: "bg-teal-100",   text: "text-teal-700" },
  Home:    { bg: "bg-blue-100",   text: "text-blue-700" },
  Fitness: { bg: "bg-purple-100", text: "text-purple-700" },
  Pets:    { bg: "bg-lime-100",   text: "text-lime-700" },
  Other:   { bg: "bg-gray-100",   text: "text-gray-600" },
};

const SOURCE_DOT: Record<"Yelp" | "Google", string> = {
  Yelp:   "bg-[#d32323]",
  Google: "bg-[#4285f4]",
};

type ActionFilter = "Recs Nearby" | "Open now" | "Take appointments";

const ACTION_FILTERS: ActionFilter[] = ["Recs Nearby", "Open now", "Take appointments"];

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function locationPillLabel(filter: LocationFilter): string {
  switch (filter.type) {
    case "all": return "City";
    case "city": return filter.city;
    case "neighborhood": return filter.neighborhood;
    case "custom": return filter.query.length > 14 ? filter.query.slice(0, 14) + "…" : filter.query;
  }
}

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
  const style = CATEGORY_STYLE[rec.category as Category] ?? CATEGORY_STYLE.Other;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-black/4 group",
        isTrusted && "bg-sage-light/20"
      )}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        {rec.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.photo} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center", style.bg)} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm leading-tight truncate">
          {rec.businessName}
        </p>
        <p className="text-xs text-muted mt-0.5 truncate">
          by {recommender?.name.split(" ")[0]} · {rec.city}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", style.bg, style.text)}>
            {rec.category}
          </span>
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
        <h3 className={cn("text-[13px] font-bold tracking-wide uppercase", isTrusted ? "text-charcoal" : "text-muted")}>
          {label}
        </h3>
        {badge && (
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto", badgeStyle)}>
            {badge}
          </span>
        )}
      </div>

      <div className={cn(
        "mx-4 rounded-2xl overflow-hidden divide-y shadow-sm shadow-black/5",
        isTrusted
          ? "bg-sage-light/30 divide-sage/10 ring-1 ring-sage/15"
          : "bg-white divide-black/5"
      )}>
        {recs.map((rec) => (
          <DiscoverCard key={rec.id} rec={rec} isTrusted={isTrusted} onClick={() => onCardClick(rec.id)} />
        ))}
      </div>

      <button className="flex items-center gap-1 px-5 mt-2.5 text-xs font-semibold text-sage">
        See all <ChevronRight size={12} />
      </button>
    </div>
  );
}

// ─── external result card ─────────────────────────────────────────────────────

function ExternalResultCard({ result }: { result: ExternalResult }) {
  const style = CATEGORY_STYLE[result.category] ?? CATEGORY_STYLE.Other;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={cn("w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center", style.bg)}>
        <span className={cn("text-sm font-bold", style.text)}>{result.category[0]}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="font-semibold text-charcoal text-sm leading-tight truncate">{result.businessName}</p>
          <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-black/10 flex-shrink-0">
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", SOURCE_DOT[result.source])} />
            via {result.source}
          </span>
        </div>
        <p className="text-xs text-muted mt-0.5 truncate">{result.city}</p>
        <div className="flex items-center gap-2.5 mt-1 flex-wrap">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", style.bg, style.text)}>
            {result.category}
          </span>
          <span className="text-[11px] text-amber-500 font-medium">{result.rating} ★</span>
          <span className="text-[11px] text-muted">({result.reviewCount})</span>
          <span className="text-[11px] font-bold text-sage">{result.tasteMatch}% match</span>
        </div>
      </div>

      <a
        href={result.viewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-semibold text-sage flex-shrink-0 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        View →
      </a>
    </div>
  );
}

// ─── flat results ─────────────────────────────────────────────────────────────

function FlatResults({ recs, onCardClick, showFallback }: { recs: Recommendation[]; onCardClick: (id: string) => void; showFallback?: boolean }) {
  if (recs.length === 0) {
    if (showFallback) return null;
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
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({ type: "all" });
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allRecs = useMemo(() => [...userRecs, ...recommendations], [userRecs]);
  const friends = users.filter((u) => u.id !== currentUser.id);

  function toggleFilter(f: ActionFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  }

  const isFiltered =
    query.trim().length > 0 ||
    activeCategory !== "All" ||
    activeFilters.size > 0 ||
    locationFilter.type !== "all";

  const filteredRecs = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allRecs.filter((r) => {
      if (activeCategory !== "All" && r.category !== activeCategory) return false;

      // Location filter
      if (locationFilter.type === "city") {
        const nbs = CITY_NEIGHBORHOODS[locationFilter.city] ?? [];
        if (!nbs.includes(r.neighborhood ?? "")) return false;
      } else if (locationFilter.type === "neighborhood") {
        if (r.neighborhood !== locationFilter.neighborhood) return false;
      } else if (locationFilter.type === "custom") {
        const lq = locationFilter.query.toLowerCase();
        if (!r.city.toLowerCase().includes(lq) && !(r.neighborhood?.toLowerCase().includes(lq) ?? false)) return false;
      }

      // Action filters
      if (activeFilters.has("Recs Nearby")) {
        if (r.lat == null || r.lng == null || distanceMiles(avaLocation.lat, avaLocation.lng, r.lat, r.lng) > 5) return false;
      }
      if (activeFilters.has("Open now") && !r.openNow) return false;
      if (activeFilters.has("Take appointments") && !r.reservations) return false;

      if (!q) return true;
      const recommender = users.find((u) => u.id === r.recommenderId);
      return (
        r.businessName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.blurb.toLowerCase().includes(q) ||
        recommender?.name.toLowerCase().includes(q)
      );
    });
  }, [allRecs, query, activeCategory, activeFilters, locationFilter]);

  const hasNetworkResults = useMemo(
    () => filteredRecs.some((r) => avasDirectFriendIds.has(r.recommenderId)),
    [filteredRecs]
  );
  const showFallback = query.trim().length > 0 && !hasNetworkResults;

  const fromYourPeople = useMemo(
    () => allRecs.filter((r) => avasDirectFriendIds.has(r.recommenderId))
      .sort((a, b) => b.vouches.length - a.vouches.length).slice(0, 3),
    [allRecs]
  );

  const friendsOfFriends = useMemo(
    () => allRecs.filter((r) => !avasDirectFriendIds.has(r.recommenderId) && r.recommenderId !== currentUser.id)
      .sort((a, b) => b.likesCount - a.likesCount).slice(0, 2),
    [allRecs]
  );

  const popularNearby = useMemo(
    () => [...allRecs].sort((a, b) =>
      (b.likesCount + b.vouches.length * 2) - (a.likesCount + a.vouches.length * 2)
    ).slice(0, 3),
    [allRecs]
  );

  const selectedRec = selectedId ? allRecs.find((r) => r.id === selectedId) ?? null : null;
  const selectedRecommender = selectedRec
    ? (users.find((u) => u.id === selectedRec.recommenderId) ?? currentUser)
    : currentUser;

  return (
    <>
      <div className="pt-4 pb-4">

        {/* Search */}
        <div className="px-4 mb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recs, places, people…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-black/10 text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

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

        {/* Filter pills: City + action filters */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar mb-4">
          {/* Location pill */}
          <button
            onClick={() => setLocationSheetOpen(true)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
              locationFilter.type !== "all"
                ? "bg-sage text-white border-sage shadow-sm"
                : "bg-white text-charcoal/70 border-black/10 hover:border-black/25"
            )}
          >
            <MapPin size={11} />
            <span>{locationPillLabel(locationFilter)}</span>
            <ChevronDown size={10} />
          </button>

          {/* Action filter pills */}
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

        {/* Content */}
        {isFiltered ? (
          <>
            <FlatResults recs={filteredRecs} onCardClick={setSelectedId} showFallback={showFallback} />

            {showFallback && (
              <div className="mb-5 mt-2">
                <div className="flex items-center gap-2 px-4 mb-2">
                  <h3 className="text-[13px] font-bold tracking-wide uppercase text-muted">You might also like</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/6 text-muted/70 ml-auto">
                    via Yelp &amp; Google
                  </span>
                </div>
                <div className="mx-4 bg-white rounded-2xl shadow-sm shadow-black/5 divide-y divide-black/5 overflow-hidden">
                  {getMockExternalResults(query, 5).map((result) => (
                    <ExternalResultCard key={result.id} result={result} />
                  ))}
                </div>
                <p className="text-[10px] text-muted/50 px-5 mt-2">
                  These results come from Yelp and Google and haven&apos;t been vetted by your network.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <Section icon={Users} label="From your people" badge="Most trusted" badgeStyle="bg-sage text-white" recs={fromYourPeople} isTrusted onCardClick={setSelectedId} />
            <Section icon={Users} label="Friends of friends" recs={friendsOfFriends} onCardClick={setSelectedId} />
            <Section icon={TrendingUp} label="Popular in your area" recs={popularNearby} onCardClick={setSelectedId} />
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
        onVouch={(chain) => { if (!selectedId) return; addVouch(selectedId); if (chain) addVouchChain(selectedId, chain); }}
        onUnvouch={() => selectedId && removeVouch(selectedId)}
        onDisagree={(comment) => selectedId && addDisagreement(selectedId, comment)}
        vouchChains={selectedId ? (interactions.vouchChains[selectedId] ?? []) : []}
        disagreements={selectedId ? (interactions.disagreements[selectedId] ?? []) : []}
      />

      <LocationSheet
        isOpen={locationSheetOpen}
        userCities={currentUser.cities ?? []}
        currentFilter={locationFilter}
        onClose={() => setLocationSheetOpen(false)}
        onSelect={setLocationFilter}
      />
    </>
  );
}
