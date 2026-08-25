"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, X } from "lucide-react";
import { CITY_NEIGHBORHOODS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export type LocationFilter =
  | { type: "all" }
  | { type: "city"; city: string }
  | { type: "neighborhood"; city: string; neighborhood: string }
  | { type: "custom"; query: string };

interface LocationSheetProps {
  isOpen: boolean;
  userCities: string[];
  currentFilter: LocationFilter;
  onClose: () => void;
  onSelect: (filter: LocationFilter) => void;
}

function Radio({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
        active ? "border-sage bg-sage" : "border-black/20"
      )}
    >
      {active && <div className="w-2 h-2 rounded-full bg-white" />}
    </div>
  );
}

export function LocationSheet({
  isOpen,
  userCities,
  currentFilter,
  onClose,
  onSelect,
}: LocationSheetProps) {
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [customExpanded, setCustomExpanded] = useState(false);
  const [customQuery, setCustomQuery] = useState(
    currentFilter.type === "custom" ? currentFilter.query : ""
  );

  function select(filter: LocationFilter) {
    onSelect(filter);
    onClose();
  }

  function handleCustomSubmit() {
    const q = customQuery.trim();
    if (q) select({ type: "custom", query: q });
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[55] bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
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
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-black/15 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-black/8">
          <p className="font-semibold text-charcoal">Filter by location</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/6 text-muted"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[65vh] pb-10">
          {/* All my cities */}
          <button
            onClick={() => select({ type: "all" })}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-4 transition-colors text-left",
              currentFilter.type === "all" ? "bg-sage-light/40" : "hover:bg-black/3"
            )}
          >
            <Radio active={currentFilter.type === "all"} />
            <div>
              <p className={cn("text-sm font-semibold", currentFilter.type === "all" ? "text-sage" : "text-charcoal")}>
                All my cities
              </p>
              <p className="text-xs text-muted mt-0.5">{userCities.join(", ")}</p>
            </div>
          </button>

          {/* Individual cities */}
          {userCities.map((city) => {
            const isCityActive = currentFilter.type === "city" && currentFilter.city === city;
            const isNbInCity = currentFilter.type === "neighborhood" && currentFilter.city === city;
            const isExpanded = expandedCity === city;
            const neighborhoods = CITY_NEIGHBORHOODS[city] ?? [];

            return (
              <div key={city} className="border-t border-black/6">
                <div className={cn(
                  "flex items-center gap-3 px-5 py-3.5 transition-colors",
                  (isCityActive || isNbInCity) ? "bg-sage-light/30" : ""
                )}>
                  <button
                    onClick={() => select({ type: "city", city })}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <Radio active={isCityActive} />
                    <p className={cn("text-sm font-medium", isCityActive ? "text-sage font-semibold" : "text-charcoal")}>
                      {city}
                    </p>
                  </button>

                  {neighborhoods.length > 0 && (
                    <button
                      onClick={() => setExpandedCity(isExpanded ? null : city)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-muted px-2.5 py-1 rounded-lg bg-black/5 hover:bg-black/8 transition-colors flex-shrink-0"
                    >
                      Neighborhoods
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}
                </div>

                {/* Neighborhood sub-list */}
                {isExpanded && (
                  <div className="bg-black/[0.018] border-t border-black/5">
                    {neighborhoods.map((nb) => {
                      const isNbActive =
                        currentFilter.type === "neighborhood" &&
                        currentFilter.neighborhood === nb;
                      return (
                        <button
                          key={nb}
                          onClick={() => select({ type: "neighborhood", city, neighborhood: nb })}
                          className={cn(
                            "w-full flex items-center gap-3 pl-11 pr-5 py-2.5 transition-colors text-left",
                            isNbActive ? "bg-sage-light/50" : "hover:bg-black/4"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            isNbActive ? "border-sage bg-sage" : "border-black/20"
                          )}>
                            {isNbActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <p className={cn("text-sm flex-1", isNbActive ? "text-sage font-semibold" : "text-charcoal/80")}>
                            {nb}
                          </p>
                          {isNbActive && <MapPin size={12} className="text-sage" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom location */}
          <div className="border-t border-black/6">
            <button
              onClick={() => setCustomExpanded(!customExpanded)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-black/3 transition-colors text-left"
            >
              <Radio active={currentFilter.type === "custom"} />
              <p className={cn("text-sm font-medium flex-1", currentFilter.type === "custom" ? "text-sage font-semibold" : "text-charcoal")}>
                Custom location
              </p>
              {customExpanded ? (
                <ChevronUp size={14} className="text-muted" />
              ) : (
                <ChevronDown size={14} className="text-muted" />
              )}
            </button>

            {customExpanded && (
              <div className="px-5 pb-4 pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                    placeholder="Enter a city or neighborhood…"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/5 border border-black/10 text-sm text-charcoal placeholder:text-muted/60 focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
                    autoFocus
                  />
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customQuery.trim()}
                    className="px-4 py-2.5 rounded-xl bg-sage text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
                {currentFilter.type === "custom" && (
                  <p className="text-xs text-sage mt-1.5 font-medium">
                    Active: &ldquo;{currentFilter.query}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
