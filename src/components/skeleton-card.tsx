export function SkeletonCard() {
  return (
    <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm shadow-black/5 overflow-hidden animate-pulse">
      <div className="h-40 bg-black/6" />
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-black/8 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-black/8 rounded-full w-1/3" />
            <div className="h-2.5 bg-black/5 rounded-full w-1/4" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-black/8 rounded-full w-3/4" />
          <div className="h-3 bg-black/5 rounded-full w-full" />
          <div className="h-3 bg-black/5 rounded-full w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
