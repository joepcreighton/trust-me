import { currentUser } from "@/lib/mock-data";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="px-4 pt-6">
      {/* Profile header */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-20 h-20 rounded-full object-cover mb-3 ring-4 ring-sage-light"
        />
        <h2 className="font-display text-2xl text-charcoal">{currentUser.name}</h2>
        <p className="text-sm text-muted">@{currentUser.username}</p>
      </div>

      {/* Stats row */}
      <div className="bg-white rounded-2xl shadow-sm shadow-black/5 p-4 flex divide-x divide-black/5 text-center mb-6">
        {[
          { label: "Recommendations", value: "0" },
          { label: "Vouches given", value: "0" },
          { label: "Friends", value: "15" },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 px-2">
            <p className="font-display text-2xl text-charcoal">{value}</p>
            <p className="text-[11px] text-muted mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Placeholder body */}
      <div className="flex flex-col items-center text-center py-8">
        <User size={28} className="text-sage mb-3" strokeWidth={1.5} />
        <p className="text-sm text-muted max-w-[260px] leading-relaxed">
          Your recommendations and vouches will show up here. Start by sharing
          something you love.
        </p>
        <span className="mt-4 text-xs text-sage font-medium bg-sage-light px-4 py-1.5 rounded-full">
          Coming soon
        </span>
      </div>
    </div>
  );
}
