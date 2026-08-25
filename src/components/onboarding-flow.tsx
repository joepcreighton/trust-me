"use client";

import { useState, useCallback } from "react";
import {
  Heart, Handshake, ArrowRight, Check, Link2,
  Sparkles, HeartPulse, Home, Dumbbell, PawPrint, Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Category, type Recommendation } from "@/lib/mock-data";
import { useCurrentUser } from "@/lib/auth-context";
import { ONBOARDING_PLACES, getPlacesForCities } from "@/lib/onboarding-places";

// ─── constants ────────────────────────────────────────────────────────────────

const ONBOARDING_CITIES = [
  "New York City, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Austin, TX",
  "Denver, CO",
  "San Diego, CA",
];

const MOCK_INVITE_LINK = "trustme.app/invite/ava-chen";

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  Beauty:  Sparkles,
  Health:  HeartPulse,
  Home:    Home,
  Fitness: Dumbbell,
  Pets:    PawPrint,
  Other:   Circle,
};

// ─── types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface OnboardingFlowProps {
  onComplete: (recs: Recommendation[]) => void;
}

// ─── progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {([1, 2, 3, 4, 5] as Step[]).map((s) => (
        <div
          key={s}
          className={cn(
            "rounded-full transition-all duration-300",
            step === s ? "w-5 h-1.5 bg-sage" : "w-1.5 h-1.5 bg-black/15"
          )}
        />
      ))}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const currentUser = useCurrentUser();
  const [step, setStep] = useState<Step>(1);
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
  const [beenPlaces, setBeenPlaces] = useState<Set<string>>(new Set());
  const [blurbs, setBlurbs] = useState<Map<string, string>>(new Map());
  const [expandedBlurb, setExpandedBlurb] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const places = getPlacesForCities(Array.from(selectedCities));

  function toggleCity(city: string) {
    setSelectedCities((prev) => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city); else next.add(city);
      return next;
    });
  }

  function toggleBeen(id: string) {
    setBeenPlaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function setBlurb(id: string, val: string) {
    setBlurbs((prev) => new Map(prev).set(id, val));
  }

  function advance() {
    if (step === 3 && beenPlaces.size === 0) {
      setStep(5);
    } else if (step < 5) {
      setStep((s) => (s + 1) as Step);
    } else {
      handleComplete();
    }
    setExpandedBlurb(null);
  }

  function handleSkipAll() {
    handleComplete();
  }

  function handleComplete() {
    const newRecs: Recommendation[] = [];
    beenPlaces.forEach((placeId) => {
      const place = ONBOARDING_PLACES.find((p) => p.id === placeId);
      const blurb = blurbs.get(placeId)?.trim() ?? "";
      if (place && blurb) {
        newRecs.push({
          id: `onboard-${placeId}-${Date.now()}`,
          recommenderId: currentUser.id,
          businessName: place.businessName,
          category: place.category,
          subCategory: place.subCategory,
          city: place.city,
          blurb,
          photo: place.photo,
          timestamp: new Date().toISOString(),
          likesCount: 0,
          vouches: [],
          commentCount: 0,
        });
      }
    });
    onComplete(newRecs);
  }

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(`https://${MOCK_INVITE_LINK}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const beenCount = beenPlaces.size;

  return (
    <div className="fixed inset-0 z-[150] bg-cream flex flex-col">
      <div className="relative mx-auto w-full max-w-[430px] flex flex-col h-full">

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-14 pb-3">
          <div className="flex items-center justify-between mb-3">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="text-sm text-muted font-medium px-1 py-1"
              >
                ←
              </button>
            ) : (
              <div className="w-8" />
            )}

            <ProgressDots step={step} />

            <button
              onClick={handleSkipAll}
              className="text-sm text-muted font-medium px-1 py-1"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && <StepWelcome />}
          {step === 2 && (
            <StepCities
              selectedCities={selectedCities}
              onToggle={toggleCity}
            />
          )}
          {step === 3 && (
            <StepPlaces
              places={places}
              beenPlaces={beenPlaces}
              onToggle={toggleBeen}
            />
          )}
          {step === 4 && (
            <StepVouch
              beenPlaces={beenPlaces}
              blurbs={blurbs}
              expandedBlurb={expandedBlurb}
              onSetBlurb={setBlurb}
              onSetExpanded={setExpandedBlurb}
            />
          )}
          {step === 5 && (
            <StepInvite copied={copied} onCopy={handleCopyLink} />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 pb-10 pt-3 border-t border-black/5 bg-cream">
          <button
            onClick={advance}
            className="w-full h-12 rounded-full bg-sage text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-sage/30 active:scale-[0.98] transition-transform"
          >
            {step === 1 && <>Let&apos;s go <ArrowRight size={16} /></>}
            {step === 2 && <>Next <ArrowRight size={16} /></>}
            {step === 3 && (
              <>
                Next
                {beenCount > 0 && (
                  <span className="ml-1 bg-white/25 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {beenCount} place{beenCount !== 1 ? "s" : ""}
                  </span>
                )}
                <ArrowRight size={16} />
              </>
            )}
            {step === 4 && <>Continue <ArrowRight size={16} /></>}
            {step === 5 && <>Get started <ArrowRight size={16} /></>}
          </button>

          {step === 1 && (
            <button
              onClick={handleSkipAll}
              className="w-full mt-2 py-2 text-sm text-muted font-medium text-center"
            >
              Skip onboarding
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="px-5 pt-2 pb-4">
      <p className="text-xs font-bold text-sage uppercase tracking-widest mb-3">
        Welcome
      </p>
      <h2 className="font-display text-[2rem] text-charcoal leading-tight mb-3">
        Recommendations from people you actually trust.
      </h2>
      <p className="text-sm text-muted leading-relaxed mb-8">
        Trust Me runs on two signals. They mean very different things.
      </p>

      <div className="space-y-3">
        <div className="bg-rose-50 rounded-2xl p-4 flex gap-4 items-start">
          <Heart
            size={22}
            className="text-rose-400 flex-shrink-0 mt-0.5"
            strokeWidth={1.75}
          />
          <div>
            <p className="font-semibold text-charcoal text-sm">Like</p>
            <p className="text-sm text-muted mt-0.5 leading-relaxed">
              A quick nod that says &ldquo;thanks for sharing.&rdquo; Shows support
              without staking your name on it.
            </p>
          </div>
        </div>

        <div className="bg-sage-light rounded-2xl p-4 flex gap-4 items-start">
          <Handshake
            size={22}
            className="text-sage flex-shrink-0 mt-0.5"
            strokeWidth={1.75}
          />
          <div>
            <p className="font-semibold text-charcoal text-sm">Vouch</p>
            <p className="text-sm text-muted mt-0.5 leading-relaxed">
              &ldquo;I&apos;ve used them and I second this.&rdquo; The highest trust signal
              on the platform — your name goes on it.
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted/60 text-center mt-6">
        Vouching multiplies trust across your whole network.
      </p>
    </div>
  );
}

// ─── Step 2: Cities ───────────────────────────────────────────────────────────

function StepCities({
  selectedCities,
  onToggle,
}: {
  selectedCities: Set<string>;
  onToggle: (city: string) => void;
}) {
  return (
    <div className="px-5 pt-2 pb-4">
      <p className="text-xs font-bold text-sage uppercase tracking-widest mb-3">
        Your cities
      </p>
      <h2 className="font-display text-[2rem] text-charcoal leading-tight mb-2">
        Where do you spend time?
      </h2>
      <p className="text-sm text-muted mb-6">
        We&apos;ll show you relevant places. Pick as many as you like.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {ONBOARDING_CITIES.map((city) => {
          const active = selectedCities.has(city);
          return (
            <button
              key={city}
              onClick={() => onToggle(city)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border text-left transition-all",
                active
                  ? "border-sage bg-sage text-white shadow-sm"
                  : "border-black/10 bg-white text-charcoal hover:border-sage/40"
              )}
            >
              {active && (
                <Check size={14} strokeWidth={2.5} className="flex-shrink-0" />
              )}
              <span className="text-sm font-medium leading-tight">
                {city.split(",")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {selectedCities.size === 0 && (
        <p className="text-xs text-muted/60 text-center mt-5">
          Nothing selected? We&apos;ll show you popular spots everywhere.
        </p>
      )}
    </div>
  );
}

// ─── Step 3: Places you may have been ────────────────────────────────────────

function StepPlaces({
  places,
  beenPlaces,
  onToggle,
}: {
  places: ReturnType<typeof getPlacesForCities>;
  beenPlaces: Set<string>;
  onToggle: (id: string) => void;
}) {
  const beenCount = beenPlaces.size;

  return (
    <div className="pt-2 pb-4">
      <div className="px-5 mb-5">
        <p className="text-xs font-bold text-sage uppercase tracking-widest mb-3">
          Places you may know
        </p>
        <h2 className="font-display text-[2rem] text-charcoal leading-tight mb-2">
          Have you been here?
        </h2>
        <p className="text-sm text-muted">
          Tap any you recognize — we&apos;ll ask for your take.
          {beenCount > 0 && beenCount < 5 && (
            <span className="text-sage font-medium">
              {" "}Tap {5 - beenCount} more for a richer feed.
            </span>
          )}
          {beenCount >= 5 && (
            <span className="text-sage font-medium"> Great start!</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        {places.map((place) => {
          const been = beenPlaces.has(place.id);
          return (
            <div
              key={place.id}
              className={cn(
                "relative rounded-2xl overflow-hidden border-2 transition-all bg-white",
                been ? "border-sage shadow-sm shadow-sage/20" : "border-transparent shadow-sm shadow-black/5"
              )}
            >
              {/* Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={place.photo}
                alt={place.businessName}
                className="w-full h-24 object-cover"
                loading="lazy"
              />

              {/* Been badge */}
              {been && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sage flex items-center justify-center shadow-sm">
                  <Check size={13} strokeWidth={2.5} className="text-white" />
                </div>
              )}

              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs font-semibold text-charcoal leading-tight line-clamp-1">
                  {place.businessName}
                </p>
                <p className="text-[10px] text-muted mt-0.5">{place.subCategory}</p>

                <button
                  onClick={() => onToggle(place.id)}
                  className={cn(
                    "mt-2 w-full text-[10px] font-bold py-1.5 rounded-full transition-all",
                    been
                      ? "bg-sage text-white"
                      : "bg-black/6 text-muted hover:bg-sage-light hover:text-sage"
                  )}
                >
                  {been ? "✓ Been here" : "Been here?"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {places.length === 0 && (
        <div className="px-5 py-12 text-center">
          <p className="text-muted text-sm">
            No places found for your cities yet. More coming soon!
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Add your take (vouch + notes) ────────────────────────────────────

function StepVouch({
  beenPlaces,
  blurbs,
  expandedBlurb,
  onSetBlurb,
  onSetExpanded,
}: {
  beenPlaces: Set<string>;
  blurbs: Map<string, string>;
  expandedBlurb: string | null;
  onSetBlurb: (id: string, val: string) => void;
  onSetExpanded: (id: string | null) => void;
}) {
  const beenList = Array.from(beenPlaces)
    .map((id) => ONBOARDING_PLACES.find((p) => p.id === id))
    .filter((p): p is (typeof ONBOARDING_PLACES)[number] => p != null);

  const filledCount = Array.from(blurbs.values()).filter((b) => b.trim().length > 0).length;

  return (
    <div className="px-5 pt-2 pb-4">
      <p className="text-xs font-bold text-sage uppercase tracking-widest mb-3">
        Your take
      </p>
      <h2 className="font-display text-[2rem] text-charcoal leading-tight mb-2">
        Share your recommendation
      </h2>
      <p className="text-sm text-muted mb-1">
        Add a note for any place you&apos;ve been. Your circle will see it as your vouch.
      </p>
      {filledCount > 0 && (
        <p className="text-xs text-sage font-semibold mb-4">
          {filledCount} note{filledCount !== 1 ? "s" : ""} added
        </p>
      )}
      {filledCount === 0 && <div className="mb-4" />}

      <div className="space-y-3">
        {beenList.map((place) => {
          const Icon = CATEGORY_ICON[place.category];
          const isExpanded = expandedBlurb === place.id;
          const blurb = blurbs.get(place.id) ?? "";
          const hasBlurb = blurb.trim().length > 0;

          return (
            <div key={place.id} className="bg-white rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-sage-light flex items-center justify-center flex-shrink-0">
                  <Icon size={15} strokeWidth={1.75} className="text-sage" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-charcoal truncate">
                    {place.businessName}
                  </p>
                  <p className="text-[11px] text-muted">
                    {place.subCategory} · {place.city.split(",")[0]}
                  </p>
                </div>
              </div>

              {isExpanded ? (
                <>
                  <p className="text-xs font-display italic text-sage mb-1.5">
                    Trust me...
                  </p>
                  <textarea
                    value={blurb}
                    onChange={(e) => onSetBlurb(place.id, e.target.value)}
                    placeholder="What makes this place worth trusting?"
                    rows={3}
                    autoFocus
                    className="w-full text-sm text-charcoal px-3 py-2.5 border border-black/10 rounded-xl focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 resize-none leading-relaxed placeholder:text-muted/50 transition-all"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => { onSetBlurb(place.id, ""); onSetExpanded(null); }}
                      className="text-xs text-muted font-medium"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => onSetExpanded(null)}
                      className="text-xs text-sage font-semibold"
                    >
                      Save note
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => onSetExpanded(place.id)}
                  className="w-full text-left"
                >
                  {hasBlurb ? (
                    <p className="text-xs text-charcoal/70 italic line-clamp-2 leading-relaxed">
                      &ldquo;{blurb}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-sage font-semibold flex items-center gap-1">
                      <span className="text-base leading-none">+</span> Add your take
                    </p>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 5: Invite ───────────────────────────────────────────────────────────

function StepInvite({
  copied,
  onCopy,
}: {
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="px-5 pt-2 pb-4 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-sage-light flex items-center justify-center mb-6 mt-2">
        <Handshake size={34} className="text-sage" strokeWidth={1.5} />
      </div>

      <p className="text-xs font-bold text-sage uppercase tracking-widest mb-3">
        Invite your circle
      </p>
      <h2 className="font-display text-[2rem] text-charcoal leading-tight mb-3">
        Better with your people
      </h2>
      <p className="text-sm text-muted leading-relaxed max-w-[280px]">
        Trust Me works best when your actual circle is on it. Recs from friends
        you trust, vouched by people who know you.
      </p>

      <div className="mt-8 w-full space-y-3">
        <div className="bg-black/5 rounded-2xl px-4 py-3 text-left">
          <p className="text-[10px] text-muted font-semibold uppercase tracking-wide mb-1">
            Your invite link
          </p>
          <p className="text-sm text-charcoal font-medium truncate">
            {MOCK_INVITE_LINK}
          </p>
        </div>

        <button
          onClick={onCopy}
          className={cn(
            "w-full h-12 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all",
            copied
              ? "bg-charcoal text-white"
              : "bg-sage text-white shadow-sm shadow-sage/30 active:scale-[0.98]"
          )}
        >
          {copied ? (
            <>
              <Check size={16} strokeWidth={2.5} /> Copied!
            </>
          ) : (
            <>
              <Link2 size={16} strokeWidth={2} /> Copy invite link
            </>
          )}
        </button>

        <p className="text-xs text-muted/60 pt-1">
          Or skip for now and invite later from your profile.
        </p>
      </div>
    </div>
  );
}
