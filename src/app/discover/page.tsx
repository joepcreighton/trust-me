import { Compass } from "lucide-react";

export default function DiscoverPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center mb-5">
        <Compass size={28} className="text-sage" strokeWidth={1.5} />
      </div>
      <h2 className="font-display text-2xl text-charcoal mb-2">Discover</h2>
      <p className="text-sm text-muted leading-relaxed max-w-[260px]">
        Browse recommendations by category, neighborhood, or what&apos;s
        trending in your circle this week.
      </p>
      <span className="mt-5 text-xs text-sage font-medium bg-sage-light px-4 py-1.5 rounded-full">
        Coming soon
      </span>
    </div>
  );
}
