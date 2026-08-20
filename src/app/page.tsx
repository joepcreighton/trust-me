"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  recommendations,
  users,
  currentUser,
  mockAsks,
  Ask,
  Recommendation,
  Category,
} from "@/lib/mock-data";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { RecommendationCard } from "@/components/recommendation-card";
import { cn } from "@/lib/utils";

const ASKS_KEY = "trust-me-asks";

const CATEGORY_STYLE: Record<Category, { bg: string; text: string }> = {
  Beauty:  { bg: "bg-pink-100",   text: "text-pink-700" },
  Health:  { bg: "bg-teal-100",   text: "text-teal-700" },
  Food:    { bg: "bg-orange-100", text: "text-orange-700" },
  Home:    { bg: "bg-blue-100",   text: "text-blue-700" },
  Fitness: { bg: "bg-purple-100", text: "text-purple-700" },
  Pets:    { bg: "bg-lime-100",   text: "text-lime-700" },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

function AskFeedCard({ ask }: { ask: Ask }) {
  const asker = users.find((u) => u.id === ask.askerId) ?? currentUser;
  const catStyle = ask.category ? CATEGORY_STYLE[ask.category] : null;

  const repliers = ask.replies
    .map((r) => users.find((u) => u.id === r.replierId))
    .filter((u): u is NonNullable<typeof u> => u != null)
    .slice(0, 4);

  return (
    <div className="mx-4 mb-4 bg-cream rounded-2xl border border-black/8 px-4 py-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asker.avatar} alt={asker.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-charcoal">{asker.name}</p>
          <p className="text-[11px] text-muted">{timeAgo(ask.timestamp)}</p>
        </div>
        <span className="text-[10px] font-bold text-muted/70 uppercase tracking-wider bg-black/6 px-2 py-0.5 rounded-full flex-shrink-0">
          asking for
        </span>
        {catStyle && ask.category && (
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", catStyle.bg, catStyle.text)}>
            {ask.category}
          </span>
        )}
      </div>

      <p className="text-sm text-charcoal leading-relaxed">&ldquo;{ask.question}&rdquo;</p>

      {repliers.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-black/6">
          <div className="flex -space-x-1.5">
            {repliers.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u.id} src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full border-2 border-cream object-cover" />
            ))}
          </div>
          <span className="text-[11px] text-muted">
            {ask.replies.length} {ask.replies.length === 1 ? "reply" : "replies"}
          </span>
        </div>
      )}
    </div>
  );
}

type FeedItem =
  | { type: "rec"; data: Recommendation; timestamp: string; hasTrustedChain: boolean }
  | { type: "ask"; data: Ask; timestamp: string; hasTrustedChain: false };

export default function HomePage() {
  const router = useRouter();
  const { userRecs } = useUserRecs();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();
  const [userAsks, setUserAsks] = useState<Ask[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ASKS_KEY);
      if (stored) setUserAsks(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const friends = users.filter((u) => u.id !== currentUser.id);

  const feedItems = useMemo((): FeedItem[] => {
    const allRecs = [...userRecs, ...recommendations];
    const allAsks = [...userAsks, ...mockAsks];
    const items: FeedItem[] = [
      ...allRecs.map((r) => {
        const chains = interactions.vouchChains[r.id] ?? [];
        const hasTrustedChain = chains.some((c) => c.length >= 3);
        return { type: "rec" as const, data: r, timestamp: r.timestamp, hasTrustedChain };
      }),
      ...allAsks.map((a) => ({
        type: "ask" as const, data: a, timestamp: a.timestamp, hasTrustedChain: false as const,
      })),
    ];
    // Trusted chains (3+ people) surface above non-chain items; within each group, sort by time
    return items.sort((a, b) => {
      if (a.hasTrustedChain !== b.hasTrustedChain) return a.hasTrustedChain ? -1 : 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [userRecs, userAsks, interactions.vouchChains]);

  return (
    <div className="pt-4 pb-4">
      {/* Compose bar */}
      <button
        onClick={() => router.push("/ask")}
        className="mx-4 mb-5 w-[calc(100%-2rem)] flex items-center gap-3 bg-white rounded-2xl shadow-sm shadow-black/5 px-4 py-3 text-left active:scale-[0.99] transition-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        <span className="flex-1 text-sm text-muted/70">What are you looking for?</span>
        <ChevronRight size={16} className="text-muted/40 flex-shrink-0" />
      </button>

      {/* Mixed timeline */}
      {feedItems.map((item) => {
        if (item.type === "ask") {
          return <AskFeedCard key={item.data.id} ask={item.data} />;
        }

        const rec = item.data;
        const recommender = users.find((u) => u.id === rec.recommenderId) ?? currentUser;
        const chains = interactions.vouchChains[rec.id] ?? [];
        const disagreements = interactions.disagreements[rec.id] ?? [];

        return (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            recommender={recommender}
            isLiked={interactions.likes.includes(rec.id)}
            isVouched={interactions.vouches.includes(rec.id)}
            isSaved={interactions.saves.includes(rec.id)}
            onToggleLike={() => toggle("likes", rec.id)}
            onToggleSave={() => toggle("saves", rec.id)}
            onVouch={(chain) => {
              addVouch(rec.id);
              if (chain) addVouchChain(rec.id, chain);
            }}
            onUnvouch={() => removeVouch(rec.id)}
            onDisagree={(comment) => addDisagreement(rec.id, comment)}
            friends={friends}
            currentUserAvatar={currentUser.avatar}
            vouchChains={chains}
            disagreements={disagreements}
          />
        );
      })}
    </div>
  );
}
