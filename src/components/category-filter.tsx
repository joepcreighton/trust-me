"use client";

import { cn } from "@/lib/utils";
import { Category } from "@/lib/mock-data";

const categories: Array<Category | "All"> = [
  "All",
  "Beauty",
  "Health",
  "Home",
  "Fitness",
  "Pets",
  "Other",
];

interface CategoryFilterProps {
  active: Category | "All";
  onChange: (cat: Category | "All") => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            "flex-shrink-0 text-sm font-medium px-3.5 py-1.5 rounded-full border transition-all",
            active === cat
              ? "bg-sage text-white border-sage shadow-sm"
              : "bg-white text-muted border-black/10 hover:border-sage/50 hover:text-charcoal"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
