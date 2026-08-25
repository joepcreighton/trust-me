"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Compass, Plus, Map, User, Check, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRecs } from "@/lib/user-recs-context";
import { UIContext } from "@/lib/ui-context";
import { RecommendSheet } from "./recommend-sheet";
import { SplashScreen } from "./splash-screen";
import type { Recommendation } from "@/lib/mock-data";

const LEFT_TABS = [
  { href: "/",         label: "Home",     Icon: Home },
  { href: "/discover", label: "Discover", Icon: Compass },
];

const RIGHT_TABS = [
  { href: "/explore", label: "Explore", Icon: Map },
  { href: "/profile", label: "Profile", Icon: User },
];

const SHELL_BYPASS = ["/sign-in", "/sign-up", "/onboarding"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { addUserRec } = useUserRecs();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Auth/onboarding routes render without the app shell
  const isBypass = SHELL_BYPASS.some((p) => pathname.startsWith(p));

  const openRecommendSheet = useCallback(() => setSheetOpen(true), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Block body scroll when action sheet is open
  useEffect(() => {
    document.body.style.overflow = actionSheetOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [actionSheetOpen]);

  function handlePost(rec: Recommendation) {
    addUserRec(rec);
    setSheetOpen(false);
    setToast("Posted!");
    router.push("/");
  }


  function renderTab({ href, label, Icon }: { href: string; label: string; Icon: React.ElementType }) {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
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
  }

  if (isBypass) {
    return (
      <UIContext.Provider value={{ openRecommendSheet }}>
        {children}
      </UIContext.Provider>
    );
  }

  return (
    <UIContext.Provider value={{ openRecommendSheet }}>
      <>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
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
                {LEFT_TABS.map(renderTab)}

                {/* Center + button */}
                <button
                  onClick={() => setActionSheetOpen(true)}
                  className="flex flex-col items-center -mt-5 group"
                  aria-label="Share"
                >
                  <div className="w-14 h-14 rounded-full bg-sage flex items-center justify-center shadow-lg shadow-sage/30 transition-transform group-active:scale-95">
                    <Plus size={26} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-medium leading-none mt-1.5 text-muted">Share</span>
                </button>

                {RIGHT_TABS.map(renderTab)}
              </div>
            </nav>
          </div>
        </div>

        {/* Action sheet — outside frame */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
            actionSheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setActionSheetOpen(false)}
          aria-hidden="true"
        />
        <div
          className={cn(
            "fixed bottom-0 left-1/2 -translate-x-1/2 z-50",
            "w-full max-w-[430px] bg-white rounded-t-3xl",
            "transition-transform duration-300 ease-out",
            actionSheetOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-10 h-1 bg-black/15 rounded-full" />
          </div>
          <div className="px-5 pb-10">
            <button
              onClick={() => {
                setActionSheetOpen(false);
                setSheetOpen(true);
              }}
              className="w-full flex items-center gap-4 px-5 py-4 bg-sage rounded-2xl text-white active:scale-[0.98] transition-transform"
            >
              <PlusCircle size={22} strokeWidth={1.75} />
              <div className="text-left">
                <p className="font-semibold text-base leading-tight">Share a recommendation</p>
                <p className="text-sm text-white/70 mt-0.5">Tell your circle who to trust</p>
              </div>
            </button>
            <button
              onClick={() => setActionSheetOpen(false)}
              className="w-full mt-3 py-3 text-sm font-medium text-muted"
            >
              Cancel
            </button>
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
            "flex items-center gap-2 px-4 py-2.5 rounded-2xl max-w-[340px]",
            "bg-charcoal text-white text-sm font-medium shadow-lg text-center",
            "transition-all duration-300",
            toast
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <Check size={15} strokeWidth={2.5} className="flex-shrink-0" />
          {toast}
        </div>
      </>
    </UIContext.Provider>
  );
}
