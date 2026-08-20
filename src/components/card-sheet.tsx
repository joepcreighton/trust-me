"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Recommendation, User } from "@/lib/mock-data";
import type { Disagreement } from "@/lib/use-interactions";
import { RecommendationCard } from "./recommendation-card";

interface CardSheetProps {
  rec: Recommendation | null;
  onClose: () => void;
  isLiked: boolean;
  isVouched: boolean;
  isSaved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onVouch: (chain?: string[]) => void;
  onUnvouch: () => void;
  onDisagree: (comment: string) => void;
  recommender: User;
  friends: User[];
  currentUserAvatar: string;
  vouchChains?: string[][];
  disagreements?: Disagreement[];
}

export function CardSheet({
  rec,
  onClose,
  isLiked,
  isVouched,
  isSaved,
  onToggleLike,
  onToggleSave,
  onVouch,
  onUnvouch,
  onDisagree,
  recommender,
  friends,
  currentUserAvatar,
  vouchChains,
  disagreements,
}: CardSheetProps) {
  const isOpen = rec !== null;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 z-50",
          "w-full max-w-[430px] bg-cream rounded-t-3xl",
          "max-h-[90vh] overflow-y-auto",
          "transition-transform duration-300 ease-out"
        )}
        style={{ transform: isOpen ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-3 pb-3 bg-cream/95 backdrop-blur-sm">
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

        {rec && (
          <div className="pt-2 pb-8">
            <RecommendationCard
              rec={rec}
              recommender={recommender}
              isLiked={isLiked}
              isVouched={isVouched}
              isSaved={isSaved}
              onToggleLike={onToggleLike}
              onToggleSave={onToggleSave}
              onVouch={onVouch}
              onUnvouch={onUnvouch}
              onDisagree={onDisagree}
              friends={friends}
              currentUserAvatar={currentUserAvatar}
              vouchChains={vouchChains}
              disagreements={disagreements}
            />
          </div>
        )}
      </div>
    </>
  );
}
