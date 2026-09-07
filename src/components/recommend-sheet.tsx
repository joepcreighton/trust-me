"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  X,
  MapPin,
  Camera,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Home,
  Dumbbell,
  PawPrint,
  Circle,
  Globe,
  Phone,
  Loader2,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import { cn } from "@/lib/utils";
import { Category, Recommendation } from "@/lib/mock-data";
import { useCurrentUser } from "@/lib/auth-context";
import { cityToLatLng } from "@/lib/city-coords";
import { createClient } from "@/lib/supabase/client";

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
  address: string;
  lat: number | null;
  lng: number | null;
  mapboxPlaceId: string;
  website: string;
  phone: string;
}

interface MapboxSuggestion {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted?: string;
  context?: {
    place?: { name: string };
    district?: { name: string };
    region?: { name: string; region_code?: string };
  };
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

const WHY_LIMIT = 280;

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// ─── helpers ─────────────────────────────────────────────────────────────────

async function fetchSuggestions(
  query: string,
  sessionToken: string,
  biasLat?: number,
  biasLng?: number,
): Promise<MapboxSuggestion[]> {
  if (!MAPBOX_TOKEN || query.length < 2) return [];
  const params = new URLSearchParams({
    q: query,
    access_token: MAPBOX_TOKEN,
    session_token: sessionToken,
    types: "poi,address",
    limit: "5",
    language: "en",
  });
  if (biasLat != null && biasLng != null) {
    params.set("proximity", `${biasLng},${biasLat}`);
  }
  try {
    const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params}`);
    const json = await res.json();
    return json.suggestions ?? [];
  } catch {
    return [];
  }
}

async function retrievePlace(mapboxId: string, sessionToken: string) {
  if (!MAPBOX_TOKEN) return null;
  try {
    const params = new URLSearchParams({ access_token: MAPBOX_TOKEN, session_token: sessionToken });
    const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?${params}`);
    const json = await res.json();
    return json.features?.[0] ?? null;
  } catch {
    return null;
  }
}

// Supabase-based fallback autocomplete (no Mapbox token)
async function getBusinessSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("recommendations")
    .select("business_name")
    .ilike("business_name", `%${query}%`)
    .limit(5);
  const seen = new Set<string>();
  return (data ?? []).map((r) => r.business_name).filter((name) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

// ─── component ───────────────────────────────────────────────────────────────

interface RecommendSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (rec: Recommendation) => void;
}

const INITIAL_FORM: FormState = {
  name: "", provider: "", category: null, why: "",
  photo: null, city: "", address: "", lat: null, lng: null,
  mapboxPlaceId: "", website: "", phone: "",
};

export function RecommendSheet({ isOpen, onClose, onPost }: RecommendSheetProps) {
  const currentUser = useCurrentUser();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[] | string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [posting, setPosting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef<string>("");
  const primaryCity = currentUser.cities?.[0];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setForm(INITIAL_FORM);
      setSuggestions([]);
      setPhotoError(null);
      // New Mapbox session per sheet open
      sessionTokenRef.current = crypto.randomUUID();
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  async function handleNameChange(val: string) {
    setForm((f) => ({ ...f, name: val }));

    if (MAPBOX_TOKEN) {
      setLoadingSuggestions(true);
      const bias = primaryCity ? cityToLatLng(primaryCity) : undefined;
      const results = await fetchSuggestions(val, sessionTokenRef.current, bias?.lat, bias?.lng);
      setSuggestions(results);
      setLoadingSuggestions(false);
    } else {
      getBusinessSuggestions(val).then(setSuggestions);
    }
  }

  async function handlePickMapboxSuggestion(suggestion: MapboxSuggestion) {
    setSuggestions([]);
    setForm((f) => ({ ...f, name: suggestion.name }));

    const feature = await retrievePlace(suggestion.mapbox_id, sessionTokenRef.current);
    // Start a new session token after retrieve (per Mapbox billing rules)
    sessionTokenRef.current = crypto.randomUUID();

    if (!feature) return;

    const props = feature.properties ?? {};
    const coords = props.coordinates ?? {};
    const context = props.context ?? suggestion.context ?? {};

    setForm((f) => ({
      ...f,
      name: props.name ?? suggestion.name,
      address: props.full_address ?? suggestion.full_address ?? "",
      city: context.place?.name ?? f.city,
      lat: coords.latitude ?? null,
      lng: coords.longitude ?? null,
      mapboxPlaceId: props.mapbox_id ?? suggestion.mapbox_id,
      phone: props.metadata?.phone ?? f.phone,
      website: props.metadata?.website ?? f.website,
    }));
  }

  function handlePickFallbackSuggestion(name: string) {
    setForm((f) => ({ ...f, name }));
    setSuggestions([]);
  }

  async function handlePhotoFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be under 5 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file");
      return;
    }
    if (!currentUser.id) return;

    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });
      const ext = compressed.type.split("/")[1] ?? "jpg";
      const path = `${currentUser.id}/draft-${Date.now()}.${ext}`;
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("rec-photos")
        .upload(path, compressed, { contentType: compressed.type });
      if (error) { setPhotoError("Upload failed — try again"); return; }
      const { data: urlData } = supabase.storage.from("rec-photos").getPublicUrl(data.path);
      setForm((f) => ({ ...f, photo: urlData.publicUrl }));
    } catch {
      setPhotoError("Upload failed — try again");
    } finally {
      setPhotoUploading(false);
    }
  }

  function canAdvance(): boolean {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.category !== null;
    if (step === 3) return form.why.trim().length > 0;
    return true;
  }

  function handleNext() {
    if (step < 4) setStep((s) => (s + 1) as Step);
    else handlePost();
  }

  async function handlePost() {
    if (!currentUser.id || posting) return;
    setPosting(true);

    const supabase = createClient();
    const cat = (form.category ?? "other").toLowerCase();

    const { data, error } = await supabase
      .from("recommendations")
      .insert({
        user_id: currentUser.id,
        business_name: form.name.trim(),
        service_provider: form.provider.trim() || null,
        category: cat,
        blurb: form.why.trim(),
        photo_url: form.photo || null,
        city: form.city || null,
        address: form.address || null,
        latitude: form.lat,
        longitude: form.lng,
        mapbox_place_id: form.mapboxPlaceId || null,
        website: form.website.trim() || null,
        phone: form.phone.trim() || null,
      })
      .select()
      .single();

    setPosting(false);

    if (!error && data) {
      const rec: Recommendation = {
        id: data.id,
        recommenderId: currentUser.id,
        businessName: data.business_name,
        serviceProvider: data.service_provider ?? undefined,
        category: (data.category.charAt(0).toUpperCase() + data.category.slice(1)) as Category,
        subCategory: "Other",
        city: data.city ?? "",
        lat: data.latitude ?? undefined,
        lng: data.longitude ?? undefined,
        blurb: data.blurb,
        photo: data.photo_url ?? undefined,
        website: data.website ?? undefined,
        phone: data.phone ?? undefined,
        timestamp: data.created_at,
        likesCount: 0,
        vouches: [],
        commentCount: 0,
      };
      onPost(rec);
    }
  }

  const progress = (step / 4) * 100;
  const overLimit = form.why.length > WHY_LIMIT;

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
          "w-full max-w-[430px] bg-white rounded-t-3xl",
          "flex flex-col max-h-[88vh]",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-black/15 rounded-full" />
        </div>

        <div className="px-4 pt-2 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
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
              <p className="text-xs text-muted font-medium">Step {step} of 4</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 -mr-1 text-muted hover:text-charcoal transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-3 h-1 bg-black/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage rounded-full transition-all duration-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {step === 1 && (
            <StepName
              name={form.name}
              provider={form.provider}
              suggestions={suggestions}
              loadingSuggestions={loadingSuggestions}
              hasMapbox={Boolean(MAPBOX_TOKEN)}
              inputRef={inputRef}
              onChange={handleNameChange}
              onProviderChange={(v) => setForm((f) => ({ ...f, provider: v }))}
              onPickMapboxSuggestion={handlePickMapboxSuggestion}
              onPickFallbackSuggestion={handlePickFallbackSuggestion}
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
              photoUploading={photoUploading}
              photoError={photoError}
              onPickPhotoFile={handlePhotoFile}
              onRemovePhoto={() => setForm((f) => ({ ...f, photo: null }))}
              onCityChange={(city) => setForm((f) => ({ ...f, city }))}
              onWebsiteChange={(website) => setForm((f) => ({ ...f, website }))}
              onPhoneChange={(phone) => setForm((f) => ({ ...f, phone }))}
            />
          )}
        </div>

        <div className="px-5 pb-8 pt-3 flex-shrink-0 border-t border-black/5">
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance() || posting || photoUploading}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "h-12 rounded-full font-semibold text-sm transition-all",
              canAdvance() && !posting && !photoUploading
                ? "bg-sage text-white shadow-sm shadow-sage/30 active:opacity-75"
                : "bg-black/8 text-muted cursor-not-allowed"
            )}
          >
            {posting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : step < 4 ? (
              <>Next <ArrowRight size={16} /></>
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
  loadingSuggestions,
  hasMapbox,
  inputRef,
  onChange,
  onProviderChange,
  onPickMapboxSuggestion,
  onPickFallbackSuggestion,
}: {
  name: string;
  provider: string;
  suggestions: MapboxSuggestion[] | string[];
  loadingSuggestions: boolean;
  hasMapbox: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  onProviderChange: (v: string) => void;
  onPickMapboxSuggestion: (s: MapboxSuggestion) => void;
  onPickFallbackSuggestion: (name: string) => void;
}) {
  const mapboxSuggestions = hasMapbox ? (suggestions as MapboxSuggestion[]) : [];
  const fallbackSuggestions = !hasMapbox ? (suggestions as string[]) : [];

  return (
    <div className="pt-1">
      <h2 className="font-display text-2xl text-charcoal leading-snug">
        Who or what are you recommending?
      </h2>
      <p className="text-sm text-muted mt-1 mb-5">A person, business, or place</p>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
          <MapPin size={17} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Poppy Nails"
          className="w-full pl-10 pr-10 py-3.5 rounded-2xl border border-black/10 bg-white text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
        />
        {loadingSuggestions && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Loader2 size={15} className="animate-spin text-muted" />
          </div>
        )}
      </div>

      {/* Mapbox suggestions */}
      {mapboxSuggestions.length > 0 && (
        <div className="mt-2 rounded-2xl border border-black/8 bg-white overflow-hidden shadow-sm">
          {mapboxSuggestions.map((s) => (
            <button
              key={s.mapbox_id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onPickMapboxSuggestion(s); }}
              onTouchEnd={(e) => { e.preventDefault(); onPickMapboxSuggestion(s); }}
              className="w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-sage-light transition-colors border-b border-black/5 last:border-0"
            >
              <MapPin size={13} className="text-muted flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-charcoal truncate">{s.name}</p>
                {(s.full_address ?? s.place_formatted) && (
                  <p className="text-xs text-muted mt-0.5 truncate">{s.full_address ?? s.place_formatted}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Fallback Supabase suggestions (no Mapbox token) */}
      {fallbackSuggestions.length > 0 && (
        <div className="mt-2 rounded-2xl border border-black/8 bg-white overflow-hidden shadow-sm">
          {fallbackSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onPickFallbackSuggestion(s); }}
              className="w-full text-left px-4 py-3 text-sm text-charcoal hover:bg-sage-light transition-colors border-b border-black/5 last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {!loadingSuggestions && mapboxSuggestions.length === 0 && name.length >= 2 && (
        <p className="text-xs text-muted mt-3">
          Not in suggestions? Any name works — just keep typing.
        </p>
      )}

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
      <p className="text-sm text-muted mt-1 mb-6">Pick the best fit</p>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
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
  photoUploading,
  photoError,
  onPickPhotoFile,
  onRemovePhoto,
  onCityChange,
  onWebsiteChange,
  onPhoneChange,
}: {
  photo: string | null;
  city: string;
  website: string;
  phone: string;
  photoUploading: boolean;
  photoError: string | null;
  onPickPhotoFile: (file: File) => void;
  onRemovePhoto: () => void;
  onCityChange: (v: string) => void;
  onWebsiteChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPickPhotoFile(file);
    e.target.value = "";
  }

  return (
    <div className="pt-1">
      <h2 className="font-display text-2xl text-charcoal leading-snug">
        A few last details
      </h2>
      <p className="text-sm text-muted mt-1 mb-6">
        All optional — skip anything you&apos;d like
      </p>

      {/* Photo */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-charcoal uppercase tracking-wide mb-3">Photo</p>

        {photo ? (
          <div className="relative rounded-2xl overflow-hidden h-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onRemovePhoto}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoUploading}
            className="w-full h-32 rounded-2xl border-2 border-dashed border-black/15 flex flex-col items-center justify-center gap-2 text-muted hover:border-sage/50 hover:text-sage hover:bg-sage-light/20 transition-all disabled:opacity-60"
          >
            {photoUploading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                <span className="text-sm font-medium">Uploading…</span>
              </>
            ) : (
              <>
                <Camera size={24} strokeWidth={1.5} />
                <span className="text-sm font-medium">Add a photo</span>
                <span className="text-xs text-muted/60">JPEG, PNG, WebP — max 5 MB</span>
              </>
            )}
          </button>
        )}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {photoError && (
          <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
            <Upload size={11} /> {photoError}
          </p>
        )}
      </div>

      {/* City */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-charcoal uppercase tracking-wide mb-3">Location</p>
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City (auto-filled if you picked from suggestions)"
          className="w-full px-4 py-3.5 rounded-2xl border border-black/10 bg-white text-charcoal text-sm placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
        />
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-charcoal uppercase tracking-wide">Contact info</p>

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
