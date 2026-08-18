"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Compass, PlusCircle, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/discover", label: "Discover", Icon: Compass },
  { href: "/recommend", label: "", Icon: PlusCircle, isCenter: true },
  { href: "/saved", label: "Saved", Icon: Bookmark },
  { href: "/profile", label: "Profile", Icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
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
          <div className="flex items-end justify-around px-2 pt-2 pb-safe pb-3">
            {tabs.map(({ href, label, Icon, isCenter }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);

              if (isCenter) {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center -mt-6 group"
                    aria-label="Add recommendation"
                  >
                    <div className="w-14 h-14 rounded-full bg-sage flex items-center justify-center shadow-lg shadow-sage/30 transition-transform group-active:scale-95">
                      <Icon size={26} className="text-white" strokeWidth={2} />
                    </div>
                  </Link>
                );
              }

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
  );
}
