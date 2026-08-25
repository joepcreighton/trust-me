"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Sparkles, MessageSquare, Settings, Lock } from "lucide-react";
import {
  recommendations,
  users,
  currentUser,
  mockAsks,
  Ask,
  Category,
  Recommendation,
} from "@/lib/mock-data";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

type ProfileTab = "recs" | "looking";

const ASKS_KEY = "trust-me-asks";

const CATEGORY_ORDER: Category[] = ["Beauty", "Health", "Home", "Fitness", "Pets", "Other"];

const CATEGORY_META: Record<Category, { emoji: string; bg: string; text: string; border: string }> = {
  Beauty:  { emoji: "💅", bg: "bg-pink-50",   text: "text-pink-700",   border: "border-pink-100" },
  Health:  { emoji: "🌿", bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-100" },
  Home:    { emoji: "🏡", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-100" },
  Fitness: { emoji: "💪", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100" },
  Pets:    { emoji: "🐾", bg: "bg-lime-50",   text: "text-lime-700",   border: "border-lime-100" },
  Other:   { emoji: "✦",  bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-100" },
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

// ─── Beli summary card ────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  count,
  label,
  onClick,
}: {
  icon: string;
  count: number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1.5 bg-white rounded-2xl shadow-sm shadow-black/5 py-4 px-2 active:scale-[0.97] transition-transform"
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="font-display text-2xl text-charcoal leading-tight">{count}</span>
      <span className="text-[11px] text-muted text-center leading-tight">{label}</span>
    </button>
  );
}

// ─── Category accordion ───────────────────────────────────────────────────────

function ProfileRecItem({ rec }: { rec: Recommendation }) {
  const meta = CATEGORY_META[rec.category];
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
        {rec.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.photo} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center text-lg", meta.bg)}>
            {meta.emoji}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm leading-tight truncate">{rec.businessName}</p>
        <p className="text-xs text-muted mt-0.5 truncate">{rec.city}</p>
      </div>
    </div>
  );
}

function CategoryAccordion({
  category,
  recs,
}: {
  category: Category;
  recs: Recommendation[];
}) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[category];

  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden bg-white shadow-sm shadow-black/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-black/4 transition-colors"
      >
        <span className="text-base leading-none">{meta.emoji}</span>
        <span className="font-semibold text-charcoal text-sm flex-1">{category}</span>
        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", meta.bg, meta.text)}>
          {recs.length}
        </span>
        <ChevronDown
          size={16}
          className={cn("text-muted/60 transition-transform duration-200 flex-shrink-0", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="divide-y divide-black/5 border-t border-black/5">
          {recs.map((rec) => (
            <ProfileRecItem key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ask card for "Looking for" tab ──────────────────────────────────────────

function LookingForCard({ ask, allRecs }: { ask: Ask; allRecs: Recommendation[] }) {
  const catStyle = ask.category ? CATEGORY_META[ask.category] : null;

  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm shadow-black/5 p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[10px] font-bold text-muted/70 uppercase tracking-wider bg-black/5 px-2 py-0.5 rounded-full">
          asking for
        </span>
        {catStyle && ask.category && (
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", catStyle.bg, catStyle.text)}>
            {ask.category}
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted">{timeAgo(ask.timestamp)}</span>
      </div>

      <p className="text-sm text-charcoal leading-relaxed">&ldquo;{ask.question}&rdquo;</p>

      {ask.replies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-black/5 space-y-3">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wide">
            {ask.replies.length} {ask.replies.length === 1 ? "reply" : "replies"}
          </p>
          {ask.replies.map((reply, i) => {
            const replier = users.find((u) => u.id === reply.replierId);
            const rec = allRecs.find((r) => r.id === reply.recId);
            if (!replier) return null;
            return (
              <div key={i} className="flex gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={replier.avatar} alt={replier.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-charcoal">{replier.name}</p>
                  <p className="text-xs text-charcoal/70 mt-0.5 leading-relaxed">{reply.note}</p>
                  {rec && (
                    <span className="inline-block mt-1.5 text-[11px] font-semibold text-sage bg-sage-light/60 px-2.5 py-1 rounded-full">
                      → {rec.businessName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ask.replies.length === 0 && (
        <p className="mt-2.5 text-xs text-muted/60 italic">No replies yet — your circle will come through.</p>
      )}
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("recs");
  const [userAsks, setUserAsks] = useState<Ask[]>([]);

  const { userRecs } = useUserRecs();
  const { interactions } = useInteractions();
  const { settings } = useSettings();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ASKS_KEY);
      if (stored) setUserAsks(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const allRecs = useMemo(() => [...userRecs, ...recommendations], [userRecs]);

  // Ava's asks only (user-posted + any mock asks from Ava)
  const avaAsks = useMemo(
    () => [...userAsks, ...mockAsks].filter((a) => a.askerId === currentUser.id),
    [userAsks]
  );

  // Summary card counts
  const recommendedCount = userRecs.length;
  const vouchedCount = interactions.vouches.length;
  const wantToTryCount = interactions.saves.length;

  // Recs grouped by category (only Ava's own)
  const recsByCategory = useMemo(
    () =>
      CATEGORY_ORDER.map((cat) => ({
        category: cat,
        recs: userRecs.filter((r) => r.category === cat),
      })).filter((g) => g.recs.length > 0),
    [userRecs]
  );

  const cityLine = currentUser.cities?.join(" + ");

  return (
    <div>
      {/* ── Profile header ──────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 text-center relative">
        {/* Gear icon */}
        <button
          onClick={() => router.push("/settings")}
          aria-label="Settings"
          className="absolute top-0 right-0 w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-charcoal hover:bg-black/5 transition-colors"
        >
          <Settings size={18} strokeWidth={1.75} />
        </button>

        <div className="relative inline-block mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-sage-light"
          />
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-sage border-2 border-white" />
        </div>

        <h2 className="font-display text-2xl text-charcoal leading-tight">{currentUser.name}</h2>
        <p className="text-sm text-muted mt-0.5">@{currentUser.username}</p>

        {cityLine && settings.showCity && (
          <p className="text-sm text-muted mt-1.5">📍 {cityLine}</p>
        )}

        <p className="text-sm text-charcoal/75 italic mt-3 max-w-[260px] mx-auto leading-relaxed">
          &ldquo;I only share what I&apos;d genuinely tell a close friend.&rdquo;
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-5">
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-display text-[1.5rem] text-charcoal leading-tight">
              {currentUser.friends.length}
            </span>
            <span className="text-[11px] text-muted leading-tight">friends</span>
          </div>
          <div className="w-px h-8 bg-black/8" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-display text-[1.5rem] text-charcoal leading-tight">
              {userRecs.length}
            </span>
            <span className="text-[11px] text-muted leading-tight">recs posted</span>
          </div>
          <div className="w-px h-8 bg-black/8" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-display text-[1.5rem] text-charcoal leading-tight">
              {interactions.saves.length}
            </span>
            <span className="text-[11px] text-muted leading-tight">saved</span>
          </div>
        </div>
      </div>

      {/* ── Privacy banner ─────────────────────────────────────────────── */}
      {settings.profileVisibility === "friends" && (
        <div className="mx-4 mb-3 flex items-start gap-2.5 bg-sage-light/60 rounded-xl px-3.5 py-3 border border-sage/15">
          <Lock size={14} className="text-sage flex-shrink-0 mt-0.5" />
          <p className="text-xs text-charcoal/75 leading-relaxed">
            <span className="font-semibold text-charcoal">Friends only.</span>{" "}
            Non-friends see an &ldquo;Add as friend to see recommendations&rdquo; prompt instead of your recs.
          </p>
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-black/8 bg-cream sticky top-0 z-10">
        {(
          [
            { key: "recs" as ProfileTab, label: "Recommendations" },
            { key: "looking" as ProfileTab, label: "Looking for", count: avaAsks.length },
          ] satisfies Array<{ key: ProfileTab; label: string; count?: number }>
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
            {count != null && count > 0 && (
              <span
                className={cn(
                  "text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  activeTab === key ? "bg-sage text-white" : "bg-black/8 text-muted"
                )}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Recommendations tab ─────────────────────────────────────────── */}
      {activeTab === "recs" && (
        <div className="pt-5 pb-4">
          {/* Summary cards */}
          <div className="flex gap-3 px-4 mb-5">
            <SummaryCard icon="✓" count={recommendedCount} label="Recommended" />
            <SummaryCard icon="🤝" count={vouchedCount} label="Vouched" />
            <SummaryCard
              icon="🔖"
              count={wantToTryCount}
              label="Want to Try"
              onClick={() => router.push("/saved")}
            />
          </div>

          {/* Category accordions */}
          {recsByCategory.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 px-8">
              <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-sage" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl text-charcoal mb-2">Your recs live here</h3>
              <p className="text-sm text-muted leading-relaxed max-w-[240px]">
                Tap the{" "}
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sage text-white text-[10px] font-bold relative -top-px mx-0.5">
                  +
                </span>{" "}
                below to share your first recommendation.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[12px] font-bold text-muted uppercase tracking-wide px-4 mb-3">
                My Recommendations
              </p>
              {recsByCategory.map(({ category, recs }) => (
                <CategoryAccordion key={category} category={category} recs={recs} />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Looking for tab ─────────────────────────────────────────────── */}
      {activeTab === "looking" && (
        <div className="pt-5 pb-4">
          {avaAsks.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 px-8">
              <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-sage" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl text-charcoal mb-2">Nothing asked yet</h3>
              <p className="text-sm text-muted leading-relaxed max-w-[240px]">
                When you post a question from the home feed, your active asks and replies show up here.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[12px] font-bold text-muted uppercase tracking-wide px-4 mb-3">
                Active Asks
              </p>
              {avaAsks.map((ask) => (
                <LookingForCard key={ask.id} ask={ask} allRecs={allRecs} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
