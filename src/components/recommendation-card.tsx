"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Handshake, MessageCircle, Bookmark, MapPin, ThumbsDown, Link2, Globe, Phone } from "lucide-react";
import {
  Recommendation, User, Category,
  users as allUsers, currentUser,
} from "@/lib/mock-data";
import type { Disagreement } from "@/lib/use-interactions";
import { cn } from "@/lib/utils";
import { VouchAvatars } from "./vouch-avatars";
import { VouchSheet } from "./vouch-sheet";
import { DisagreeSheet } from "./disagree-sheet";

interface RecommendationCardProps {
  rec: Recommendation;
  recommender: User;
  isLiked: boolean;
  isVouched: boolean;
  isSaved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onVouch: (chain?: string[]) => void;
  onUnvouch: () => void;
  onDisagree: (comment: string) => void;
  friends: User[];
  currentUserAvatar: string;
  vouchChains?: string[][];
  disagreements?: Disagreement[];
}

const categoryStyle: Record<Category, { bg: string; text: string }> = {
  Beauty:  { bg: "bg-pink-100",   text: "text-pink-700" },
  Home:    { bg: "bg-blue-100",   text: "text-blue-700" },
  Health:  { bg: "bg-teal-100",   text: "text-teal-700" },
  Fitness: { bg: "bg-purple-100", text: "text-purple-700" },
  Pets:    { bg: "bg-lime-100",   text: "text-lime-700" },
  Other:   { bg: "bg-gray-100",   text: "text-gray-600" },
};

// Direct friends — used to filter which vouchers to show avatars for.
const directFriendIds = new Set(currentUser.friends);

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

// ─── Chain display ─────────────────────────────────────────────────────────────

function ChainDisplay({ chains }: { chains: string[][] }) {
  const chain = chains[0];
  if (!chain || chain.length === 0) return null;

  const nodes = chain
    .map((id) => (id === currentUser.id ? currentUser : allUsers.find((u) => u.id === id)))
    .filter((u): u is User => u != null);

  const visible = nodes.slice(0, 3);
  const remaining = nodes.length - visible.length;
  const hasTrustedChain = chain.length >= 3;

  const nameText = visible
    .map((u) => (u.id === currentUser.id ? "You" : u.name.split(" ")[0]))
    .join(" → ");

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5 flex-wrap">
      <div className="flex items-center gap-1">
        {visible.map((u, i) => (
          <span key={u.id} className="flex items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full border border-white object-cover" />
            {i < visible.length - 1 && (
              <span className="text-muted/50 text-[11px] font-medium">→</span>
            )}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-xs text-muted font-medium ml-0.5">→ +{remaining}</span>
        )}
      </div>

      <p className="text-xs text-muted flex-1 min-w-0">
        <span className="font-medium text-charcoal">{nameText}</span> vouched
      </p>

      {hasTrustedChain && (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-light text-sage-dark border border-sage/20 flex-shrink-0">
          <Link2 size={10} strokeWidth={2} />
          Trusted chain
        </span>
      )}
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function RecommendationCard({
  rec,
  recommender,
  isLiked,
  isVouched,
  isSaved,
  onToggleLike,
  onToggleSave,
  onVouch,
  onUnvouch,
  onDisagree,
  friends,
  currentUserAvatar,
  vouchChains = [],
  disagreements = [],
}: RecommendationCardProps) {
  const router = useRouter();
  const [vouchSheetOpen, setVouchSheetOpen] = useState(false);
  const [disagreeSheetOpen, setDisagreeSheetOpen] = useState(false);

  const displayLikes = rec.likesCount + (isLiked ? 1 : 0);
  const displayVouches = rec.vouches.length + (isVouched ? 1 : 0);
  const style = categoryStyle[rec.category];

  const voucherFriends = rec.vouches
    .filter((id) => directFriendIds.has(id))
    .map((id) => friends.find((f) => f.id === id))
    .filter((f): f is User => f !== undefined);

  const hasChains = vouchChains.length > 0;
  const showVouchStrip = hasChains || voucherFriends.length > 0 || isVouched;

  function handleVouchClick() {
    if (isVouched) onUnvouch();
    else setVouchSheetOpen(true);
  }

  return (
    <>
      <article className="bg-white rounded-2xl shadow-sm shadow-black/5 mx-4 mb-4 overflow-hidden">
        {/* Card header */}
        <div className="p-4 pb-0">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recommender.avatar}
              alt={recommender.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-semibold text-charcoal">{recommender.name}</span>
                <span className="text-muted"> recommends</span>
              </p>
            </div>
            <span className="text-xs text-muted flex-shrink-0">{timeAgo(rec.timestamp)}</span>
          </div>

          <div className="mt-3">
            <span className={cn("inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full", style.bg, style.text)}>
              {rec.category} · {rec.subCategory}
            </span>
            <h3 className="font-display text-[1.3rem] mt-2 text-charcoal leading-tight">
              {rec.businessName}
            </h3>
            {rec.serviceProvider && (
              <p className="text-xs text-muted font-medium mt-0.5">
                {rec.providerId ? (
                  <button
                    onClick={() => router.push(`/provider/${rec.providerId}`)}
                    className="hover:text-sage transition-colors underline underline-offset-2 decoration-muted/30"
                  >
                    {rec.serviceProvider}
                  </button>
                ) : (
                  rec.serviceProvider
                )}
                {" at "}{rec.businessName}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1 text-muted">
              <MapPin size={12} />
              <span className="text-xs">{rec.city}</span>
            </div>
          </div>
        </div>

        {/* Photo */}
        {rec.photo && (
          <div className="mt-3 h-48 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rec.photo} alt={rec.businessName} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}

        {/* Blurb + actions */}
        <div className="p-4 pt-3">
          <p className="font-display text-sm italic text-sage leading-snug">Trust me...</p>
          <div className="h-px bg-sage/20 my-2" />
          <p className="text-sm text-charcoal leading-relaxed">{rec.blurb}</p>

          {/* Contact info */}
          {(rec.website || rec.phone) && (
            <div className="flex items-center gap-4 mt-3">
              {rec.website && (
                <a
                  href={rec.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-sage transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Globe size={13} strokeWidth={1.75} />
                  <span>Website</span>
                </a>
              )}
              {rec.phone && (
                <a
                  href={`tel:${rec.phone}`}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-sage transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone size={13} strokeWidth={1.75} />
                  <span>Call</span>
                </a>
              )}
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center mt-4 gap-1">
            <button
              onClick={onToggleLike}
              aria-label={isLiked ? "Unlike" : "Like"}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium py-1.5 px-2 rounded-full transition-colors",
                isLiked ? "text-rose-500 bg-rose-50" : "text-muted hover:text-rose-400 hover:bg-rose-50/50"
              )}
            >
              <Heart size={17} strokeWidth={2} className={cn(isLiked && "fill-rose-500")} />
              <span>{displayLikes}</span>
            </button>

            <button
              onClick={handleVouchClick}
              aria-label={isVouched ? "Remove vouch" : "Vouch for this"}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium py-1.5 px-2 rounded-full transition-colors",
                isVouched ? "text-sage bg-sage-light" : "text-muted hover:text-sage hover:bg-sage-light/50"
              )}
            >
              <Handshake size={17} strokeWidth={2} />
              <span className="font-semibold text-[11px] uppercase tracking-wide">Vouch</span>
              <span>{displayVouches}</span>
            </button>

            <button
              aria-label="Comments"
              className="flex items-center gap-1.5 text-sm text-muted py-1.5 px-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <MessageCircle size={17} strokeWidth={1.5} />
              <span>{rec.commentCount + disagreements.length}</span>
            </button>

            <button
              onClick={() => setDisagreeSheetOpen(true)}
              aria-label="Disagree"
              className={cn(
                "flex items-center gap-1.5 text-sm py-1.5 px-2 rounded-full transition-colors",
                disagreements.length > 0
                  ? "text-rose-400 bg-rose-50"
                  : "text-muted hover:text-rose-400 hover:bg-rose-50/50"
              )}
            >
              <ThumbsDown size={15} strokeWidth={1.5} />
              {disagreements.length > 0 && <span className="text-xs">{disagreements.length}</span>}
            </button>

            <button
              onClick={onToggleSave}
              aria-label={isSaved ? "Unsave" : "Save"}
              className={cn(
                "ml-auto py-1.5 px-2 rounded-full transition-colors",
                isSaved ? "text-sage" : "text-muted hover:text-sage hover:bg-sage-light/50"
              )}
            >
              <Bookmark size={17} strokeWidth={2} className={cn(isSaved && "fill-sage")} />
            </button>
          </div>

          <p className="text-[10px] text-muted/60 mt-1.5 ml-1">
            ❤️ show support &nbsp;·&nbsp; 🤝 &ldquo;I&apos;ve used them &amp; second this&rdquo;
          </p>

          {/* Vouch strip */}
          {showVouchStrip && (
            hasChains ? (
              <ChainDisplay chains={vouchChains} />
            ) : (
              <VouchAvatars
                vouchers={voucherFriends}
                isUserVouching={isVouched}
                currentUserAvatar={currentUserAvatar}
              />
            )
          )}

          {/* Disagreements */}
          {disagreements.length > 0 && (
            <div className="mt-3 space-y-2">
              {disagreements.map((d, i) => (
                <div key={i} className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Disagreed</span>
                    <span className="text-[10px] text-muted">{timeAgo(d.timestamp)}</span>
                  </div>
                  <p className="text-xs text-charcoal/80 leading-relaxed">{d.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>

      <VouchSheet
        isOpen={vouchSheetOpen}
        recommender={recommender}
        isSaved={isSaved}
        onClose={() => setVouchSheetOpen(false)}
        onVouch={(chain) => { onVouch(chain); setVouchSheetOpen(false); }}
        onSaveInstead={() => { if (!isSaved) onToggleSave(); setVouchSheetOpen(false); }}
      />

      <DisagreeSheet
        isOpen={disagreeSheetOpen}
        onClose={() => setDisagreeSheetOpen(false)}
        onSubmit={onDisagree}
      />
    </>
  );
}
