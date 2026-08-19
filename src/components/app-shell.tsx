"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Compass, MessageCircle, Bookmark, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRecs } from "@/lib/user-recs-context";
import { UIContext } from "@/lib/ui-context";
import { RecommendSheet } from "./recommend-sheet";
import type { Recommendation } from "@/lib/mock-data";

const NAV_TABS = [
  { href: "/",         label: "Home",     Icon: Home },
  { href: "/discover", label: "Discover", Icon: Compass },
  { href: "/ask",      label: "Ask",      Icon: MessageCircle, isCenter: true },
  { href: "/saved",    label: "Saved",    Icon: Bookmark },
  { href: "/profile",  label: "Profile",  Icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { addUserRec } = useUserRecs();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const openRecommendSheet = useCallback(() => setSheetOpen(true), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function handlePost(rec: Recommendation) {
    addUserRec(rec);
    setSheetOpen(false);
    setToast("Posted!");
    router.push("/");
  }

  return (
    <UIContext.Provider value={{ openRecommendSheet }}>
      <>
        <div className="min-h-screen bg-cream">
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
              <div className="flex items-end justify-around px-1 pt-2 pb-3">
                {NAV_TABS.map(({ href, label, Icon, isCenter }) => {
                  const isActive =
                    href === "/" ? pathname === "/" : pathname.startsWith(href);

                  if (isCenter) {
                    return (
                      <Link
                        key={href}
                        href={href}
                        className="flex flex-col items-center -mt-5 group"
                      >
                        <div
                          className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-active:scale-95",
                            isActive
                              ? "bg-sage-dark shadow-sage/30"
                              : "bg-sage shadow-sage/30"
                          )}
                        >
                          <Icon size={24} className="text-white" strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-medium leading-none mt-1.5",
                            isActive ? "text-sage-dark" : "text-muted"
                          )}
                        >
                          {label}
                        </span>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex flex-col items-center gap-0.5 py-1 px-3 min-w-[52px] transition-colors",
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

        {/* Recommend sheet — outside frame */}
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
    </UIContext.Provider>
  );
}
