"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Recommendation, User } from "@/lib/mock-data";
import { RecommendationCard } from "./recommendation-card";

interface CardSheetProps {
  rec: Recommendation | null;
  onClose: () => void;
  // Interaction state — pass from parent so sheet stays in sync with the list
  isLiked: boolean;
  isVouched: boolean;
  isSaved: boolean;
  onToggleLike: () => void;
  onToggleVouch: () => void;
  onToggleSave: () => void;
  // Context needed by the card
  recommender: User;
  friends: User[];
  currentUserAvatar: string;
}

export function CardSheet({
  rec,
  onClose,
  isLiked,
  isVouched,
  isSaved,
  onToggleLike,
  onToggleVouch,
  onToggleSave,
  recommender,
  friends,
  currentUserAvatar,
}: CardSheetProps) {
  const isOpen = rec !== null;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 z-50",
          "w-full max-w-[430px] bg-cream rounded-t-3xl",
          "max-h-[90vh] overflow-y-auto",
          "transition-transform duration-300 ease-out"
        )}
        style={{ transform: isOpen ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Sticky close bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-3 pb-3 bg-cream/95 backdrop-blur-sm">
          {/* Drag handle — centered absolutely so it doesn't push the X */}
          <div className="absolute left-1/2 -translate-x-1/2 top-3.5 w-10 h-1 bg-black/15 rounded-full" />
          <div className="w-8" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center text-muted hover:bg-black/12 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Full card */}
        {rec && (
          <div className="pt-2 pb-8">
            <RecommendationCard
              rec={rec}
              recommender={recommender}
              isLiked={isLiked}
              isVouched={isVouched}
              isSaved={isSaved}
              onToggleLike={onToggleLike}
              onToggleVouch={onToggleVouch}
              onToggleSave={onToggleSave}
              friends={friends}
              currentUserAvatar={currentUserAvatar}
            />
          </div>
        )}
      </div>
    </>
  );
}
