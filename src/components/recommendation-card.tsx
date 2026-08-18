"use client";

import { Heart, Handshake, MessageCircle, Bookmark, MapPin } from "lucide-react";
import { Recommendation, User, Category } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { VouchAvatars } from "./vouch-avatars";

interface RecommendationCardProps {
  rec: Recommendation;
  recommender: User;
  isLiked: boolean;
  isVouched: boolean;
  isSaved: boolean;
  onToggleLike: () => void;
  onToggleVouch: () => void;
  onToggleSave: () => void;
  friends: User[];
  currentUserAvatar: string;
}

const categoryStyle: Record<Category, { bg: string; text: string }> = {
  Beauty:  { bg: "bg-pink-100",   text: "text-pink-700" },
  Home:    { bg: "bg-blue-100",   text: "text-blue-700" },
  Health:  { bg: "bg-teal-100",   text: "text-teal-700" },
  Food:    { bg: "bg-orange-100", text: "text-orange-700" },
  Fitness: { bg: "bg-purple-100", text: "text-purple-700" },
  Pets:    { bg: "bg-lime-100",   text: "text-lime-700" },
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export function RecommendationCard({
  rec,
  recommender,
  isLiked,
  isVouched,
  isSaved,
  onToggleLike,
  onToggleVouch,
  onToggleSave,
  friends,
  currentUserAvatar,
}: RecommendationCardProps) {
  const displayLikes = rec.likesCount + (isLiked ? 1 : 0);
  const displayVouches = rec.vouches.length + (isVouched ? 1 : 0);
  const style = categoryStyle[rec.category];

  const voucherFriends = rec.vouches
    .map((id) => friends.find((f) => f.id === id))
    .filter((f): f is User => f !== undefined);

  const showVouchStrip = voucherFriends.length > 0 || isVouched;

  return (
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
          <span className="text-xs text-muted flex-shrink-0">
            {timeAgo(rec.timestamp)}
          </span>
        </div>

        {/* Business details */}
        <div className="mt-3">
          <span
            className={cn(
              "inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
              style.bg,
              style.text
            )}
          >
            {rec.category} · {rec.subCategory}
          </span>
          <h3 className="font-display text-[1.3rem] mt-2 text-charcoal leading-tight">
            {rec.businessName}
          </h3>
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
          <img
            src={rec.photo}
            alt={rec.businessName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Blurb + actions */}
      <div className="p-4 pt-3">
        <p className="text-sm text-charcoal leading-relaxed">
          &ldquo;{rec.blurb}&rdquo;
        </p>

        {/* Action row */}
        <div className="flex items-center mt-4 gap-1">
          <button
            onClick={onToggleLike}
            title="Like — show your support (social)"
            aria-label={isLiked ? "Unlike" : "Like"}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium py-1.5 px-2 rounded-full transition-colors",
              isLiked
                ? "text-rose-500 bg-rose-50"
                : "text-muted hover:text-rose-400 hover:bg-rose-50/50"
            )}
          >
            <Heart
              size={17}
              strokeWidth={2}
              className={cn(isLiked && "fill-rose-500")}
            />
            <span>{displayLikes}</span>
          </button>

          <button
            onClick={onToggleVouch}
            title="Vouch — I've personally used them and second this recommendation"
            aria-label={isVouched ? "Remove vouch" : "Vouch for this"}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium py-1.5 px-2 rounded-full transition-colors",
              isVouched
                ? "text-sage bg-sage-light"
                : "text-muted hover:text-sage hover:bg-sage-light/50"
            )}
          >
            <Handshake size={17} strokeWidth={2} />
            <span className="font-semibold text-[11px] uppercase tracking-wide">
              Vouch
            </span>
            <span>{displayVouches}</span>
          </button>

          <button
            aria-label="Comments"
            className="flex items-center gap-1.5 text-sm text-muted py-1.5 px-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <MessageCircle size={17} strokeWidth={1.5} />
            <span>{rec.commentCount}</span>
          </button>

          <button
            onClick={onToggleSave}
            aria-label={isSaved ? "Unsave" : "Save"}
            className={cn(
              "ml-auto py-1.5 px-2 rounded-full transition-colors",
              isSaved
                ? "text-sage"
                : "text-muted hover:text-sage hover:bg-sage-light/50"
            )}
          >
            <Bookmark
              size={17}
              strokeWidth={2}
              className={cn(isSaved && "fill-sage")}
            />
          </button>
        </div>

        {/* Distinction hint — appears only once per session feel */}
        <p className="text-[10px] text-muted/60 mt-1.5 ml-1">
          ❤️ show support &nbsp;·&nbsp; 🤝 "I&apos;ve used them &amp; second this"
        </p>

        {/* Vouch strip */}
        {showVouchStrip && (
          <VouchAvatars
            vouchers={voucherFriends}
            isUserVouching={isVouched}
            currentUserAvatar={currentUserAvatar}
          />
        )}
      </div>
    </article>
  );
}
