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
            className={`neon-scan flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all ${
              on
                ? "border-primary/70 bg-primary/20 text-foreground shadow-[0_0_24px_color-mix(in_oklch,var(--primary),transparent_72%)]"
                : "border-border/70 bg-secondary/45 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
            }`}
          >
            <Icon className={`h-4 w-4 ${on ? "text-primary neon-text-glow" : ""}`} />
            {t}
          </Link>
        );
      })}
    </div>
  );
}
