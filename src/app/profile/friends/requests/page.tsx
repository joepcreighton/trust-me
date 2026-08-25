"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserCheck, UserX, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface PendingRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterHandle: string;
  requesterAvatar: string | null;
  createdAt: string;
}

export default function FriendRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: rows } = await supabase
      .from("friendships")
      .select("id, user_a, user_b, requested_by, created_at")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq("status", "pending")
      .neq("requested_by", user.id)
      .order("created_at", { ascending: false });

    if (!rows || rows.length === 0) { setLoading(false); return; }

    const requesterIds = rows.map((r) => r.requested_by);
    const { data: profiles } = await supabase
      .from("users")
      .select("id, handle, full_name, avatar_url")
      .in("id", requesterIds);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    setRequests(rows.map((r) => {
      const p = profileMap[r.requested_by];
      return {
        id: r.id,
        requesterId: r.requested_by,
        requesterName: p?.full_name ?? "Someone",
        requesterHandle: p?.handle ?? "unknown",
        requesterAvatar: p?.avatar_url ?? null,
        createdAt: r.created_at,
      };
    }));
    setLoading(false);
  }

  async function accept(id: string) {
    setActing(id);
    const supabase = createClient();
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setActing(null);
  }

  async function decline(id: string) {
    setActing(id);
    const supabase = createClient();
    await supabase.from("friendships").delete().eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setActing(null);
  }

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return `${Math.floor(d / 7)}w`;
  }

  return (
    <div className="pb-8">
      <div className="relative flex items-center px-3 py-3 border-b border-black/5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted hover:text-charcoal transition-colors px-2 py-1.5 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="font-semibold text-charcoal text-base absolute left-1/2 -translate-x-1/2">
          Friend Requests{requests.length > 0 ? ` · ${requests.length}` : ""}
        </h1>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-sage border-t-transparent animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-8">
          <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mb-4">
            <Users size={22} className="text-sage" strokeWidth={1.5} />
          </div>
          <p className="font-display text-xl text-charcoal mb-2">All caught up</p>
          <p className="text-sm text-muted leading-relaxed max-w-[230px]">
            No pending friend requests. Share your invite code to grow your circle.
          </p>
        </div>
      ) : (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm shadow-black/5 overflow-hidden divide-y divide-black/5">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center gap-3 px-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={req.requesterAvatar ?? `https://i.pravatar.cc/150?u=${req.requesterId}`}
                alt={req.requesterName}
                className="w-11 h-11 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal text-sm">{req.requesterName}</p>
                <p className="text-xs text-muted">@{req.requesterHandle} · {timeAgo(req.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => decline(req.id)}
                  disabled={acting === req.id}
                  className={cn(
                    "w-9 h-9 rounded-full border border-black/10 flex items-center justify-center transition-all",
                    acting === req.id ? "opacity-50" : "hover:bg-red-50 hover:border-red-200 active:scale-95"
                  )}
                  aria-label="Decline"
                >
                  <UserX size={16} className="text-muted" />
                </button>
                <button
                  onClick={() => accept(req.id)}
                  disabled={acting === req.id}
                  className={cn(
                    "w-9 h-9 rounded-full bg-sage flex items-center justify-center shadow-sm shadow-sage/30 transition-all",
                    acting === req.id ? "opacity-50" : "hover:bg-sage-dark active:scale-95"
                  )}
                  aria-label="Accept"
                >
                  <UserCheck size={16} className="text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
