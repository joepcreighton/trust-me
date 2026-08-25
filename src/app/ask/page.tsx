"use client";

import { useState, useEffect, useMemo } from "react";
import { Send, ChevronRight, PlusCircle } from "lucide-react";
import type { Category, Ask, Recommendation } from "@/lib/mock-data";
import type { DbAsk, DbRecommendation } from "@/lib/db-types";
import { useCurrentUser } from "@/lib/auth-context";
import { useInteractions } from "@/lib/use-interactions";
import { useUI } from "@/lib/ui-context";
import { CardSheet } from "@/components/card-sheet";
import { SkeletonList } from "@/components/skeleton-card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── constants ───────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ["Beauty", "Health", "Home", "Fitness", "Pets", "Other"];

const CATEGORY_EMOJI: Record<string, string> = {
  Beauty: "💅", Health: "🌿", Home: "🏡",
  Fitness: "💪", Pets: "🐾", Other: "✦",
};

const CATEGORY_STYLE: Record<Category, { bg: string; text: string }> = {
  Beauty:  { bg: "bg-pink-100",   text: "text-pink-700" },
  Health:  { bg: "bg-teal-100",   text: "text-teal-700" },
  Home:    { bg: "bg-blue-100",   text: "text-blue-700" },
  Fitness: { bg: "bg-purple-100", text: "text-purple-700" },
  Pets:    { bg: "bg-lime-100",   text: "text-lime-700" },
  Other:   { bg: "bg-gray-100",   text: "text-gray-600" },
};

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
    blurb: row.blurb,
    photo: row.photo_url ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    timestamp: row.created_at,
    likesCount: row.likes?.length ?? 0,
    vouches: row.vouches?.map((v) => v.user_id) ?? [],
    commentCount: 0,
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

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

// ─── rec chip ────────────────────────────────────────────────────────────────

function RecChip({
  recId,
  allRecs,
  onClick,
}: {
  recId: string;
  allRecs: Recommendation[];
  onClick: (rec: Recommendation) => void;
}) {
  const rec = allRecs.find((r) => r.id === recId);
  if (!rec) return null;
  const style = CATEGORY_STYLE[rec.category];

  return (
    <button
      onClick={() => onClick(rec)}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
        "border transition-colors hover:opacity-80 active:scale-95",
        style.bg, style.text, "border-current/20"
      )}
    >
      <span>{CATEGORY_EMOJI[rec.category]}</span>
      <span className="truncate max-w-[160px]">{rec.businessName}</span>
      <ChevronRight size={11} className="flex-shrink-0" />
    </button>
  );
}

// ─── reply row ───────────────────────────────────────────────────────────────

function ReplyRow({
  reply,
  replierName,
  replierAvatar,
  allRecs,
  onRecClick,
}: {
  reply: Ask["replies"][0];
  replierName: string;
  replierAvatar: string;
  allRecs: Recommendation[];
  onRecClick: (rec: Recommendation) => void;
}) {
  return (
    <div className="flex gap-2.5 mt-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={replierAvatar} alt={replierName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-charcoal">{replierName}</p>
        {reply.note && <p className="text-xs text-charcoal/75 mt-0.5 leading-relaxed">{reply.note}</p>}
        {reply.recId && (
          <div className="mt-2">
            <RecChip recId={reply.recId} allRecs={allRecs} onClick={onRecClick} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ask card ────────────────────────────────────────────────────────────────

function AskCard({
  ask,
  askerName,
  askerAvatar,
  rawReplies,
  allRecs,
  onRecClick,
}: {
  ask: Ask;
  askerName: string;
  askerAvatar: string;
  rawReplies: DbAsk["replies"];
  allRecs: Recommendation[];
  onRecClick: (rec: Recommendation) => void;
}) {
  const catStyle = ask.category ? CATEGORY_STYLE[ask.category] : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-black/5 mx-4 mb-4 p-4">
      <div className="flex items-center gap-2.5 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={askerAvatar} alt={askerName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-charcoal">{askerName}</p>
          <p className="text-xs text-muted">{timeAgo(ask.timestamp)}</p>
        </div>
        {catStyle && ask.category && (
          <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0", catStyle.bg, catStyle.text)}>
            {ask.category}
          </span>
        )}
      </div>

      <p className="text-sm text-charcoal leading-relaxed">&ldquo;{ask.question}&rdquo;</p>

      {(rawReplies ?? []).length > 0 && (
        <div className="mt-3 pt-3 border-t border-black/5">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wide mb-1">
            {rawReplies!.length} {rawReplies!.length === 1 ? "reply" : "replies"}
          </p>
          {rawReplies!.map((reply, i) => (
            <ReplyRow
              key={reply.id ?? i}
              reply={{ replierId: reply.user_id, recId: reply.recommendation_id ?? "", note: reply.text ?? "" }}
              replierName={reply.replier?.full_name ?? "Someone"}
              replierAvatar={reply.replier?.avatar_url ?? DEFAULT_AVATAR}
              allRecs={allRecs}
              onRecClick={onRecClick}
            />
          ))}
        </div>
      )}

      <button className="mt-3 pt-3 border-t border-black/5 w-full text-left text-xs text-muted hover:text-sage transition-colors">
        Reply with a recommendation…
      </button>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function AskPage() {
  const currentUser = useCurrentUser();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();
  const { openRecommendSheet } = useUI();

  const [questionText, setQuestionText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [posting, setPosting] = useState(false);

  const [dbAsks, setDbAsks] = useState<DbAsk[]>([]);
  const [allDbRecs, setAllDbRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [selectedRecUser, setSelectedRecUser] = useState<{ id: string; name: string; username: string; avatar: string; friends: [] }>({
    id: "", name: "", username: "", avatar: DEFAULT_AVATAR, friends: [],
  });

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const [askRes, recRes] = await Promise.all([
        supabase
          .from("asks")
          .select(`
            *,
            asker:users!user_id(id, handle, full_name, avatar_url),
            replies:ask_replies(
              id, user_id, recommendation_id, text, created_at,
              replier:users!user_id(id, handle, full_name, avatar_url)
            )
          `)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("recommendations")
          .select("*, vouches(user_id), likes(user_id)")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (askRes.data) setDbAsks(askRes.data as DbAsk[]);
      if (recRes.data) setAllDbRecs((recRes.data as DbRecommendation[]).map(mapDbRec));
      setLoading(false);
    }

    loadData();

    const channel = supabase
      .channel("asks-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "asks" }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function postAsk() {
    if (!questionText.trim() || !currentUser.id || posting) return;
    setPosting(true);

    const supabase = createClient();
    await supabase.from("asks").insert({
      user_id: currentUser.id,
      question: questionText.trim(),
      category: selectedCategory ? selectedCategory.toLowerCase() : null,
    });

    setQuestionText("");
    setSelectedCategory(null);
    setPosting(false);
  }

  const friends = useMemo(
    () => dbAsks
      .map((a) => ({ id: a.asker?.id ?? "", name: a.asker?.full_name ?? "Someone", username: a.asker?.handle ?? "unknown", avatar: a.asker?.avatar_url ?? DEFAULT_AVATAR, friends: [] as string[] }))
      .filter((u, i, arr) => u.id && u.id !== currentUser.id && arr.findIndex((x) => x.id === u.id) === i),
    [dbAsks, currentUser.id]
  );

  function handleRecClick(rec: Recommendation) {
    setSelectedRec(rec);
    // find recommender from allDbRecs (we don't have join here so fallback)
    setSelectedRecUser({ id: rec.recommenderId, name: "Someone", username: "unknown", avatar: DEFAULT_AVATAR, friends: [] });
  }

  return (
    <>
      <div className="pt-4 pb-4">
        {/* ── Compose ───────────────────────────────────────────────────── */}
        <div className="mx-4 mb-6 bg-white rounded-2xl shadow-sm shadow-black/5 p-4">
          <h2 className="font-display text-xl text-charcoal mb-1">What are you looking for?</h2>
          <p className="text-xs text-muted mb-3">Ask your circle — they&apos;ll reply with recs they trust.</p>

          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. A dermatologist in San Diego who's great with acne — someone who actually listens."
            rows={3}
            className="w-full px-3.5 py-3 rounded-xl border border-black/10 bg-cream text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all resize-none leading-relaxed"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              const style = CATEGORY_STYLE[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(active ? null : cat)}
                  className={cn(
                    "flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all",
                    active
                      ? cn("border-transparent", style.bg, style.text)
                      : "border-black/10 text-muted bg-transparent hover:border-black/20"
                  )}
                >
                  <span>{CATEGORY_EMOJI[cat]}</span>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={postAsk}
              disabled={!questionText.trim() || posting}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all",
                questionText.trim() && !posting
                  ? "bg-sage text-white shadow-sm shadow-sage/30 active:scale-95"
                  : "bg-black/8 text-muted cursor-not-allowed"
              )}
            >
              <Send size={14} />
              Ask my circle
            </button>

            <span className="text-muted/40 text-xs">or</span>

            <button
              onClick={openRecommendSheet}
              className="flex items-center gap-1.5 text-sm font-medium text-sage hover:text-sage-dark transition-colors"
            >
              <PlusCircle size={15} />
              Share a rec
            </button>
          </div>
        </div>

        {/* ── Ask feed ──────────────────────────────────────────────────── */}
        <div className="px-4 mb-3">
          <h3 className="text-[13px] font-bold text-muted uppercase tracking-wide">From your circle</h3>
        </div>

        {loading ? (
          <SkeletonList count={2} />
        ) : dbAsks.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted">No asks yet — post one above!</p>
          </div>
        ) : (
          dbAsks.map((row) => (
            <AskCard
              key={row.id}
              ask={mapDbAsk(row)}
              askerName={row.asker?.full_name ?? "Someone"}
              askerAvatar={row.asker?.avatar_url ?? DEFAULT_AVATAR}
              rawReplies={row.replies ?? []}
              allRecs={allDbRecs}
              onRecClick={handleRecClick}
            />
          ))
        )}
      </div>

      <CardSheet
        rec={selectedRec}
        onClose={() => setSelectedRec(null)}
        recommender={selectedRecUser}
        friends={friends}
        currentUserAvatar={currentUser.avatar}
        isLiked={selectedRec ? interactions.likes.includes(selectedRec.id) : false}
        isVouched={selectedRec ? interactions.vouches.includes(selectedRec.id) : false}
        isSaved={selectedRec ? interactions.saves.includes(selectedRec.id) : false}
        onToggleLike={() => selectedRec && toggle("likes", selectedRec.id)}
        onToggleSave={() => selectedRec && toggle("saves", selectedRec.id)}
        onVouch={(chain) => {
          if (!selectedRec) return;
          addVouch(selectedRec.id);
          if (chain) addVouchChain(selectedRec.id, chain);
        }}
        onUnvouch={() => selectedRec && removeVouch(selectedRec.id)}
        onDisagree={(comment) => selectedRec && addDisagreement(selectedRec.id, comment)}
        vouchChains={[]}
        disagreements={selectedRec ? (interactions.disagreements[selectedRec.id] ?? []) : []}
      />
    </>
  );
}
