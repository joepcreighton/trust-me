"use client";

import { useState, useEffect, useMemo } from "react";
import { Send, ChevronRight, PlusCircle } from "lucide-react";
import {
  recommendations,
  users,
  currentUser,
  mockAsks,
  Category,
  Ask,
  AskReply,
  Recommendation,
} from "@/lib/mock-data";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { useUI } from "@/lib/ui-context";
import { CardSheet } from "@/components/card-sheet";
import { cn } from "@/lib/utils";

// ─── constants ───────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ["Beauty", "Health", "Food", "Home", "Fitness", "Pets"];

const CATEGORY_EMOJI: Record<string, string> = {
  Beauty: "💅", Health: "🌿", Food: "🍜",
  Home: "🏡", Fitness: "💪", Pets: "🐾",
};

const CATEGORY_STYLE: Record<Category, { bg: string; text: string }> = {
  Beauty:  { bg: "bg-pink-100",   text: "text-pink-700" },
  Health:  { bg: "bg-teal-100",   text: "text-teal-700" },
  Food:    { bg: "bg-orange-100", text: "text-orange-700" },
  Home:    { bg: "bg-blue-100",   text: "text-blue-700" },
  Fitness: { bg: "bg-purple-100", text: "text-purple-700" },
  Pets:    { bg: "bg-lime-100",   text: "text-lime-700" },
};

const STORAGE_KEY = "trust-me-asks";

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
        style.bg,
        style.text,
        "border-current/20"
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
  allRecs,
  onRecClick,
}: {
  reply: AskReply;
  allRecs: Recommendation[];
  onRecClick: (rec: Recommendation) => void;
}) {
  const replier = users.find((u) => u.id === reply.replierId);
  if (!replier) return null;

  return (
    <div className="flex gap-2.5 mt-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={replier.avatar}
        alt={replier.name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-charcoal">{replier.name}</p>
        <p className="text-xs text-charcoal/75 mt-0.5 leading-relaxed">{reply.note}</p>
        <div className="mt-2">
          <RecChip recId={reply.recId} allRecs={allRecs} onClick={onRecClick} />
        </div>
      </div>
    </div>
  );
}

// ─── ask card ────────────────────────────────────────────────────────────────

function AskCard({
  ask,
  allRecs,
  onRecClick,
}: {
  ask: Ask;
  allRecs: Recommendation[];
  onRecClick: (rec: Recommendation) => void;
}) {
  const asker = users.find((u) => u.id === ask.askerId) ?? currentUser;
  const catStyle = ask.category ? CATEGORY_STYLE[ask.category] : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-black/5 mx-4 mb-4 p-4">
      {/* Asker row */}
      <div className="flex items-center gap-2.5 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asker.avatar}
          alt={asker.name}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-charcoal">{asker.name}</p>
          <p className="text-xs text-muted">{timeAgo(ask.timestamp)}</p>
        </div>
        {catStyle && ask.category && (
          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0",
              catStyle.bg,
              catStyle.text
            )}
          >
            {ask.category}
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-sm text-charcoal leading-relaxed">
        &ldquo;{ask.question}&rdquo;
      </p>

      {/* Replies */}
      {ask.replies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-black/5">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wide mb-1">
            {ask.replies.length} {ask.replies.length === 1 ? "reply" : "replies"}
          </p>
          {ask.replies.map((reply, i) => (
            <ReplyRow key={i} reply={reply} allRecs={allRecs} onRecClick={onRecClick} />
          ))}
        </div>
      )}

      {/* Reply CTA (placeholder) */}
      <button className="mt-3 pt-3 border-t border-black/5 w-full text-left text-xs text-muted hover:text-sage transition-colors">
        Reply with a recommendation…
      </button>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function AskPage() {
  const { userRecs } = useUserRecs();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();
  const { openRecommendSheet } = useUI();

  const [questionText, setQuestionText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [userAsks, setUserAsks] = useState<Ask[]>([]);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  const allRecs = useMemo(() => [...userRecs, ...recommendations], [userRecs]);
  const friends = users.filter((u) => u.id !== currentUser.id);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUserAsks(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  function postAsk() {
    if (!questionText.trim()) return;
    const ask: Ask = {
      id: `ask-${Date.now()}`,
      askerId: currentUser.id,
      question: questionText.trim(),
      category: selectedCategory ?? undefined,
      timestamp: new Date().toISOString(),
      replies: [],
    };
    setUserAsks((prev) => {
      const next = [ask, ...prev];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setQuestionText("");
    setSelectedCategory(null);
  }

  const allAsks: Ask[] = [...userAsks, ...mockAsks];

  const selectedRecommender = selectedRec
    ? (users.find((u) => u.id === selectedRec.recommenderId) ?? currentUser)
    : currentUser;

  return (
    <>
      <div className="pt-4 pb-4">

        {/* ── Compose ───────────────────────────────────────────────────── */}
        <div className="mx-4 mb-6 bg-white rounded-2xl shadow-sm shadow-black/5 p-4">
          <h2 className="font-display text-xl text-charcoal mb-1">
            What are you looking for?
          </h2>
          <p className="text-xs text-muted mb-3">
            Ask your circle — they&apos;ll reply with recs they trust.
          </p>

          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. A dermatologist in San Diego who's great with acne — someone who actually listens."
            rows={3}
            className="w-full px-3.5 py-3 rounded-xl border border-black/10 bg-cream text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all resize-none leading-relaxed"
          />

          {/* Category tag */}
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

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={postAsk}
              disabled={!questionText.trim()}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all",
                questionText.trim()
                  ? "bg-sage text-white shadow-sm shadow-sage/30 active:scale-95"
                  : "bg-black/8 text-muted cursor-not-allowed"
              )}
            >
              <Send size={14} />
              Ask my circle
            </button>

            {/* Divider */}
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
          <h3 className="text-[13px] font-bold text-muted uppercase tracking-wide">
            From your circle
          </h3>
        </div>

        {allAsks.map((ask) => (
          <AskCard
            key={ask.id}
            ask={ask}
            allRecs={allRecs}
            onRecClick={setSelectedRec}
          />
        ))}
      </div>

      {/* Card sheet for rec chips */}
      <CardSheet
        rec={selectedRec}
        onClose={() => setSelectedRec(null)}
        recommender={selectedRecommender}
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
        vouchChains={selectedRec ? (interactions.vouchChains[selectedRec.id] ?? []) : []}
        disagreements={selectedRec ? (interactions.disagreements[selectedRec.id] ?? []) : []}
      />
    </>
  );
}
