"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_CHARS = 20;

interface DisagreeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

export function DisagreeSheet({ isOpen, onClose, onSubmit }: DisagreeSheetProps) {
  const [comment, setComment] = useState("");

  function handleClose() {
    setComment("");
    onClose();
  }

  function handleSubmit() {
    if (comment.trim().length < MIN_CHARS) return;
    onSubmit(comment.trim());
    setComment("");
    onClose();
  }

  const remaining = MIN_CHARS - comment.trim().length;
  const isValid = remaining <= 0;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[55] bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 z-[60]",
          "w-full max-w-[430px] bg-white rounded-t-3xl",
          "transition-transform duration-300 ease-out"
        )}
        style={{ transform: isOpen ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-black/15 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <p className="font-semibold text-charcoal">Why do you disagree?</p>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/6 text-muted"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-10">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your perspective…"
            rows={4}
            autoFocus
            className="w-full mt-3 px-4 py-3 rounded-2xl border border-black/10 bg-cream text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all resize-none leading-relaxed"
          />
          <p className="text-xs text-muted/70 mt-2 leading-relaxed">
            Comments help others understand different perspectives.
            {!isValid && comment.trim().length > 0 && (
              <span className="text-muted"> ({remaining} more characters needed)</span>
            )}
          </p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-full border border-black/10 text-muted text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className={cn(
                "flex-1 py-3 rounded-full text-sm font-semibold transition-all",
                isValid
                  ? "bg-charcoal text-white active:scale-[0.98]"
                  : "bg-black/8 text-muted cursor-not-allowed"
              )}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
