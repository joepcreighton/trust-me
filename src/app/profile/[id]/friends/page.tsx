"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Friend {
  id: string;
  handle: string;
  full_name: string;
  avatar_url: string | null;
  locations: { city: string; state?: string }[];
}

export default function UserFriendsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [profileName, setProfileName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [profileRes, friendsRes] = await Promise.all([
        supabase.from("users").select("full_name").eq("id", id).single(),
        supabase.rpc("get_user_friends", { p_user_id: id }),
      ]);

      if (profileRes.data) setProfileName(profileRes.data.full_name ?? "");
      if (!friendsRes.error && friendsRes.data) setFriends(friendsRes.data as Friend[]);
      setLoading(false);
    }

    load();
  }, [id]);

  const firstName = profileName.split(" ")[0];

  return (
    <div className="pb-4">
      {/* Sub-header */}
      <div className="relative flex items-center px-3 py-3 border-b border-black/5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted hover:text-charcoal transition-colors px-2 py-1.5 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="font-semibold text-charcoal text-base absolute left-1/2 -translate-x-1/2">
          {firstName ? `${firstName}'s friends` : "Friends"}
          {friends.length > 0 ? ` · ${friends.length}` : ""}
        </h1>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-sage border-t-transparent animate-spin" />
        </div>
      ) : friends.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-8">
          <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mb-4">
            <Users size={22} className="text-sage" strokeWidth={1.5} />
          </div>
          <p className="font-display text-xl text-charcoal mb-2">No friends yet</p>
          <p className="text-sm text-muted leading-relaxed max-w-[230px]">
            {firstName ? `${firstName} hasn't connected with anyone yet.` : "No connections yet."}
          </p>
        </div>
      ) : (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm shadow-black/5 overflow-hidden divide-y divide-black/5">
          {friends.map((friend) => (
            <Link
              key={friend.id}
              href={`/profile/${friend.id}`}
              className="flex items-center gap-3 px-4 py-3.5 active:bg-black/4 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={friend.avatar_url ?? "https://i.pravatar.cc/150?u=" + friend.id}
                alt={friend.full_name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal text-sm hover:underline underline-offset-2">{friend.full_name}</p>
                <p className="text-xs text-muted mt-0.5">@{friend.handle}</p>
              </div>
              {friend.locations?.[0]?.city && (
                <p className="flex items-center gap-1 text-xs text-muted flex-shrink-0">
                  <MapPin size={11} strokeWidth={1.75} />
                  {friend.locations[0].city}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
