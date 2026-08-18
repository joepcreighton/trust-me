"use client";

import { useState, useEffect } from "react";
import { recommendations, users, currentUser, Category } from "@/lib/mock-data";
import { useUserRecs } from "@/lib/user-recs-context";
import { RecommendationCard } from "@/components/recommendation-card";
import { CategoryFilter } from "@/components/category-filter";

interface Interactions {
  likes: string[];
  vouches: string[];
  saves: string[];
}

const STORAGE_KEY = "trust-me-interactions";

export default function HomePage() {
  const { userRecs } = useUserRecs();
  const [interactions, setInteractions] = useState<Interactions>({
    likes: [],
    vouches: [],
    saves: [],
  });
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setInteractions(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  function toggle(type: keyof Interactions, id: string) {
    setInteractions((prev) => {
      const arr = prev[type];
      const next = arr.includes(id)
        ? arr.filter((x) => x !== id)
        : [...arr, id];
      const updated = { ...prev, [type]: next };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }

  const friends = users.filter((u) => u.id !== currentUser.id);

  // User-posted recs appear at the top; mock data fills the rest
  const allRecs = [...userRecs, ...recommendations];

  const filtered =
    activeCategory === "All"
      ? allRecs
      : allRecs.filter((r) => r.category === activeCategory);

  return (
    <div className="pt-4 pb-4">
      {/* Feed header */}
      <div className="px-4 mb-4">
        <h2 className="font-display text-2xl text-charcoal">From your circle</h2>
        <p className="text-sm text-muted mt-0.5">
          Recommendations from people you trust
        </p>
      </div>

      {/* Category filter */}
      <div className="mb-4">
        <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <p className="text-muted text-sm">No {activeCategory} recommendations yet.</p>
          <p className="text-muted/60 text-xs mt-1">Be the first to share one!</p>
        </div>
      ) : (
        filtered.map((rec) => {
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
    </div>
  );
}
