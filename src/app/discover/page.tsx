"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronRight, Users, TrendingUp, X, MapPin, ChevronDown, Heart, Handshake, Star } from "lucide-react";
import Link from "next/link";
import {
  CITY_NEIGHBORHOODS,
  Category,
  Recommendation,
  ExternalResult,
  getMockExternalResults,
} from "@/lib/mock-data";
import type { DbRecommendation } from "@/lib/db-types";
import { useCurrentUser } from "@/lib/auth-context";
import { useInteractions } from "@/lib/use-interactions";
import { CardSheet } from "@/components/card-sheet";
import { LocationSheet, LocationFilter } from "@/components/location-sheet";
import { SkeletonList } from "@/components/skeleton-card";
import { createClient } from "@/lib/supabase/client";
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

// ─── recs for you ────────────────────────────────────────────────────────────

const DEFAULT_AVATAR = "https://i.pravatar.cc/150?u=placeholder";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapDbRec(row: DbRecommendation): Recommendation & { _recommenderName: string; _recommenderAvatar: string } {
  return {
    id: row.id,
    recommenderId: row.user_id,
    businessName: row.business_name,
    serviceProvider: row.service_provider ?? undefined,
    category: capitalize(row.category) as Category,
    subCategory: row.subcategory ?? "Other",
    city: row.city ?? "",
    neighborhood: row.neighborhood ?? undefined,
    lat: row.latitude ?? undefined,
    lng: row.longitude ?? undefined,
    blurb: row.blurb,
    photo: row.photo_url ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    timestamp: row.created_at,
    likesCount: row.likes?.length ?? 0,
    vouches: row.vouches?.map((v) => v.user_id) ?? [],
    commentCount: 0,
    reservations: row.takes_appointments,
    _recommenderName: row.recommender?.full_name ?? "Someone",
    _recommenderAvatar: row.recommender?.avatar_url ?? DEFAULT_AVATAR,
  };
}

function RecsForYouCard({
  rec,
  reason,
  onClick,
}: {
  rec: Recommendation;
  reason: string;
  onClick: () => void;
}) {
  const style = CATEGORY_STYLE[rec.category as Category] ?? CATEGORY_STYLE.Other;
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[168px] rounded-2xl overflow-hidden bg-white shadow-sm shadow-black/8 active:scale-[0.97] transition-transform text-left"
    >
      <div className="h-[128px] w-full overflow-hidden relative">
        {rec.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.photo} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className={cn("w-full h-full", style.bg)} />
        )}
        <span className={cn(
          "absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full",
          "bg-white/85 backdrop-blur-sm",
          style.text
        )}>
          {rec.subCategory}
        </span>
      </div>

      <div className="p-3">
        <p className="font-semibold text-charcoal text-[13px] leading-tight line-clamp-2">{rec.businessName}</p>
        <p className="text-[10px] text-muted mt-0.5 truncate">{rec.neighborhood ?? rec.city}</p>

        <div className="flex items-start gap-1 mt-2.5">
          <span className="text-sage text-[10px] mt-[1px] flex-shrink-0">✦</span>
          <p className="text-[10px] text-muted/80 leading-relaxed line-clamp-2">{reason}</p>
        </div>

        <div className="flex items-center gap-2.5 mt-2">
          <span className="flex items-center gap-0.5 text-[10px] text-muted/60">
            <Handshake size={10} strokeWidth={1.5} />
            {rec.vouches.length}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted/60">
            <Heart size={10} strokeWidth={1.5} />
            {rec.likesCount}
          </span>
        </div>
      </div>
    </button>
  );
}

function RecsForYouSection({
  items,
  onCardClick,
}: {
  items: { rec: Recommendation; reason: string }[];
  onCardClick: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="px-4 mb-3">
        <h2 className="font-display text-[1.05rem] font-bold text-charcoal leading-tight">Recs for You</h2>
        <p className="text-[11px] text-muted mt-0.5">Based on your taste &amp; activity</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pl-4 pb-2 no-scrollbar">
        {items.map(({ rec, reason }) => (
          <RecsForYouCard
            key={rec.id}
            rec={rec}
            reason={reason}
            onClick={() => onCardClick(rec.id)}
          />
        ))}
        <div className="flex-shrink-0 w-2" />
      </div>
    </div>
  );
}

// ─── compact discover card ────────────────────────────────────────────────────

function DiscoverCard({
  rec,
  recommenderName,
  isTrusted,
  onClick,
}: {
  rec: Recommendation;
  recommenderName?: string;
  isTrusted?: boolean;
  onClick: () => void;
}) {
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
          by {(recommenderName ?? "Someone").split(" ")[0]} · {rec.city}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", style.bg, style.text)}>
            {rec.category}
          </span>
          <span className="flex items-center gap-2 text-[11px] text-muted">
            <Heart size={11} strokeWidth={1.5} />
            {rec.likesCount}
            <span className="text-muted/30">·</span>
            <Handshake size={11} strokeWidth={1.5} />
            {rec.vouches.length}
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

type RichRec = Recommendation & { _recommenderName: string; _recommenderAvatar: string };

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
  recs: RichRec[];
  isTrusted?: boolean;
  onCardClick: (id: string) => void;
}) {
  if (recs.length === 0) return null;
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
          <DiscoverCard key={rec.id} rec={rec} recommenderName={rec._recommenderName} isTrusted={isTrusted} onClick={() => onCardClick(rec.id)} />
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
          <span className="flex items-center gap-0.5 text-[11px] text-amber-500 font-medium">
            <Star size={10} className="fill-amber-500" strokeWidth={0} />
            {result.rating}
          </span>
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

// ─── person row ───────────────────────────────────────────────────────────────

type PersonResult = {
  id: string;
  handle: string;
  full_name: string;
  avatar_url: string | null;
  locations: Array<{ city: string; state: string; neighborhood?: string }>;
};

function PersonRow({
  person,
  friendIds,
  sentRequestIds,
  onAddFriend,
}: {
  person: PersonResult;
  friendIds: Set<string>;
  sentRequestIds: Set<string>;
  onAddFriend: () => void;
}) {
  const primaryCity = person.locations?.[0]?.city;
  const isFriend = friendIds.has(person.id);
  const isPending = sentRequestIds.has(person.id);

  return (
    <Link
      href={`/profile/${person.id}`}
      className="flex items-center gap-3 px-4 py-3.5 active:bg-black/4 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={person.avatar_url ?? `https://i.pravatar.cc/150?u=${person.id}`}
        alt={person.full_name}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm leading-tight">{person.full_name}</p>
        <p className="text-xs text-muted mt-0.5 truncate">
          @{person.handle}{primaryCity ? ` · ${primaryCity}` : ""}
        </p>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddFriend(); }}
        disabled={isFriend || isPending}
        className={cn(
          "flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all",
          isFriend
            ? "bg-sage/10 text-sage border-sage/20"
            : isPending
            ? "bg-black/5 text-muted border-black/10"
            : "bg-sage text-white border-sage shadow-sm active:scale-95"
        )}
      >
        {isFriend ? "Friends" : isPending ? "Requested" : "Add friend"}
      </button>
    </Link>
  );
}

// ─── flat results ─────────────────────────────────────────────────────────────

function FlatResults({ recs, onCardClick, showFallback }: { recs: RichRec[]; onCardClick: (id: string) => void; showFallback?: boolean }) {
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
          <DiscoverCard key={rec.id} rec={rec} recommenderName={rec._recommenderName} onClick={() => onCardClick(rec.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const currentUser = useCurrentUser();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [activeFilters, setActiveFilters] = useState<Set<ActionFilter>>(new Set());
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({ type: "all" });
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [allRecs, setAllRecs] = useState<RichRec[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // People search state
  const [peopleResults, setPeopleResults] = useState<PersonResult[]>([]);
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const [recRes, friendRes, pendingRes] = await Promise.all([
        supabase
          .from("recommendations")
          .select(`
            *,
            recommender:users!user_id(id, handle, full_name, avatar_url),
            vouches(user_id),
            likes(user_id)
          `)
          .order("created_at", { ascending: false })
          .limit(100),
        currentUser.id
          ? supabase
              .from("friendships")
              .select("user_a, user_b")
              .eq("status", "accepted")
              .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`)
          : Promise.resolve({ data: [] }),
        currentUser.id
          ? supabase
              .from("friendships")
              .select("user_a, user_b")
              .eq("status", "pending")
              .eq("requested_by", currentUser.id)
          : Promise.resolve({ data: [] }),
      ]);

      if (recRes.data) {
        setAllRecs((recRes.data as DbRecommendation[]).map(mapDbRec));
      }

      if (friendRes.data) {
        const ids = new Set(
          (friendRes.data as { user_a: string; user_b: string }[]).map((row) =>
            row.user_a === currentUser.id ? row.user_b : row.user_a
          )
        );
        setFriendIds(ids);
      }

      if (pendingRes.data) {
        const sent = new Set(
          (pendingRes.data as { user_a: string; user_b: string }[]).map((row) =>
            row.user_a === currentUser.id ? row.user_b : row.user_a
          )
        );
        setSentRequestIds(sent);
      }

      setLoading(false);
    }

    if (currentUser.id !== "") loadData();
  }, [currentUser.id]);

  // Debounced people search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || !currentUser.id) {
      setPeopleResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("id, handle, full_name, avatar_url, locations")
        .or(`full_name.ilike.%${q}%,handle.ilike.%${q}%`)
        .neq("id", currentUser.id)
        .limit(5);
      if (!cancelled && data) {
        setPeopleResults(data as PersonResult[]);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, currentUser.id]);

  async function sendFriendRequest(personId: string) {
    if (!currentUser.id) return;
    const supabase = createClient();
    const { error } = await supabase.from("friendships").insert({
      user_a: currentUser.id,
      user_b: personId,
      status: "pending",
      requested_by: currentUser.id,
    });
    if (!error) setSentRequestIds((prev) => new Set([...prev, personId]));
  }

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

      if (locationFilter.type === "city") {
        const nbs = CITY_NEIGHBORHOODS[locationFilter.city] ?? [];
        if (!nbs.includes(r.neighborhood ?? "")) return false;
      } else if (locationFilter.type === "neighborhood") {
        if (r.neighborhood !== locationFilter.neighborhood) return false;
      } else if (locationFilter.type === "custom") {
        const lq = locationFilter.query.toLowerCase();
        if (!r.city.toLowerCase().includes(lq) && !(r.neighborhood?.toLowerCase().includes(lq) ?? false)) return false;
      }

      if (activeFilters.has("Recs Nearby")) {
        if (r.lat == null || r.lng == null) return false;
      }
      if (activeFilters.has("Take appointments") && !r.reservations) return false;

      if (!q) return true;
      return (
        r.businessName.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.blurb.toLowerCase().includes(q) ||
        r._recommenderName.toLowerCase().includes(q)
      );
    });
  }, [allRecs, query, activeCategory, activeFilters, locationFilter]);

  // Only show fallback when there's a real query AND zero network results
  const showFallback = query.trim().length > 0 && filteredRecs.length === 0;

  const fromYourPeople = useMemo(
    () => allRecs.filter((r) => friendIds.has(r.recommenderId))
      .sort((a, b) => b.vouches.length - a.vouches.length).slice(0, 5),
    [allRecs, friendIds]
  );

  const popularNearby = useMemo(
    () => [...allRecs].sort((a, b) =>
      (b.likesCount + b.vouches.length * 2) - (a.likesCount + a.vouches.length * 2)
    ).slice(0, 5),
    [allRecs]
  );

  const allOthers = useMemo(
    () => allRecs.filter((r) => !friendIds.has(r.recommenderId) && r.recommenderId !== currentUser.id)
      .sort((a, b) => b.likesCount - a.likesCount).slice(0, 5),
    [allRecs, friendIds, currentUser.id]
  );

  const selectedRec = selectedId ? (allRecs.find((r) => r.id === selectedId) ?? null) : null;
  const selectedRecommender = selectedRec
    ? { id: selectedRec.recommenderId, name: selectedRec._recommenderName, username: "unknown", avatar: selectedRec._recommenderAvatar, friends: [] as [] }
    : { id: "", name: "", username: "", avatar: DEFAULT_AVATAR, friends: [] as [] };

  const friends = allRecs
    .map((r) => ({ id: r.recommenderId, name: r._recommenderName, username: "unknown", avatar: r._recommenderAvatar, friends: [] as [] }))
    .filter((u, i, arr) => u.id && u.id !== currentUser.id && arr.findIndex((x) => x.id === u.id) === i);

  const showPeople = query.trim().length >= 2 && peopleResults.length > 0;

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

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar mb-4">
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
        {loading ? (
          <SkeletonList count={3} />
        ) : (
          <>
            {/* People section — above recs when there are matches */}
            {showPeople && (
              <div className="mb-5">
                <div className="flex items-center gap-2 px-4 mb-2">
                  <Users size={14} className="text-charcoal" />
                  <h3 className="text-[13px] font-bold tracking-wide uppercase text-charcoal">People</h3>
                </div>
                <div className="mx-4 bg-white rounded-2xl shadow-sm shadow-black/5 divide-y divide-black/5 overflow-hidden">
                  {peopleResults.map((person) => (
                    <PersonRow
                      key={person.id}
                      person={person}
                      friendIds={friendIds}
                      sentRequestIds={sentRequestIds}
                      onAddFriend={() => sendFriendRequest(person.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rec results */}
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
            ) : allRecs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <p className="text-sm text-muted">No recommendations yet.</p>
                <p className="text-xs text-muted/60 mt-1">Be the first to share one!</p>
              </div>
            ) : (
              <>
                <Section icon={Users} label="From your people" badge="Most trusted" badgeStyle="bg-sage text-white" recs={fromYourPeople} isTrusted onCardClick={setSelectedId} />
                <Section icon={Users} label="From the network" recs={allOthers} onCardClick={setSelectedId} />
                <Section icon={TrendingUp} label="Most loved" recs={popularNearby} onCardClick={setSelectedId} />
              </>
            )}
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
        vouchChains={[]}
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
