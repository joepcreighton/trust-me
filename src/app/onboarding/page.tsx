"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Camera, X, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Gender } from "@/lib/mock-data";

const BIO_LIMIT = 150;

const ONBOARDING_CITIES = [
  "New York City", "Los Angeles", "Chicago", "San Francisco",
  "Austin", "Miami", "Denver", "Seattle", "Boston", "Nashville",
  "Brooklyn", "Portland", "Atlanta", "Philadelphia", "Washington DC",
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 rounded-full flex-1 transition-colors duration-300",
            i < step ? "bg-sage" : i === step ? "bg-sage/40" : "bg-black/10"
          )}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [gender, setGender] = useState<Gender | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Prefill from auth user's auto-generated data
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/sign-in"); return; }
      // Pre-fill full_name from email if not set
      const metaName = user.user_metadata?.full_name;
      if (metaName) setFullName(metaName);
    });
  }, [router]);

  // Debounced handle uniqueness check
  useEffect(() => {
    if (!handle) { setHandleError(null); return; }
    const h = handle.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (h !== handle) { setHandleError("Only letters, numbers, and underscores."); return; }
    if (h.length < 3) { setHandleError("At least 3 characters."); return; }
    setCheckingHandle(true);
    setHandleError(null);
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("handle", h)
        .maybeSingle();
      setCheckingHandle(false);
      if (data) setHandleError("That handle is taken. Try another.");
    }, 400);
    return () => clearTimeout(t);
  }, [handle]);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function toggleCity(city: string) {
    setCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  }

  const steps = ["handle", "name", "bio", "location", "gender", "photo"];
  const TOTAL = steps.length;

  function canAdvance() {
    if (step === 0) return handle.length >= 3 && !handleError && !checkingHandle;
    if (step === 1) return fullName.trim().length > 0;
    return true; // bio, location, gender, photo are all skippable
  }

  async function handleComplete() {
    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { router.replace("/sign-in"); return; }

    let avatarUrl: string | null = null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop() ?? "jpg";
      const { data } = await supabase.storage
        .from("avatars")
        .upload(`${user.id}/avatar.${ext}`, avatarFile, {
          upsert: true,
          contentType: avatarFile.type,
        });
      if (data) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(data.path);
        avatarUrl = urlData.publicUrl;
      }
    }

    await supabase
      .from("users")
      .update({
        handle: handle.toLowerCase(),
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        locations: cities.map((city) => ({ city, state: "" })),
        gender: gender ?? null,
        avatar_url: avatarUrl,
        onboarding_complete: true,
      })
      .eq("id", user.id);

    router.replace("/");
  }

  function next() {
    if (step < TOTAL - 1) setStep((s) => s + 1);
    else handleComplete();
  }

  const isLastStep = step === TOTAL - 1;

  return (
    <div className="min-h-screen bg-cream flex flex-col px-6 py-10">
      <div className="w-full max-w-sm mx-auto flex flex-col flex-1">
        {/* Header */}
        <div className="mb-8">
          <span className="font-display text-2xl text-charcoal">trust me</span>
          <div className="mt-3">
            <ProgressBar step={step} total={TOTAL} />
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1">

          {/* Step 0: Handle */}
          {step === 0 && (
            <div>
              <h2 className="font-display text-[1.75rem] text-charcoal leading-tight mb-1.5">
                Pick your handle
              </h2>
              <p className="text-sm text-muted mb-6">
                This is how friends will find you. You can change it later.
              </p>
              <div className="flex items-center gap-2 bg-white border border-black/12 rounded-2xl px-4 shadow-sm">
                <span className="text-muted text-base">@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourhandle"
                  autoFocus
                  autoCapitalize="none"
                  autoComplete="off"
                  maxLength={30}
                  className="flex-1 text-base text-charcoal bg-transparent py-4 focus:outline-none placeholder:text-muted/40"
                />
                {checkingHandle && (
                  <span className="text-xs text-muted animate-pulse">checking…</span>
                )}
                {!checkingHandle && handle.length >= 3 && !handleError && (
                  <Check size={16} className="text-sage" strokeWidth={2.5} />
                )}
              </div>
              {handleError && (
                <p className="text-sm text-rose-500 mt-2">{handleError}</p>
              )}
            </div>
          )}

          {/* Step 1: Full name */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-[1.75rem] text-charcoal leading-tight mb-1.5">
                Your name
              </h2>
              <p className="text-sm text-muted mb-6">
                This is how your friends will see you.
              </p>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                autoFocus
                className="w-full bg-white border border-black/12 rounded-2xl px-4 py-4 text-base text-charcoal shadow-sm focus:outline-none focus:ring-2 focus:ring-sage/30 placeholder:text-muted/50"
              />
            </div>
          )}

          {/* Step 2: Bio */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-[1.75rem] text-charcoal leading-tight mb-1.5">
                A few words about you
              </h2>
              <p className="text-sm text-muted mb-6">
                Optional — shows on your profile.
              </p>
              <div className="relative">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_LIMIT))}
                  placeholder="What should your friends know about your taste?"
                  autoFocus
                  rows={4}
                  className="w-full bg-white border border-black/12 rounded-2xl px-4 py-3.5 text-sm text-charcoal shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-sage/30 placeholder:text-muted/50"
                />
                <p className={cn(
                  "text-right text-[11px] mt-1",
                  bio.length > BIO_LIMIT - 20 ? "text-rose-400" : "text-muted"
                )}>
                  {bio.length}/{BIO_LIMIT}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-[1.75rem] text-charcoal leading-tight mb-1.5">
                Where do you spend time?
              </h2>
              <p className="text-sm text-muted mb-6">
                Helps surface recs near you. Optional.
              </p>
              <div className="flex flex-wrap gap-2">
                {ONBOARDING_CITIES.map((city) => {
                  const selected = cities.includes(city);
                  return (
                    <button
                      key={city}
                      onClick={() => toggleCity(city)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors",
                        selected
                          ? "bg-sage text-white"
                          : "bg-white border border-black/12 text-charcoal"
                      )}
                    >
                      {selected && <Check size={13} strokeWidth={2.5} />}
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Gender */}
          {step === 4 && (
            <div>
              <h2 className="font-display text-[1.75rem] text-charcoal leading-tight mb-1.5">
                Gender
              </h2>
              <p className="text-sm text-muted mb-6">
                Private — never shown on your profile. Helps personalize recs.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {GENDER_OPTIONS.map(({ value, label }) => {
                  const selected = gender === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setGender(selected ? null : value)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3.5 rounded-2xl border text-sm font-semibold text-left transition-colors",
                        selected
                          ? "bg-sage text-white border-sage"
                          : "bg-white border-black/12 text-charcoal"
                      )}
                    >
                      {label}
                      {selected && <Check size={15} strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Photo */}
          {step === 5 && (
            <div>
              <h2 className="font-display text-[1.75rem] text-charcoal leading-tight mb-1.5">
                Add a profile picture
              </h2>
              <p className="text-sm text-muted mb-8">
                Optional — you can always add one later.
              </p>
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-black/5 flex items-center justify-center">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={28} className="text-muted/40" strokeWidth={1.5} />
                    )}
                  </div>
                  {avatarPreview && (
                    <button
                      onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-charcoal text-white flex items-center justify-center"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={pickFile}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-6 py-2.5 rounded-full border border-sage/40 text-sage text-sm font-semibold hover:bg-sage-light transition-colors"
                >
                  {avatarPreview ? "Change photo" : "Choose photo"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-muted font-medium py-2"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step >= 2 && !isLastStep && (
              <button
                onClick={next}
                className="text-sm text-muted font-medium py-2 px-2"
              >
                Skip
              </button>
            )}
            <button
              onClick={next}
              disabled={!canAdvance() || submitting}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all",
                canAdvance() && !submitting
                  ? "bg-sage text-white shadow-sm shadow-sage/20 active:scale-[0.97]"
                  : "bg-black/8 text-muted"
              )}
            >
              {submitting ? "Setting up…" : isLastStep ? (
                <>Done <Check size={15} strokeWidth={2.5} /></>
              ) : (
                <>Next <ArrowRight size={15} strokeWidth={2} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
