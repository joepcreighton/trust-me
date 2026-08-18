"use client";

import { useState } from "react";
import { Bookmark, ChevronRight } from "lucide-react";
import { recommendations, users, currentUser, Category, Recommendation } from "@/lib/mock-data";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { CardSheet } from "@/components/card-sheet";
import { cn } from "@/lib/utils";

// ─── constants ───────────────────────────────────────────────────────────────

const CATEGORY_ORDER: Category[] = ["Beauty", "Health", "Home", "Food", "Fitness", "Pets"];

const CATEGORY_META: Record<Category, { emoji: string; bg: string; text: string }> = {
  Beauty:  { emoji: "💅", bg: "bg-pink-50",   text: "text-pink-600" },
  Health:  { emoji: "🌿", bg: "bg-teal-50",   text: "text-teal-600" },
  Home:    { emoji: "🏡", bg: "bg-blue-50",   text: "text-blue-600" },
  Food:    { emoji: "🍜", bg: "bg-orange-50", text: "text-orange-600" },
  Fitness: { emoji: "💪", bg: "bg-purple-50", text: "text-purple-600" },
  Pets:    { emoji: "🐾", bg: "bg-lime-50",   text: "text-lime-600" },
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
            <span className="text-xl">{meta.emoji}</span>
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
  const { userRecs } = useUserRecs();
  const { interactions, toggle } = useInteractions();
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
        {grouped.map(({ category, meta, recs }) => (
          <div key={category} className="mb-6">
            {/* Category header */}
            <div className="flex items-center gap-2 px-4 mb-2">
              <span className="text-base leading-none">{meta.emoji}</span>
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
        ))}
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
        onToggleVouch={() => selectedId && toggle("vouches", selectedId)}
        onToggleSave={() => selectedId && handleToggleSave(selectedId)}
      />
    </>
  );
}
