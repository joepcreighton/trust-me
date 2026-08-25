"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile, type Gender } from "@/lib/user-profile-context";
import { currentUser } from "@/lib/mock-data";

// ─── constants ────────────────────────────────────────────────────────────────

const BIO_LIMIT = 150;

const DEFAULT_AVATAR = currentUser.avatar;

const AVAILABLE_CITIES = [
  "New York City", "Los Angeles", "Chicago", "Austin", "Denver",
  "San Diego", "Seattle", "Boston", "Nashville", "Miami",
  "Portland", "Atlanta", "Washington DC", "Philadelphia",
  "Charleston", "Salt Lake City", "Phoenix", "Dallas",
  "Houston", "Minneapolis", "San Francisco", "Brooklyn",
  "New Orleans", "Las Vegas", "Detroit", "Raleigh",
  "Charlotte", "Tampa", "Orlando", "Sacramento",
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "woman",            label: "Woman" },
  { value: "man",              label: "Man" },
  { value: "non-binary",       label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

// ─── component ────────────────────────────────────────────────────────────────

interface EditProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileSheet({ isOpen, onClose, onSaved }: EditProfileSheetProps) {
  const { profile, updateProfile } = useUserProfile();

  const [localAvatar, setLocalAvatar] = useState(profile.avatar);
  const [localBio, setLocalBio] = useState(profile.bio);
  const [localCities, setLocalCities] = useState<string[]>(profile.cities);
  const [localGender, setLocalGender] = useState<Gender | null>(profile.gender);

  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const citySearchRef = useRef<HTMLInputElement>(null);

  // Sync local state from context when sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalAvatar(profile.avatar);
      setLocalBio(profile.bio);
      setLocalCities([...profile.cities]);
      setLocalGender(profile.gender);
      setShowCityDropdown(false);
      setCitySearch("");
    }
  }, [isOpen]); // intentionally only on open, not on every profile change

  // Block body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Auto-focus city search when dropdown opens
  useEffect(() => {
    if (showCityDropdown) {
      setTimeout(() => citySearchRef.current?.focus(), 80);
    }
  }, [showCityDropdown]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") setLocalAvatar(result);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function addCity(city: string) {
    if (!localCities.includes(city)) {
      setLocalCities((prev) => [...prev, city]);
    }
    setShowCityDropdown(false);
    setCitySearch("");
  }

  function removeCity(city: string) {
    setLocalCities((prev) => prev.filter((c) => c !== city));
  }

  function handleSave() {
    updateProfile({
      avatar: localAvatar,
      bio: localBio.trim(),
      cities: localCities,
      gender: localGender,
    });
    onSaved();
    onClose();
  }

  const overLimit = localBio.length > BIO_LIMIT;

  const filteredCities = AVAILABLE_CITIES.filter(
    (c) =>
      !localCities.includes(c) &&
      c.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[55] bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-cream flex flex-col",
          "transition-transform duration-300 ease-out",
          "max-w-[430px] mx-auto",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-14 pb-4 border-b border-black/8">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/8 transition-colors text-muted"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
          <h2 className="font-display text-lg text-charcoal">Edit profile</h2>
          <div className="w-8" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">

          {/* ── Avatar ── */}
          <section className="flex flex-col items-center gap-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={localAvatar}
                alt="Profile photo"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-sage-light"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                aria-label="Change photo"
              >
                <Camera size={22} className="text-white" strokeWidth={1.75} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-sage"
              >
                Change photo
              </button>
              {localAvatar !== DEFAULT_AVATAR && (
                <>
                  <span className="text-black/20">·</span>
                  <button
                    onClick={() => setLocalAvatar(DEFAULT_AVATAR)}
                    className="text-sm text-muted"
                  >
                    Remove photo
                  </button>
                </>
              )}
            </div>
          </section>

          {/* ── Bio ── */}
          <section>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wide mb-2.5">
              Bio
            </label>
            <div className="rounded-2xl border border-black/10 bg-white focus-within:border-sage focus-within:ring-2 focus-within:ring-sage/20 transition-all">
              <textarea
                value={localBio}
                onChange={(e) => setLocalBio(e.target.value)}
                placeholder="A few words about you..."
                rows={3}
                className="w-full px-4 pt-3.5 pb-1 bg-transparent text-charcoal text-sm placeholder:text-muted/50 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex justify-end px-4 pb-3">
                <span
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    overLimit ? "text-rose-500" : "text-muted/50"
                  )}
                >
                  {localBio.length}/{BIO_LIMIT}
                </span>
              </div>
            </div>
            {overLimit && (
              <p className="text-xs text-rose-500 mt-1.5">
                Over the limit — consider trimming.
              </p>
            )}
          </section>

          {/* ── Locations ── */}
          <section>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wide mb-1.5">
              Where you spend time
            </label>
            <p className="text-xs text-muted mb-3">
              First city is your primary location.
            </p>

            {/* Chips */}
            {localCities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {localCities.map((city, i) => (
                  <span
                    key={city}
                    className={cn(
                      "flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm font-medium",
                      i === 0
                        ? "bg-sage text-white"
                        : "bg-white border border-black/10 text-charcoal"
                    )}
                  >
                    {city}
                    <button
                      onClick={() => removeCity(city)}
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                        i === 0 ? "hover:bg-white/20" : "hover:bg-black/10"
                      )}
                      aria-label={`Remove ${city}`}
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add location button / dropdown */}
            {!showCityDropdown ? (
              <button
                onClick={() => setShowCityDropdown(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-sage py-1"
              >
                <span className="text-base leading-none">+</span>
                Add location
                <ChevronDown size={14} strokeWidth={2} />
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-black/8">
                  <Search size={15} className="text-muted flex-shrink-0" strokeWidth={1.75} />
                  <input
                    ref={citySearchRef}
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Search cities..."
                    className="flex-1 text-sm text-charcoal bg-transparent focus:outline-none placeholder:text-muted/50"
                  />
                  <button
                    onClick={() => { setShowCityDropdown(false); setCitySearch(""); }}
                    className="text-muted"
                  >
                    <X size={14} />
                  </button>
                </div>
                {/* City list */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => addCity(city)}
                        className="w-full text-left px-4 py-3 text-sm text-charcoal hover:bg-sage-light/50 transition-colors border-b border-black/5 last:border-0"
                      >
                        {city}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted px-4 py-3">No cities found</p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ── Gender ── */}
          <section>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wide mb-2.5">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setLocalGender(value)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all",
                    localGender === value
                      ? "border-sage bg-sage text-white shadow-sm"
                      : "border-black/10 bg-white text-charcoal hover:border-sage/40 hover:bg-sage-light/30"
                  )}
                >
                  {localGender === value && (
                    <Check size={13} strokeWidth={2.5} className="flex-shrink-0" />
                  )}
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted/60 mt-2.5 leading-relaxed">
              Used to personalize your recommendations. Only visible to you.
            </p>
          </section>

          {/* Bottom spacer so content clears the sticky footer */}
          <div className="h-4" />
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 px-5 pb-10 pt-3 border-t border-black/8 bg-cream">
          <button
            onClick={handleSave}
            disabled={overLimit}
            className={cn(
              "w-full h-12 rounded-full font-semibold text-sm transition-all",
              overLimit
                ? "bg-black/10 text-muted cursor-not-allowed"
                : "bg-sage text-white shadow-sm shadow-sage/30 active:scale-[0.98]"
            )}
          >
            Save changes
          </button>
        </div>
      </div>
    </>
  );
}
