"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  X,
  Search,
  Camera,
  ChevronDown,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Home,
  Dumbbell,
  PawPrint,
  Circle,
  Globe,
  Phone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { recommendations, Category, Recommendation } from "@/lib/mock-data";
import { useCurrentUser } from "@/lib/auth-context";

// ─── types ──────────────────────────────────────────────────────────────────

type FormCategory = Category | "Other";
type Step = 1 | 2 | 3 | 4;

interface FormState {
  name: string;
  provider: string;
  category: FormCategory | null;
  why: string;
  photo: string | null;
  city: string;
  website: string;
  phone: string;
}

// ─── constants ───────────────────────────────────────────────────────────────

const CATEGORIES: Array<{ value: FormCategory; icon: LucideIcon }> = [
  { value: "Beauty",  icon: Sparkles },
  { value: "Health",  icon: HeartPulse },
  { value: "Home",    icon: Home },
  { value: "Fitness", icon: Dumbbell },
  { value: "Pets",    icon: PawPrint },
  { value: "Other",   icon: Circle },
];

const CITIES = [
  "New York City, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Austin, TX",
  "Denver, CO",
  "San Diego, CA",
  "Online",
];

const WHY_LIMIT = 280;

const CATEGORY_PHOTOS: Record<string, string[]> = {
  Beauty: [
    "1522337360788-8b13dee7a37e",
    "1556228578-8c89e6adf883",
    "1604654894610-df63bc536371",
  ],
  Health: [
    "1573496359142-b8d87734a5a2",
    "1576091160399-112ba8d25d1d",
  ],
  Home: [
    "1484154218962-a197022b5858",
  ],
  Fitness: [
    "1534438327276-14e5300c3a48",
    "1506629082955-511b1aa562c8",
    "1574680096145-d05b474e2155",
  ],
  Pets: [
    "1587300003388-59208cc962cb",
  ],
  Other: [
    "1519337265831-281ec6cc8514",
    "1507679799987-c73779587ccf",
  ],
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function getBusinessSuggestions(query: string): string[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  const seen = new Set<string>();
  return recommendations
    .map((r) => r.businessName)
    .filter((name) => {
      if (seen.has(name)) return false;
      seen.add(name);
      return name.toLowerCase().includes(q);
    })
    .slice(0, 5);
}

function pickRandomPhoto(category: FormCategory | null): string {
  const pool = CATEGORY_PHOTOS[category ?? "Other"] ?? CATEGORY_PHOTOS.Other;
  const id = pool[Math.floor(Math.random() * pool.length)];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
}

// ─── component ───────────────────────────────────────────────────────────────

interface RecommendSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (rec: Recommendation) => void;
}

export function RecommendSheet({ isOpen, onClose, onPost }: RecommendSheetProps) {
  const currentUser = useCurrentUser();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    name: "",
    provider: "",
    category: null,
    why: "",
    photo: null,
    city: "",
    website: "",
    phone: "",
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form whenever sheet opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setForm({ name: "", provider: "", category: null, why: "", photo: null, city: "", website: "", phone: "" });
      setSuggestions([]);
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // Block body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleNameChange(val: string) {
    setForm((f) => ({ ...f, name: val }));
    setSuggestions(getBusinessSuggestions(val));
  }

  function pickSuggestion(name: string) {
    setForm((f) => ({ ...f, name }));
    setSuggestions([]);
  }

  function addPhoto() {
    setForm((f) => ({ ...f, photo: pickRandomPhoto(f.category) }));
  }

  function removePhoto() {
    setForm((f) => ({ ...f, photo: null }));
  }

  function canAdvance(): boolean {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.category !== null;
    if (step === 3) return form.why.trim().length > 0;
    return true;
  }

  function handleNext() {
    if (step < 4) {
      setStep((s) => (s + 1) as Step);
    } else {
      handlePost();
    }
  }

  function handlePost() {
    const cat: Category =
      form.category === "Other" || !form.category ? "Beauty" : form.category;

    const rec: Recommendation = {
      id: `user-${Date.now()}`,
      recommenderId: currentUser.id,
      businessName: form.name.trim(),
      category: cat,
      subCategory: "Hair", // sensible default; full subcat picker is future scope
      city: form.city || "Location TBD",
      serviceProvider: form.provider.trim() || undefined,
      blurb: form.why.trim(),
      photo: form.photo ?? undefined,
      website: form.website.trim() || undefined,
      phone: form.phone.trim() || undefined,
      timestamp: new Date().toISOString(),
      likesCount: 0,
      vouches: [],
      commentCount: 0,
    };

    onPost(rec);
  }

  const progress = (step / 4) * 100;
  const overLimit = form.why.length > WHY_LIMIT;

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
          "w-full max-w-[430px] bg-white rounded-t-3xl",
          "flex flex-col max-h-[88vh]",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-black/15 rounded-full" />
        </div>

        {/* Sheet header */}
        <div className="px-4 pt-2 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="p-1 -ml-1 text-muted hover:text-charcoal transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="w-7" />
            )}

            <div className="text-center">
              <p className="text-xs text-muted font-medium">
                Step {step} of 4
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1 -mr-1 text-muted hover:text-charcoal transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-black/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage rounded-full transition-all duration-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {step === 1 && (
            <StepName
              name={form.name}
              provider={form.provider}
              suggestions={suggestions}
              inputRef={inputRef}
              onChange={handleNameChange}
              onProviderChange={(v) => setForm((f) => ({ ...f, provider: v }))}
              onPickSuggestion={pickSuggestion}
            />
          )}
          {step === 2 && (
            <StepCategory
              selected={form.category}
              onSelect={(cat) => setForm((f) => ({ ...f, category: cat }))}
            />
          )}
          {step === 3 && (
            <StepWhy
              why={form.why}
              overLimit={overLimit}
              onChange={(val) => setForm((f) => ({ ...f, why: val }))}
            />
          )}
          {step === 4 && (
            <StepExtras
              photo={form.photo}
              city={form.city}
              website={form.website}
              phone={form.phone}
              onAddPhoto={addPhoto}
              onRemovePhoto={removePhoto}
              onCityChange={(city) => setForm((f) => ({ ...f, city }))}
              onWebsiteChange={(website) => setForm((f) => ({ ...f, website }))}
              onPhoneChange={(phone) => setForm((f) => ({ ...f, phone }))}
            />
          )}
        </div>

        {/* Footer action */}
        <div className="px-5 pb-8 pt-3 flex-shrink-0 border-t border-black/5">
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "h-12 rounded-full font-semibold text-sm transition-all",
              canAdvance()
                ? "bg-sage text-white shadow-sm shadow-sage/30 active:scale-[0.98]"
                : "bg-black/8 text-muted cursor-not-allowed"
            )}
          >
            {step < 4 ? (
              <>
                Next <ArrowRight size={16} />
              </>
            ) : (
              "Post →"
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Step 1: Name ────────────────────────────────────────────────────────────

function StepName({
  name,
  provider,
  suggestions,
  inputRef,
  onChange,
  onProviderChange,
  onPickSuggestion,
}: {
  name: string;
  provider: string;
  suggestions: string[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  onProviderChange: (v: string) => void;
  onPickSuggestion: (v: string) => void;
}) {
  return (
    <div className="pt-1">
      <h2 className="font-display text-2xl text-charcoal leading-snug">
        Who or what are you recommending?
      </h2>
      <p className="text-sm text-muted mt-1 mb-5">
        A person, business, or place
      </p>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
          <Search size={17} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Maria's Color Studio"
          className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-black/10 bg-white text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
        />
      </div>

      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-2 rounded-2xl border border-black/8 bg-white overflow-hidden shadow-sm">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={(e) => {
                e.preventDefault();
                onPickSuggestion(s);
              }}
              className="w-full text-left px-4 py-3 text-sm text-charcoal hover:bg-sage-light transition-colors border-b border-black/5 last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {suggestions.length === 0 && name.length >= 2 && (
        <p className="text-xs text-muted mt-3">
          Not in our suggestions? No problem — any name works.
        </p>
      )}

      {/* Optional service provider */}
      <div className="mt-5">
        <p className="text-xs font-semibold text-charcoal/70 uppercase tracking-wide mb-2">
          Service provider <span className="font-normal normal-case text-muted">— optional</span>
        </p>
        <input
          type="text"
          value={provider}
          onChange={(e) => onProviderChange(e.target.value)}
          placeholder="e.g. Elizabeth (nail tech)"
          className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
        />
        <p className="text-xs text-muted mt-1.5">
          For &ldquo;Poppy Nails — Elizabeth&rdquo; style recommendations
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Category ────────────────────────────────────────────────────────

function StepCategory({
  selected,
  onSelect,
}: {
  selected: FormCategory | null;
  onSelect: (cat: FormCategory) => void;
}) {
  return (
    <div className="pt-1">
      <h2 className="font-display text-2xl text-charcoal leading-snug">
        What kind of recommendation?
      </h2>
      <p className="text-sm text-muted mt-1 mb-6">
        Pick the best fit
      </p>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-medium text-left transition-all",
              selected === value
                ? "border-sage bg-sage text-white shadow-sm"
                : "border-black/10 bg-white text-charcoal hover:border-sage/40 hover:bg-sage-light/40"
            )}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Why ─────────────────────────────────────────────────────────────

function StepWhy({
  why,
  overLimit,
  onChange,
}: {
  why: string;
  overLimit: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="pt-1">
      <h2 className="font-display text-2xl text-charcoal leading-snug">
        Why do you love them?
      </h2>
      <p className="text-sm text-muted mt-1 mb-5">
        Be specific — details are what make people trust your rec
      </p>

      <div className="rounded-2xl border border-black/10 bg-white focus-within:border-sage focus-within:ring-2 focus-within:ring-sage/20 transition-all">
        <div className="px-4 pt-4 pb-0.5">
          <span className="text-sm font-semibold italic text-sage">Trust me...</span>
        </div>
        <textarea
          value={why}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. She's been doing my highlights for 3 years and I've never had brassy hair since. Book months in advance but SO worth it."
          rows={5}
          className="w-full px-4 pt-2 pb-10 bg-transparent text-charcoal text-sm placeholder:text-muted/60 focus:outline-none resize-none leading-relaxed"
          autoFocus
        />
        <span
          className={cn(
            "block text-right px-4 pb-3 text-[11px] font-medium transition-colors -mt-8",
            overLimit ? "text-rose-500" : "text-muted/60"
          )}
        >
          {why.length}/{WHY_LIMIT}
        </span>
      </div>

      {overLimit && (
        <p className="text-xs text-rose-500 mt-2">
          Over the soft limit — you can still post, but consider trimming.
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Extras ──────────────────────────────────────────────────────────

function StepExtras({
  photo,
  city,
  website,
  phone,
  onAddPhoto,
  onRemovePhoto,
  onCityChange,
  onWebsiteChange,
  onPhoneChange,
}: {
  photo: string | null;
  city: string;
  website: string;
  phone: string;
  onAddPhoto: () => void;
  onRemovePhoto: () => void;
  onCityChange: (v: string) => void;
  onWebsiteChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}) {
  return (
    <div className="pt-1">
      <h2 className="font-display text-2xl text-charcoal leading-snug">
        A few last details
      </h2>
      <p className="text-sm text-muted mt-1 mb-6">
        All optional — skip anything you'd like
      </p>

      {/* Photo */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-charcoal uppercase tracking-wide mb-3">
          Photo
        </p>

        {photo ? (
          <div className="relative rounded-2xl overflow-hidden h-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={onRemovePhoto}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onAddPhoto}
            className="w-full h-32 rounded-2xl border-2 border-dashed border-black/15 flex flex-col items-center justify-center gap-2 text-muted hover:border-sage/50 hover:text-sage hover:bg-sage-light/20 transition-all"
          >
            <Camera size={24} strokeWidth={1.5} />
            <span className="text-sm font-medium">Add a photo</span>
          </button>
        )}
      </div>

      {/* City */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-charcoal uppercase tracking-wide mb-3">
          Location
        </p>

        <div className="relative">
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3.5 rounded-2xl border border-black/10 bg-white text-charcoal text-sm focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all cursor-pointer"
          >
            <option value="">No location / skip</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-charcoal uppercase tracking-wide">
          Contact info
        </p>

        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <Globe size={15} strokeWidth={1.75} />
          </div>
          <input
            type="url"
            value={website}
            onChange={(e) => onWebsiteChange(e.target.value)}
            placeholder="Website URL"
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-black/10 bg-white text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
          />
        </div>

        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <Phone size={15} strokeWidth={1.75} />
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="Phone number"
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-black/10 bg-white text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
