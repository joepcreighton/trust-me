"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Recommendation, avaLocation, Category } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ─── category colors ──────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<Category, string> = {
  Beauty:  "#db2777",
  Health:  "#0d9488",
  Home:    "#2563eb",
  Fitness: "#7c3aed",
  Pets:    "#65a30d",
  Other:   "#6b7280",
};

// ─── custom pin icon ──────────────────────────────────────────────────────────

function makePinIcon(color: string, badge: number | string, trusted: boolean) {
  const badgeStr = typeof badge === "number" && badge > 9 ? "9+" : String(badge);
  const ring = trusted ? `stroke="#fff" stroke-width="2.5"` : "";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <path d="M18 2C10.27 2 4 8.27 4 16c0 9.75 14 26 14 26s14-16.25 14-26C32 8.27 25.73 2 18 2z"
        fill="${color}" ${ring} opacity="${trusted ? 1 : 0.9}"/>
      ${trusted ? `<path d="M18 2C10.27 2 4 8.27 4 16c0 9.75 14 26 14 26s14-16.25 14-26C32 8.27 25.73 2 18 2z" fill="none" stroke="white" stroke-width="2.5"/>` : ""}
      <text x="18" y="20" font-family="system-ui,sans-serif" font-size="${badge === 0 ? 9 : 10}" font-weight="700"
        fill="white" text-anchor="middle" dominant-baseline="middle">${badge === 0 ? "•" : badgeStr}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -46],
  });
}

// ─── recenter helper ──────────────────────────────────────────────────────────

function MapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prev = useRef<string>("");
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (key !== prev.current) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
      prev.current = key;
    }
  }, [lat, lng, map]);
  return null;
}

// ─── props ────────────────────────────────────────────────────────────────────

interface MapViewProps {
  recs: Recommendation[];
  vouchChainCounts: Record<string, number>;
  onRecClick: (id: string) => void;
  onSwitchToList?: () => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function MapView({ recs, vouchChainCounts, onRecClick, onSwitchToList }: MapViewProps) {
  const mappable = recs.filter((r) => r.lat != null && r.lng != null);

  return (
    <div className="relative mx-4 rounded-2xl overflow-hidden" style={{ height: "calc(100dvh - 240px)" }}>
      <MapContainer
        center={[avaLocation.lat, avaLocation.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapCenter lat={avaLocation.lat} lng={avaLocation.lng} />

        {mappable.map((rec) => {
          const chainCount = vouchChainCounts[rec.id] ?? 0;
          const trusted = chainCount >= 1;
          const color = CATEGORY_COLOR[rec.category];
          const badge = rec.vouches.length;
          const icon = makePinIcon(color, badge, trusted);

          return (
            <Marker
              key={rec.id}
              position={[rec.lat!, rec.lng!]}
              icon={icon}
            >
              <Popup closeButton={false} className="trust-me-popup">
                <div className="w-52 font-sans">
                  <p className="font-semibold text-[13px] text-gray-900 leading-tight">
                    {rec.businessName}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {rec.city}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {rec.blurb}
                  </p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] text-gray-400">
                      ❤️ {rec.likesCount} &nbsp;·&nbsp; 🤝 {rec.vouches.length}
                    </span>
                    <button
                      onClick={() => onRecClick(rec.id)}
                      style={{ backgroundColor: "#6B8F71" }}
                      className="text-white text-[11px] font-semibold px-3 py-1 rounded-full"
                    >
                      View rec
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* View List button — only shown when a handler is provided */}
      {onSwitchToList && (
        <button
          onClick={onSwitchToList}
          className={cn(
            "absolute bottom-4 right-4 z-[1000]",
            "flex items-center gap-1.5 px-4 py-2.5 rounded-full",
            "bg-white shadow-lg shadow-black/20 border border-black/8",
            "text-sm font-semibold text-gray-800",
            "active:scale-95 transition-transform"
          )}
        >
          ☰ View List
        </button>
      )}

      {/* Attribution small */}
      <div className="absolute bottom-2 left-2 z-[1000] text-[9px] text-gray-400">
        © OpenStreetMap
      </div>
    </div>
  );
}
