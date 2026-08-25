"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/lib/mock-data";
import { useCurrentUser } from "@/lib/auth-context";

interface VouchSheetProps {
  isOpen: boolean;
  recommender: User;
  isSaved: boolean;
  onClose: () => void;
  onVouch: (chain?: string[]) => void;
  onSaveInstead: () => void;
}

export function VouchSheet({
  isOpen,
  recommender,
  isSaved,
  onClose,
  onVouch,
  onSaveInstead,
}: VouchSheetProps) {
  const currentUser = useCurrentUser();
  const [step, setStep] = useState<1 | 2>(1);

  function handleClose() {
    setStep(1);
    onClose();
  }

  function handleSaveInstead() {
    if (!isSaved) onSaveInstead();
    handleClose();
  }

  function handleSource(chain?: string[]) {
    onVouch(chain);
    setStep(1);
    onClose();
  }

  const recommenderFirst = recommender.name.split(" ")[0];

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

        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="text-sm text-muted font-medium">
              Back
            </button>
          ) : (
            <div className="w-10" />
          )}
          <p className="font-semibold text-charcoal text-sm">
            {step === 1 ? "Have you been here?" : "How did you hear about them?"}
          </p>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/6 text-muted"
          >
            <X size={15} />
          </button>
        </div>

        {step === 1 && (
          <div className="px-5 pb-10 space-y-3">
            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center gap-4 px-5 py-4 bg-sage rounded-2xl text-white text-left active:scale-[0.98] transition-transform"
            >
              <span className="text-2xl leading-none">🤝</span>
              <div>
                <p className="font-semibold text-base leading-tight">Yes, I vouch for them</p>
                <p className="text-sm text-white/70 mt-0.5">I've personally experienced this and trust it</p>
              </div>
            </button>
            <button
              onClick={handleSaveInstead}
              className="w-full flex items-center gap-4 px-5 py-4 bg-black/5 rounded-2xl text-left active:scale-[0.98] transition-transform"
            >
              <span className="text-2xl leading-none">🔖</span>
              <div>
                <p className="font-semibold text-base leading-tight text-charcoal">Not yet — just save this</p>
                <p className="text-sm text-muted mt-0.5">Add to your list to try later</p>
              </div>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="px-5 pb-10 space-y-2.5">
            <button
              onClick={() => handleSource([recommender.id, currentUser.id])}
              className="w-full text-left px-5 py-4 bg-sage-light/50 rounded-2xl border border-sage/20 active:scale-[0.98] transition-transform"
            >
              <p className="font-semibold text-charcoal text-sm leading-tight">
                {recommenderFirst} told me about them
              </p>
              <p className="text-xs text-muted mt-1">
                Trust chain: {recommenderFirst} → you
              </p>
            </button>
            <button
              onClick={() => handleSource([currentUser.id, recommender.id])}
              className="w-full text-left px-5 py-4 bg-black/4 rounded-2xl border border-black/8 active:scale-[0.98] transition-transform"
            >
              <p className="font-semibold text-charcoal text-sm leading-tight">
                I told {recommenderFirst} about them
              </p>
              <p className="text-xs text-muted mt-1">
                Trust chain: you → {recommenderFirst}
              </p>
            </button>
            <button
              onClick={() => handleSource(undefined)}
              className="w-full text-left px-5 py-4 bg-black/4 rounded-2xl border border-black/8 active:scale-[0.98] transition-transform"
            >
              <p className="font-semibold text-charcoal text-sm leading-tight">
                Unrelated — I already knew them
              </p>
              <p className="text-xs text-muted mt-1">Vouch recorded, no chain created</p>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
