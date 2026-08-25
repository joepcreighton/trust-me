"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 900);
    const t2 = setTimeout(() => onDone(), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] bg-cream flex flex-col items-center justify-center",
        "transition-opacity duration-400",
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <h1 className="font-display text-[3.5rem] text-charcoal leading-none tracking-tight">
        trust me
      </h1>
      <p className="text-sage text-sm font-medium mt-2 tracking-wide">
        recommendations from your people
      </p>
    </div>
  );
}
