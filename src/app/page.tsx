"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Category, Ask, Recommendation } from "@/lib/mock-data";
import type { DbRecommendation, DbAsk } from "@/lib/db-types";
import { useCurrentUser } from "@/lib/auth-context";
import { useInteractions } from "@/lib/use-interactions";
import { RecommendationCard } from "@/components/recommendation-card";
import { SkeletonList } from "@/components/skeleton-card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DEFAULT_AVATAR = "https://i.pravatar.cc/150?u=placeholder";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapDbRec(row: DbRecommendation): Recommendation {
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
  };
}

function mapDbAsk(row: DbAsk): Ask {
  return {
    id: row.id,
    askerId: row.user_id,
    question: row.question,
    category: row.category ? (capitalize(row.category) as Category) : undefined,
    timestamp: row.created_at,
    replies: (row.replies ?? []).map((r) => ({
      replierId: r.user_id,
      recId: r.recommendation_id ?? "",
      note: r.text ?? "",
    })),
  };
}

function mapDbUser(u: DbRecommendation["recommender"]) {
  return {
    id: u?.id ?? "",
    name: u?.full_name ?? "Unknown",
    username: u?.handle ?? "unknown",
    avatar: u?.avatar_url ?? DEFAULT_AVATAR,
    friends: [],
  };
}

const ASKS_KEY = "trust-me-asks";

const CATEGORY_STYLE: Record<Category, { bg: string; text: string }> = {
  Beauty:  { bg: "bg-pink-100",   text: "text-pink-700" },
  Health:  { bg: "bg-teal-100",   text: "text-teal-700" },
  Home:    { bg: "bg-blue-100",   text: "text-blue-700" },
  Fitness: { bg: "bg-purple-100", text: "text-purple-700" },
  Pets:    { bg: "bg-lime-100",   text: "text-lime-700" },
  Other:   { bg: "bg-gray-100",   text: "text-gray-600" },
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

function AskFeedCard({ ask, askerName, askerAvatar, replierAvatars }: {
  ask: Ask;
  askerName: string;
  askerAvatar: string;
  replierAvatars: string[];
}) {
  const catStyle = ask.category ? CATEGORY_STYLE[ask.category] : null;

  return (
    <div className="mx-4 mb-4 bg-cream rounded-2xl border border-black/8 px-4 py-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <Link href={`/profile/${ask.askerId}`} className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={askerAvatar} alt={askerName} className="w-8 h-8 rounded-full object-cover" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${ask.askerId}`} className="text-xs font-semibold text-charcoal hover:underline underline-offset-2">{askerName}</Link>
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

      {replierAvatars.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-black/6">
          <div className="flex -space-x-1.5">
            {replierAvatars.map((avatar, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={avatar} alt="" className="w-5 h-5 rounded-full border-2 border-cream object-cover" />
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
  | { type: "rec"; data: Recommendation; recommender: ReturnType<typeof mapDbUser>; timestamp: string; vouches: number }
  | { type: "ask"; data: Ask; askerName: string; askerAvatar: string; replierAvatars: string[]; timestamp: string };

export default function HomePage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();

  const [dbRecs, setDbRecs] = useState<DbRecommendation[]>([]);
  const [dbAsks, setDbAsks] = useState<DbAsk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadFeed() {
      const [recRes, askRes] = await Promise.all([
        supabase
          .from("recommendations")
          .select(`
            *,
            recommender:users!user_id(id, handle, full_name, avatar_url),
            vouches(user_id),
            likes(user_id),
            disagreements(id, user_id, comment, created_at)
          `)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("asks")
          .select(`
            *,
            asker:users!user_id(id, handle, full_name, avatar_url),
            replies:ask_replies(id, user_id, recommendation_id, text, created_at)
          `)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      if (recRes.data) setDbRecs(recRes.data as DbRecommendation[]);
      if (askRes.data) setDbAsks(askRes.data as DbAsk[]);
      setLoading(false);
    }

    loadFeed();

    // Realtime: prepend new recs/asks
    const channel = supabase
      .channel("feed-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "recommendations" }, () => {
        loadFeed();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "asks" }, () => {
        loadFeed();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const feedItems = useMemo((): FeedItem[] => {
    const recItems: FeedItem[] = dbRecs.map((row) => ({
      type: "rec" as const,
      data: mapDbRec(row),
      recommender: mapDbUser(row.recommender),
      timestamp: row.created_at,
      vouches: row.vouches?.length ?? 0,
    }));

    const askItems: FeedItem[] = dbAsks.map((row) => {
      const ask = mapDbAsk(row);
      return {
        type: "ask" as const,
        data: ask,
        askerName: row.asker?.full_name ?? "Someone",
        askerAvatar: row.asker?.avatar_url ?? DEFAULT_AVATAR,
        replierAvatars: [],
        timestamp: row.created_at,
      };
    });

    const all: FeedItem[] = [...recItems, ...askItems];

    return all.sort((a, b) => {
      const aVouches = a.type === "rec" ? a.vouches : 0;
      const bVouches = b.type === "rec" ? b.vouches : 0;
      const aTrusted = aVouches >= 3;
      const bTrusted = bVouches >= 3;
      if (aTrusted !== bTrusted) return aTrusted ? -1 : 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [dbRecs, dbAsks]);

  const friends = useMemo(
    () => dbRecs
      .map((r) => mapDbUser(r.recommender))
      .filter((u, i, arr) => u.id && u.id !== currentUser.id && arr.findIndex((x) => x.id === u.id) === i),
    [dbRecs, currentUser.id]
  );

  // disagreements from DB per rec
  const disagreementsMap = useMemo(() => {
    const map: Record<string, { comment: string; timestamp: string }[]> = {};
    for (const row of dbRecs) {
      if (row.disagreements?.length) {
        map[row.id] = row.disagreements.map((d) => ({ comment: d.comment, timestamp: d.created_at }));
      }
    }
    return map;
  }, [dbRecs]);

  // Merge local optimistic disagreements
  const mergedDisagreements = useMemo(() => {
    const merged = { ...disagreementsMap };
    for (const [recId, localDisags] of Object.entries(interactions.disagreements)) {
      merged[recId] = [...(merged[recId] ?? []), ...localDisags];
    }
    return merged;
  }, [disagreementsMap, interactions.disagreements]);

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

      {loading ? (
        <SkeletonList count={4} />
      ) : feedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <p className="text-sm text-muted">No recs yet — be the first to share one.</p>
        </div>
      ) : (
        feedItems.map((item) => {
          if (item.type === "ask") {
            return (
              <AskFeedCard
                key={item.data.id}
                ask={item.data}
                askerName={item.askerName}
                askerAvatar={item.askerAvatar}
                replierAvatars={item.replierAvatars}
              />
            );
          }

          const rec = item.data;
          return (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              recommender={item.recommender}
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
              vouchChains={[]}
              disagreements={mergedDisagreements[rec.id] ?? []}
            />
          );
        })
      )}
    </div>
  );
}
