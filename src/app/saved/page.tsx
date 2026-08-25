"use client";

import { useState } from "react";
import { Bookmark, ChevronRight, Sparkles, HeartPulse, Home, Dumbbell, PawPrint, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { recommendations, users, Category, Recommendation } from "@/lib/mock-data";
import { useCurrentUser } from "@/lib/auth-context";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { CardSheet } from "@/components/card-sheet";
import { cn } from "@/lib/utils";

// ─── constants ───────────────────────────────────────────────────────────────

const CATEGORY_ORDER: Category[] = ["Beauty", "Health", "Home", "Fitness", "Pets", "Other"];

const CATEGORY_META: Record<Category, { icon: LucideIcon; bg: string; text: string }> = {
  Beauty:  { icon: Sparkles,   bg: "bg-pink-50",   text: "text-pink-600" },
  Health:  { icon: HeartPulse, bg: "bg-teal-50",   text: "text-teal-600" },
  Home:    { icon: Home,       bg: "bg-blue-50",   text: "text-blue-600" },
  Fitness: { icon: Dumbbell,   bg: "bg-purple-50", text: "text-purple-600" },
  Pets:    { icon: PawPrint,   bg: "bg-lime-50",   text: "text-lime-600" },
  Other:   { icon: Circle,     bg: "bg-gray-50",   text: "text-gray-500" },
};

// ─── compact list item ───────────────────────────────────────────────────────

function SavedItem({
  rec,
  recommenderName,
  onClick,
}: {
  rec: Recommendation;
  recommenderName: string;
  onClick: () => void;
}) {
  const meta = CATEGORY_META[rec.category];
  const PlaceholderIcon = meta.icon;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-black/4 group"
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        {rec.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rec.photo}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center", meta.bg)}>
            <PlaceholderIcon size={20} strokeWidth={1.5} className={meta.text} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm leading-tight truncate">
          {rec.businessName}
        </p>
        <p className="text-xs text-muted mt-0.5 truncate">
          {recommenderName} · {rec.city}
        </p>
        <p className="text-xs text-charcoal/60 mt-0.5 line-clamp-1 leading-relaxed">
          {rec.blurb}
        </p>
      </div>

      <ChevronRight
        size={16}
        className="text-muted/40 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function SavedPage() {
  const currentUser = useCurrentUser();
  const { userRecs } = useUserRecs();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allRecs = [...userRecs, ...recommendations];
  const friends = users.filter((u) => u.id !== currentUser.id);

  // Only show recs that are currently saved
  const savedRecs = allRecs.filter((r) => interactions.saves.includes(r.id));

  // Group by category in defined order, drop empty groups
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    meta: CATEGORY_META[cat],
    recs: savedRecs.filter((r) => r.category === cat),
  })).filter((g) => g.recs.length > 0);

  const selectedRec = selectedId
    ? allRecs.find((r) => r.id === selectedId) ?? null
    : null;

  const selectedRecommender = selectedRec
    ? (users.find((u) => u.id === selectedRec.recommenderId) ?? currentUser)
    : currentUser;

  function handleToggleSave(id: string) {
    toggle("saves", id);
    // Close sheet immediately when the user unsaves the open card
    if (selectedId === id) setSelectedId(null);
  }

  // ── empty state ────────────────────────────────────────────────────────────
  if (savedRecs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center mb-5">
          <Bookmark size={26} className="text-sage" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-2xl text-charcoal mb-2">Nothing saved yet</h2>
        <p className="text-sm text-muted leading-relaxed max-w-[260px]">
          Tap the bookmark icon on any recommendation to save it here, organized
          by category.
        </p>
      </div>
    );
  }

  // ── main view ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="pt-5 pb-4">
        {/* Page header */}
        <div className="px-4 mb-6">
          <h2 className="font-display text-2xl text-charcoal">Saved</h2>
          <p className="text-sm text-muted mt-0.5">
            {savedRecs.length} bookmark{savedRecs.length !== 1 ? "s" : ""} across{" "}
            {grouped.length} {grouped.length !== 1 ? "categories" : "category"}
          </p>
        </div>

        {/* Category groups */}
        {grouped.map(({ category, meta, recs }) => {
          const CategoryIcon = meta.icon;
          return (
          <div key={category} className="mb-6">
            {/* Category header */}
            <div className="flex items-center gap-2 px-4 mb-2">
              <CategoryIcon size={16} strokeWidth={1.75} className={meta.text} />
              <h3 className="text-[13px] font-bold text-charcoal tracking-wide uppercase">
                {category}
              </h3>
              <span
                className={cn(
                  "text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
                  meta.bg,
                  meta.text
                )}
              >
                {recs.length}
              </span>
            </div>

            {/* Card */}
            <div className="mx-4 bg-white rounded-2xl shadow-sm shadow-black/5 overflow-hidden divide-y divide-black/5">
              {recs.map((rec) => {
                const recommender =
                  users.find((u) => u.id === rec.recommenderId) ?? currentUser;
                return (
                  <SavedItem
                    key={rec.id}
                    rec={rec}
                    recommenderName={recommender.name}
                    onClick={() => setSelectedId(rec.id)}
                  />
                );
              })}
            </div>
          </div>
          );
        })}
      </div>

      {/* Full-card detail sheet */}
      <CardSheet
        rec={selectedRec}
        onClose={() => setSelectedId(null)}
        recommender={selectedRecommender}
        friends={friends}
        currentUserAvatar={currentUser.avatar}
        isLiked={selectedId ? interactions.likes.includes(selectedId) : false}
        isVouched={selectedId ? interactions.vouches.includes(selectedId) : false}
        isSaved={selectedId ? interactions.saves.includes(selectedId) : true}
        onToggleLike={() => selectedId && toggle("likes", selectedId)}
        onToggleSave={() => selectedId && handleToggleSave(selectedId)}
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
