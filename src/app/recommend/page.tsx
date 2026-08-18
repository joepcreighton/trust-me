import { PlusCircle } from "lucide-react";

export default function RecommendPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-sage-light flex items-center justify-center mb-5">
        <PlusCircle size={28} className="text-sage" strokeWidth={1.5} />
      </div>
      <h2 className="font-display text-2xl text-charcoal mb-2">
        Share a recommendation
      </h2>
      <p className="text-sm text-muted leading-relaxed max-w-[260px]">
        Know someone amazing? A hidden gem? Share it with the people who trust
        your taste — your rec goes straight to their feed.
      </p>
      <span className="mt-5 text-xs text-sage font-medium bg-sage-light px-4 py-1.5 rounded-full">
        Coming soon
      </span>
    </div>
  );
}
