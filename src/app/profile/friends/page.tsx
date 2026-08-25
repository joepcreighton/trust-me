"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, MapPin } from "lucide-react";
import { currentUser, users } from "@/lib/mock-data";

export default function FriendsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const friends = users
    .filter((u) => currentUser.friends.includes(u.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filtered = query.trim()
    ? friends.filter(
        (f) =>
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.username.toLowerCase().includes(query.toLowerCase())
      )
    : friends;

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
          Friends · {friends.length}
        </h1>
      </div>

      {/* Search */}
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

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-8">
          {query.trim() ? (
            <p className="text-muted text-sm">
              No friends match &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              <p className="font-display text-xl text-charcoal mb-2">
                No friends yet
              </p>
              <p className="text-sm text-muted leading-relaxed">
                Invite people to Trust Me →
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="mx-4 mt-2 bg-white rounded-2xl shadow-sm shadow-black/5 overflow-hidden divide-y divide-black/5">
          {filtered.map((friend) => (
            <button
              key={friend.id}
              onClick={() => router.push(`/profile/${friend.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-black/4 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={friend.avatar}
                alt={friend.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal text-sm">
                  {friend.name}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  @{friend.username}
                </p>
              </div>
              {friend.cities?.[0] && (
                <p className="flex items-center gap-1 text-xs text-muted flex-shrink-0">
                  <MapPin size={11} strokeWidth={1.75} />
                  {friend.cities[0]}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
