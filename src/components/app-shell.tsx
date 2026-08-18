"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Compass, Plus, Bookmark, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRecs } from "@/lib/user-recs-context";
import { RecommendSheet } from "./recommend-sheet";
import type { Recommendation } from "@/lib/mock-data";

const NAV_TABS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/discover", label: "Discover", Icon: Compass },
  { href: "/saved", label: "Saved", Icon: Bookmark },
  { href: "/profile", label: "Profile", Icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { addUserRec } = useUserRecs();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function handlePost(rec: Recommendation) {
    addUserRec(rec);
    setSheetOpen(false);
    showToast("Posted!");
    router.push("/");
  }

  return (
    <>
      <div className="min-h-screen bg-cream">
        {/* Centered mobile frame */}
        <div className="relative mx-auto max-w-[430px] min-h-screen bg-cream flex flex-col">

          {/* Top bar */}
          <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20 bg-cream/95 backdrop-blur-sm">
            <div className="flex items-center justify-center h-14 px-4 border-b border-black/5">
              <span className="font-display text-[1.6rem] text-charcoal tracking-tight leading-none">
                trust me
              </span>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 pt-14 pb-24 overflow-y-auto">{children}</main>

          {/* Bottom nav */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20 bg-card border-t border-black/5">
            <div className="flex items-end justify-around px-2 pt-2 pb-3">
              {/* Left two tabs */}
              {NAV_TABS.slice(0, 2).map(({ href, label, Icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-1 px-3 min-w-[56px] transition-colors",
                      isActive ? "text-sage" : "text-muted"
                    )}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-[10px] font-medium leading-none">{label}</span>
                  </Link>
                );
              })}

              {/* Center "+" button */}
              <button
                onClick={() => setSheetOpen(true)}
                aria-label="Add recommendation"
                className="flex flex-col items-center -mt-6 group"
              >
                <div className="w-14 h-14 rounded-full bg-sage flex items-center justify-center shadow-lg shadow-sage/30 transition-transform group-active:scale-95">
                  <Plus size={26} className="text-white" strokeWidth={2.5} />
                </div>
              </button>

              {/* Right two tabs */}
              {NAV_TABS.slice(2).map(({ href, label, Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-1 px-3 min-w-[56px] transition-colors",
                      isActive ? "text-sage" : "text-muted"
                    )}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-[10px] font-medium leading-none">{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Sheet — rendered outside the frame so it overlays full viewport */}
      <RecommendSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPost={handlePost}
      />

      {/* Toast */}
      <div
        className={cn(
          "fixed top-20 left-1/2 -translate-x-1/2 z-[60]",
          "flex items-center gap-2 px-4 py-2.5 rounded-full",
          "bg-charcoal text-white text-sm font-medium shadow-lg",
          "transition-all duration-300",
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <Check size={15} strokeWidth={2.5} />
        {toast}
      </div>
    </>
  );
}
