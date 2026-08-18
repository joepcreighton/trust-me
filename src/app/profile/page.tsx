"use client";

import { useState } from "react";
import { Handshake, Sparkles } from "lucide-react";
import { recommendations, users, currentUser } from "@/lib/mock-data";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { RecommendationCard } from "@/components/recommendation-card";
import { cn } from "@/lib/utils";

type ProfileTab = "recs" | "vouched";

// ─── sub-components ──────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display text-[1.5rem] text-charcoal leading-tight">
        {value}
      </span>
      <span className="text-[11px] text-muted leading-tight">{label}</span>
    </div>
  );
}

function EmptyRecs() {
  return (
    <div className="flex flex-col items-center text-center py-12 px-8">
      <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mb-4">
        <Sparkles size={24} className="text-sage" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-xl text-charcoal mb-2">
        Your recs live here
      </h3>
      <p className="text-sm text-muted leading-relaxed max-w-[240px]">
        Tap the{" "}
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sage text-white text-[10px] font-bold relative -top-px mx-0.5">
          +
        </span>{" "}
        below to share your first recommendation with your circle.
      </p>
    </div>
  );
}

function EmptyVouched() {
  return (
    <div className="flex flex-col items-center text-center py-12 px-8">
      <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mb-4">
        <Handshake size={24} className="text-sage" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-xl text-charcoal mb-2">
        Nothing vouched yet
      </h3>
      <p className="text-sm text-muted leading-relaxed max-w-[240px]">
        When you tap 🤝 on a rec you&apos;ve personally experienced, it shows
        up here — your personal shortlist of tried-and-trusted.
      </p>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("recs");
  const { userRecs } = useUserRecs();
  const { interactions, toggle } = useInteractions();

  const friends = users.filter((u) => u.id !== currentUser.id);

  // Recs Ava has personally vouched for (across mock + user-posted)
  const allRecs = [...userRecs, ...recommendations];
  const vouchedRecs = allRecs.filter((r) =>
    interactions.vouches.includes(r.id)
  );

  const friendCount = users.length - 1; // exclude Ava herself

  return (
    <div>
      {/* ── Profile header ──────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-sage-light"
          />
          {/* Subtle online indicator */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-sage border-2 border-white" />
        </div>

        {/* Identity */}
        <h2 className="font-display text-2xl text-charcoal leading-tight">
          {currentUser.name}
        </h2>
        <p className="text-sm text-muted mt-0.5">@{currentUser.username}</p>

        {/* Bio */}
        <p className="text-sm text-charcoal/75 italic mt-3 max-w-[260px] mx-auto leading-relaxed">
          &ldquo;I only share what I&apos;d genuinely tell a close friend.&rdquo;
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-5">
          <StatPill value={89} label="following" />
          <div className="w-px h-8 bg-black/8" />
          <StatPill value={156} label="followers" />
          <div className="w-px h-8 bg-black/8" />
          <StatPill value={friendCount} label="friends" />
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-black/8 bg-cream sticky top-0 z-10">
        {(
          [
            {
              key: "recs" as ProfileTab,
              label: "My Recs",
              count: userRecs.length,
            },
            {
              key: "vouched" as ProfileTab,
              label: "Vouched",
              count: vouchedRecs.length,
            },
          ] as const
        ).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold",
              "border-b-2 -mb-px transition-colors",
              activeTab === key
                ? "border-sage text-charcoal"
                : "border-transparent text-muted hover:text-charcoal/70"
            )}
          >
            {label}
            {count > 0 && (
              <span
                className={cn(
                  "text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  activeTab === key
                    ? "bg-sage text-white"
                    : "bg-black/8 text-muted"
                )}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="pt-4 pb-4">
        {activeTab === "recs" && (
          <>
            {userRecs.length === 0 ? (
              <EmptyRecs />
            ) : (
              userRecs.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  recommender={currentUser}
                  isLiked={interactions.likes.includes(rec.id)}
                  isVouched={interactions.vouches.includes(rec.id)}
                  isSaved={interactions.saves.includes(rec.id)}
                  onToggleLike={() => toggle("likes", rec.id)}
                  onToggleVouch={() => toggle("vouches", rec.id)}
                  onToggleSave={() => toggle("saves", rec.id)}
                  friends={friends}
                  currentUserAvatar={currentUser.avatar}
                />
              ))
            )}
          </>
        )}

        {activeTab === "vouched" && (
          <>
            {vouchedRecs.length === 0 ? (
              <EmptyVouched />
            ) : (
              vouchedRecs.map((rec) => {
                const recommender =
                  users.find((u) => u.id === rec.recommenderId) ?? currentUser;
                return (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    recommender={recommender}
                    isLiked={interactions.likes.includes(rec.id)}
                    isVouched={interactions.vouches.includes(rec.id)}
                    isSaved={interactions.saves.includes(rec.id)}
                    onToggleLike={() => toggle("likes", rec.id)}
                    onToggleVouch={() => toggle("vouches", rec.id)}
                    onToggleSave={() => toggle("saves", rec.id)}
                    friends={friends}
                    currentUserAvatar={currentUser.avatar}
                  />
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
