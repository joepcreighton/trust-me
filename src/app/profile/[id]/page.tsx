"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Heart, Handshake, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { DbUser } from "@/lib/db-types";

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  Beauty:  { bg: "bg-pink-100",   text: "text-pink-700" },
  Health:  { bg: "bg-teal-100",   text: "text-teal-700" },
  Home:    { bg: "bg-blue-100",   text: "text-blue-700" },
  Fitness: { bg: "bg-purple-100", text: "text-purple-700" },
  Pets:    { bg: "bg-lime-100",   text: "text-lime-700" },
  Other:   { bg: "bg-gray-100",   text: "text-gray-600" },
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface RecRow {
  id: string;
  business_name: string;
  category: string;
  city: string | null;
  photo_url: string | null;
  vouches: { user_id: string }[];
  likes: { user_id: string }[];
}

interface VouchedRecInner extends RecRow {
  recommender: { id: string; full_name: string } | null;
}

interface VouchedRow {
  recommendation_id: string;
  rec: VouchedRecInner | null;
}

type FriendStatus = "friends" | "pending_sent" | "pending_received" | "none";

function CategoryGroup({ category, recs }: { category: string; recs: RecRow[] }) {
  const [open, setOpen] = useState(true);
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.Other;
  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden bg-white shadow-sm shadow-black/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-black/4"
      >
        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", style.bg, style.text)}>
          {category}
        </span>
        <span className="flex-1 text-sm text-muted">{recs.length} rec{recs.length !== 1 ? "s" : ""}</span>
        <ChevronDown
          size={15}
          className={cn("text-muted/50 transition-transform duration-200 flex-shrink-0", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="divide-y divide-black/5 border-t border-black/5">
          {recs.map((rec) => (
            <div key={rec.id} className="flex items-center gap-3 px-4 py-3">
              <div className={cn("w-10 h-10 rounded-xl overflow-hidden flex-shrink-0", style.bg)}>
                {rec.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rec.photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal text-sm leading-tight truncate">{rec.business_name}</p>
                {rec.city && <p className="text-xs text-muted mt-0.5 truncate">{rec.city}</p>}
                <span className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                  <Heart size={10} strokeWidth={1.5} />
                  {rec.likes?.length ?? 0}
                  <span className="text-muted/30">·</span>
                  <Handshake size={10} strokeWidth={1.5} />
                  {rec.vouches?.length ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [recs, setRecs] = useState<RecRow[]>([]);
  const [vouchedRecs, setVouchedRecs] = useState<VouchedRow[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [showVouches, setShowVouches] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setLoading(false); return; }
      setCurrentUserId(authUser.id);

      const [profileRes, recsRes, vouchesRes, friendshipRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", id).single(),
        supabase
          .from("recommendations")
          .select("id, business_name, category, city, photo_url, vouches(user_id), likes(user_id)")
          .eq("user_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("vouches")
          .select("recommendation_id, rec:recommendations(id, business_name, category, city, photo_url, recommender:users!user_id(id, full_name), vouches(user_id), likes(user_id))")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("friendships")
          .select("status, requested_by")
          .or(`user_a.eq.${id},user_b.eq.${id}`)
          .maybeSingle(),
      ]);

      setProfile(profileRes.data);
      setRecs((recsRes.data as RecRow[]) ?? []);
      setVouchedRecs(((vouchesRes.data ?? []) as unknown as VouchedRow[]));

      if (friendshipRes.data) {
        const f = friendshipRes.data as { status: string; requested_by: string };
        if (f.status === "accepted") {
          setFriendStatus("friends");
        } else if (f.status === "pending") {
          setFriendStatus(f.requested_by === authUser.id ? "pending_sent" : "pending_received");
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  async function handleFriendAction() {
    setFriendError(null);
    setAddingFriend(true);
    const supabase = createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setFriendError("You must be signed in to do that.");
      setAddingFriend(false);
      return;
    }

    if (friendStatus === "pending_received") {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .or(`user_a.eq.${id},user_b.eq.${id}`);
      if (error) {
        setFriendError("Couldn't accept the request. Please try again.");
      } else {
        setFriendStatus("friends");
      }
    } else {
      const { error } = await supabase.from("friendships").insert({
        user_a: authUser.id,
        user_b: id,
        status: "pending",
        requested_by: authUser.id,
      });
      if (error) {
        setFriendError("Couldn't send the request. Please try again.");
      } else {
        setFriendStatus("pending_sent");
      }
    }

    setAddingFriend(false);
  }

  const recsByCategory = useMemo(() => {
    const groups: Record<string, RecRow[]> = {};
    for (const rec of recs) {
      const cat = capitalize(rec.category);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(rec);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [recs]);

  if (loading) {
    return (
      <div className="pt-4 pb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 px-4 py-3 text-sm text-muted">
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex justify-center pt-16">
          <div className="w-5 h-5 rounded-full border-2 border-sage border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] px-8 text-center">
        <p className="text-sm text-muted">User not found.</p>
        <button onClick={() => router.back()} className="mt-3 text-sage text-sm font-semibold">
          Go back
        </button>
      </div>
    );
  }

  const primaryCity = (profile.locations as Array<{ city: string }>)?.[0]?.city;
  const isOwnProfile = currentUserId === id;
  const validVouches = vouchedRecs.filter((v) => v.rec);

  return (
    <div className="pb-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 px-4 py-3 text-sm text-muted hover:text-charcoal transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="px-4 pb-5 border-b border-black/5">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatar_url ?? `https://i.pravatar.cc/150?u=${profile.id}`}
            alt={profile.full_name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl text-charcoal leading-tight">{profile.full_name}</h1>
            <p className="text-sm text-muted mt-0.5">@{profile.handle}</p>
            {primaryCity && (
              <p className="flex items-center gap-1 text-xs text-muted mt-1">
                <MapPin size={11} strokeWidth={1.75} />
                {primaryCity}
              </p>
            )}
          </div>

          {!isOwnProfile && (
            friendStatus === "friends" ? (
              <span className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full bg-sage/10 text-sage border border-sage/20">
                Friends
              </span>
            ) : (
              <button
                onClick={handleFriendAction}
                disabled={addingFriend || friendStatus === "pending_sent"}
                className={cn(
                  "flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full border transition-all",
                  friendStatus === "pending_sent"
                    ? "bg-black/5 text-muted border-black/10"
                    : "bg-sage text-white border-sage shadow-sm active:scale-95 disabled:opacity-60"
                )}
              >
                {addingFriend
                  ? "…"
                  : friendStatus === "pending_sent"
                  ? "Requested"
                  : friendStatus === "pending_received"
                  ? "Accept"
                  : "Add friend"}
              </button>
            )
          )}
        </div>

        {friendError && (
          <p className="mt-2 text-xs text-rose-500 text-right">{friendError}</p>
        )}

        {profile.bio && (
          <p className="mt-3 text-sm text-charcoal/75 leading-relaxed">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex flex-col items-center">
            <span className="font-display text-xl text-charcoal leading-tight">{recs.length}</span>
            <span className="text-[11px] text-muted">recs</span>
          </div>
          {validVouches.length > 0 && (
            <>
              <div className="w-px h-6 bg-black/8" />
              <div className="flex flex-col items-center">
                <span className="font-display text-xl text-charcoal leading-tight">{validVouches.length}</span>
                <span className="text-[11px] text-muted">vouched</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab switcher when both sections exist */}
      {validVouches.length > 0 && (
        <div className="flex border-b border-black/8 bg-cream sticky top-0 z-10">
          <button
            onClick={() => setShowVouches(false)}
            className={cn(
              "flex-1 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
              !showVouches ? "border-sage text-charcoal" : "border-transparent text-muted"
            )}
          >
            Recommendations
          </button>
          <button
            onClick={() => setShowVouches(true)}
            className={cn(
              "flex-1 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
              showVouches ? "border-sage text-charcoal" : "border-transparent text-muted"
            )}
          >
            Vouched for
          </button>
        </div>
      )}

      {/* Recommendations tab */}
      {!showVouches && (
        <div className="mt-4">
          {recsByCategory.length === 0 ? (
            <p className="text-center text-sm text-muted py-12">No recommendations yet.</p>
          ) : (
            <>
              <p className="text-[11px] font-bold text-muted uppercase tracking-wide px-4 mb-3">
                {recs.length} rec{recs.length !== 1 ? "s" : ""}
              </p>
              {recsByCategory.map(([cat, catRecs]) => (
                <CategoryGroup key={cat} category={cat} recs={catRecs} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Vouched tab */}
      {showVouches && (
        <div className="mt-4">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wide px-4 mb-3">
            {validVouches.length} vouched
          </p>
          <div className="mx-4 bg-white rounded-2xl shadow-sm shadow-black/5 divide-y divide-black/5 overflow-hidden">
            {validVouches.map((v) => {
              const rec = v.rec!;
              const cat = capitalize(rec.category);
              const style = CATEGORY_STYLE[cat] ?? CATEGORY_STYLE.Other;
              return (
                <div key={v.recommendation_id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={cn("w-11 h-11 rounded-xl overflow-hidden flex-shrink-0", style.bg)}>
                    {rec.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={rec.photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal text-sm leading-tight truncate">{rec.business_name}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {rec.recommender ? (
                        <Link href={`/profile/${rec.recommender.id}`} className="hover:underline underline-offset-2">
                          {rec.recommender.full_name}
                        </Link>
                      ) : "Someone"}{rec.city ? ` · ${rec.city}` : ""}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", style.bg, style.text)}>
                        {cat}
                      </span>
                      <span className="flex items-center gap-2 text-[11px] text-muted">
                        <Heart size={11} strokeWidth={1.5} />
                        {rec.likes?.length ?? 0}
                        <span className="text-muted/30">·</span>
                        <Handshake size={11} strokeWidth={1.5} />
                        {rec.vouches?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
