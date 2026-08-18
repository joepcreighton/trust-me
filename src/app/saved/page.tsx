import { Bookmark } from "lucide-react";

export default function SavedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center mb-5">
        <Bookmark size={28} className="text-sage" strokeWidth={1.5} />
      </div>
      <h2 className="font-display text-2xl text-charcoal mb-2">Saved</h2>
      <p className="text-sm text-muted leading-relaxed max-w-[260px]">
        All the recs you&apos;ve bookmarked, organized by category so you can
        actually find them when you need them.
      </p>
      <span className="mt-5 text-xs text-sage font-medium bg-sage-light px-4 py-1.5 rounded-full">
        Coming soon
      </span>
    </div>
  );
}
