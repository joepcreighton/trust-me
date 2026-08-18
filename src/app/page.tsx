"use client";

import { useState, useEffect } from "react";
import { recommendations, users, currentUser } from "@/lib/mock-data";
import { RecommendationCard } from "@/components/recommendation-card";

interface Interactions {
  likes: string[];
  vouches: string[];
  saves: string[];
}

const STORAGE_KEY = "trust-me-interactions";

export default function HomePage() {
  const [interactions, setInteractions] = useState<Interactions>({
    likes: [],
    vouches: [],
    saves: [],
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setInteractions(JSON.parse(stored));
    } catch {
      // ignore parse errors
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
        // ignore storage errors
      }
      return updated;
    });
  }

  const friends = users.filter((u) => u.id !== currentUser.id);

  return (
    <div className="pt-4 pb-4">
      {/* Feed header */}
      <div className="px-4 mb-5">
        <h2 className="font-display text-2xl text-charcoal">
          From your circle
        </h2>
        <p className="text-sm text-muted mt-0.5">
          Recommendations from people you trust
        </p>
      </div>

      {/* Cards */}
      {recommendations.map((rec) => {
        const recommender = users.find((u) => u.id === rec.recommenderId)!;
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
      })}
    </div>
  );
}
