"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, MapPin, ChevronRight } from "lucide-react";
import {
  providers,
  recommendations,
  users,
  Recommendation,
} from "@/lib/mock-data";
import { useCurrentUser } from "@/lib/auth-context";
import { useUserRecs } from "@/lib/user-recs-context";
import { useInteractions } from "@/lib/use-interactions";
import { CardSheet } from "@/components/card-sheet";
import { cn } from "@/lib/utils";

// ─── rec row ──────────────────────────────────────────────────────────────────

function RecRow({ rec, onClick }: { rec: Recommendation; onClick: () => void }) {
  const currentUser = useCurrentUser();
  const recommender = users.find((u) => u.id === rec.recommenderId) ?? currentUser;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 text-left active:bg-black/4 transition-colors group"
    >
      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-black/5">
        {rec.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.photo} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-charcoal text-sm leading-tight truncate">{rec.businessName}</p>
        <p className="text-xs text-muted mt-0.5 truncate">{rec.city}</p>
        <p className="text-[11px] text-muted/70 mt-0.5 truncate">
          rec&apos;d by {recommender.name.split(" ")[0]} · ❤️ {rec.likesCount} · 🤝 {rec.vouches.length}
        </p>
      </div>
      <ChevronRight size={15} className="text-muted/40 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ProviderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { userRecs } = useUserRecs();
  const { interactions, toggle, addVouch, removeVouch, addVouchChain, addDisagreement } = useInteractions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const provider = providers.find((p) => p.id === id);
  const friends = users.filter((u) => u.id !== currentUser.id);
  const allRecs = useMemo(() => [...userRecs, ...recommendations], [userRecs]);

  const providerRecs = useMemo(
    () => allRecs.filter((r) => r.providerId === id),
    [allRecs, id]
  );

  const totalVouches = providerRecs.reduce((sum, r) => sum + r.vouches.length, 0);
  const totalLikes   = providerRecs.reduce((sum, r) => sum + r.likesCount, 0);

  const selectedRec = selectedId ? allRecs.find((r) => r.id === selectedId) ?? null : null;
  const selectedRecommender = selectedRec
    ? (users.find((u) => u.id === selectedRec.recommenderId) ?? currentUser)
    : currentUser;

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-8 text-center">
        <p className="text-muted text-sm">Provider not found.</p>
        <button onClick={() => router.back()} className="mt-3 text-sage text-sm font-medium">
          Go back
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="pb-4">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-4 py-3 text-sm text-muted hover:text-charcoal transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* ── Provider header ───────────────────────────────────────────── */}
        <div className="px-4 pb-5 border-b border-black/5">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={provider.avatar}
              alt={provider.name}
              className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-sm"
            />
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl text-charcoal leading-tight">{provider.name}</h1>
                {provider.verified && (
                  <BadgeCheck size={20} className="text-sage flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted mt-0.5">{provider.profession}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3">
                <div className="text-center">
                  <p className="text-base font-bold text-charcoal leading-none">{providerRecs.length}</p>
                  <p className="text-[10px] text-muted mt-0.5">recs</p>
                </div>
                <div className="w-px h-6 bg-black/8" />
                <div className="text-center">
                  <p className="text-base font-bold text-charcoal leading-none">{totalVouches}</p>
                  <p className="text-[10px] text-muted mt-0.5">vouches</p>
                </div>
                <div className="w-px h-6 bg-black/8" />
                <div className="text-center">
                  <p className="text-base font-bold text-charcoal leading-none">{totalLikes}</p>
                  <p className="text-[10px] text-muted mt-0.5">likes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="mt-4 text-sm text-charcoal/75 leading-relaxed">{provider.bio}</p>

          {/* Works at */}
          <div className="mt-4">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">Works at</p>
            <div className="space-y-1.5">
              {provider.businesses.map((biz) => (
                <div key={biz} className="flex items-center gap-2 text-sm text-charcoal">
                  <MapPin size={12} className="text-muted flex-shrink-0" />
                  <span>{biz}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recommendations ───────────────────────────────────────────── */}
        {providerRecs.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted">No recommendations yet.</p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wide px-4 mb-1">
              Mentioned in {providerRecs.length} rec{providerRecs.length !== 1 ? "s" : ""}
            </p>
            <div className={cn(
              "mx-4 bg-white rounded-2xl shadow-sm shadow-black/5",
              "divide-y divide-black/5 overflow-hidden"
            )}>
              {providerRecs.map((rec) => (
                <RecRow key={rec.id} rec={rec} onClick={() => setSelectedId(rec.id)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <CardSheet
        rec={selectedRec}
        onClose={() => setSelectedId(null)}
        recommender={selectedRecommender}
        friends={friends}
        currentUserAvatar={currentUser.avatar}
        isLiked={selectedId ? interactions.likes.includes(selectedId) : false}
        isVouched={selectedId ? interactions.vouches.includes(selectedId) : false}
        isSaved={selectedId ? interactions.saves.includes(selectedId) : false}
        onToggleLike={() => selectedId && toggle("likes", selectedId)}
        onToggleSave={() => selectedId && toggle("saves", selectedId)}
        onVouch={(chain) => {
          if (!selectedId) return;
          addVouch(selectedId);
          if (chain) addVouchChain(selectedId, chain);
        }}
        onUnvouch={() => selectedId && removeVouch(selectedId)}
        onDisagree={(comment) => selectedId && addDisagreement(selectedId, comment)}
        vouchChains={selectedId ? (interactions.vouchChains[selectedId] ?? []) : []}
        disagreements={selectedId ? (interactions.disagreements[selectedId] ?? []) : []}
      />
    </>
  );
}
