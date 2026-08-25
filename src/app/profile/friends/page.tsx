"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Friend {
  id: string;
  handle: string;
  full_name: string;
  avatar_url: string | null;
  locations: { city: string; state?: string }[];
}

export default function FriendsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data: rows } = await supabase
        .from("friendships")
        .select("user_a, user_b")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .eq("status", "accepted");

      if (!rows || rows.length === 0) { setLoading(false); return; }

      const friendIds = rows.map((r) =>
        r.user_a === user.id ? r.user_b : r.user_a
      );

      const { data: profiles } = await supabase
        .from("users")
        .select("id, handle, full_name, avatar_url, locations")
        .in("id", friendIds);

      setFriends(profiles ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = query.trim()
    ? friends.filter(
        (f) =>
          f.full_name.toLowerCase().includes(query.toLowerCase()) ||
          f.handle.toLowerCase().includes(query.toLowerCase())
      )
    : friends;

  const sorted = [...filtered].sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );

  return (
    <div className="pb-4">
      {/* Sub-header */}
      <div className="relative flex items-center px-3 py-3 border-b border-black/5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted hover:text-charcoal transition-colors px-2 py-1.5 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="font-semibold text-charcoal text-base absolute left-1/2 -translate-x-1/2">
          Friends{friends.length > 0 ? ` · ${friends.length}` : ""}
        </h1>
      </div>

      {/* Search */}
      {friends.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 bg-white rounded-2xl border border-black/8 px-3.5 py-2.5 shadow-sm shadow-black/4">
            <Search size={16} className="text-muted flex-shrink-0" strokeWidth={1.75} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search friends"
              autoComplete="off"
              className="flex-1 text-sm text-charcoal bg-transparent focus:outline-none placeholder:text-muted/50"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-sage border-t-transparent animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-8">
          {query.trim() ? (
            <p className="text-muted text-sm">
              No friends match &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mb-4">
                <Users size={22} className="text-sage" strokeWidth={1.5} />
              </div>
              <p className="font-display text-xl text-charcoal mb-2">No friends yet</p>
              <p className="text-sm text-muted leading-relaxed max-w-[230px]">
                Share your invite code with people you trust to connect with them here.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="mx-4 mt-2 bg-white rounded-2xl shadow-sm shadow-black/5 overflow-hidden divide-y divide-black/5">
          {sorted.map((friend) => (
            <button
              key={friend.id}
              onClick={() => router.push(`/profile/${friend.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-black/4 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={friend.avatar_url ?? "https://i.pravatar.cc/150?u=" + friend.id}
                alt={friend.full_name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal text-sm">{friend.full_name}</p>
                <p className="text-xs text-muted mt-0.5">@{friend.handle}</p>
              </div>
              {friend.locations?.[0]?.city && (
                <p className="flex items-center gap-1 text-xs text-muted flex-shrink-0">
                  <MapPin size={11} strokeWidth={1.75} />
                  {friend.locations[0].city}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
