"use client";

import Link from "next/link";
import { Flame, Landmark, Bitcoin, Trophy, Cpu, Globe, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  全部: Flame,
  政治: Landmark,
  加密: Bitcoin,
  体育: Trophy,
  科技: Cpu,
  国际: Globe,
};

export function CategoryNav({ categories, active }: { categories: string[]; active: string }) {
  const tabs = ["全部", ...categories];
  return (
    <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {tabs.map((t) => {
        const Icon = ICONS[t] ?? Sparkles;
        const on = active === t;
        return (
          <Link
            key={t}
            href={t === "全部" ? "/" : `/?cat=${encodeURIComponent(t)}`}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
              on
                ? "border-primary bg-primary/15 text-foreground shadow-sm shadow-primary/10"
                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <Icon className={`h-4 w-4 ${on ? "text-primary" : ""}`} />
            {t}
          </Link>
        );
      })}
    </div>
  );
}
